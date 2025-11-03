/**
 * Wind Data Types for Wind Rose Analysis
 * 
 * Defines interfaces and types for wind resource data used in
 * wind rose visualizations and analysis.
 */

// ============================================================================
// Wind Resource Data Types
// ============================================================================

/**
 * Wind resource data for a specific location
 */
export interface WindResourceData {
  location: {
    lat: number;
    lng: number;
    name?: string;
    elevation?: number;
  };
  measurementHeight: number; // meters above ground
  dataSource: string;
  timeRange: {
    startDate: string;
    endDate: string;
    totalHours: number;
  };
  windData: WindMeasurement[];
  statistics: WindStatistics;
  qualityMetrics: DataQualityMetrics;
}

/**
 * Individual wind measurement
 */
export interface WindMeasurement {
  timestamp: string;
  windSpeed: number; // m/s
  windDirection: number; // degrees (0-360)
  temperature?: number; // Celsius
  pressure?: number; // hPa
  humidity?: number; // %
  turbulenceIntensity?: number; // %
}

/**
 * Wind statistics summary
 */
export interface WindStatistics {
  meanWindSpeed: number;
  maxWindSpeed: number;
  minWindSpeed: number;
  standardDeviation: number;
  prevailingDirection: number;
  calmPercentage: number; // percentage of time with wind < 1 m/s
  powerDensity: number; // W/m²
  weibullParameters: {
    shape: number; // k parameter
    scale: number; // A parameter
  };
}

/**
 * Data quality metrics
 */
export interface DataQualityMetrics {
  completeness: number; // percentage of valid data points
  missingDataPoints: number;
  outlierCount: number;
  validationFlags: string[];
  reliability: 'high' | 'medium' | 'low';
}

// ============================================================================
// Wind Rose Data Types
// ============================================================================

/**
 * Wind rose configuration
 */
export interface WindRoseConfig {
  directionBins: number; // typically 16 or 36
  speedBins: WindSpeedBin[];
  colorScheme: string[];
  showCalm: boolean;
  calmThreshold: number; // m/s
  units: 'metric' | 'imperial';
  title?: string;
  subtitle?: string;
}

/**
 * Wind speed bin definition
 */
export interface WindSpeedBin {
  min: number;
  max: number;
  label: string;
  color: string;
}

/**
 * Wind rose data structure
 */
export interface WindRoseData {
  directionBins: DirectionBin[];
  totalObservations: number;
  calmPercentage: number;
  config: WindRoseConfig;
  metadata: WindRoseMetadata;
}

/**
 * Direction bin data
 */
export interface DirectionBin {
  direction: number; // center direction in degrees
  directionRange: {
    min: number;
    max: number;
  };
  label: string; // e.g., "N", "NNE", "NE"
  speedBins: SpeedBinData[];
  totalFrequency: number; // percentage of total observations
  averageSpeed: number;
  maxSpeed: number;
}

/**
 * Speed bin data within a direction bin
 */
export interface SpeedBinData {
  speedRange: {
    min: number;
    max: number;
  };
  frequency: number; // percentage of total observations
  count: number; // actual number of observations
  averageSpeed: number;
}

/**
 * Wind rose metadata
 */
export interface WindRoseMetadata {
  generatedAt: string;
  dataSource: string;
  measurementHeight: number;
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  timeRange: {
    startDate: string;
    endDate: string;
  };
  qualityScore: number; // 0-100
}

// ============================================================================
// Seasonal Analysis Types
// ============================================================================

/**
 * Seasonal wind analysis data
 */
export interface SeasonalWindData {
  seasons: SeasonData[];
  monthlyData: MonthlyWindData[];
  yearlyTrends: YearlyTrendData[];
  seasonalComparison: SeasonalComparison;
}

/**
 * Season-specific wind data
 */
export interface SeasonData {
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  months: number[]; // month numbers (1-12)
  windRose: WindRoseData;
  statistics: WindStatistics;
  energyPotential: number; // relative energy potential (0-1)
}

/**
 * Monthly wind data
 */
export interface MonthlyWindData {
  month: number; // 1-12
  monthName: string;
  windRose: WindRoseData;
  statistics: WindStatistics;
  energyPotential: number;
  turbineCapacityFactor: number;
}

/**
 * Yearly trend data
 */
export interface YearlyTrendData {
  year: number;
  annualMeanSpeed: number;
  annualEnergyPotential: number;
  seasonalVariation: number; // coefficient of variation
  extremeEvents: ExtremeEvent[];
}

/**
 * Extreme weather event
 */
export interface ExtremeEvent {
  date: string;
  type: 'high_wind' | 'calm_period' | 'direction_shift';
  maxWindSpeed?: number;
  duration: number; // hours
  impact: 'low' | 'medium' | 'high';
}

/**
 * Seasonal comparison metrics
 */
export interface SeasonalComparison {
  mostProductiveSeason: string;
  leastProductiveSeason: string;
  seasonalVariability: number; // coefficient of variation
  consistencyRating: 'high' | 'medium' | 'low';
  recommendations: string[];
}

// ============================================================================
// Temporal Analysis Types
// ============================================================================

/**
 * Temporal wind pattern analysis
 */
export interface TemporalWindAnalysis {
  diurnalPatterns: DiurnalPattern[];
  weeklyPatterns: WeeklyPattern;
  monthlyPatterns: MonthlyPattern[];
  longTermTrends: LongTermTrend[];
}

/**
 * Diurnal (daily) wind patterns
 */
export interface DiurnalPattern {
  hour: number; // 0-23
  averageSpeed: number;
  averageDirection: number;
  frequency: number;
  energyPotential: number;
}

/**
 * Weekly wind patterns
 */
export interface WeeklyPattern {
  weekdays: DayPattern[];
  weekendEffect: number; // difference in wind patterns
  consistencyScore: number;
}

/**
 * Daily pattern data
 */
export interface DayPattern {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  averageSpeed: number;
  peakHour: number;
  calmHour: number;
}

/**
 * Monthly pattern data
 */
export interface MonthlyPattern {
  month: number;
  monthName: string;
  averageSpeed: number;
  prevailingDirection: number;
  variability: number;
  energyRanking: number; // 1-12 ranking
}

/**
 * Long-term trend analysis
 */
export interface LongTermTrend {
  parameter: 'wind_speed' | 'direction' | 'energy_potential';
  trend: 'increasing' | 'decreasing' | 'stable';
  changeRate: number; // per year
  significance: number; // statistical significance (0-1)
  confidence: number; // confidence level (0-1)
}

// ============================================================================
// Wind Rose Visualization Types
// ============================================================================

/**
 * Wind rose visualization configuration
 */
export interface WindRoseVisualizationConfig {
  chartType: 'polar' | 'bar' | 'scatter';
  showFrequency: boolean;
  showSpeed: boolean;
  showCalm: boolean;
  interactive: boolean;
  exportFormats: ('png' | 'svg' | 'pdf' | 'json')[];
  dimensions: {
    width: number;
    height: number;
  };
  styling: WindRoseStyle;
}

/**
 * Wind rose styling options
 */
export interface WindRoseStyle {
  colorScheme: 'viridis' | 'plasma' | 'blues' | 'custom';
  customColors?: string[];
  showGrid: boolean;
  showLabels: boolean;
  fontSize: number;
  lineWidth: number;
  transparency: number; // 0-1
}

/**
 * Wind rose export data
 */
export interface WindRoseExportData {
  windRoseData: WindRoseData;
  visualizationConfig: WindRoseVisualizationConfig;
  statistics: WindStatistics;
  metadata: {
    exportedAt: string;
    exportFormat: string;
    version: string;
  };
  rawData?: WindMeasurement[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Wind direction utilities
 */
export const WIND_DIRECTIONS = {
  16: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
  8: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'],
  4: ['N', 'E', 'S', 'W']
} as const;

/**
 * Default wind speed bins (m/s)
 */
export const DEFAULT_SPEED_BINS: WindSpeedBin[] = [
  { min: 0, max: 2, label: '0-2 m/s', color: '#3498db' },
  { min: 2, max: 4, label: '2-4 m/s', color: '#2ecc71' },
  { min: 4, max: 6, label: '4-6 m/s', color: '#f1c40f' },
  { min: 6, max: 8, label: '6-8 m/s', color: '#e67e22' },
  { min: 8, max: 10, label: '8-10 m/s', color: '#e74c3c' },
  { min: 10, max: Infinity, label: '10+ m/s', color: '#9b59b6' }
];

/**
 * Default wind rose configuration
 */
export const DEFAULT_WIND_ROSE_CONFIG: WindRoseConfig = {
  directionBins: 16,
  speedBins: DEFAULT_SPEED_BINS,
  colorScheme: ['#3498db', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c', '#9b59b6'],
  showCalm: true,
  calmThreshold: 1.0,
  units: 'metric',
  title: 'Wind Rose Analysis',
  subtitle: 'Wind speed and direction distribution'
};