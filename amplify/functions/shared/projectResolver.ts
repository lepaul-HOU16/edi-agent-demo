/**
 * ProjectResolver - Resolve project references from natural language queries
 * 
 * Handles:
 * - Explicit project references ("for project west-texas", "project panhandle-wind")
 * - Implicit references ("that project", "the project", "continue")
 * - Partial name matching with fuzzy search
 * - Ambiguity detection and resolution
 */

import { ProjectStore } from './projectStore';
import { SessionContext } from './sessionContextManager';

interface ProjectData {
  project_id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  terrain_results?: any;
  layout_results?: any;
  simulation_results?: any;
  report_results?: any;
  metadata?: {
    turbine_count?: number;
    total_capacity_mw?: number;
    annual_energy_gwh?: number;
  };
}

interface ResolveResult {
  projectName: string | null;
  isAmbiguous: boolean;
  matches?: string[];
  confidence: 'explicit' | 'implicit' | 'partial' | 'active' | 'none';
}

export class ProjectResolver {
  private projectStore: ProjectStore;
  private projectListCache: { projects: ProjectData[]; timestamp: number } | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(projectStore: ProjectStore) {
    this.projectStore = projectStore;
  }

  /**
   * Resolve project name from query and session context
   * @param query - User query text
   * @param sessionContext - Current session context
   * @returns Resolved project name or null
   */
  async resolve(query: string, sessionContext: SessionContext): Promise<ResolveResult> {
    console.log('[ProjectResolver] Resolving project from query:', query);
    console.log('[ProjectResolver] Session context:', {
      active_project: sessionContext.active_project,
      history: sessionContext.project_history
    });

    // 1. Check for explicit project reference
    const explicitRef = this.extractExplicitReference(query);
    if (explicitRef) {
      console.log('[ProjectResolver] Found explicit reference:', explicitRef);
      
      // Verify project exists
      const matches = await this.findMatchingProjects(explicitRef);
      if (matches.length === 1) {
        return {
          projectName: matches[0],
          isAmbiguous: false,
          confidence: 'explicit'
        };
      } else if (matches.length > 1) {
        return {
          projectName: null,
          isAmbiguous: true,
          matches,
          confidence: 'explicit'
        };
      }
      // If no exact match, continue to partial matching
    }

    // 2. Check for implicit references
    const implicitRef = this.extractImplicitReference(query, sessionContext);
    if (implicitRef) {
      console.log('[ProjectResolver] Found implicit reference:', implicitRef);
      return {
        projectName: implicitRef,
        isAmbiguous: false,
        confidence: 'implicit'
      };
    }

    // 3. Check for partial name match in query
    const partialMatch = await this.matchPartialName(query);
    if (partialMatch) {
      console.log('[ProjectResolver] Found partial match:', partialMatch);
      
      if (typeof partialMatch === 'string') {
        return {
          projectName: partialMatch,
          isAmbiguous: false,
          confidence: 'partial'
        };
      } else {
        // Multiple matches
        return {
          projectName: null,
          isAmbiguous: true,
          matches: partialMatch as string[],
          confidence: 'partial'
        };
      }
    }

    // 4. Fall back to active project from session
    if (sessionContext.active_project) {
      console.log('[ProjectResolver] Using active project:', sessionContext.active_project);
      return {
        projectName: sessionContext.active_project,
        isAmbiguous: false,
        confidence: 'active'
      };
    }

    // 5. No match found
    console.log('[ProjectResolver] No project reference found');
    return {
      projectName: null,
      isAmbiguous: false,
      confidence: 'none'
    };
  }

  /**
   * Extract explicit project reference from query
   * Patterns:
   * - "for project {name}"
   * - "for {name} project"
   * - "project {name}"
   * 
   * @param query - User query
   * @returns Extracted project name or null
   */
  extractExplicitReference(query: string): string | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Pattern 1: "for project {name}"
    const forProjectPattern = /for\s+project\s+([a-z0-9\-\s]+?)(?:\s|$|\.|\,)/i;
    let match = normalizedQuery.match(forProjectPattern);
    if (match) {
      return this.normalizeProjectName(match[1]);
    }

    // Pattern 2: "for {name} project"
    const forNameProjectPattern = /for\s+([a-z0-9\-\s]+?)\s+project(?:\s|$|\.|\,)/i;
    match = normalizedQuery.match(forNameProjectPattern);
    if (match) {
      return this.normalizeProjectName(match[1]);
    }

    // Pattern 3: "project {name}" (at start or after punctuation)
    const projectNamePattern = /(?:^|\s)project\s+([a-z0-9\-\s]+?)(?:\s|$|\.|\,)/i;
    match = normalizedQuery.match(projectNamePattern);
    if (match) {
      return this.normalizeProjectName(match[1]);
    }

    return null;
  }

  /**
   * Extract implicit project reference from query
   * Patterns:
   * - "that project" → last mentioned project
   * - "the project" → active project
   * - "continue" → active project
   * 
   * @param query - User query
   * @param sessionContext - Current session context
   * @returns Project name or null
   */
  private extractImplicitReference(query: string, sessionContext: SessionContext): string | null {
    const normalizedQuery = query.toLowerCase().trim();

    // Pattern 1: "that project" → last mentioned (most recent in history)
    if (normalizedQuery.includes('that project')) {
      if (sessionContext.project_history && sessionContext.project_history.length > 0) {
        return sessionContext.project_history[0]; // Most recent
      }
    }

    // Pattern 2: "the project" → active project
    if (normalizedQuery.includes('the project')) {
      return sessionContext.active_project || null;
    }

    // Pattern 3: "continue" → active project
    if (normalizedQuery.match(/\bcontinue\b/)) {
      return sessionContext.active_project || null;
    }

    return null;
  }

  /**
   * Match project by partial name using fuzzy matching
   * 
   * @param query - User query or partial name
   * @returns Best matching project name, array of matches if ambiguous, or null
   */
  async matchPartialName(query: string): Promise<string | string[] | null> {
    const projects = await this.getProjectList();
    if (projects.length === 0) {
      return null;
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Extract potential project name fragments from query
    const fragments = this.extractProjectNameFragments(normalizedQuery);
    if (fragments.length === 0) {
      return null;
    }

    console.log('[ProjectResolver] Extracted fragments:', fragments);

    // Find matches for each fragment
    const allMatches: Array<{ projectName: string; score: number; matchType: string }> = [];

    for (const fragment of fragments) {
      // Exact match
      const exactMatches = projects.filter(p => 
        p.project_name.toLowerCase() === fragment
      );
      exactMatches.forEach(p => {
        allMatches.push({ projectName: p.project_name, score: 100, matchType: 'exact' });
      });

      // Contains match
      const containsMatches = projects.filter(p => 
        p.project_name.toLowerCase().includes(fragment) && 
        !exactMatches.find(em => em.project_name === p.project_name)
      );
      containsMatches.forEach(p => {
        allMatches.push({ projectName: p.project_name, score: 80, matchType: 'contains' });
      });

      // Fuzzy match (Levenshtein distance)
      const fuzzyMatches = projects.filter(p => {
        const distance = this.levenshteinDistance(fragment, p.project_name.toLowerCase());
        const maxLength = Math.max(fragment.length, p.project_name.length);
        const similarity = 1 - (distance / maxLength);
        return similarity > 0.6 && 
               !exactMatches.find(em => em.project_name === p.project_name) &&
               !containsMatches.find(cm => cm.project_name === p.project_name);
      });
      fuzzyMatches.forEach(p => {
        const distance = this.levenshteinDistance(fragment, p.project_name.toLowerCase());
        const maxLength = Math.max(fragment.length, p.project_name.length);
        const similarity = 1 - (distance / maxLength);
        allMatches.push({ 
          projectName: p.project_name, 
          score: similarity * 60, 
          matchType: 'fuzzy' 
        });
      });
    }

    if (allMatches.length === 0) {
      return null;
    }

    // Sort by score (highest first)
    allMatches.sort((a, b) => b.score - a.score);

    console.log('[ProjectResolver] Matches found:', allMatches);

    // If top match is significantly better than others, return it
    if (allMatches.length === 1 || allMatches[0].score > allMatches[1].score + 20) {
      return allMatches[0].projectName;
    }

    // If multiple matches with similar scores, return all for disambiguation
    const topScore = allMatches[0].score;
    const ambiguousMatches = allMatches
      .filter(m => m.score >= topScore - 10)
      .map(m => m.projectName);

    // Remove duplicates
    const uniqueMatches = Array.from(new Set(ambiguousMatches));

    if (uniqueMatches.length === 1) {
      return uniqueMatches[0];
    }

    return uniqueMatches;
  }

  /**
   * Extract potential project name fragments from query
   * Looks for location names, wind farm references, etc.
   */
  private extractProjectNameFragments(query: string): string[] {
    const fragments: string[] = [];

    // Skip extraction if query contains coordinates (lat/lon pattern)
    // This prevents "analyze terrain at 32.7767, -96.797" from matching existing projects
    const hasCoordinates = /\b\d+\.\d+\s*,\s*-?\d+\.\d+\b/.test(query);
    if (hasCoordinates) {
      console.log('[ProjectResolver] Query contains coordinates, skipping fragment extraction');
      return fragments;
    }

    // Pattern 1: Location names (2-3 words before "wind farm")
    const windFarmPattern = /([a-z\-]+(?:\s+[a-z\-]+){0,2})\s+wind\s+farm/gi;
    let match;
    while ((match = windFarmPattern.exec(query)) !== null) {
      fragments.push(this.normalizeProjectName(match[1]));
    }

    // Pattern 2: Location names after "in" or "at" (but NOT coordinates)
    const locationPattern = /(?:in|at)\s+([a-z\-]+(?:\s+[a-z\-]+){0,2})/gi;
    while ((match = locationPattern.exec(query)) !== null) {
      const fragment = match[1];
      // Skip if it looks like a number
      if (!/^\d/.test(fragment)) {
        fragments.push(this.normalizeProjectName(fragment));
      }
    }

    // Pattern 3: Capitalized words (potential location names)
    const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b/g;
    while ((match = capitalizedPattern.exec(query)) !== null) {
      fragments.push(this.normalizeProjectName(match[1]));
    }

    // Pattern 4: Hyphenated names (already normalized project names)
    const hyphenatedPattern = /\b([a-z]+(?:\-[a-z]+)+)\b/g;
    while ((match = hyphenatedPattern.exec(query)) !== null) {
      fragments.push(match[1]);
    }

    return Array.from(new Set(fragments)); // Remove duplicates
  }

  /**
   * Find projects matching a name (exact or partial)
   */
  private async findMatchingProjects(name: string): Promise<string[]> {
    const projects = await this.getProjectList();
    const normalizedName = name.toLowerCase();

    return projects
      .filter(p => p.project_name.toLowerCase() === normalizedName)
      .map(p => p.project_name);
  }

  /**
   * Get cached project list or fetch from S3
   */
  private async getProjectList(): Promise<ProjectData[]> {
    const now = Date.now();

    // Check cache
    if (this.projectListCache && (now - this.projectListCache.timestamp) < this.CACHE_TTL_MS) {
      console.log('[ProjectResolver] Using cached project list');
      return this.projectListCache.projects;
    }

    // Fetch from S3
    console.log('[ProjectResolver] Fetching project list from S3');
    const projects = await this.projectStore.list();
    
    // Update cache
    this.projectListCache = {
      projects,
      timestamp: now
    };

    return projects;
  }

  /**
   * Normalize project name to kebab-case
   */
  private normalizeProjectName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s\-]/g, '') // Remove special chars except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/\-+/g, '-') // Replace multiple hyphens with single
      .replace(/^\-|\-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Used for fuzzy matching
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix: number[][] = [];

    // Initialize matrix
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Clear project list cache (useful after creating/deleting projects)
   */
  clearCache(): void {
    this.projectListCache = null;
  }
}
