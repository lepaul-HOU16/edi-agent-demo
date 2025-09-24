/**
 * Professional Methodology Documentation System
 * Provides comprehensive documentation for all petrophysical calculations
 * Requirements: 6.7, 7.3
 */

import { MethodologyDocumentation } from '../types/petrophysics';

/**
 * Methodology Documentation Registry
 * Maintains comprehensive documentation for all calculation methods
 */
export class MethodologyDocumentationRegistry {
  private methodologies: Map<string, MethodologyDocumentation>;

  constructor() {
    this.methodologies = new Map();
    this.initializeMethodologies();
  }

  /**
   * Initialize all methodology documentation
   */
  private initializeMethodologies(): void {
    // Porosity methodologies
    this.methodologies.set('porosity_density', this.getDensityPorosityMethodology());
    this.methodologies.set('porosity_neutron', this.getNeutronPorosityMethodology());
    this.methodologies.set('porosity_effective', this.getEffectivePorosityMethodology());
    this.methodologies.set('porosity_total', this.getTotalPorosityMethodology());

    // Shale volume methodologies
    this.methodologies.set('shale_volume_larionov_tertiary', this.getLarionovTertiaryMethodology());
    this.methodologies.set('shale_volume_larionov_pre_tertiary', this.getLarionovPreTertiaryMethodology());
    this.methodologies.set('shale_volume_linear', this.getLinearShaleVolumeMethodology());
    this.methodologies.set('shale_volume_clavier', this.getClavierMethodology());

    // Saturation methodologies
    this.methodologies.set('saturation_archie', this.getArchieMethodology());
    this.methodologies.set('saturation_waxman_smits', this.getWaxmanSmitsMethodology());
    this.methodologies.set('saturation_dual_water', this.getDualWaterMethodology());

    // Permeability methodologies
    this.methodologies.set('permeability_kozeny_carman', this.getKozenyCarmanMethodology());
    this.methodologies.set('permeability_timur', this.getTimurMethodology());
    this.methodologies.set('permeability_coates_dumanoir', this.getCoatesDumanoirMethodology());

    // Quality control methodologies
    this.methodologies.set('data_quality_assessment', this.getDataQualityMethodology());
    this.methodologies.set('environmental_corrections', this.getEnvironmentalCorrectionsMethodology());
    this.methodologies.set('uncertainty_analysis', this.getUncertaintyAnalysisMethodology());

    // Reservoir analysis methodologies
    this.methodologies.set('reservoir_quality_assessment', this.getReservoirQualityMethodology());
    this.methodologies.set('net_pay_calculation', this.getNetPayMethodology());
    this.methodologies.set('completion_efficiency', this.getCompletionEfficiencyMethodology());

    // Multi-well analysis methodologies
    this.methodologies.set('multi_well_correlation', this.getMultiWellCorrelationMethodology());
    this.methodologies.set('geological_correlation', this.getGeologicalCorrelationMethodology());
    this.methodologies.set('completion_target_ranking', this.getCompletionTargetRankingMethodology());
  }

  /**
   * Get methodology documentation by key
   */
  public getMethodology(key: string): MethodologyDocumentation | undefined {
    return this.methodologies.get(key);
  }

  /**
   * Get methodology by calculation type and method
   */
  public getMethodologyByType(calculationType: string, method?: string): MethodologyDocumentation | undefined {
    if (method) {
      const key = `${calculationType}_${method}`;
      return this.methodologies.get(key);
    }
    
    // Return first methodology for the calculation type
    const keys = Array.from(this.methodologies.keys()).filter(k => k.startsWith(calculationType));
    return keys.length > 0 ? this.methodologies.get(keys[0]) : undefined;
  }

  /**
   * Get all available methodology keys
   */
  public getAvailableMethodologies(): string[] {
    return Array.from(this.methodologies.keys());
  }

  /**
   * Get methodologies by category
   */
  public getMethodologiesByCategory(category: string): MethodologyDocumentation[] {
    const keys = Array.from(this.methodologies.keys()).filter(k => k.startsWith(category));
    return keys.map(key => this.methodologies.get(key)!).filter(Boolean);
  }

  // Porosity Methodologies
  private getDensityPorosityMethodology(): MethodologyDocumentation {
    return {
      name: 'Density Porosity Calculation',
      description: 'Calculates porosity from bulk density measurements using the density-porosity relationship',
      industryReferences: [
        'Schlumberger Cased Hole Log Interpretation Principles/Applications (1989)',
        'Bateman, R.M. - Openhole Log Analysis and Formation Evaluation (1985)',
        'API RP 40 - Recommended Practices for Core Analysis (1998)',
        'SPWLA Guidelines for Petrophysical Data Quality Assessment'
      ],
      assumptions: [
        'Matrix density is constant and known (typically 2.65 g/cc for quartz sandstone)',
        'Fluid density is 1.0 g/cc (fresh water equivalent)',
        'No significant clay-bound water or heavy minerals',
        'Bulk density measurement is accurate and environmentally corrected',
        'Formation is water-saturated for porosity calculation'
      ],
      limitations: [
        'Affected by shale content and clay minerals',
        'Gas effect can cause porosity overestimation',
        'Heavy minerals can cause porosity underestimation',
        'Requires accurate matrix density determination',
        'Environmental corrections must be properly applied'
      ],
      methodology: 'φD = (ρma - ρb) / (ρma - ρf) where ρma = matrix density (2.65 g/cc), ρb = bulk density, ρf = fluid density (1.0 g/cc)',
      uncertaintyRange: [0.02, 0.05]
    };
  }

  private getNeutronPorosityMethodology(): MethodologyDocumentation {
    return {
      name: 'Neutron Porosity Calculation',
      description: 'Determines porosity from neutron log response calibrated to limestone porosity units',
      industryReferences: [
        'Schlumberger Log Interpretation Charts (1989)',
        'Halliburton Logging Services - Neutron Logging Principles',
        'Baker Hughes - Neutron Porosity Measurement Techniques',
        'SPE 13083 - Neutron Log Response in Shaly Formations'
      ],
      assumptions: [
        'Neutron log is calibrated to limestone porosity units',
        'Formation water has normal hydrogen content',
        'No significant hydrocarbon effect (gas correction applied if needed)',
        'Clay-bound water contributes to apparent porosity',
        'Environmental corrections have been applied'
      ],
      limitations: [
        'Overestimates porosity in shaly formations',
        'Gas effect causes significant porosity underestimation',
        'Affected by clay minerals and bound water',
        'Requires lithology-specific corrections',
        'Sensitive to borehole conditions and mud properties'
      ],
      methodology: 'φN = NPHI (neutron porosity reading in limestone units, typically as decimal fraction)',
      uncertaintyRange: [0.03, 0.06]
    };
  }

  private getEffectivePorosityMethodology(): MethodologyDocumentation {
    return {
      name: 'Effective Porosity Calculation',
      description: 'Combines density and neutron porosity to minimize individual log limitations and provide effective porosity',
      industryReferences: [
        'Schlumberger Cased Hole Log Interpretation Principles/Applications',
        'Poupon, A. and Leveaux, J. - Evaluation of Water Saturations in Shaly Formations',
        'Dresser Atlas - Log Interpretation Charts (1979)',
        'SPWLA Best Practices for Porosity Determination'
      ],
      assumptions: [
        'Density and neutron logs are properly calibrated',
        'Environmental corrections have been applied to both logs',
        'Formation is predominantly sandstone or carbonate',
        'Gas corrections applied when necessary',
        'Clay-bound water effects are minimized by averaging'
      ],
      limitations: [
        'May not be accurate in highly shaly formations',
        'Gas effect still present but reduced',
        'Requires both density and neutron log data',
        'Averaging may mask important geological variations',
        'Lithology-specific corrections may be needed'
      ],
      methodology: 'φE = (φD + φN) / 2 where φD = density porosity, φN = neutron porosity (both in same units)',
      uncertaintyRange: [0.02, 0.04]
    };
  }

  private getTotalPorosityMethodology(): MethodologyDocumentation {
    return {
      name: 'Total Porosity Calculation',
      description: 'Calculates total porosity including both effective and clay-bound water porosity',
      industryReferences: [
        'Waxman, M.H. and Smits, L.J.M. - Electrical Conductivities in Oil-Bearing Shaly Sands',
        'Clavier, C. et al. - Theoretical and Experimental Bases for the Dual-Water Model',
        'SPWLA Guidelines for Shaly Sand Analysis',
        'Schlumberger Shaly Sand Interpretation Techniques'
      ],
      assumptions: [
        'Total porosity includes effective and clay-bound porosity',
        'Neutron log response includes clay-bound water',
        'Density log corrected for clay mineral effects',
        'Shale volume is accurately determined',
        'Clay mineral composition is known'
      ],
      limitations: [
        'Difficult to distinguish effective from bound porosity',
        'Requires detailed clay mineral analysis',
        'Highly dependent on shale volume accuracy',
        'May overestimate effective porosity in shaly zones',
        'Complex in mixed lithology formations'
      ],
      methodology: 'φT = φN + Vsh × φsh where φN = neutron porosity, Vsh = shale volume, φsh = shale porosity',
      uncertaintyRange: [0.04, 0.08]
    };
  }

  // Shale Volume Methodologies
  private getLarionovTertiaryMethodology(): MethodologyDocumentation {
    return {
      name: 'Larionov Shale Volume - Tertiary Rocks',
      description: 'Non-linear shale volume calculation for Tertiary age rocks using gamma ray response',
      industryReferences: [
        'Larionov, V.V. - Borehole Radiometry (1969)',
        'Schlumberger Log Interpretation Charts',
        'Bateman, R.M. - Cased Hole Log Analysis and Formation Evaluation',
        'SPWLA Guidelines for Shale Volume Determination'
      ],
      assumptions: [
        'Gamma ray response is primarily due to clay content',
        'Clean sand and shale end-points are properly defined',
        'No significant radioactive minerals (glauconite, K-feldspar)',
        'Formation is Tertiary age (younger, less consolidated)',
        'Gamma ray log is properly calibrated'
      ],
      limitations: [
        'May overestimate shale volume in radioactive sands',
        'End-point selection is critical for accuracy',
        'Not applicable to older, more consolidated formations',
        'Assumes uniform clay mineral composition',
        'Affected by uranium and thorium content'
      ],
      methodology: 'Vsh = 0.083 × (2^(3.7 × IGR) - 1) where IGR = (GR - GRclean) / (GRshale - GRclean)',
      uncertaintyRange: [0.10, 0.20]
    };
  }

  private getLarionovPreTertiaryMethodology(): MethodologyDocumentation {
    return {
      name: 'Larionov Shale Volume - Pre-Tertiary Rocks',
      description: 'Non-linear shale volume calculation for older, consolidated rocks using gamma ray response',
      industryReferences: [
        'Larionov, V.V. - Borehole Radiometry (1969)',
        'Schlumberger Log Interpretation Charts',
        'Dresser Atlas - Basic Well Log Analysis (1982)',
        'AAPG Methods in Exploration - Shale Volume Determination'
      ],
      assumptions: [
        'Formation is pre-Tertiary age (older, more consolidated)',
        'Gamma ray response correlates with clay content',
        'Clean sand and shale baselines are established',
        'No significant radioactive cement or heavy minerals',
        'Structural clay is the primary gamma ray source'
      ],
      limitations: [
        'Less sensitive than Tertiary formula for low shale volumes',
        'May underestimate shale volume in highly radioactive formations',
        'Requires age-appropriate calibration',
        'Affected by diagenetic processes in older rocks',
        'End-point determination more critical'
      ],
      methodology: 'Vsh = 0.33 × (2^(2 × IGR) - 1) where IGR = (GR - GRclean) / (GRshale - GRclean)',
      uncertaintyRange: [0.08, 0.18]
    };
  }

  private getLinearShaleVolumeMethodology(): MethodologyDocumentation {
    return {
      name: 'Linear Shale Volume Calculation',
      description: 'Simple linear relationship between gamma ray response and shale volume',
      industryReferences: [
        'Basic Well Log Analysis - AAPG (1987)',
        'Cased Hole Log Interpretation Principles - Schlumberger',
        'Fundamentals of Formation Evaluation - Bateman',
        'SPE Guidelines for Quick-Look Petrophysical Analysis'
      ],
      assumptions: [
        'Linear relationship between gamma ray and clay content',
        'Clean sand and shale end-points are well defined',
        'No radioactive minerals or cements present',
        'Uniform clay mineral distribution',
        'Simple geological setting'
      ],
      limitations: [
        'Oversimplifies the gamma ray-clay relationship',
        'May overestimate shale volume at low clay contents',
        'Not suitable for complex lithologies',
        'Ignores non-linear clay effects on gamma ray',
        'Less accurate than non-linear methods'
      ],
      methodology: 'Vsh = IGR = (GR - GRclean) / (GRshale - GRclean)',
      uncertaintyRange: [0.15, 0.25]
    };
  }

  private getClavierMethodology(): MethodologyDocumentation {
    return {
      name: 'Clavier Shale Volume Calculation',
      description: 'Non-linear shale volume calculation using empirical relationship for consolidated formations',
      industryReferences: [
        'Clavier, C. et al. - Theoretical and Experimental Bases for the Dual-Water Model (1984)',
        'SPE 13240 - The Theoretical Basis of the Dual Water Model',
        'Schlumberger Technical Review - Shaly Sand Analysis',
        'SPWLA Symposium - Advanced Shale Volume Techniques'
      ],
      assumptions: [
        'Empirical relationship applies to formation type',
        'Gamma ray response correlates with structural clay',
        'Clean and shale baselines are accurately determined',
        'Formation is moderately to well consolidated',
        'Clay minerals have consistent gamma ray response'
      ],
      limitations: [
        'Empirical formula may not apply to all formations',
        'Requires calibration for specific geological settings',
        'May give negative values for very clean formations',
        'Less commonly used than Larionov methods',
        'Limited validation in unconventional reservoirs'
      ],
      methodology: 'Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)²) where IGR = (GR - GRclean) / (GRshale - GRclean)',
      uncertaintyRange: [0.12, 0.22]
    };
  }

  // Saturation Methodologies
  private getArchieMethodology(): MethodologyDocumentation {
    return {
      name: 'Archie Water Saturation Calculation',
      description: 'Classic water saturation calculation for clean formations using Archie\'s equation',
      industryReferences: [
        'Archie, G.E. - The Electrical Resistivity Log as an Aid in Determining Some Reservoir Characteristics (1942)',
        'Winsauer, W.O. et al. - Resistivity of Brine-Saturated Sands in Relation to Pore Geometry (1952)',
        'Schlumberger Log Interpretation Principles/Applications',
        'SPE Monograph - Cased Hole Log Interpretation'
      ],
      assumptions: [
        'Formation is clean (low clay content)',
        'Formation water resistivity (Rw) is known and constant',
        'Porosity is accurately determined',
        'Archie parameters (a, m, n) are appropriate for formation',
        'No conductive minerals present'
      ],
      limitations: [
        'Not applicable to shaly formations',
        'Requires accurate Rw determination',
        'Archie parameters vary with lithology and texture',
        'Assumes homogeneous pore structure',
        'May overestimate water saturation in shaly zones'
      ],
      methodology: 'Sw = ((a × Rw) / (φ^m × Rt))^(1/n) where a=1.0, m=2.0, n=2.0 (typical values)',
      uncertaintyRange: [0.10, 0.25]
    };
  }

  private getWaxmanSmitsMethodology(): MethodologyDocumentation {
    return {
      name: 'Waxman-Smits Water Saturation Calculation',
      description: 'Advanced water saturation calculation for shaly formations accounting for clay conductivity',
      industryReferences: [
        'Waxman, M.H. and Smits, L.J.M. - Electrical Conductivities in Oil-Bearing Shaly Sands (1968)',
        'SPE 1863 - Electrical Conductivities in Shaly Sands',
        'Schlumberger Shaly Sand Interpretation Techniques',
        'SPWLA Guidelines for Shaly Formation Analysis'
      ],
      assumptions: [
        'Clay conductivity can be quantified and modeled',
        'Cation exchange capacity (CEC) is known or estimated',
        'Formation water salinity is constant',
        'Clay minerals are dispersed throughout the formation',
        'Dual-water model assumptions apply'
      ],
      limitations: [
        'Requires additional clay property measurements',
        'More complex than Archie equation',
        'CEC determination can be uncertain',
        'May not apply to all clay types',
        'Requires specialized log analysis software'
      ],
      methodology: 'Complex equation involving clay conductivity: Ct = Cw × Sw^n / F* + Csh where F* includes clay effects',
      uncertaintyRange: [0.08, 0.18]
    };
  }

  private getDualWaterMethodology(): MethodologyDocumentation {
    return {
      name: 'Dual Water Model Saturation Calculation',
      description: 'Advanced saturation model distinguishing between clay-bound and free water',
      industryReferences: [
        'Clavier, C. et al. - Theoretical and Experimental Bases for the Dual-Water Model (1984)',
        'SPE 13240 - The Theoretical Basis of the Dual Water Model',
        'Schlumberger Technical Review - Dual Water Model Applications',
        'SPWLA Symposium - Advanced Saturation Techniques'
      ],
      assumptions: [
        'Two distinct water types: clay-bound and free water',
        'Clay-bound water has different resistivity than free water',
        'Shale volume is accurately determined',
        'Clay water saturation can be estimated',
        'Formation is in electrical equilibrium'
      ],
      limitations: [
        'Requires accurate shale volume determination',
        'Clay water properties must be known',
        'More complex than conventional methods',
        'May be over-parameterized for simple formations',
        'Requires extensive calibration'
      ],
      methodology: 'Swt = Swb × Vsh + Swe × (1 - Vsh) where Swb = clay-bound water, Swe = effective water saturation',
      uncertaintyRange: [0.06, 0.15]
    };
  }

  // Permeability Methodologies
  private getKozenyCarmanMethodology(): MethodologyDocumentation {
    return {
      name: 'Kozeny-Carman Permeability Estimation',
      description: 'Theoretical permeability calculation based on pore structure and grain size',
      industryReferences: [
        'Kozeny, J. - Über kapillare Leitung des Wassers im Boden (1927)',
        'Carman, P.C. - Fluid Flow through Granular Beds (1937)',
        'Bear, J. - Dynamics of Fluids in Porous Media (1972)',
        'SPE Textbook - Reservoir Engineering Fundamentals'
      ],
      assumptions: [
        'Porous medium consists of uniform spherical grains',
        'Pore structure is well-connected and tortuous',
        'Grain size distribution is known',
        'No significant clay or cement blocking pore throats',
        'Darcy flow conditions apply'
      ],
      limitations: [
        'Requires accurate grain size determination',
        'Assumes idealized pore geometry',
        'May not account for diagenetic effects',
        'Large uncertainty in permeability estimates',
        'Not suitable for fractured or vuggy formations'
      ],
      methodology: 'k = (φ³ / (1-φ)²) × (d²/180) where φ = porosity, d = grain diameter in microns',
      uncertaintyRange: [0.50, 1.00]
    };
  }

  private getTimurMethodology(): MethodologyDocumentation {
    return {
      name: 'Timur Permeability Correlation',
      description: 'Empirical permeability correlation based on porosity and irreducible water saturation',
      industryReferences: [
        'Timur, A. - An Investigation of Permeability, Porosity, and Residual Water Saturation Relationships (1968)',
        'SPE 2094 - Effective Porosity and Permeability Correlations',
        'Schlumberger Log Analysis Handbook',
        'SPWLA Guidelines for Permeability Estimation'
      ],
      assumptions: [
        'Correlation applies to formation lithology and texture',
        'Irreducible water saturation is accurately determined',
        'Formation is consolidated sandstone or carbonate',
        'No significant fracture permeability',
        'Pore structure is representative of correlation database'
      ],
      limitations: [
        'Empirical correlation with large scatter',
        'May not apply to all formation types',
        'Requires accurate Swi determination',
        'Large uncertainty in permeability estimates',
        'Should be calibrated with core data when available'
      ],
      methodology: 'k = 0.136 × (φ^4.4 / Swi²) where φ = porosity (fraction), Swi = irreducible water saturation',
      uncertaintyRange: [0.30, 0.70]
    };
  }

  private getCoatesDumanoirMethodology(): MethodologyDocumentation {
    return {
      name: 'Coates-Dumanoir Permeability Model',
      description: 'Permeability estimation using free fluid index from NMR or capillary pressure data',
      industryReferences: [
        'Coates, G.R. and Dumanoir, J.L. - A New Approach to Improved Log-Derived Permeability (1974)',
        'SPE 5050 - NMR Logging Principles and Applications',
        'Schlumberger NMR Logging Handbook',
        'SPWLA NMR Logging Guidelines'
      ],
      assumptions: [
        'Free fluid index accurately represents mobile porosity',
        'Capillary pressure relationships are known',
        'Formation is water-wet',
        'NMR T2 cutoff is properly calibrated',
        'Pore size distribution affects permeability'
      ],
      limitations: [
        'Requires NMR log data or capillary pressure measurements',
        'T2 cutoff selection affects results significantly',
        'May not apply to oil-wet or mixed-wet formations',
        'Complex in heterogeneous formations',
        'Requires specialized interpretation techniques'
      ],
      methodology: 'k = C × (φ × FFI)² where C = formation-specific constant, FFI = free fluid index',
      uncertaintyRange: [0.25, 0.60]
    };
  }

  // Quality Control and Analysis Methodologies
  private getDataQualityMethodology(): MethodologyDocumentation {
    return {
      name: 'Data Quality Assessment',
      description: 'Comprehensive assessment of well log data quality including completeness, environmental corrections, and statistical validation',
      industryReferences: [
        'API RP 40 - Recommended Practices for Core Analysis',
        'SPWLA Guidelines for Petrophysical Data Quality',
        'SPE Guidelines for Log Data Quality Control',
        'Schlumberger Log Quality Control Procedures'
      ],
      assumptions: [
        'Log curves are properly calibrated to industry standards',
        'Environmental corrections have been applied where necessary',
        'Depth registration is accurate across all curves',
        'Borehole conditions are within acceptable limits',
        'Tool specifications and operating procedures were followed'
      ],
      limitations: [
        'Quality assessment based on statistical analysis only',
        'Cannot detect systematic calibration errors without reference data',
        'Requires minimum data density for reliable statistical assessment',
        'May not identify subtle environmental effects',
        'Limited ability to assess accuracy without ground truth'
      ],
      methodology: 'Multi-criteria assessment including data completeness, statistical outlier detection, curve correlation analysis, and environmental correction validation',
      uncertaintyRange: [0.05, 0.15]
    };
  }

  private getEnvironmentalCorrectionsMethodology(): MethodologyDocumentation {
    return {
      name: 'Environmental Corrections Validation',
      description: 'Validation and application of environmental corrections for borehole effects on log measurements',
      industryReferences: [
        'Schlumberger Log Interpretation Charts - Environmental Corrections',
        'Halliburton Environmental Correction Procedures',
        'Baker Hughes Log Analysis Guidelines',
        'SPWLA Environmental Effects on Log Measurements'
      ],
      assumptions: [
        'Borehole size and mud properties are accurately measured',
        'Formation temperature and pressure are known',
        'Tool specifications and correction charts are current',
        'Invasion effects are properly characterized',
        'Correction algorithms are appropriate for formation type'
      ],
      limitations: [
        'Correction charts may not cover all conditions',
        'Assumes standard tool configurations',
        'May not account for unusual borehole conditions',
        'Correction accuracy depends on input parameter quality',
        'Some effects may be difficult to separate'
      ],
      methodology: 'Application of service company correction charts and algorithms based on borehole conditions, mud properties, and formation characteristics',
      uncertaintyRange: [0.03, 0.10]
    };
  }

  private getUncertaintyAnalysisMethodology(): MethodologyDocumentation {
    return {
      name: 'Uncertainty Analysis and Error Propagation',
      description: 'Comprehensive uncertainty analysis for all petrophysical calculations using Monte Carlo methods',
      industryReferences: [
        'SPE Guidelines for Uncertainty Analysis in Petrophysics',
        'Monte Carlo Methods in Reservoir Engineering - Haldorsen & Damsleth',
        'SPWLA Best Practices for Uncertainty Quantification',
        'Uncertainty Analysis in Petroleum Exploration - Rose'
      ],
      assumptions: [
        'Input parameter uncertainties are normally distributed',
        'Correlations between input parameters are minimal or known',
        'Systematic errors have been identified and corrected',
        'Monte Carlo simulation provides adequate sampling',
        'Uncertainty distributions are representative'
      ],
      limitations: [
        'Does not account for model uncertainty',
        'Assumes independence of input parameters unless specified',
        'Requires accurate estimates of input parameter uncertainties',
        'May not capture all sources of uncertainty',
        'Computational intensity for complex models'
      ],
      methodology: 'Monte Carlo simulation with error propagation analysis, confidence interval calculation, and sensitivity analysis',
      uncertaintyRange: [0.10, 0.30]
    };
  }

  private getReservoirQualityMethodology(): MethodologyDocumentation {
    return {
      name: 'Reservoir Quality Assessment',
      description: 'Comprehensive reservoir quality metrics including net-to-gross, completion efficiency, and reservoir ranking',
      industryReferences: [
        'SPE Guidelines for Reservoir Quality Assessment',
        'Industry Best Practices for Completion Design - SPE',
        'Reservoir Characterization Handbook - Bateman',
        'AAPG Methods in Exploration - Reservoir Quality'
      ],
      assumptions: [
        'Cutoff values are appropriate for formation type and development strategy',
        'Log-derived properties represent reservoir conditions',
        'Completion efficiency metrics follow industry standards',
        'Net pay criteria are calibrated to production performance',
        'Reservoir quality ranking is based on established criteria'
      ],
      limitations: [
        'Cutoff values may need local calibration with production data',
        'Does not account for mechanical rock properties',
        'Assumes homogeneous reservoir properties within intervals',
        'May not capture small-scale heterogeneity effects',
        'Completion efficiency depends on technology and practices'
      ],
      methodology: 'Net-to-Gross = Clean Sand Thickness / Total Thickness; Completion Efficiency = Perforated Length / Net Pay Length; Quality ranking based on porosity, permeability, and saturation',
      uncertaintyRange: [0.05, 0.15]
    };
  }

  private getNetPayMethodology(): MethodologyDocumentation {
    return {
      name: 'Net Pay Calculation',
      description: 'Determination of net reservoir thickness meeting porosity, saturation, and shale volume criteria',
      industryReferences: [
        'SPE Guidelines for Net Pay Determination',
        'Cased Hole Log Analysis - Schlumberger',
        'Reservoir Engineering Handbook - Ahmed',
        'SPWLA Best Practices for Net Pay Calculation'
      ],
      assumptions: [
        'Cutoff criteria are appropriate for reservoir type',
        'Log measurements accurately represent formation properties',
        'Vertical resolution is adequate for thin bed analysis',
        'Completion technology can access identified net pay',
        'Economic cutoffs are based on current development costs'
      ],
      limitations: [
        'Cutoff selection significantly affects net pay calculation',
        'May not account for completion technology limitations',
        'Assumes uniform completion efficiency across net pay',
        'Does not consider mechanical rock properties',
        'May miss thin productive intervals below log resolution'
      ],
      methodology: 'Net Pay = Σ(thickness) where Vsh < Vsh_cutoff AND φ > φ_cutoff AND Sw < Sw_cutoff',
      uncertaintyRange: [0.10, 0.25]
    };
  }

  private getCompletionEfficiencyMethodology(): MethodologyDocumentation {
    return {
      name: 'Completion Efficiency Analysis',
      description: 'Assessment of completion effectiveness based on perforated interval versus net pay ratio',
      industryReferences: [
        'SPE Guidelines for Completion Design Optimization',
        'Industry Best Practices for Perforation Strategy',
        'Completion Engineering Handbook - Economides',
        'SPWLA Completion Evaluation Guidelines'
      ],
      assumptions: [
        'Perforation strategy targets highest quality reservoir intervals',
        'Completion technology can effectively access perforated zones',
        'Net pay calculation accurately identifies productive intervals',
        'Completion efficiency correlates with production performance',
        'Mechanical integrity allows perforation in target zones'
      ],
      limitations: [
        'Does not account for completion technology variations',
        'Assumes uniform perforation effectiveness',
        'May not consider wellbore stability issues',
        'Does not include fracture stimulation effects',
        'Economic factors may override technical optimization'
      ],
      methodology: 'Completion Efficiency = (Perforated Length in Net Pay) / (Total Net Pay Length) × 100%',
      uncertaintyRange: [0.05, 0.20]
    };
  }

  private getMultiWellCorrelationMethodology(): MethodologyDocumentation {
    return {
      name: 'Multi-Well Correlation Analysis',
      description: 'Geological correlation and reservoir continuity analysis across multiple wells using log character and structural framework',
      industryReferences: [
        'AAPG Guidelines for Stratigraphic Correlation',
        'SPE Best Practices for Multi-Well Analysis',
        'Sequence Stratigraphy - Emery & Myers',
        'Well Log Correlation Techniques - Bateman'
      ],
      assumptions: [
        'Wells are within the same geological and structural setting',
        'Structural dip and fault patterns are consistent across the field',
        'Log character accurately reflects geological facies',
        'Datum selection is appropriate for structural framework',
        'Correlation quality is sufficient for reservoir modeling'
      ],
      limitations: [
        'Requires adequate well control and data quality',
        'May miss thin beds below log vertical resolution',
        'Structural complexity can complicate correlation',
        'Facies changes may disrupt log character correlation',
        'Limited by understanding of depositional environment'
      ],
      methodology: 'Structural datum correlation with sequence stratigraphic framework, log character matching, and geological marker identification',
      uncertaintyRange: [0.05, 0.20]
    };
  }

  private getGeologicalCorrelationMethodology(): MethodologyDocumentation {
    return {
      name: 'Geological Correlation and Marker Identification',
      description: 'Identification and correlation of geological markers, formation tops, and sequence boundaries across wells',
      industryReferences: [
        'AAPG Methods in Exploration - Geological Correlation',
        'Sequence Stratigraphy Principles - Van Wagoner et al.',
        'Well Log Facies Analysis - Serra',
        'Stratigraphic Correlation Guidelines - AAPG'
      ],
      assumptions: [
        'Geological markers have consistent log character across the field',
        'Structural framework is understood and consistent',
        'Depositional environment controls are recognized',
        'Sequence stratigraphic concepts apply to the formation',
        'Log resolution is adequate for marker identification'
      ],
      limitations: [
        'Marker identification may be subjective',
        'Facies changes can alter log character',
        'Structural complications may disrupt correlation',
        'Limited by log vertical resolution',
        'Requires geological expertise and local knowledge'
      ],
      methodology: 'Systematic identification of log character patterns, formation tops, flooding surfaces, and sequence boundaries using established geological principles',
      uncertaintyRange: [0.10, 0.30]
    };
  }

  private getCompletionTargetRankingMethodology(): MethodologyDocumentation {
    return {
      name: 'Completion Target Identification and Ranking',
      description: 'Systematic identification and ranking of completion targets based on reservoir quality metrics and completion potential',
      industryReferences: [
        'SPE Guidelines for Completion Target Selection',
        'Industry Best Practices for Perforation Strategy - SPE',
        'Completion Design Optimization - Economides & Nolte',
        'SPWLA Completion Evaluation Best Practices'
      ],
      assumptions: [
        'Reservoir quality metrics correlate with production potential',
        'Completion technology can effectively access identified targets',
        'Ranking criteria are appropriate for development strategy',
        'Economic factors are incorporated in target selection',
        'Mechanical rock properties allow successful completion'
      ],
      limitations: [
        'Ranking based on static reservoir properties only',
        'May not account for dynamic reservoir behavior',
        'Completion technology limitations not fully considered',
        'Economic assumptions may change over field life',
        'Does not include geomechanical completion risks'
      ],
      methodology: 'Multi-criteria ranking based on porosity, permeability, net pay thickness, hydrocarbon saturation, and completion efficiency potential',
      uncertaintyRange: [0.15, 0.35]
    };
  }
}

/**
 * Default instance of methodology documentation registry
 */
export const methodologyRegistry = new MethodologyDocumentationRegistry();