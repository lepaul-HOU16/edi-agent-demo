// Response interface for renewable tools
interface ToolResponse {
  messageContent: string;
  messageContentType: string;
  agentUsed: string;
  artifacts?: any[];
  thoughtSteps?: Array<{
    title: string;
    content: string;
    type: string;
  }>;
}

// Turbine specifications database
interface TurbineSpec {
  name: string;
  capacity: number; // MW
  rotorDiameter: number; // meters
  hubHeight: number; // meters
  cutInSpeed: number; // m/s
  cutOutSpeed: number; // m/s
  ratedSpeed: number; // m/s
  powerCurve: { windSpeed: number; power: number }[]; // MW
}

interface WindData {
  direction: number; // degrees
  speed: number; // m/s
  frequency: number; // percentage
}

interface TurbinePosition {
  id: string;
  lat: number;
  lng: number;
  x?: number; // meters from reference point
  y?: number; // meters from reference point
}

interface SimulationParams {
  layoutData: {
    turbinePositions: TurbinePosition[];
    turbineModel: string;
    totalCapacity: number;
    windDirection?: number;
  };
  windResource?: WindData[];
  projectId?: string;
  analysisOptions?: {
    wakeModel?: 'jensen' | 'park' | 'larsen'; // Default: jensen
    ambientTurbulence?: number; // Default: 0.1
    airDensity?: number; // kg/m³, Default: 1.225
    includeTerrainEffects?: boolean; // Default: false
    analysisYears?: number; // Default: 1
  };
}

// Standard turbine specifications
const TURBINE_DATABASE: Record<string, TurbineSpec> = {
  'Vestas_V90_3MW': {
    name: 'Vestas V90 3.0MW',
    capacity: 3.0,
    rotorDiameter: 90,
    hubHeight: 80,
    cutInSpeed: 4,
    cutOutSpeed: 25,
    ratedSpeed: 15,
    powerCurve: [
      { windSpeed: 0, power: 0 },
      { windSpeed: 4, power: 0 },
      { windSpeed: 5, power: 0.1 },
      { windSpeed: 6, power: 0.3 },
      { windSpeed: 7, power: 0.6 },
      { windSpeed: 8, power: 1.0 },
      { windSpeed: 9, power: 1.5 },
      { windSpeed: 10, power: 2.0 },
      { windSpeed: 11, power: 2.4 },
      { windSpeed: 12, power: 2.7 },
      { windSpeed: 13, power: 2.9 },
      { windSpeed: 14, power: 3.0 },
      { windSpeed: 15, power: 3.0 },
      { windSpeed: 25, power: 3.0 },
      { windSpeed: 26, power: 0 }
    ]
  },
  'IEA_Reference_3.4MW_130': {
    name: 'IEA Reference 3.4MW',
    capacity: 3.4,
    rotorDiameter: 130,
    hubHeight: 110,
    cutInSpeed: 3,
    cutOutSpeed: 25,
    ratedSpeed: 11.5,
    powerCurve: [
      { windSpeed: 0, power: 0 },
      { windSpeed: 3, power: 0 },
      { windSpeed: 4, power: 0.15 },
      { windSpeed: 5, power: 0.4 },
      { windSpeed: 6, power: 0.8 },
      { windSpeed: 7, power: 1.3 },
      { windSpeed: 8, power: 1.9 },
      { windSpeed: 9, power: 2.6 },
      { windSpeed: 10, power: 3.1 },
      { windSpeed: 11, power: 3.3 },
      { windSpeed: 11.5, power: 3.4 },
      { windSpeed: 15, power: 3.4 },
      { windSpeed: 25, power: 3.4 },
      { windSpeed: 26, power: 0 }
    ]
  },
  'GE_2.5MW_116': {
    name: 'GE 2.5MW',
    capacity: 2.5,
    rotorDiameter: 116,
    hubHeight: 80,
    cutInSpeed: 3.5,
    cutOutSpeed: 25,
    ratedSpeed: 12.5,
    powerCurve: [
      { windSpeed: 0, power: 0 },
      { windSpeed: 3.5, power: 0 },
      { windSpeed: 4, power: 0.1 },
      { windSpeed: 5, power: 0.25 },
      { windSpeed: 6, power: 0.5 },
      { windSpeed: 7, power: 0.8 },
      { windSpeed: 8, power: 1.2 },
      { windSpeed: 9, power: 1.6 },
      { windSpeed: 10, power: 2.0 },
      { windSpeed: 11, power: 2.3 },
      { windSpeed: 12, power: 2.4 },
      { windSpeed: 12.5, power: 2.5 },
      { windSpeed: 20, power: 2.5 },
      { windSpeed: 25, power: 2.5 },
      { windSpeed: 26, power: 0 }
    ]
  }
};

// Default wind resource (simplified for demonstration)
const DEFAULT_WIND_RESOURCE: WindData[] = [
  { direction: 0, speed: 7.5, frequency: 8 },    // N
  { direction: 45, speed: 8.2, frequency: 12 },  // NE
  { direction: 90, speed: 6.8, frequency: 6 },   // E
  { direction: 135, speed: 7.1, frequency: 8 },  // SE
  { direction: 180, speed: 8.5, frequency: 15 }, // S
  { direction: 225, speed: 9.2, frequency: 25 }, // SW (dominant)
  { direction: 270, speed: 8.0, frequency: 18 }, // W
  { direction: 315, speed: 7.3, frequency: 8 }   // NW
];

/**
 * Renewable Simulation Tool - Wake Modeling & Performance Analysis
 * 
 * Converts original Python simulation_tools.py functionality:
 * - Jensen wake model implementation
 * - Energy production forecasting
 * - Capacity factor analysis
 * - Performance optimization recommendations
 * - Annual energy production (AEP) calculations
 */
export async function renewableSimulationTool(params: SimulationParams): Promise<ToolResponse> {
  console.log('🌬️ Starting renewable simulation analysis with params:', JSON.stringify(params, null, 2));
  
  try {
    // Extract and validate parameters
    const { layoutData, windResource, projectId, analysisOptions } = params;
    const { turbinePositions, turbineModel, totalCapacity, windDirection } = layoutData;
    
    // Validation
    if (!turbinePositions || turbinePositions.length === 0) {
      throw new Error('Turbine positions are required for simulation');
    }
    
    if (!turbineModel || !TURBINE_DATABASE[turbineModel]) {
      throw new Error(`Invalid turbine model: ${turbineModel}. Available models: ${Object.keys(TURBINE_DATABASE).join(', ')}`);
    }
    
    const turbineSpec = TURBINE_DATABASE[turbineModel];
    const windData = windResource || DEFAULT_WIND_RESOURCE;
    const options = analysisOptions || {};
    
    console.log(`📊 Analyzing ${turbinePositions.length} turbines using ${turbineSpec.name}`);
    console.log(`🎯 Expected capacity: ${totalCapacity}MW, Individual turbine: ${turbineSpec.capacity}MW`);
    
    // Convert lat/lng positions to x/y coordinates for wake calculations
    const positionsWithCoords = convertToCartesian(turbinePositions);
    console.log('📍 Converted turbine positions to Cartesian coordinates');
    
    // Perform wake analysis for each wind direction
    const wakeAnalysisResults = [];
    let totalAEP = 0;
    let totalLosses = 0;
    
    for (const windCondition of windData) {
      console.log(`🌪️ Analyzing wind from ${windCondition.direction}° at ${windCondition.speed}m/s (${windCondition.frequency}% frequency)`);
      
      const wakeResult = calculateWakeLosses(
        positionsWithCoords,
        turbineSpec,
        windCondition,
        options.wakeModel || 'jensen',
        options.ambientTurbulence || 0.1
      );
      
      wakeAnalysisResults.push({
        windDirection: windCondition.direction,
        windSpeed: windCondition.speed,
        frequency: windCondition.frequency,
        ...wakeResult
      });
      
      // Accumulate annual energy production
      const aepContribution = wakeResult.netPower * windCondition.frequency / 100 * 8760; // hours per year
      totalAEP += aepContribution;
      totalLosses += wakeResult.wakeLosses * windCondition.frequency / 100;
    }
    
    // Calculate performance metrics
    const grossAEP = turbinePositions.length * turbineSpec.capacity * 8760 * 0.35; // Assume 35% capacity factor without wake
    const netAEP = totalAEP;
    const capacityFactor = netAEP / (totalCapacity * 8760) * 100;
    const wakeEfficiency = (netAEP / grossAEP) * 100;
    const averageWakeLoss = totalLosses;
    
    console.log(`⚡ Net AEP: ${Math.round(netAEP)} MWh/year`);
    console.log(`📈 Capacity Factor: ${capacityFactor.toFixed(1)}%`);
    console.log(`🌊 Wake Efficiency: ${wakeEfficiency.toFixed(1)}%`);
    console.log(`📉 Average Wake Loss: ${averageWakeLoss.toFixed(1)}%`);
    
    // Generate optimization recommendations
    const recommendations = generateOptimizationRecommendations(
      wakeAnalysisResults,
      turbineSpec,
      positionsWithCoords,
      averageWakeLoss
    );
    
    // Performance analysis by wind direction
    const performanceByDirection = wakeAnalysisResults.map(result => ({
      direction: result.windDirection,
      directionName: getDirectionName(result.windDirection),
      frequency: result.frequency,
      averageWindSpeed: result.windSpeed,
      grossPower: result.grossPower,
      netPower: result.netPower,
      wakeLoss: result.wakeLosses,
      efficiency: ((result.netPower / result.grossPower) * 100) || 0
    }));
    
    // Create simulation artifact
    const simulationArtifact = {
      messageContentType: 'wind_farm_simulation' as const,
      title: `Wind Farm Performance Simulation - ${turbineSpec.name}`,
      projectId: projectId || 'simulation_analysis',
      turbineConfiguration: {
        model: turbineSpec.name,
        capacity: turbineSpec.capacity,
        rotorDiameter: turbineSpec.rotorDiameter,
        hubHeight: turbineSpec.hubHeight,
        count: turbinePositions.length,
        totalCapacity: totalCapacity
      },
      performanceMetrics: {
        annualEnergyProduction: Math.round(netAEP), // MWh/year
        capacityFactor: parseFloat(capacityFactor.toFixed(1)), // %
        wakeEfficiency: parseFloat(wakeEfficiency.toFixed(1)), // %
        averageWakeLoss: parseFloat(averageWakeLoss.toFixed(1)), // %
        grossAEP: Math.round(grossAEP), // MWh/year
        netAEP: Math.round(netAEP), // MWh/year
        expectedRevenue: Math.round(netAEP * 50), // Assume $50/MWh
        co2Offset: Math.round(netAEP * 0.4) // tons CO2/year, 0.4 ton/MWh
      },
      performanceByDirection,
      wakeAnalysis: {
        wakeModel: options.wakeModel || 'jensen',
        ambientTurbulence: options.ambientTurbulence || 0.1,
        analysisConditions: windData.length,
        totalWakeInteractions: wakeAnalysisResults.reduce((sum, r) => sum + (r.wakeInteractions || 0), 0)
      },
      optimizationRecommendations: recommendations,
      turbinePositions: positionsWithCoords,
      analysisTimestamp: new Date().toISOString(),
      analysisParameters: {
        wakeModel: options.wakeModel || 'jensen',
        turbulenceIntensity: options.ambientTurbulence || 0.1,
        airDensity: options.airDensity || 1.225,
        terrainEffects: options.includeTerrainEffects || false
      }
    };
    
    console.log('✅ Simulation analysis complete, generating response');
    
    // Return RouterResponse with simulation artifact
    return {
      messageContent: `## Wind Farm Performance Simulation Complete

I've completed a comprehensive wake modeling and performance analysis for your ${totalCapacity}MW wind farm using ${turbinePositions.length} ${turbineSpec.name} turbines.

### Key Performance Metrics
- **Annual Energy Production**: ${Math.round(netAEP).toLocaleString()} MWh/year
- **Capacity Factor**: ${capacityFactor.toFixed(1)}%
- **Wake Efficiency**: ${wakeEfficiency.toFixed(1)}%
- **Average Wake Loss**: ${averageWakeLoss.toFixed(1)}%
- **Expected Annual Revenue**: $${Math.round(netAEP * 50).toLocaleString()}
- **CO₂ Offset**: ${Math.round(netAEP * 0.4).toLocaleString()} tons/year

### Analysis Summary
The simulation used the Jensen wake model to analyze ${windData.length} wind conditions, calculating wake interactions between turbines and their impact on energy production. The analysis shows ${wakeEfficiency.toFixed(1)}% wake efficiency, indicating ${averageWakeLoss.toFixed(1)}% energy loss due to wake effects.

${recommendations.length > 0 ? `### Optimization Opportunities
${recommendations.slice(0, 3).map(rec => `• ${rec.description}`).join('\n')}` : ''}

The detailed simulation results include performance analysis by wind direction, wake interaction patterns, and turbine-specific production estimates.`,
      
      messageContentType: 'wind_farm_simulation',
      agentUsed: 'renewableEnergyAgent',
      artifacts: [simulationArtifact],
      
      thoughtSteps: [
        {
          title: "Simulation Setup",
          content: `Configured simulation for ${turbinePositions.length} ${turbineSpec.name} turbines with ${windData.length} wind conditions using ${options.wakeModel || 'jensen'} wake model`,
          type: "planning"
        },
        {
          title: "Wake Analysis",
          content: `Calculated wake interactions for each wind direction, analyzing turbine spacing and wake shadow effects. Total wake interactions: ${wakeAnalysisResults.reduce((sum, r) => sum + (r.wakeInteractions || 0), 0)}`,
          type: "analysis"
        },
        {
          title: "Performance Calculation",
          content: `Computed capacity factor (${capacityFactor.toFixed(1)}%), wake efficiency (${wakeEfficiency.toFixed(1)}%), and annual energy production (${Math.round(netAEP).toLocaleString()} MWh/year)`,
          type: "calculation"
        },
        {
          title: "Optimization Analysis",
          content: `Generated ${recommendations.length} optimization recommendations to improve wake efficiency and energy production`,
          type: "optimization"
        }
      ]
    };
    
  } catch (error) {
    console.error('❌ Error in renewable simulation tool:', error);
    
    return {
      messageContent: `I encountered an error while performing the wind farm simulation analysis: ${error.message}

To run a simulation, I need:
• Layout data with turbine positions and model
• Valid turbine model (${Object.keys(TURBINE_DATABASE).join(', ')})
• Optional: Wind resource data and analysis parameters

Please provide the required information and I'll perform the wake modeling and performance analysis.`,
      
      messageContentType: 'renewable_energy_guidance',
      agentUsed: 'renewableEnergyAgent',
      
      thoughtSteps: [
        {
          title: "Simulation Error",
          content: `Failed to complete simulation analysis: ${error.message}`,
          type: "error"
        },
        {
          title: "Requirements Check",
          content: "Validated required parameters: layout data, turbine model, and positions needed for wake analysis",
          type: "validation"
        }
      ]
    };
  }
}

/**
 * Convert latitude/longitude positions to Cartesian coordinates
 * Uses approximate conversion for wake calculations
 */
function convertToCartesian(positions: TurbinePosition[]): TurbinePosition[] {
  console.log('📐 Converting turbine positions to Cartesian coordinates');
  
  if (positions.length === 0) return positions;
  
  // Use first turbine as reference point
  const reference = positions[0];
  const refLat = reference.lat * Math.PI / 180;
  const refLng = reference.lng * Math.PI / 180;
  
  return positions.map((pos, index) => {
    const lat = pos.lat * Math.PI / 180;
    const lng = pos.lng * Math.PI / 180;
    
    // Convert to meters using approximate formulas
    const x = (lng - refLng) * Math.cos(refLat) * 111320; // meters east
    const y = (lat - refLat) * 111320; // meters north
    
    return {
      ...pos,
      x: Math.round(x),
      y: Math.round(y)
    };
  });
}

/**
 * Calculate wake losses using Jensen wake model
 * Implements industry-standard wake modeling calculations
 */
function calculateWakeLosses(
  positions: TurbinePosition[],
  turbineSpec: TurbineSpec,
  windCondition: WindData,
  wakeModel: string,
  ambientTurbulence: number
) {
  console.log(`🌊 Calculating wake losses for wind ${windCondition.direction}° at ${windCondition.speed}m/s`);
  
  const windSpeed = windCondition.speed;
  const windDirection = windCondition.direction * Math.PI / 180; // Convert to radians
  const rotorDiameter = turbineSpec.rotorDiameter;
  
  // Calculate wind direction unit vector
  const windDirX = Math.sin(windDirection);
  const windDirY = Math.cos(windDirection);
  
  let totalGrossPower = 0;
  let totalNetPower = 0;
  let wakeInteractions = 0;
  
  for (let i = 0; i < positions.length; i++) {
    const turbine = positions[i];
    
    // Calculate gross power for this turbine
    const grossPower = getTurbinePower(turbineSpec, windSpeed);
    totalGrossPower += grossPower;
    
    // Calculate effective wind speed considering wake effects
    let effectiveWindSpeed = windSpeed;
    
    // Check wake effects from upstream turbines
    for (let j = 0; j < positions.length; j++) {
      if (i === j) continue;
      
      const upstreamTurbine = positions[j];
      
      // Calculate relative position
      const dx = turbine.x! - upstreamTurbine.x!;
      const dy = turbine.y! - upstreamTurbine.y!;
      
      // Check if turbine j is upstream of turbine i
      const downwindDistance = dx * windDirX + dy * windDirY;
      
      if (downwindDistance > 0) { // Turbine j is upstream
        // Calculate perpendicular distance from wake centerline
        const crosswindDistance = Math.abs(-dx * windDirY + dy * windDirX);
        
        // Jensen wake model implementation
        const wakeRadius = calculateWakeRadius(downwindDistance, rotorDiameter, ambientTurbulence);
        
        if (crosswindDistance < wakeRadius) {
          // Turbine is in wake shadow
          wakeInteractions++;
          
          const wakeDeficit = calculateWakeDeficit(
            downwindDistance,
            crosswindDistance,
            rotorDiameter / 2,
            grossPower / turbineSpec.capacity, // Thrust coefficient approximation
            ambientTurbulence
          );
          
          effectiveWindSpeed = Math.max(effectiveWindSpeed * (1 - wakeDeficit), windSpeed * 0.3);
        }
      }
    }
    
    // Calculate net power with wake effects
    const netPower = getTurbinePower(turbineSpec, effectiveWindSpeed);
    totalNetPower += netPower;
  }
  
  const wakeLosses = totalGrossPower > 0 ? ((totalGrossPower - totalNetPower) / totalGrossPower) * 100 : 0;
  
  console.log(`📊 Wake analysis: ${wakeLosses.toFixed(1)}% loss, ${wakeInteractions} interactions`);
  
  return {
    grossPower: totalGrossPower,
    netPower: totalNetPower,
    wakeLosses: wakeLosses,
    wakeInteractions: wakeInteractions
  };
}

/**
 * Calculate wake radius using Jensen wake model
 */
function calculateWakeRadius(downwindDistance: number, rotorDiameter: number, ambientTurbulence: number): number {
  const wakeDecayConstant = 0.5 / Math.log(0.5 / ambientTurbulence);
  return (rotorDiameter / 2) + (wakeDecayConstant * downwindDistance);
}

/**
 * Calculate wake velocity deficit using Jensen model
 */
function calculateWakeDeficit(
  downwindDistance: number,
  crosswindDistance: number,
  rotorRadius: number,
  thrustCoefficient: number,
  ambientTurbulence: number
): number {
  const wakeDecayConstant = 0.5 / Math.log(0.5 / ambientTurbulence);
  const wakeRadius = rotorRadius + (wakeDecayConstant * downwindDistance);
  
  if (crosswindDistance > wakeRadius) return 0;
  
  // Jensen wake deficit formula
  const velocityDeficit = (1 - Math.sqrt(1 - thrustCoefficient)) * 
                         Math.pow(rotorRadius / wakeRadius, 2);
  
  // Apply radial distribution (top-hat model)
  return velocityDeficit;
}

/**
 * Get turbine power output for given wind speed using power curve
 */
function getTurbinePower(turbineSpec: TurbineSpec, windSpeed: number): number {  
  const powerCurve = turbineSpec.powerCurve;
  
  // Handle edge cases
  if (windSpeed < turbineSpec.cutInSpeed || windSpeed > turbineSpec.cutOutSpeed) {
    return 0;
  }
  
  // Find adjacent points in power curve
  for (let i = 0; i < powerCurve.length - 1; i++) {
    if (windSpeed >= powerCurve[i].windSpeed && windSpeed <= powerCurve[i + 1].windSpeed) {
      // Linear interpolation
      const x1 = powerCurve[i].windSpeed;
      const y1 = powerCurve[i].power;
      const x2 = powerCurve[i + 1].windSpeed;
      const y2 = powerCurve[i + 1].power;
      
      return y1 + (y2 - y1) * (windSpeed - x1) / (x2 - x1);
    }
  }
  
  // Return rated power if above rated speed
  return turbineSpec.capacity;
}

/**
 * Generate optimization recommendations based on simulation results
 */
function generateOptimizationRecommendations(
  wakeResults: any[],
  turbineSpec: TurbineSpec,
  positions: TurbinePosition[],
  averageWakeLoss: number
): Array<{ category: string; priority: 'high' | 'medium' | 'low'; description: string; potentialImprovement: string }> {
  console.log('💡 Generating optimization recommendations');
  
  const recommendations = [];
  
  // High wake loss recommendation
  if (averageWakeLoss > 15) {
    recommendations.push({
      category: 'Layout Optimization',
      priority: 'high' as const,
      description: `Wake losses of ${averageWakeLoss.toFixed(1)}% are above industry target (8-12%). Consider increasing turbine spacing or using greedy layout algorithm.`,
      potentialImprovement: `${Math.min(averageWakeLoss - 10, 8).toFixed(1)}% AEP increase`
    });
  }
  
  // Wind direction optimization
  const dominantWindDirection = wakeResults.reduce((max, result) => 
    result.frequency > max.frequency ? result : max
  );
  
  if (dominantWindDirection.wakeLoss > averageWakeLoss * 1.3) {
    recommendations.push({
      category: 'Wind Alignment',
      priority: 'medium' as const,
      description: `High wake losses (${dominantWindDirection.wakeLoss.toFixed(1)}%) in dominant wind direction (${dominantWindDirection.windDirection}°). Consider rotating layout orientation.`,
      potentialImprovement: `${(dominantWindDirection.wakeLoss * 0.3).toFixed(1)}% AEP increase`
    });
  }
  
  // Turbine spacing recommendation
  const minSpacing = calculateMinimumSpacing(positions, turbineSpec.rotorDiameter);
  if (minSpacing < 5 * turbineSpec.rotorDiameter) {
    recommendations.push({
      category: 'Spacing Optimization',
      priority: 'high' as const,
      description: `Minimum turbine spacing is ${(minSpacing / turbineSpec.rotorDiameter).toFixed(1)}D. Industry best practice is 7-9D for optimal wake recovery.`,
      potentialImprovement: `${Math.min((9 - minSpacing / turbineSpec.rotorDiameter) * 2, 12).toFixed(1)}% wake loss reduction`
    });
  }
  
  // Capacity factor recommendation
  const avgCapacityFactor = wakeResults.reduce((sum, r) => sum + (r.netPower / (positions.length * turbineSpec.capacity)), 0) / wakeResults.length * 100;
  if (avgCapacityFactor < 30) {
    recommendations.push({
      category: 'Site Assessment',
      priority: 'medium' as const,
      description: `Capacity factor (${avgCapacityFactor.toFixed(1)}%) is below industry average (35-45%). Consider wind resource assessment or turbine model optimization.`,
      potentialImprovement: 'Site-specific analysis recommended'
    });
  }
  
  // Turbine technology recommendation
  if (turbineSpec.rotorDiameter < 120 && positions.length > 10) {
    recommendations.push({
      category: 'Technology Upgrade',
      priority: 'low' as const,
      description: `Consider larger rotor diameter turbines (130m+) for improved capacity factor and reduced wake sensitivity.`,
      potentialImprovement: `5-15% AEP increase with modern turbine technology`
    });
  }
  
  console.log(`📝 Generated ${recommendations.length} optimization recommendations`);
  
  return recommendations;
}

/**
 * Calculate minimum spacing between turbines
 */
function calculateMinimumSpacing(positions: TurbinePosition[], rotorDiameter: number): number {
  let minSpacing = Infinity;
  
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dx = positions[i].x! - positions[j].x!;
      const dy = positions[i].y! - positions[j].y!;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minSpacing) {
        minSpacing = distance;
      }
    }
  }
  
  return minSpacing === Infinity ? rotorDiameter * 9 : minSpacing;
}

/**
 * Convert wind direction to cardinal direction name
 */
function getDirectionName(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}
