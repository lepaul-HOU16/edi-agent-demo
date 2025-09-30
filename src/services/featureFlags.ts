/**
 * Enterprise Feature Flag System
 * Enables safe, progressive rollout of collection features
 * Runtime toggles with A/B testing support
 */

import React from 'react';

interface FeatureFlags {
  collections_enabled: boolean;
  collection_creation: boolean;
  collection_state_restoration: boolean;
  collection_analytics: boolean;
  collection_multi_user: boolean;
  collection_advanced_search: boolean;
}

interface UserContext {
  userId: string;
  userTier?: 'basic' | 'premium' | 'enterprise';
  betaFeatures?: boolean;
  region?: string;
}

class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: FeatureFlags;
  private rolloutPercentages: { [key: string]: number };

  private constructor() {
    // Default feature flags (enable collection creation for production use)
    this.flags = {
      collections_enabled: true,
      collection_creation: true,
      collection_state_restoration: true,
      collection_analytics: false,
      collection_multi_user: false,
      collection_advanced_search: false
    };

    // Rollout percentages for gradual feature deployment
    this.rolloutPercentages = {
      collections_enabled: 100,        // Fully enabled for production use
      collection_creation: 100,        // Fully enabled for production use
      collection_state_restoration: 100, // Fully enabled for production use
      collection_analytics: 0,       // Keep disabled - not implemented yet
      collection_multi_user: 0,      // Keep disabled - enterprise feature
      collection_advanced_search: 0  // Keep disabled - not implemented yet
    };

    this.loadFromEnvironment();
  }

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private loadFromEnvironment() {
    // Allow environment override for specific deployments
    try {
      if (process.env.FEATURE_FLAGS_OVERRIDE) {
        const overrides = JSON.parse(process.env.FEATURE_FLAGS_OVERRIDE);
        this.flags = { ...this.flags, ...overrides };
      }

      if (process.env.FEATURE_ROLLOUT_PERCENTAGES) {
        const rolloutOverrides = JSON.parse(process.env.FEATURE_ROLLOUT_PERCENTAGES);
        this.rolloutPercentages = { ...this.rolloutPercentages, ...rolloutOverrides };
      }
    } catch (error) {
      console.warn('Failed to load feature flag overrides:', error);
    }
  }

  /**
   * Check if a feature is enabled for a specific user
   */
  isEnabled(feature: keyof FeatureFlags, userContext?: UserContext): boolean {
    try {
      // Check global flag first
      if (!this.flags[feature]) {
        return false;
      }

      // Check rollout percentage
      if (userContext?.userId) {
        const rolloutPercentage = this.rolloutPercentages[feature] || 0;
        if (rolloutPercentage === 0) {
          return false; // Not rolled out yet
        }
        
        if (rolloutPercentage === 100) {
          return true; // Fully rolled out
        }

        // Hash-based consistent rollout
        const hash = this.hashUserId(userContext.userId);
        const userPercentile = hash % 100;
        
        if (userPercentile < rolloutPercentage) {
          return true;
        }
      }

      // Premium/Enterprise user overrides
      if (userContext?.userTier === 'enterprise') {
        return true; // Enterprise users get early access
      }

      if (userContext?.betaFeatures) {
        return true; // Beta users get early access
      }

      return false;
    } catch (error) {
      console.warn('Feature flag check failed:', error);
      return false; // Fail safe - disable feature on error
    }
  }

  /**
   * Enable feature for specific user
   */
  enableForUser(feature: keyof FeatureFlags, userId: string): void {
    // Store user-specific overrides (could be in cache/database in production)
    const overrideKey = `feature_${feature}_${userId}`;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(overrideKey, 'true');
    }
  }

  /**
   * Get all enabled features for a user
   */
  getEnabledFeatures(userContext: UserContext): Partial<FeatureFlags> {
    const enabledFeatures: Partial<FeatureFlags> = {};
    
    for (const feature in this.flags) {
      if (this.isEnabled(feature as keyof FeatureFlags, userContext)) {
        enabledFeatures[feature as keyof FeatureFlags] = true;
      }
    }

    return enabledFeatures;
  }

  /**
   * Update rollout percentage for gradual deployment
   */
  updateRolloutPercentage(feature: keyof FeatureFlags, percentage: number): void {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Rollout percentage must be between 0 and 100');
    }
    
    this.rolloutPercentages[feature] = percentage;
    console.log(`Updated rollout for ${feature}: ${percentage}%`);
  }

  /**
   * Emergency disable - immediately turn off feature for all users
   */
  emergencyDisable(feature: keyof FeatureFlags): void {
    this.flags[feature] = false;
    this.rolloutPercentages[feature] = 0;
    console.warn(`EMERGENCY DISABLE: ${feature} disabled for all users`);
  }

  /**
   * Simple hash function for consistent user bucketing
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get feature flag status for debugging
   */
  getDebugInfo(userContext?: UserContext): any {
    return {
      flags: this.flags,
      rolloutPercentages: this.rolloutPercentages,
      userContext,
      enabledFeatures: userContext ? this.getEnabledFeatures(userContext) : {},
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const featureFlags = FeatureFlagService.getInstance();

// Convenience functions for common checks
export const isCollectionsEnabled = (userContext?: UserContext) => 
  featureFlags.isEnabled('collections_enabled', userContext);

export const isCollectionCreationEnabled = (userContext?: UserContext) => 
  featureFlags.isEnabled('collection_creation', userContext);

export const isCollectionStateRestorationEnabled = (userContext?: UserContext) => 
  featureFlags.isEnabled('collection_state_restoration', userContext);

export const isCollectionAnalyticsEnabled = (userContext?: UserContext) => 
  featureFlags.isEnabled('collection_analytics', userContext);

// HOC for feature-flagged components
export function withFeatureFlag<P extends object>(
  Component: React.ComponentType<P>,
  feature: keyof FeatureFlags,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlaggedComponent(props: P) {
    // In production, get user context from auth
    const userContext = { userId: 'current-user' }; // Placeholder
    
    if (featureFlags.isEnabled(feature, userContext)) {
      return React.createElement(Component, props);
    }
    
    if (FallbackComponent) {
      return React.createElement(FallbackComponent, props);
    }
    
    return null;
  };
}
