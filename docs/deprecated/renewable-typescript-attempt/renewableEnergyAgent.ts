/**
 * Renewable Energy Agent
 * Handles wind farm development, terrain analysis, layout optimization, simulation, and reporting
 * Integrates with existing EDI Platform infrastructure
 */

import { 
  ThoughtStep, 
  createThoughtStep, 
  completeThoughtStep 
} from '../../../utils/thoughtTypes';
import { renewableTerrainAnalysisTool } from '../tools/renewableTerrainAnalysisTool';
import { 
  createGridLayout, 
  createSpiralLayout, 
  createGreedyLayout 
} from '../tools/renewableLayoutOptimizationTool';
import { renewableSimulationTool } from '../tools/renewableSimulationTool';

interface RouterResponse {
  success: boolean;
  message: string;
  artifacts?: any[];
  thoughtSteps?: ThoughtStep[];
  sourceAttribution?: any[];
  agentUsed: string;
  triggerActions?: any;
}

export class RenewableEnergyAgent {
  private foundationModelId: string;
  private s3Bucket: string;

  constructor(foundationModelId?: string, s3Bucket?: string) {
    this.foundationModelId = foundationModelId || 'us.anthropic.claude-3-7-sonnet-20250219-v1:0';
    this.s3Bucket = s3Bucket || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m';
    
    console.log('🌱 RenewableEnergyAgent initialized');
  }

  /**
   * Main processing function for renewable energy queries
   */
  async processQuery(message: string, conversationHistory?: any[]): Promise<RouterResponse> {
    console.log('🌱 RenewableEnergyAgent: Processing query:', message.substring(0, 100) + '...');
    console.log('🌱 RenewableEnergyAgent: Conversation history provided:', !!conversationHistory, 'messages:', conversationHistory?.length || 0);
    
    try {
      // Create initial thought step
      const thoughtSteps: ThoughtStep[] = [];
      const initialThought = createThoughtStep(
        'intent_detection',
        'Analyzing renewable energy request',
        'Determining the best approach for this wind farm development query'
      );
      thoughtSteps.push(initialThought);

      // Determine the type of renewable query and route accordingly
      const queryType = this.determineRenewableQueryType(message);
      console.log('🎯 RenewableEnergyAgent: Query type determined as:', queryType);

      let response: RouterResponse;

      switch (queryType) {
        case 'terrain_analysis':
          response = await this.handleTerrainAnalysis(message, thoughtSteps);
          break;
        
        case 'layout_design':
          response = await this.handleLayoutDesign(message, thoughtSteps);
          break;
        
        case 'simulation':
          response = await this.handleSimulation(message, thoughtSteps);
          break;
        
        case 'reporting':
          response = await this.handleReporting(message, thoughtSteps);
          break;
        
        case 'general_renewable':
        default:
          response = await this.handleGeneralRenewable(message, thoughtSteps);
          break;
      }

      // Complete the initial thought step
      completeThoughtStep(initialThought, `Processed as ${queryType} query`);

      return {
        ...response,
        agentUsed: 'renewableEnergyAgent',
        thoughtSteps
      };

    } catch (error) {
      console.error('❌ RenewableEnergyAgent: Error processing query:', error);
      return {
        success: false,
        message: `Error processing renewable energy request: ${error instanceof Error ? error.message : 'Unknown error'}`,
        agentUsed: 'renewableEnergyAgent',
        artifacts: [],
        thoughtSteps: []
      };
    }
  }

  /**
   * Determine the type of renewable energy query
   */
  private determineRenewableQueryType(message: string): string {
    const lowerMessage = message.toLowerCase();

    // Terrain analysis patterns - more flexible matching
    if (/analyze.*terrain|terrain.*analysis|terrain.*for.*wind|site.*analysis|unbuildable.*areas|exclusion.*zones|setback/i.test(message)) {
      return 'terrain_analysis';
    }

    // Layout design patterns
    if (/layout|turbine.*placement|wind.*farm.*design|optimize.*layout|turbine.*spacing/i.test(message)) {
      return 'layout_design';
    }

    // Simulation patterns
    if (/simulation|wake.*analysis|energy.*production|capacity.*factor|aep|annual.*energy/i.test(message)) {
      return 'simulation';
    }

    // Reporting patterns
    if (/report|executive.*summary|documentation|financial.*analysis|recommendations/i.test(message)) {
      return 'reporting';
    }

    // Default to general renewable
    return 'general_renewable';
  }

  /**
   * Handle terrain analysis requests
   */
  private async handleTerrainAnalysis(message: string, thoughtSteps: ThoughtStep[]): Promise<RouterResponse> {
    console.log('🌍 RenewableEnergyAgent: handleTerrainAnalysis called');
    console.log('🌍 Message:', message);

    const terrainThought = createThoughtStep(
      'execution',
      'Analyzing terrain for wind farm development',
      'Identifying unbuildable areas, exclusion zones, and suitable locations for turbine placement'
    );
    thoughtSteps.push(terrainThought);

    // Extract coordinates if provided
    const coordinates = this.extractCoordinates(message);
    const setbackDistance = this.extractSetbackDistance(message);

    console.log('🌍 Extracted coordinates:', coordinates);
    console.log('🌍 Extracted setback distance:', setbackDistance);

    if (coordinates) {
      try {
        console.log('🌍 Calling renewableTerrainAnalysisTool...');
        
        // Call the actual terrain analysis tool
        const projectId = `terrain_${Date.now()}`;
        const toolParams = {
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          projectId: projectId,
          radiusKm: 5.0,
          setbackM: setbackDistance || 100
        };

        console.log('🌍 Tool parameters:', toolParams);

        const toolResponse = await renewableTerrainAnalysisTool(toolParams);

        console.log('🌍 Tool response received:', {
          success: toolResponse.success,
          hasArtifacts: !!toolResponse.artifacts,
          artifactCount: toolResponse.artifacts?.length || 0,
          artifactTypes: toolResponse.artifacts?.map(a => a.type) || []
        });

        completeThoughtStep(terrainThought, `Terrain analysis completed for ${coordinates.lat}, ${coordinates.lng}`);

        // Transform the tool response to match UI component expectations
        let transformedArtifacts = [];
        
        if (toolResponse.artifacts && toolResponse.artifacts.length > 0) {
          console.log('🌍 Transforming artifacts...');
          
          transformedArtifacts = toolResponse.artifacts.map((artifact, index) => {
            console.log(`🌍 Processing artifact ${index + 1}:`, {
              type: artifact.type,
              hasCoordinates: !!artifact.coordinates,
              hasSuitabilityScore: !!artifact.suitabilityScore,
              hasExclusionZones: !!artifact.exclusionZones,
              hasConstraints: !!artifact.constraints
            });

            if (artifact.type === 'wind_farm_terrain_analysis') {
              console.log('🌍 ✅ Found wind_farm_terrain_analysis artifact - transforming...');
              
              // Transform from tool format to UI format
              const transformed = {
                messageContentType: 'wind_farm_terrain_analysis',
                title: `Wind Farm Terrain Analysis`,
                subtitle: `Site analysis for coordinates ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
                analysisType: 'terrain_analysis',
                coordinates: { 
                  lat: coordinates.lat, 
                  lng: coordinates.lng 
                },
                setbackDistance: setbackDistance || 100,
                exclusionZones: {
                  water: artifact.exclusionZones?.some(z => z.type === 'Water') || false,
                  buildings: artifact.exclusionZones?.some(z => z.type === 'Residential') || false,
                  roads: artifact.exclusionZones?.some(z => z.type === 'Infrastructure') || false,
                  protected: artifact.exclusionZones?.some(z => z.type === 'Environmental') || false
                },
                results: {
                  buildableArea: `${Math.round((artifact.totalArea - (artifact.exclusionZones?.reduce((sum, zone) => sum + zone.area, 0) || 0)) * 100) / 100} km²`,
                  majorConstraints: artifact.constraints?.map(c => c.description) || [],
                  recommendedSetbacks: setbackDistance || 100
                },
                // Include all original data for enhanced display
                suitabilityScore: artifact.suitabilityScore,
                riskAssessment: artifact.riskAssessment,
                exclusionZoneDetails: artifact.exclusionZones,
                constraintDetails: artifact.constraints,
                recommendations: artifact.recommendations,
                projectId: artifact.siteId
              };

              console.log('🌍 ✅ Transformed artifact:', {
                messageContentType: transformed.messageContentType,
                title: transformed.title,
                hasCoordinates: !!transformed.coordinates,
                suitabilityScore: transformed.suitabilityScore,
                hasExclusionZones: !!transformed.exclusionZones,
                hasResults: !!transformed.results
              });

              return transformed;
            } else {
              console.log('🌍 ⚠️ Artifact type not wind_farm_terrain_analysis:', artifact.type);
            }
            return artifact;
          });

          console.log('🌍 Final transformed artifacts count:', transformedArtifacts.length);
          console.log('🌍 Final transformed artifacts types:', transformedArtifacts.map(a => a.messageContentType || a.type));

        } else {
          console.log('🌍 ❌ No artifacts returned from tool');
        }

        const finalResponse = {
          success: toolResponse.success,
          message: toolResponse.message,
          artifacts: transformedArtifacts,
          thoughtSteps: [...thoughtSteps, ...(toolResponse.thoughtSteps || [])],
          agentUsed: 'renewableEnergyAgent',
          sourceAttribution: toolResponse.sourceAttribution || [{
            title: 'Wind Farm Site Analysis',
            url: '#renewable-terrain-analysis',
            snippet: 'Comprehensive terrain analysis for optimal wind turbine placement'
          }]
        };

        console.log('🌍 Final response:', {
          success: finalResponse.success,
          artifactCount: finalResponse.artifacts?.length || 0,
          artifactTypes: finalResponse.artifacts?.map(a => a.messageContentType || a.type) || [],
          agentUsed: finalResponse.agentUsed
        });

        return finalResponse;

      } catch (error) {
        console.error('❌ RenewableEnergyAgent: Error executing terrain analysis tool:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        completeThoughtStep(terrainThought, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        return {
          success: false,
          message: `Error analyzing terrain: ${error instanceof Error ? error.message : 'Unknown error'}`,
          artifacts: [],
          agentUsed: 'renewableEnergyAgent',
          thoughtSteps
        };
      }
    } else {
      console.log('🌍 ❌ No coordinates found in message');
      completeThoughtStep(terrainThought, 'Coordinates needed for terrain analysis');
      
      return {
        success: true,
        message: 'I can help you analyze terrain for wind farm development. Please provide the coordinates (latitude, longitude) for the site you want to analyze, along with any specific setback requirements.',
        artifacts: [],
        agentUsed: 'renewableEnergyAgent',
        thoughtSteps
      };
    }
  }

  /**
   * Handle layout design requests
   */
  private async handleLayoutDesign(message: string, thoughtSteps: ThoughtStep[]): Promise<RouterResponse> {
    console.log('⚡ RenewableEnergyAgent: handleLayoutDesign called');
    console.log('⚡ Message:', message);

    const layoutThought = createThoughtStep(
      'execution',
      'Designing wind farm layout',
      'Optimizing turbine placement for maximum energy production'
    );
    thoughtSteps.push(layoutThought);

    // Extract parameters from message
    const coordinates = this.extractCoordinates(message);
    const capacity = this.extractCapacity(message);
    const turbineModel = this.extractTurbineModel(message);
    const layoutType = this.extractLayoutType(message);
    const windAngle = this.extractWindAngle(message);
    const spacing = this.extractSpacing(message);

    console.log('⚡ Extracted parameters:', {
      coordinates,
      capacity,
      turbineModel,
      layoutType,
      windAngle,
      spacing
    });

    if (coordinates && capacity) {
      try {
        console.log('⚡ Calling layout optimization tool...');

        // Parse capacity to get MW value
        const capacityMatch = capacity.match(/(\d+\.?\d*)/);
        const capacityMW = capacityMatch ? parseFloat(capacityMatch[1]) : 30;

        // Calculate number of turbines based on capacity and turbine model
        const turbineCapacity = this.getTurbineCapacity(turbineModel || 'IEA_Reference_3.4MW_130');
        const numTurbines = Math.ceil(capacityMW / turbineCapacity);
        const rotorDiameter = this.getRotorDiameter(turbineModel || 'IEA_Reference_3.4MW_130');

        const projectId = `layout_${Date.now()}`;
        const toolParams = {
          project_id: projectId,
          center_lat: coordinates.lat,
          center_lon: coordinates.lng,
          num_turbines: numTurbines,
          turbine_model: turbineModel || 'IEA_Reference_3.4MW_130',
          rotor_diameter: rotorDiameter,
          capacity_mw: capacityMW,
          wind_angle: windAngle || 225, // Default SW wind
          spacing_d: spacing || 9 // Default 9D spacing
        };

        console.log('⚡ Tool parameters:', toolParams);

        let toolResponse;
        
        // Choose layout algorithm based on request or default to grid
        switch (layoutType) {
          case 'spiral':
            console.log('⚡ Using spiral layout algorithm');
            toolResponse = await createSpiralLayout(toolParams);
            break;
          case 'greedy':
            console.log('⚡ Using greedy layout algorithm');
            toolResponse = await createGreedyLayout(toolParams);
            break;
          case 'grid':
          default:
            console.log('⚡ Using grid layout algorithm');
            toolResponse = await createGridLayout(toolParams);
            break;
        }

        console.log('⚡ Tool response received:', {
          success: toolResponse.success,
          hasArtifacts: !!toolResponse.artifacts,
          artifactCount: toolResponse.artifacts?.length || 0,
          artifactTypes: toolResponse.artifacts?.map(a => a.type) || []
        });

        completeThoughtStep(layoutThought, `${layoutType || 'Grid'} layout optimization completed for ${numTurbines} turbines`);

        // Transform the tool response to match UI component expectations
        let transformedArtifacts = [];
        
        if (toolResponse.artifacts && toolResponse.artifacts.length > 0) {
          console.log('⚡ Transforming artifacts...');
          
          transformedArtifacts = toolResponse.artifacts.map((artifact, index) => {
            console.log(`⚡ Processing artifact ${index + 1}:`, {
              type: artifact.type,
              hasTurbines: !!artifact.turbines,
              turbineCount: artifact.turbines?.length || 0,
              hasWindAngle: !!artifact.windAngle,
              hasCapacity: !!artifact.totalCapacity
            });

            if (artifact.type === 'wind_farm_layout') {
              console.log('⚡ ✅ Found wind_farm_layout artifact - transforming...');
              
              // Transform from tool format to UI format
              const transformed = {
                messageContentType: 'wind_farm_layout',
                title: `Wind Farm Layout - ${layoutType?.charAt(0).toUpperCase() + layoutType?.slice(1) || 'Grid'} Pattern`,
                subtitle: `${artifact.totalCapacity}MW layout with ${artifact.turbineCount} turbines`,
                analysisType: 'layout_design',
                coordinates: { 
                  lat: coordinates.lat, 
                  lng: coordinates.lng 
                },
                targetCapacity: capacity,
                turbineModel: turbineModel || 'IEA_Reference_3.4MW_130',
                layoutType: layoutType || 'grid',
                windAngle: artifact.windAngle,
                spacing: `${spacing || 9}D`,
                layout: {
                  turbineCount: artifact.turbineCount,
                  totalCapacity: `${artifact.totalCapacity}MW`,
                  efficiency: `${Math.round(artifact.placementEfficiency * 100)}%`,
                  averageSpacing: `${Math.round(artifact.averageSpacing)}m`,
                  turbinePositions: artifact.turbines,
                  layoutPattern: layoutType || 'grid',
                  windAlignment: artifact.windAngle
                },
                // Include all original data for enhanced display
                turbinePositions: artifact.turbines,
                projectId: artifact.projectId,
                algorithmUsed: layoutType || 'grid',
                optimizationMetrics: {
                  placementEfficiency: artifact.placementEfficiency,
                  averageSpacing: artifact.averageSpacing,
                  windAlignment: artifact.windAngle,
                  totalCapacity: artifact.totalCapacity
                }
              };

              console.log('⚡ ✅ Transformed artifact:', {
                messageContentType: transformed.messageContentType,
                title: transformed.title,
                turbineCount: transformed.layout.turbineCount,
                totalCapacity: transformed.layout.totalCapacity,
                efficiency: transformed.layout.efficiency,
                layoutType: transformed.layoutType
              });

              return transformed;
            } else {
              console.log('⚡ ⚠️ Artifact type not wind_farm_layout:', artifact.type);
            }
            return artifact;
          });

          console.log('⚡ Final transformed artifacts count:', transformedArtifacts.length);
          console.log('⚡ Final transformed artifacts types:', transformedArtifacts.map(a => a.messageContentType || a.type));

        } else {
          console.log('⚡ ❌ No artifacts returned from tool');
        }

        const finalResponse = {
          success: toolResponse.success,
          message: toolResponse.message + ` The ${layoutType || 'grid'} layout algorithm optimized placement for ${numTurbines} turbines with ${spacing || 9}D spacing, aligned with ${windAngle || 225}° wind direction.`,
          artifacts: transformedArtifacts,
          thoughtSteps: [...thoughtSteps, ...(toolResponse.thoughtSteps || [])],
          agentUsed: 'renewableEnergyAgent',
          sourceAttribution: toolResponse.sourceAttribution || [{
            title: 'Wind Farm Layout Optimization',
            url: '#renewable-layout-design',
            snippet: 'Strategic turbine placement for maximum energy capture using advanced algorithms'
          }]
        };

        console.log('⚡ Final response:', {
          success: finalResponse.success,
          artifactCount: finalResponse.artifacts?.length || 0,
          artifactTypes: finalResponse.artifacts?.map(a => a.messageContentType || a.type) || [],
          agentUsed: finalResponse.agentUsed
        });

        return finalResponse;

      } catch (error) {
        console.error('❌ RenewableEnergyAgent: Error executing layout optimization tool:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        completeThoughtStep(layoutThought, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        return {
          success: false,
          message: `Error optimizing wind farm layout: ${error instanceof Error ? error.message : 'Unknown error'}`,
          artifacts: [],
          agentUsed: 'renewableEnergyAgent',
          thoughtSteps
        };
      }
    } else {
      console.log('⚡ ❌ Missing required parameters');
      completeThoughtStep(layoutThought, 'Coordinates and capacity needed for layout design');
      
      return {
        success: true,
        message: 'I can help you design an optimal wind farm layout. Please provide:\n\n• **Coordinates** (latitude, longitude) for the site\n• **Capacity** (e.g., "30MW") for the wind farm\n• **Layout type** (optional): "grid", "spiral", or "greedy"\n• **Wind direction** (optional): dominant wind angle in degrees\n• **Turbine spacing** (optional): spacing in rotor diameters (default 9D)\n\nExample: "Design a 50MW grid layout wind farm at 40.7128, -74.0060 with 225° wind direction"',
        artifacts: [],
        agentUsed: 'renewableEnergyAgent',
        thoughtSteps
      };
    }
  }

  /**
   * Handle simulation requests
   */
  private async handleSimulation(message: string, thoughtSteps: ThoughtStep[]): Promise<RouterResponse> {
    console.log('🌬️ RenewableEnergyAgent: handleSimulation called');
    console.log('🌬️ Message:', message);

    const simulationThought = createThoughtStep(
      'execution',
      'Running wind farm simulation',
      'Calculating wake effects and energy production using Jensen wake model'
    );
    thoughtSteps.push(simulationThought);

    // Extract parameters from message
    const coordinates = this.extractCoordinates(message);
    const capacity = this.extractCapacity(message);
    const turbineModel = this.extractTurbineModel(message);
    const layoutType = this.extractLayoutType(message);
    const windAngle = this.extractWindAngle(message);
    const spacing = this.extractSpacing(message);

    console.log('🌬️ Extracted parameters:', {
      coordinates,
      capacity,
      turbineModel,
      layoutType,
      windAngle,
      spacing
    });

    // For simulation, we need layout data - either from user or generate a quick layout
    if (coordinates && capacity) {
      try {
        console.log('🌬️ Creating layout for simulation...');

        // Parse capacity to get MW value
        const capacityMatch = capacity.match(/(\d+\.?\d*)/);
        const capacityMW = capacityMatch ? parseFloat(capacityMatch[1]) : 30;

        // Calculate number of turbines based on capacity and turbine model  
        const turbineCapacity = this.getTurbineCapacity(turbineModel || 'IEA_Reference_3.4MW_130');
        const numTurbines = Math.ceil(capacityMW / turbineCapacity);
        const rotorDiameter = this.getRotorDiameter(turbineModel || 'IEA_Reference_3.4MW_130');

        // Create a basic grid layout for simulation
        const layoutParams = {
          project_id: `simulation_${Date.now()}`,
          center_lat: coordinates.lat,
          center_lon: coordinates.lng,
          num_turbines: numTurbines,
          turbine_model: turbineModel || 'IEA_Reference_3.4MW_130',
          rotor_diameter: rotorDiameter,
          capacity_mw: capacityMW,
          wind_angle: windAngle || 225,
          spacing_d: spacing || 9
        };

        console.log('🌬️ Creating layout with parameters:', layoutParams);

        // Create layout first (use grid as default for simulation)
        const layoutResponse = await createGridLayout(layoutParams);

        if (!layoutResponse.success || !layoutResponse.artifacts || layoutResponse.artifacts.length === 0) {
          throw new Error('Failed to create layout for simulation');
        }

        const layoutArtifact = layoutResponse.artifacts[0];
        
        if (!layoutArtifact.turbines || layoutArtifact.turbines.length === 0) {
          throw new Error('No turbine positions generated for simulation');
        }

        console.log('🌬️ Layout created successfully, running simulation...');

        // Now run the simulation with the layout data
        const simulationParams = {
          layoutData: {
            turbinePositions: layoutArtifact.turbines.map((turbine: any) => ({
              id: turbine.id,
              lat: turbine.lat,
              lng: turbine.lng
            })),
            turbineModel: turbineModel || 'IEA_Reference_3.4MW_130',
            totalCapacity: capacityMW,
            windDirection: windAngle || 225
          },
          projectId: `simulation_${Date.now()}`,
          analysisOptions: {
            wakeModel: 'jensen' as const,
            ambientTurbulence: 0.1,
            airDensity: 1.225,
            includeTerrainEffects: false
          }
        };

        console.log('🌬️ Calling renewableSimulationTool with params:', {
          turbineCount: simulationParams.layoutData.turbinePositions.length,
          turbineModel: simulationParams.layoutData.turbineModel,
          totalCapacity: simulationParams.layoutData.totalCapacity,
          windDirection: simulationParams.layoutData.windDirection
        });

        const simulationResponse = await renewableSimulationTool(simulationParams);

        console.log('🌬️ Simulation response received:', {
          hasArtifacts: !!simulationResponse.artifacts,
          artifactCount: simulationResponse.artifacts?.length || 0,
          messageContentType: simulationResponse.messageContentType
        });

        completeThoughtStep(simulationThought, `Wake modeling simulation completed for ${numTurbines} turbines`);

        // Transform simulation response to match expected format
        let transformedArtifacts = [];
        
        if (simulationResponse.artifacts && simulationResponse.artifacts.length > 0) {
          console.log('🌬️ Transforming simulation artifacts...');
          
          transformedArtifacts = simulationResponse.artifacts.map((artifact, index) => {
            console.log(`🌬️ Processing simulation artifact ${index + 1}:`, {
              messageContentType: artifact.messageContentType,
              hasPerformanceMetrics: !!artifact.performanceMetrics,
              hasWakeAnalysis: !!artifact.wakeAnalysis,
              hasRecommendations: !!artifact.optimizationRecommendations
            });

            // The artifact should already be in the correct format from the simulation tool
            return artifact;
          });
        }

        const finalResponse = {
          success: true,
          message: simulationResponse.messageContent,
          artifacts: transformedArtifacts,
          thoughtSteps: thoughtSteps, // Only use the existing thoughtSteps array
          agentUsed: 'renewableEnergyAgent',
          sourceAttribution: [{
            title: 'Wind Farm Performance Simulation',
            url: '#renewable-simulation',
            snippet: 'Jensen wake model analysis with comprehensive performance metrics'
          }]
        };

        console.log('🌬️ Final simulation response:', {
          success: finalResponse.success,
          artifactCount: finalResponse.artifacts?.length || 0,
          agentUsed: finalResponse.agentUsed
        });

        return finalResponse;

      } catch (error) {
        console.error('❌ RenewableEnergyAgent: Error running simulation:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
        
        completeThoughtStep(simulationThought, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);

        return {
          success: false,
          message: `Error running wind farm simulation: ${error instanceof Error ? error.message : 'Unknown error'}`,
          artifacts: [],
          agentUsed: 'renewableEnergyAgent',
          thoughtSteps
        };
      }
    } else {
      console.log('🌬️ ❌ Missing required parameters for simulation');
      completeThoughtStep(simulationThought, 'Coordinates and capacity needed for simulation');
      
      return {
        success: true,
        message: 'I can run a comprehensive wind farm performance simulation including wake analysis and energy production calculations. Please provide:\n\n• **Coordinates** (latitude, longitude) for the wind farm site\n• **Capacity** (e.g., "30MW") for the wind farm\n• **Turbine model** (optional): e.g., "IEA_Reference_3.4MW_130"\n• **Wind direction** (optional): dominant wind angle in degrees\n• **Turbine spacing** (optional): spacing in rotor diameters (default 9D)\n\nExample: "Run simulation for 30MW wind farm at 40.7128, -74.0060 with 225° wind direction"\n\nThe simulation will include:\n• Jensen wake model analysis\n• Annual energy production calculations\n• Capacity factor analysis\n• Wake loss optimization recommendations',
        artifacts: [],
        agentUsed: 'renewableEnergyAgent',
        thoughtSteps
      };
    }
  }

  /**
   * Handle reporting requests
   */
  private async handleReporting(message: string, thoughtSteps: ThoughtStep[]): Promise<RouterResponse> {
    const reportThought = createThoughtStep(
      'execution',
      'Generating wind farm report',
      'Creating comprehensive executive summary and documentation'
    );
    thoughtSteps.push(reportThought);

    const artifacts = [{
      messageContentType: 'wind_farm_report',
      title: 'Wind Farm Executive Report',
      subtitle: 'Comprehensive analysis and recommendations',
      analysisType: 'executive_report',
      report: {
        // This would be populated by actual report generation
        executiveSummary: 'TBD - requires project data',
        technicalAnalysis: 'TBD',
        financialProjections: 'TBD',
        recommendations: 'TBD'
      }
    }];

    completeThoughtStep(reportThought, 'Report structure prepared');

    return {
      success: true,
      message: 'Executive report generation initiated. I can create comprehensive documentation including technical analysis, financial projections, risk assessment, and strategic recommendations for your wind farm project.',
      artifacts,
      agentUsed: 'renewableEnergyAgent',
      sourceAttribution: [{
        title: 'Wind Farm Executive Reporting',
        url: '#renewable-reporting',
        snippet: 'Professional documentation and strategic analysis'
      }]
    };
  }

  /**
   * Handle general renewable energy queries
   */
  private async handleGeneralRenewable(message: string, thoughtSteps: ThoughtStep[]): Promise<RouterResponse> {
    const generalThought = createThoughtStep(
      'intent_detection',
      'Processing renewable energy inquiry',
      'Providing guidance on wind farm development process'
    );
    thoughtSteps.push(generalThought);

    completeThoughtStep(generalThought, 'General renewable energy guidance prepared');

    return {
      success: true,
      message: `I'm here to help with your renewable energy project! I can assist with:

🌍 **Terrain Analysis**: Identify suitable locations and exclusion zones
⚡ **Layout Design**: Optimize turbine placement for maximum energy production  
📊 **Simulation**: Model wake effects and calculate performance metrics
📋 **Reporting**: Generate executive summaries and technical documentation

To get started, you can ask me to:
- "Analyze terrain for wind farm at [coordinates]"
- "Design a [capacity]MW wind farm layout at [location]"
- "Run simulation for wind farm project"
- "Generate executive report for wind project"

What aspect of wind farm development would you like to explore?`,
      artifacts: [{
        messageContentType: 'renewable_energy_guidance',
        title: 'Wind Farm Development Process',
        subtitle: 'Complete workflow for renewable energy projects',
        analysisType: 'guidance',
        workflow: {
          steps: [
            'Site Selection & Terrain Analysis',
            'Layout Design & Optimization', 
            'Performance Simulation & Modeling',
            'Executive Reporting & Documentation'
          ],
          capabilities: [
            'Multi-agent coordination',
            'Interactive visualizations',
            'Performance optimization',
            'Comprehensive reporting'
          ]
        }
      }],
      sourceAttribution: [{
        title: 'Renewable Energy Development',
        url: '#renewable-energy-overview',
        snippet: 'Comprehensive wind farm development capabilities'
      }],
      agentUsed: 'renewableEnergyAgent'
    };
  }

  /**
   * Extract coordinates from message
   */
  private extractCoordinates(message: string): { lat: number; lng: number } | null {
    // Look for latitude, longitude patterns
    const coordPatterns = [
      /(\-?\d+\.?\d*),\s*(\-?\d+\.?\d*)/,  // Simple lat,lng
      /lat[itude]*:?\s*(\-?\d+\.?\d*),?\s*lon[gitude]*:?\s*(\-?\d+\.?\d*)/i,
      /(\-?\d+\.?\d*)\s*,\s*(\-?\d+\.?\d*)/
    ];

    for (const pattern of coordPatterns) {
      const match = message.match(pattern);
      if (match) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { lat, lng };
        }
      }
    }

    return null;
  }

  /**
   * Extract capacity from message
   */
  private extractCapacity(message: string): string | null {
    const capacityMatch = message.match(/(\d+\.?\d*)\s*mw/i);
    return capacityMatch ? `${capacityMatch[1]}MW` : null;
  }

  /**
   * Extract setback distance from message
   */
  private extractSetbackDistance(message: string): number | null {
    const setbackMatch = message.match(/(\d+)\s*m(?:eter)?s?\s*(?:setback|away|buffer)/i);
    return setbackMatch ? parseInt(setbackMatch[1]) : null;
  }

  /**
   * Extract turbine model from message
   */
  private extractTurbineModel(message: string): string | null {
    const turbineMatch = message.match(/turbine\s+(?:model\s+)?([A-Za-z0-9_]+(?:\.\d+)?(?:MW)?(?:_\d+)?)/i);
    return turbineMatch ? turbineMatch[1] : null;
  }

  /**
   * Extract layout type from message
   */
  private extractLayoutType(message: string): string | null {
    const lowerMessage = message.toLowerCase();
    if (/spiral.*layout|spiral.*pattern/i.test(message)) {
      return 'spiral';
    }
    if (/greedy.*layout|greedy.*pattern|optimize.*placement/i.test(message)) {
      return 'greedy';
    }
    if (/grid.*layout|grid.*pattern/i.test(message)) {
      return 'grid';
    }
    return null; // Default to grid will be handled in calling method
  }

  /**
   * Extract wind angle from message
   */
  private extractWindAngle(message: string): number | null {
    const windPatterns = [
      /wind.*direction[:\s]*(\d+)°?/i,
      /wind.*angle[:\s]*(\d+)°?/i,
      /(\d+)°?\s*wind/i,
      /dominant.*wind[:\s]*(\d+)°?/i
    ];

    for (const pattern of windPatterns) {
      const match = message.match(pattern);
      if (match) {
        const angle = parseInt(match[1]);
        if (angle >= 0 && angle < 360) {
          return angle;
        }
      }
    }
    return null;
  }

  /**
   * Extract spacing from message
   */
  private extractSpacing(message: string): number | null {
    const spacingMatch = message.match(/(\d+)D?\s*spacing|spacing[:\s]*(\d+)D?/i);
    if (spacingMatch) {
      return parseInt(spacingMatch[1] || spacingMatch[2]);
    }
    return null;
  }

  /**
   * Get turbine capacity based on model
   */
  private getTurbineCapacity(turbineModel: string): number {
    const turbineCapacities: { [key: string]: number } = {
      'IEA_Reference_3.4MW_130': 3.4,
      'NREL_Reference_2MW_116': 2.0,
      'NREL_Reference_1.5MW_77': 1.5,
      'Vestas_V90_3MW': 3.0,
      'GE_2.5MW_120': 2.5,
      'Siemens_2.3MW_108': 2.3,
      'Enercon_E126_7.5MW': 7.5,
      'Vestas_V164_8MW': 8.0,
      'GE_Haliade_6MW': 6.0
    };

    // Try to extract capacity from model name if not in lookup
    const capacityMatch = turbineModel.match(/(\d+\.?\d*)MW/i);
    if (capacityMatch) {
      return parseFloat(capacityMatch[1]);
    }

    return turbineCapacities[turbineModel] || 3.4; // Default to 3.4MW
  }

  /**
   * Get rotor diameter based on model
   */
  private getRotorDiameter(turbineModel: string): number {
    const rotorDiameters: { [key: string]: number } = {
      'IEA_Reference_3.4MW_130': 130,
      'NREL_Reference_2MW_116': 116,
      'NREL_Reference_1.5MW_77': 77,
      'Vestas_V90_3MW': 90,
      'GE_2.5MW_120': 120,
      'Siemens_2.3MW_108': 108,
      'Enercon_E126_7.5MW': 126,
      'Vestas_V164_8MW': 164,
      'GE_Haliade_6MW': 150
    };

    // Try to extract diameter from model name if not in lookup
    const diameterMatch = turbineModel.match(/_(\d+)$/);
    if (diameterMatch) {
      return parseInt(diameterMatch[1]);
    }

    return rotorDiameters[turbineModel] || 130; // Default to 130m
  }
}
