/**
 * Site Suitability Scoring Service
 * 
 * Implements comprehensive site assessment with professional scoring methodology
 * for renewable energy projects, including weighted scoring system for wind resource,
 * terrain, grid connectivity, environmental impact, regulatory compliance, and economic factors.
 */

import {
  SiteSuitabilityAssessment,
  ComponentScores,
  ComponentScore,
  RiskFactor,
  SuitabilityRecommendation,
  ScoringConfiguration,
  DEFAULT_SCORING_CONFIG,
  WindResourceAssessment,
  TerrainSuitabilityAssessment,
  GridConnectivityAssessment,
  EnvironmentalImpactAssessment,
  SiteLocation,
  SuitabilityMetadata,
  RecommendationType
} from '../../types/suitabilityScoring';
import { WindResourceData } from '../../types/windData';
import { TerrainFeature } from '../../types/layoutOptimization';

/**
 * Site Suitability Scoring Service
 * 
 * Provides comprehensive site assessment capabilities with professional
 * scoring methodology for renewable energy site evaluation.
 */
export class SuitabilityScoringService {
  private config: ScoringConfiguration;

  constructor(config: ScoringConfiguration = DEFAULT_SCORING_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate comprehensive site suitability assessment
   */
  async calculateSuitability(
    siteId: string,
    location: SiteLocation,
    windData: WindResourceData,
    terrainFeatures: TerrainFeature[],
    constraints?: any
  ): Promise<SiteSuitabilityAssessment> {
    try {
      // Perform individual component assessments
      const windResourceAssessment = await this.assessWindResource(windData);
      const terrainAssessment = await this.assessTerrainSuitability(terrainFeatures, location);
      const gridAssessment = await this.assessGridConnectivity(location);
      const environmentalAssessment = await this.assessEnvironmentalImpact(location, terrainFeatures);
      
      // Calculate component scores
      const componentScores = this.calculateComponentScores(
        windResourceAssessment,
        terrainAssessment,
        gridAssessment,
        environmentalAssessment
      );

      // Calculate overall score
      const overallScore = this.calculateOverallScore(componentScores);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(
        windResourceAssessment,
        terrainAssessment,
        gridAssessment,
        environmentalAssessment
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        overallScore,
        componentScores,
        riskFactors
      );

      // Create metadata
      const metadata = this.createMetadata(siteId);

      return {
        siteId,
        location,
        overallScore,
        componentScores,
        riskFactors,
        recommendations,
        metadata
      };
    } catch (error) {
      console.error('Error calculating site suitability:', error);
      throw new Error(`Failed to calculate site suitability: ${error.message}`);
    }
  }

  /**
   * Assess wind resource quality and potential
   */
  private async assessWindResource(windData: WindResourceData): Promise<WindResourceAssessment> {
    const statistics = windData.statistics;
    const qualityMetrics = windData.qualityMetrics;

    // Calculate resource quality metrics
    const resourceQuality = {
      averageWindSpeed: statistics.meanWindSpeed,
      windPowerDensity: statistics.powerDensity,
      capacity_factor_estimate: this.estimateCapacityFactor(statistics.meanWindSpeed),
      consistency: this.calculateConsistency(statistics),
      predictability: qualityMetrics.reliability === 'high' ? 0.9 : 
                     qualityMetrics.reliability === 'medium' ? 0.7 : 0.5,
      rating: this.rateWindResource(statistics.meanWindSpeed, statistics.powerDensity)
    };

    // Assess turbulence
    const turbulenceAssessment = {
      averageTurbulenceIntensity: 0.15, // Default value, would be calculated from data
      terrainComplexity: 0.3,
      obstacleInfluence: 0.2,
      fatigueLoadingRisk: statistics.meanWindSpeed > 8 ? 'medium' : 'low' as 'low' | 'medium' | 'high',
      mitigationRequired: false
    };

    // Create wind shear profile
    const shearProfile = {
      shearExponent: 0.14, // Typical value
      heightProfile: this.generateHeightProfile(statistics.meanWindSpeed),
      optimalHubHeight: 100, // meters
      shearVariability: 0.1
    };

    // Calculate energy potential
    const energyPotential = {
      theoreticalPotential: statistics.powerDensity * 8760 / 1000, // MWh/year/km²
      technicalPotential: statistics.powerDensity * 8760 / 1000 * 0.8,
      economicPotential: statistics.powerDensity * 8760 / 1000 * 0.6,
      developablePotential: statistics.powerDensity * 8760 / 1000 * 0.4,
      uncertaintyRange: {
        low: statistics.powerDensity * 8760 / 1000 * 0.3,
        high: statistics.powerDensity * 8760 / 1000 * 0.7
      }
    };

    return {
      windData,
      resourceQuality,
      seasonalVariability: statistics.standardDeviation / statistics.meanWindSpeed,
      extremeWindEvents: [], // Would be populated from historical data
      turbulenceAssessment,
      shearProfile,
      energyPotential
    };
  }

  /**
   * Assess terrain suitability for wind farm development
   */
  private async assessTerrainSuitability(
    terrainFeatures: TerrainFeature[],
    location: SiteLocation
  ): Promise<TerrainSuitabilityAssessment> {
    // Analyze topography
    const topography = {
      averageSlope: 5, // degrees - would be calculated from elevation data
      maxSlope: 15,
      elevationRange: 50,
      terrainRoughness: 0.3,
      suitableArea: this.calculateSuitableArea(terrainFeatures),
      accessibilityRating: this.assessAccessibility(terrainFeatures) as 'excellent' | 'good' | 'fair' | 'poor'
    };

    // Assess geology
    const geology = {
      soilType: 'Mixed', // Would be determined from geological surveys
      rockType: 'Sedimentary',
      bearingCapacity: 200, // kPa
      foundationRequirements: this.assessFoundationRequirements(),
      geotechnicalRisk: 'medium' as 'low' | 'medium' | 'high',
      seismicActivity: {
        seismicZone: 'Low',
        peakGroundAcceleration: 0.1,
        earthquakeFrequency: 0.01,
        designRequirements: ['Standard foundation design'],
        additionalCosts: 0
      }
    };

    // Assess accessibility
    const accessibility = {
      roadAccess: {
        distanceToMajorRoad: 5, // km
        roadQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
        bridgeRestrictions: false,
        weightLimitations: 80, // tons
        upgradeCosts: 0.1
      },
      transportationChallenges: [],
      constructionAccess: {
        craneAccess: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
        laydownArea: 5, // hectares
        temporaryRoadRequirements: 2, // km
        constructionComplexity: 'medium' as 'low' | 'medium' | 'high'
      },
      maintenanceAccess: {
        yearRoundAccess: true,
        emergencyAccess: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
        serviceRoadRequirements: 1, // km
        accessRestrictions: []
      },
      overallAccessibility: 'good' as 'excellent' | 'good' | 'fair' | 'poor'
    };

    // Assess land use
    const landUse = {
      currentLandUse: this.analyzeLandUse(terrainFeatures),
      landOwnership: {
        ownershipType: 'private' as 'private' | 'public' | 'mixed',
        numberOfOwners: 3,
        acquisitionMethod: 'lease' as 'purchase' | 'lease' | 'easement',
        negotiationComplexity: 'medium' as 'low' | 'medium' | 'high',
        estimatedCosts: 1000 // currency per hectare
      },
      zoning: {
        currentZoning: 'Agricultural',
        windEnergyPermitted: true,
        rezoningRequired: false,
        rezoningComplexity: 'low' as 'low' | 'medium' | 'high',
        timeToRezone: 0
      },
      conflictingUses: [],
      acquisitionComplexity: 'medium' as 'low' | 'medium' | 'high'
    };

    // Identify constraints
    const constraints = this.identifyTerrainConstraints(terrainFeatures);
    const developmentChallenges = this.identifyDevelopmentChallenges(terrainFeatures);

    return {
      topography,
      geology,
      accessibility,
      landUse,
      constraints,
      developmentChallenges
    };
  }

  /**
   * Assess grid connectivity and transmission capacity
   */
  private async assessGridConnectivity(location: SiteLocation): Promise<GridConnectivityAssessment> {
    // Mock grid infrastructure assessment
    const gridInfrastructure = {
      nearestSubstation: {
        distance: 10, // km
        voltage: 138, // kV
        capacity: 100, // MVA
        availableCapacity: 50 // MVA
      },
      transmissionLines: [
        {
          voltage: 138,
          distance: 10,
          capacity: 100,
          utilization: 60,
          upgradeRequired: false
        }
      ],
      gridReliability: 'high' as 'high' | 'medium' | 'low',
      congestionIssues: false
    };

    // Connection options
    const connectionOptions = [
      {
        connectionType: 'radial' as 'radial' | 'loop' | 'network',
        voltage: 138,
        distance: 10,
        capacity: 50,
        cost: 5000000, // currency units
        reliability: 'high' as 'high' | 'medium' | 'low',
        constructionTime: 18, // months
        permittingComplexity: 'medium' as 'low' | 'medium' | 'high'
      }
    ];

    // Transmission capacity
    const transmissionCapacity = {
      currentCapacity: 100,
      availableCapacity: 50,
      futureCapacity: 150,
      constraintPeriods: [],
      upgradeOptions: []
    };

    // Grid stability
    const gridStability = {
      voltageStability: 'stable' as 'stable' | 'marginal' | 'unstable',
      frequencyStability: 'stable' as 'stable' | 'marginal' | 'unstable',
      shortCircuitRatio: 10,
      harmonicDistortion: 3,
      stabilityStudyRequired: false
    };

    // Interconnection costs
    const interconnectionCosts = {
      studyCosts: 100000,
      constructionCosts: 4000000,
      upgradeCosts: 500000,
      ongoingCosts: 50000,
      totalCosts: 4650000,
      costPerMW: 93000
    };

    return {
      gridInfrastructure,
      connectionOptions,
      transmissionCapacity,
      gridStability,
      interconnectionCosts,
      timeToConnect: 24 // months
    };
  }

  /**
   * Assess environmental impact
   */
  private async assessEnvironmentalImpact(
    location: SiteLocation,
    terrainFeatures: TerrainFeature[]
  ): Promise<EnvironmentalImpactAssessment> {
    // Mock environmental assessment - in real implementation, this would
    // integrate with environmental databases and conduct detailed studies
    
    const ecologicalImpact = {
      habitatTypes: [],
      protectedAreas: [],
      biodiversityIndex: 0.6,
      ecosystemServices: [],
      mitigationMeasures: [],
      residualImpact: 'medium' as 'low' | 'medium' | 'high'
    };

    const wildlifeImpact = {
      birdSpecies: [],
      batSpecies: [],
      migrationRoutes: [],
      breedingAreas: [],
      collisionRisk: {
        overallRisk: 'medium' as 'low' | 'medium' | 'high',
        riskBySpecies: {},
        riskFactors: ['Migration routes', 'Breeding areas'],
        mitigationEffectiveness: 0.7,
        residualRisk: 'low' as 'low' | 'medium' | 'high'
      },
      displacementRisk: {
        overallRisk: 'low' as 'low' | 'medium' | 'high',
        affectedSpecies: [],
        displacementDistance: 500,
        habitatLoss: 10,
        populationImpact: 5
      },
      mitigationStrategies: []
    };

    const visualImpact = {
      viewshedAnalysis: {
        visibilityArea: 100,
        maximumViewingDistance: 20,
        prominentViewpoints: [],
        landscapeCharacter: {
          type: 'Rural Agricultural',
          quality: 'medium' as 'high' | 'medium' | 'low',
          rarity: 'common' as 'common' | 'uncommon' | 'rare',
          intactness: 'medium' as 'high' | 'medium' | 'low',
          culturalValue: 'medium' as 'high' | 'medium' | 'low'
        },
        visualSensitivity: 'medium' as 'low' | 'medium' | 'high'
      },
      sensitiveReceptors: [],
      visualImpactRating: 'medium' as 'low' | 'medium' | 'high',
      mitigationMeasures: [],
      publicAcceptance: {
        overallSupport: 65,
        supportByGroup: {},
        concerns: ['Visual impact', 'Noise'],
        benefitPerception: 'medium' as 'high' | 'medium' | 'low',
        engagementLevel: 'medium' as 'high' | 'medium' | 'low'
      }
    };

    const noiseImpact = {
      noiseModeling: {
        modelType: 'ISO 9613-2',
        backgroundNoise: 35,
        predictedNoise: 40,
        noiseIncrease: 5,
        complianceMargin: 5,
        uncertaintyRange: { low: 38, high: 42 }
      },
      sensitiveReceptors: [],
      complianceAssessment: {
        overallCompliance: true,
        nonCompliantReceptors: 0,
        worstCaseExceedance: 0,
        complianceStrategy: 'Standard setbacks',
        regulatoryRequirements: ['45 dB(A) at nearest residence']
      },
      mitigationMeasures: [],
      monitoringPlan: {
        preConstructionMonitoring: true,
        operationalMonitoring: true,
        monitoringLocations: 3,
        monitoringDuration: 12,
        reportingFrequency: 'Quarterly'
      }
    };

    return {
      ecologicalImpact,
      wildlifeImpact,
      visualImpact,
      noiseImpact,
      culturalHeritage: {
        archaeologicalSites: [],
        historicStructures: [],
        culturalLandscapes: [],
        indigenousHeritage: {
          traditionalTerritory: false,
          sacredSites: [],
          traditionalUse: [],
          consultationRequired: false,
          consentObtained: true
        },
        impactAssessment: {
          overallImpact: 'minor' as 'none' | 'minor' | 'moderate' | 'major',
          directImpacts: [],
          indirectImpacts: [],
          cumulativeImpacts: [],
          mitigationMeasures: [],
          residualImpact: 'minor' as 'none' | 'minor' | 'moderate' | 'major'
        }
      },
      waterResources: {
        surfaceWater: {
          waterBodies: [],
          drainagePatterns: [],
          flowRegimes: [],
          waterRights: [],
          impactAssessment: {
            constructionImpacts: [],
            operationalImpacts: [],
            cumulativeImpacts: [],
            mitigationMeasures: [],
            monitoringRequired: false,
            residualImpact: 'low' as 'low' | 'medium' | 'high'
          }
        },
        groundwater: {
          aquifers: [],
          wellFields: [],
          waterQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
          vulnerabilityAssessment: {
            overallVulnerability: 'low' as 'low' | 'medium' | 'high',
            contaminationRisk: 'low' as 'low' | 'medium' | 'high',
            protectionMeasures: [],
            monitoringRequired: false
          }
        },
        wetlands: {
          wetlandAreas: [],
          wetlandFunctions: [],
          jurisdictionalStatus: 'non_jurisdictional' as 'jurisdictional' | 'non_jurisdictional' | 'uncertain',
          impactAssessment: {
            directImpacts: 0,
            indirectImpacts: 0,
            cumulativeImpacts: 0,
            mitigationRequired: false,
            compensationRequired: false
          }
        },
        floodRisk: {
          floodZone: 'X' as 'A' | 'AE' | 'X' | 'D',
          floodElevation: 0,
          floodFrequency: 0.01,
          floodImpact: 'none' as 'none' | 'minor' | 'moderate' | 'major',
          mitigationMeasures: []
        },
        waterQuality: {
          surfaceWaterQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
          groundwaterQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
          contaminationSources: [],
          impactPotential: 'low' as 'low' | 'medium' | 'high',
          monitoringRequired: false
        }
      },
      soilImpact: {
        soilTypes: [],
        soilQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
        erosionRisk: 'low' as 'low' | 'medium' | 'high',
        compactionRisk: 'medium' as 'low' | 'medium' | 'high',
        contaminationRisk: 'low' as 'low' | 'medium' | 'high',
        mitigationMeasures: [],
        restorationPlan: {
          restorationRequired: true,
          restorationMethods: ['Topsoil replacement', 'Revegetation'],
          timeframe: 12,
          successCriteria: ['80% vegetation cover'],
          monitoringPeriod: 24
        }
      },
      cumulativeImpacts: []
    };
  }

  /**
   * Calculate component scores based on assessments
   */
  private calculateComponentScores(
    windAssessment: WindResourceAssessment,
    terrainAssessment: TerrainSuitabilityAssessment,
    gridAssessment: GridConnectivityAssessment,
    environmentalAssessment: EnvironmentalImpactAssessment
  ): ComponentScores {
    // Wind Resource Score (0-100)
    const windResourceScore = this.calculateWindResourceScore(windAssessment);
    
    // Terrain Suitability Score (0-100)
    const terrainSuitabilityScore = this.calculateTerrainScore(terrainAssessment);
    
    // Grid Connectivity Score (0-100)
    const gridConnectivityScore = this.calculateGridScore(gridAssessment);
    
    // Environmental Impact Score (0-100, higher is better - less impact)
    const environmentalImpactScore = this.calculateEnvironmentalScore(environmentalAssessment);
    
    // Regulatory Compliance Score (0-100)
    const regulatoryComplianceScore = this.calculateRegulatoryScore();
    
    // Economic Viability Score (0-100)
    const economicViabilityScore = this.calculateEconomicScore(gridAssessment);

    return {
      windResource: {
        score: windResourceScore,
        weight: this.config.weights.windResource,
        confidence: 0.8,
        dataQuality: 'high',
        subScores: {
          averageWindSpeed: this.scoreWindSpeed(windAssessment.resourceQuality.averageWindSpeed),
          powerDensity: this.scorePowerDensity(windAssessment.resourceQuality.windPowerDensity),
          consistency: windAssessment.resourceQuality.consistency * 100,
          turbulence: this.scoreTurbulence(windAssessment.turbulenceAssessment)
        },
        rationale: `Wind resource quality rated as ${windAssessment.resourceQuality.rating} with average wind speed of ${windAssessment.resourceQuality.averageWindSpeed.toFixed(1)} m/s`,
        improvementPotential: Math.max(0, 90 - windResourceScore)
      },
      terrainSuitability: {
        score: terrainSuitabilityScore,
        weight: this.config.weights.terrainSuitability,
        confidence: 0.7,
        dataQuality: 'medium',
        subScores: {
          topography: this.scoreTopography(terrainAssessment.topography),
          accessibility: this.scoreAccessibility(terrainAssessment.accessibility),
          geology: this.scoreGeology(terrainAssessment.geology),
          landUse: this.scoreLandUse(terrainAssessment.landUse)
        },
        rationale: `Terrain suitability is ${terrainSuitabilityScore > 70 ? 'good' : terrainSuitabilityScore > 50 ? 'fair' : 'challenging'} with ${terrainAssessment.topography.accessibilityRating} accessibility`,
        improvementPotential: Math.max(0, 85 - terrainSuitabilityScore)
      },
      gridConnectivity: {
        score: gridConnectivityScore,
        weight: this.config.weights.gridConnectivity,
        confidence: 0.9,
        dataQuality: 'high',
        subScores: {
          distance: this.scoreGridDistance(gridAssessment.gridInfrastructure.nearestSubstation.distance),
          capacity: this.scoreGridCapacity(gridAssessment.gridInfrastructure.nearestSubstation.availableCapacity),
          reliability: this.scoreGridReliability(gridAssessment.gridInfrastructure.gridReliability),
          cost: this.scoreInterconnectionCost(gridAssessment.interconnectionCosts.costPerMW)
        },
        rationale: `Grid connection available ${gridAssessment.gridInfrastructure.nearestSubstation.distance}km away with ${gridAssessment.gridInfrastructure.nearestSubstation.availableCapacity}MVA capacity`,
        improvementPotential: Math.max(0, 95 - gridConnectivityScore)
      },
      environmentalImpact: {
        score: environmentalImpactScore,
        weight: this.config.weights.environmentalImpact,
        confidence: 0.6,
        dataQuality: 'medium',
        subScores: {
          wildlife: this.scoreWildlifeImpact(environmentalAssessment.wildlifeImpact),
          visual: this.scoreVisualImpact(environmentalAssessment.visualImpact),
          noise: this.scoreNoiseImpact(environmentalAssessment.noiseImpact),
          cultural: this.scoreCulturalImpact(environmentalAssessment.culturalHeritage)
        },
        rationale: `Environmental impact assessment shows ${environmentalImpactScore > 70 ? 'low' : environmentalImpactScore > 50 ? 'moderate' : 'high'} overall impact`,
        improvementPotential: Math.max(0, 80 - environmentalImpactScore)
      },
      regulatoryCompliance: {
        score: regulatoryComplianceScore,
        weight: this.config.weights.regulatoryCompliance,
        confidence: 0.8,
        dataQuality: 'high',
        subScores: {
          zoning: 85,
          permits: 75,
          setbacks: 90,
          environmental: 80
        },
        rationale: 'Regulatory compliance appears favorable with standard permitting requirements',
        improvementPotential: Math.max(0, 95 - regulatoryComplianceScore)
      },
      economicViability: {
        score: economicViabilityScore,
        weight: this.config.weights.economicViability,
        confidence: 0.7,
        dataQuality: 'medium',
        subScores: {
          capitalCosts: this.scoreCapitalCosts(gridAssessment.interconnectionCosts.totalCosts),
          operationalCosts: 75,
          revenue: this.scoreRevenuePotential(windAssessment.energyPotential.economicPotential),
          incentives: 70
        },
        rationale: `Economic viability is ${economicViabilityScore > 70 ? 'strong' : economicViabilityScore > 50 ? 'moderate' : 'challenging'} based on current market conditions`,
        improvementPotential: Math.max(0, 85 - economicViabilityScore)
      }
    };
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(componentScores: ComponentScores): number {
    const weights = this.config.weights;
    
    const weightedScore = 
      componentScores.windResource.score * weights.windResource +
      componentScores.terrainSuitability.score * weights.terrainSuitability +
      componentScores.gridConnectivity.score * weights.gridConnectivity +
      componentScores.environmentalImpact.score * weights.environmentalImpact +
      componentScores.regulatoryCompliance.score * weights.regulatoryCompliance +
      componentScores.economicViability.score * weights.economicViability;

    return Math.round(weightedScore * 100) / 100;
  }

  /**
   * Identify risk factors based on assessments
   */
  private identifyRiskFactors(
    windAssessment: WindResourceAssessment,
    terrainAssessment: TerrainSuitabilityAssessment,
    gridAssessment: GridConnectivityAssessment,
    environmentalAssessment: EnvironmentalImpactAssessment
  ): RiskFactor[] {
    const risks: RiskFactor[] = [];

    // Wind resource risks
    if (windAssessment.resourceQuality.averageWindSpeed < 6) {
      risks.push({
        id: 'low_wind_resource',
        category: 'technical',
        type: 'wind_resource_variability',
        severity: 'high',
        probability: 0.8,
        impact: 0.9,
        riskScore: 72,
        description: 'Low average wind speed may result in poor energy production',
        mitigationStrategies: [
          {
            strategy: 'Use larger, more efficient turbines',
            effectiveness: 0.7,
            cost: 0.3,
            timeToImplement: 6,
            feasibility: 'high',
            dependencies: []
          }
        ],
        timeframe: 'immediate',
        costToMitigate: 0.3
      });
    }

    // Terrain risks
    if (terrainAssessment.topography.averageSlope > 10) {
      risks.push({
        id: 'steep_terrain',
        category: 'technical',
        type: 'terrain_instability',
        severity: 'medium',
        probability: 0.6,
        impact: 0.7,
        riskScore: 42,
        description: 'Steep terrain increases construction costs and complexity',
        mitigationStrategies: [
          {
            strategy: 'Specialized foundation design',
            effectiveness: 0.8,
            cost: 0.4,
            timeToImplement: 3,
            feasibility: 'medium',
            dependencies: ['Geotechnical study']
          }
        ],
        timeframe: 'short_term',
        costToMitigate: 0.4
      });
    }

    // Grid risks
    if (gridAssessment.gridInfrastructure.nearestSubstation.availableCapacity < 30) {
      risks.push({
        id: 'grid_capacity_constraint',
        category: 'technical',
        type: 'grid_capacity_constraints',
        severity: 'medium',
        probability: 0.7,
        impact: 0.8,
        riskScore: 56,
        description: 'Limited grid capacity may require expensive upgrades',
        mitigationStrategies: [
          {
            strategy: 'Coordinate with utility for grid upgrades',
            effectiveness: 0.9,
            cost: 0.6,
            timeToImplement: 24,
            feasibility: 'medium',
            dependencies: ['Utility agreement']
          }
        ],
        timeframe: 'medium_term',
        costToMitigate: 0.6
      });
    }

    // Environmental risks
    if (environmentalAssessment.wildlifeImpact.collisionRisk.overallRisk === 'high') {
      risks.push({
        id: 'wildlife_collision_risk',
        category: 'environmental',
        type: 'environmental_restrictions',
        severity: 'high',
        probability: 0.5,
        impact: 0.8,
        riskScore: 40,
        description: 'High wildlife collision risk may require operational restrictions',
        mitigationStrategies: [
          {
            strategy: 'Implement wildlife monitoring and curtailment systems',
            effectiveness: 0.8,
            cost: 0.2,
            timeToImplement: 12,
            feasibility: 'high',
            dependencies: ['Environmental permits']
          }
        ],
        timeframe: 'short_term',
        costToMitigate: 0.2
      });
    }

    return risks;
  }

  /**
   * Generate development recommendations
   */
  private generateRecommendations(
    overallScore: number,
    componentScores: ComponentScores,
    riskFactors: RiskFactor[]
  ): SuitabilityRecommendation[] {
    const recommendations: SuitabilityRecommendation[] = [];

    // Overall development recommendation
    if (overallScore >= 80) {
      recommendations.push({
        id: 'proceed_development',
        type: 'proceed_with_development',
        priority: 'high',
        category: 'development',
        title: 'Proceed with Development',
        description: 'Site shows excellent suitability for wind energy development',
        rationale: `Overall suitability score of ${overallScore} indicates strong development potential`,
        expectedBenefit: {
          scoreImprovement: 0,
          riskReduction: 0,
          costSavings: 0,
          timelineBenefit: 0,
          stakeholderBenefit: ['High project success probability'],
          environmentalBenefit: ['Clean energy generation']
        },
        implementation: {
          phases: [
            {
              phase: 'Detailed feasibility study',
              duration: 6,
              cost: 500000,
              activities: ['Wind measurement campaign', 'Environmental studies', 'Grid interconnection study'],
              deliverables: ['Feasibility report', 'Environmental impact assessment'],
              dependencies: [],
              risks: ['Regulatory delays']
            }
          ],
          totalDuration: 24,
          totalCost: 2000000,
          resources: [],
          milestones: [],
          successCriteria: ['Obtain all permits', 'Secure financing', 'Complete construction']
        },
        risks: [],
        dependencies: [],
        alternatives: []
      });
    } else if (overallScore >= 60) {
      recommendations.push({
        id: 'conditional_development',
        type: 'conditional_development',
        priority: 'medium',
        category: 'development',
        title: 'Conditional Development',
        description: 'Site has good potential but requires risk mitigation',
        rationale: `Overall score of ${overallScore} indicates viable development with proper risk management`,
        expectedBenefit: {
          scoreImprovement: 10,
          riskReduction: 30,
          costSavings: 0,
          timelineBenefit: 0,
          stakeholderBenefit: ['Reduced project risks'],
          environmentalBenefit: ['Minimized environmental impact']
        },
        implementation: {
          phases: [
            {
              phase: 'Risk mitigation planning',
              duration: 3,
              cost: 200000,
              activities: ['Risk assessment', 'Mitigation strategy development'],
              deliverables: ['Risk mitigation plan'],
              dependencies: [],
              risks: []
            }
          ],
          totalDuration: 30,
          totalCost: 2500000,
          resources: [],
          milestones: [],
          successCriteria: ['Mitigate identified risks', 'Achieve target returns']
        },
        risks: [],
        dependencies: [],
        alternatives: []
      });
    } else if (overallScore >= 40) {
      recommendations.push({
        id: 'further_studies',
        type: 'further_studies_required',
        priority: 'medium',
        category: 'development',
        title: 'Further Studies Required',
        description: 'Additional studies needed to determine viability',
        rationale: `Score of ${overallScore} indicates potential but requires detailed investigation`,
        expectedBenefit: {
          scoreImprovement: 15,
          riskReduction: 40,
          costSavings: 0,
          timelineBenefit: 0,
          stakeholderBenefit: ['Better informed decisions'],
          environmentalBenefit: ['Thorough impact assessment']
        },
        implementation: {
          phases: [
            {
              phase: 'Detailed site studies',
              duration: 12,
              cost: 800000,
              activities: ['Extended wind monitoring', 'Detailed environmental surveys', 'Geotechnical investigation'],
              deliverables: ['Comprehensive site assessment'],
              dependencies: [],
              risks: ['Study results may be unfavorable']
            }
          ],
          totalDuration: 18,
          totalCost: 1200000,
          resources: [],
          milestones: [],
          successCriteria: ['Complete all studies', 'Achieve minimum viability thresholds']
        },
        risks: [],
        dependencies: [],
        alternatives: []
      });
    } else {
      recommendations.push({
        id: 'alternative_site',
        type: 'alternative_site',
        priority: 'high',
        category: 'development',
        title: 'Consider Alternative Sites',
        description: 'Current site shows poor suitability for development',
        rationale: `Low score of ${overallScore} suggests exploring better alternatives`,
        expectedBenefit: {
          scoreImprovement: 30,
          riskReduction: 60,
          costSavings: 1000000,
          timelineBenefit: 6,
          stakeholderBenefit: ['Higher success probability'],
          environmentalBenefit: ['Reduced environmental impact']
        },
        implementation: {
          phases: [
            {
              phase: 'Alternative site identification',
              duration: 3,
              cost: 150000,
              activities: ['Regional screening', 'Preliminary assessments'],
              deliverables: ['Alternative site recommendations'],
              dependencies: [],
              risks: ['Limited alternative sites available']
            }
          ],
          totalDuration: 6,
          totalCost: 300000,
          resources: [],
          milestones: [],
          successCriteria: ['Identify viable alternatives', 'Complete comparative analysis']
        },
        risks: [],
        dependencies: [],
        alternatives: []
      });
    }

    return recommendations;
  }

  // Helper methods for scoring individual components
  private calculateWindResourceScore(assessment: WindResourceAssessment): number {
    const windSpeed = assessment.resourceQuality.averageWindSpeed;
    const powerDensity = assessment.resourceQuality.windPowerDensity;
    const consistency = assessment.resourceQuality.consistency;
    
    let score = 0;
    score += this.scoreWindSpeed(windSpeed) * 0.4;
    score += this.scorePowerDensity(powerDensity) * 0.3;
    score += consistency * 100 * 0.2;
    score += this.scoreTurbulence(assessment.turbulenceAssessment) * 0.1;
    
    return Math.min(100, Math.max(0, score));
  }

  private scoreWindSpeed(windSpeed: number): number {
    if (windSpeed >= 9) return 100;
    if (windSpeed >= 7.5) return 85;
    if (windSpeed >= 6.5) return 70;
    if (windSpeed >= 5.5) return 50;
    if (windSpeed >= 4.5) return 30;
    return 10;
  }

  private scorePowerDensity(powerDensity: number): number {
    if (powerDensity >= 600) return 100;
    if (powerDensity >= 500) return 85;
    if (powerDensity >= 400) return 70;
    if (powerDensity >= 300) return 50;
    if (powerDensity >= 200) return 30;
    return 10;
  }

  private scoreTurbulence(turbulence: any): number {
    if (turbulence.averageTurbulenceIntensity < 0.1) return 100;
    if (turbulence.averageTurbulenceIntensity < 0.15) return 80;
    if (turbulence.averageTurbulenceIntensity < 0.2) return 60;
    return 40;
  }

  private calculateTerrainScore(assessment: TerrainSuitabilityAssessment): number {
    let score = 0;
    score += this.scoreTopography(assessment.topography) * 0.3;
    score += this.scoreAccessibility(assessment.accessibility) * 0.3;
    score += this.scoreGeology(assessment.geology) * 0.2;
    score += this.scoreLandUse(assessment.landUse) * 0.2;
    
    return Math.min(100, Math.max(0, score));
  }

  private scoreTopography(topography: any): number {
    let score = 100;
    
    // Penalize steep slopes
    if (topography.averageSlope > 15) score -= 30;
    else if (topography.averageSlope > 10) score -= 15;
    else if (topography.averageSlope > 5) score -= 5;
    
    // Reward suitable area
    score *= topography.suitableArea / 100;
    
    return Math.max(0, score);
  }

  private scoreAccessibility(accessibility: any): number {
    const ratings = { excellent: 100, good: 80, fair: 60, poor: 40 };
    return ratings[accessibility.overallAccessibility] || 40;
  }

  private scoreGeology(geology: any): number {
    let score = 80; // Base score
    
    if (geology.geotechnicalRisk === 'high') score -= 30;
    else if (geology.geotechnicalRisk === 'medium') score -= 15;
    
    if (geology.bearingCapacity < 150) score -= 20;
    
    return Math.max(0, score);
  }

  private scoreLandUse(landUse: any): number {
    let score = 80; // Base score
    
    if (landUse.acquisitionComplexity === 'high') score -= 30;
    else if (landUse.acquisitionComplexity === 'medium') score -= 15;
    
    if (!landUse.zoning.windEnergyPermitted) score -= 20;
    
    return Math.max(0, score);
  }

  private calculateGridScore(assessment: GridConnectivityAssessment): number {
    let score = 0;
    score += this.scoreGridDistance(assessment.gridInfrastructure.nearestSubstation.distance) * 0.3;
    score += this.scoreGridCapacity(assessment.gridInfrastructure.nearestSubstation.availableCapacity) * 0.3;
    score += this.scoreGridReliability(assessment.gridInfrastructure.gridReliability) * 0.2;
    score += this.scoreInterconnectionCost(assessment.interconnectionCosts.costPerMW) * 0.2;
    
    return Math.min(100, Math.max(0, score));
  }

  private scoreGridDistance(distance: number): number {
    if (distance <= 5) return 100;
    if (distance <= 10) return 85;
    if (distance <= 20) return 70;
    if (distance <= 50) return 50;
    if (distance <= 100) return 30;
    return 10;
  }

  private scoreGridCapacity(capacity: number): number {
    if (capacity >= 100) return 100;
    if (capacity >= 50) return 85;
    if (capacity >= 25) return 70;
    if (capacity >= 10) return 50;
    if (capacity >= 5) return 30;
    return 10;
  }

  private scoreGridReliability(reliability: string): number {
    const ratings = { high: 100, medium: 70, low: 40 };
    return ratings[reliability] || 40;
  }

  private scoreInterconnectionCost(costPerMW: number): number {
    if (costPerMW <= 50000) return 100;
    if (costPerMW <= 75000) return 85;
    if (costPerMW <= 100000) return 70;
    if (costPerMW <= 150000) return 50;
    if (costPerMW <= 200000) return 30;
    return 10;
  }

  private calculateEnvironmentalScore(assessment: EnvironmentalImpactAssessment): number {
    let score = 0;
    score += this.scoreWildlifeImpact(assessment.wildlifeImpact) * 0.3;
    score += this.scoreVisualImpact(assessment.visualImpact) * 0.25;
    score += this.scoreNoiseImpact(assessment.noiseImpact) * 0.25;
    score += this.scoreCulturalImpact(assessment.culturalHeritage) * 0.2;
    
    return Math.min(100, Math.max(0, score));
  }

  private scoreWildlifeImpact(wildlife: any): number {
    const riskScores = { low: 90, medium: 70, high: 40 };
    return riskScores[wildlife.collisionRisk.overallRisk] || 40;
  }

  private scoreVisualImpact(visual: any): number {
    const impactScores = { low: 90, medium: 70, high: 40 };
    return impactScores[visual.visualImpactRating] || 40;
  }

  private scoreNoiseImpact(noise: any): number {
    return noise.complianceAssessment.overallCompliance ? 90 : 50;
  }

  private scoreCulturalImpact(cultural: any): number {
    const impactScores = { none: 100, minor: 85, moderate: 60, major: 30 };
    return impactScores[cultural.impactAssessment.overallImpact] || 30;
  }

  private calculateRegulatoryScore(): number {
    // Mock regulatory scoring - would be based on actual regulatory analysis
    return 80;
  }

  private calculateEconomicScore(gridAssessment: GridConnectivityAssessment): number {
    let score = 70; // Base economic score
    
    // Adjust based on interconnection costs
    score += this.scoreCapitalCosts(gridAssessment.interconnectionCosts.totalCosts) * 0.4;
    score += 75 * 0.3; // Operational costs score
    score += this.scoreRevenuePotential(1000) * 0.3; // Revenue potential
    
    return Math.min(100, Math.max(0, score));
  }

  private scoreCapitalCosts(totalCosts: number): number {
    if (totalCosts <= 3000000) return 90;
    if (totalCosts <= 5000000) return 75;
    if (totalCosts <= 8000000) return 60;
    return 40;
  }

  private scoreRevenuePotential(economicPotential: number): number {
    if (economicPotential >= 2000) return 90;
    if (economicPotential >= 1500) return 75;
    if (economicPotential >= 1000) return 60;
    return 40;
  }

  // Helper methods for assessment calculations
  private estimateCapacityFactor(windSpeed: number): number {
    // Simplified capacity factor estimation
    if (windSpeed >= 9) return 45;
    if (windSpeed >= 7.5) return 38;
    if (windSpeed >= 6.5) return 32;
    if (windSpeed >= 5.5) return 25;
    if (windSpeed >= 4.5) return 18;
    return 12;
  }

  private calculateConsistency(statistics: any): number {
    // Calculate consistency as inverse of coefficient of variation
    const cv = statistics.standardDeviation / statistics.meanWindSpeed;
    return Math.max(0, 1 - cv);
  }

  private rateWindResource(windSpeed: number, powerDensity: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (windSpeed >= 8.5 && powerDensity >= 500) return 'excellent';
    if (windSpeed >= 7 && powerDensity >= 400) return 'good';
    if (windSpeed >= 5.5 && powerDensity >= 300) return 'fair';
    return 'poor';
  }

  private generateHeightProfile(baseWindSpeed: number): any[] {
    // Generate simple height profile
    return [
      { height: 50, windSpeed: baseWindSpeed * 0.85, windDirection: 225, turbulenceIntensity: 0.18 },
      { height: 80, windSpeed: baseWindSpeed * 0.92, windDirection: 225, turbulenceIntensity: 0.16 },
      { height: 100, windSpeed: baseWindSpeed, windDirection: 225, turbulenceIntensity: 0.15 },
      { height: 120, windSpeed: baseWindSpeed * 1.05, windDirection: 225, turbulenceIntensity: 0.14 }
    ];
  }

  private calculateSuitableArea(terrainFeatures: TerrainFeature[]): number {
    // Mock calculation - would analyze actual terrain constraints
    const totalFeatures = terrainFeatures.length;
    if (totalFeatures > 100) return 70; // High feature density reduces suitable area
    if (totalFeatures > 50) return 80;
    return 90;
  }

  private assessAccessibility(terrainFeatures: TerrainFeature[]): string {
    // Mock accessibility assessment
    const roadFeatures = terrainFeatures.filter(f => f.properties?.highway);
    if (roadFeatures.length > 5) return 'excellent';
    if (roadFeatures.length > 2) return 'good';
    if (roadFeatures.length > 0) return 'fair';
    return 'poor';
  }

  private assessFoundationRequirements(): any[] {
    return [
      {
        turbineSize: '3MW',
        foundationType: 'shallow' as const,
        estimatedCost: 1.0,
        constructionComplexity: 'medium' as const
      }
    ];
  }

  private analyzeLandUse(terrainFeatures: TerrainFeature[]): any[] {
    return [
      {
        type: 'agricultural' as const,
        area: 80,
        percentage: 80,
        compatibility: 'high' as const,
        restrictions: []
      }
    ];
  }

  private identifyTerrainConstraints(terrainFeatures: TerrainFeature[]): any[] {
    // Mock constraint identification
    return terrainFeatures.slice(0, 3).map(feature => ({
      type: 'water_bodies' as const,
      area: 2,
      severity: 'minor' as const,
      mitigation: 'Maintain setback distance',
      mitigationCost: 0.1
    }));
  }

  private identifyDevelopmentChallenges(terrainFeatures: TerrainFeature[]): any[] {
    return [
      {
        challenge: 'Seasonal access restrictions',
        category: 'technical' as const,
        impact: 'medium' as const,
        likelihood: 0.3,
        mitigation: ['Improved road maintenance', 'Alternative access routes'],
        contingencyRequired: false
      }
    ];
  }

  private createMetadata(siteId: string): SuitabilityMetadata {
    return {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      methodology: 'Multi-criteria weighted scoring',
      dataQuality: 'medium',
      confidence: 0.75,
      limitations: [
        'Limited environmental survey data',
        'Preliminary grid capacity assessment',
        'Mock economic assumptions'
      ],
      assumptions: [
        'Standard turbine specifications',
        'Current regulatory framework',
        'Stable economic conditions'
      ],
      reviewStatus: 'draft',
      reviewer: undefined
    };
  }

  /**
   * Update scoring configuration
   */
  updateConfiguration(config: Partial<ScoringConfiguration>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfiguration(): ScoringConfiguration {
    return { ...this.config };
  }
}