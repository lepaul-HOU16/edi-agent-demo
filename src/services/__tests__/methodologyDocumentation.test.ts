/**
 * Tests for Methodology Documentation System
 * Validates comprehensive methodology documentation for all calculation types
 * Requirements: 6.7, 7.3
 */

import { MethodologyDocumentationRegistry, methodologyRegistry } from '../methodologyDocumentation';
import { MethodologyDocumentation } from '../../types/petrophysics';

describe('MethodologyDocumentationRegistry', () => {
  let registry: MethodologyDocumentationRegistry;

  beforeEach(() => {
    registry = new MethodologyDocumentationRegistry();
  });

  describe('Initialization and Basic Functionality', () => {
    it('should initialize with comprehensive methodology documentation', () => {
      const availableMethodologies = registry.getAvailableMethodologies();
      
      expect(availableMethodologies.length).toBeGreaterThan(15);
      expect(availableMethodologies).toContain('porosity_density');
      expect(availableMethodologies).toContain('shale_volume_larionov_tertiary');
      expect(availableMethodologies).toContain('saturation_archie');
      expect(availableMethodologies).toContain('permeability_kozeny_carman');
    });

    it('should provide methodology documentation for all calculation types', () => {
      const calculationTypes = [
        'porosity', 'shale_volume', 'saturation', 'permeability',
        'data_quality_assessment', 'uncertainty_analysis', 'reservoir_quality_assessment'
      ];

      calculationTypes.forEach(type => {
        const methodology = registry.getMethodologyByType(type);
        expect(methodology).toBeDefined();
        expect(methodology!.name).toBeTruthy();
        expect(methodology!.description).toBeTruthy();
        expect(methodology!.industryReferences.length).toBeGreaterThan(0);
        expect(methodology!.assumptions.length).toBeGreaterThan(0);
        expect(methodology!.limitations.length).toBeGreaterThan(0);
        expect(methodology!.methodology).toBeTruthy();
        expect(methodology!.uncertaintyRange.length).toBe(2);
      });
    });
  });

  describe('Porosity Methodologies', () => {
    it('should provide density porosity methodology', () => {
      const methodology = registry.getMethodology('porosity_density');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Density Porosity');
      expect(methodology!.industryReferences).toContain('Schlumberger Cased Hole Log Interpretation Principles/Applications (1989)');
      expect(methodology!.assumptions).toContain('Matrix density is constant and known (typically 2.65 g/cc for quartz sandstone)');
      expect(methodology!.methodology).toContain('φD = (ρma - ρb) / (ρma - ρf)');
      expect(methodology!.uncertaintyRange[0]).toBe(0.02);
      expect(methodology!.uncertaintyRange[1]).toBe(0.05);
    });

    it('should provide neutron porosity methodology', () => {
      const methodology = registry.getMethodology('porosity_neutron');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Neutron Porosity');
      expect(methodology!.industryReferences.some(ref => ref.includes('Neutron'))).toBe(true);
      expect(methodology!.limitations).toContain('Gas effect causes significant porosity underestimation');
    });

    it('should provide effective porosity methodology', () => {
      const methodology = registry.getMethodology('porosity_effective');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Effective Porosity');
      expect(methodology!.methodology).toContain('φE = (φD + φN) / 2');
    });
  });

  describe('Shale Volume Methodologies', () => {
    it('should provide Larionov Tertiary methodology', () => {
      const methodology = registry.getMethodology('shale_volume_larionov_tertiary');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Larionov Shale Volume - Tertiary');
      expect(methodology!.industryReferences).toContain('Larionov, V.V. - Borehole Radiometry (1969)');
      expect(methodology!.methodology).toContain('Vsh = 0.083 × (2^(3.7 × IGR) - 1)');
      expect(methodology!.assumptions).toContain('Formation is Tertiary age (younger, less consolidated)');
    });

    it('should provide Larionov Pre-Tertiary methodology', () => {
      const methodology = registry.getMethodology('shale_volume_larionov_pre_tertiary');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Pre-Tertiary');
      expect(methodology!.methodology).toContain('Vsh = 0.33 × (2^(2 × IGR) - 1)');
    });

    it('should provide Linear shale volume methodology', () => {
      const methodology = registry.getMethodology('shale_volume_linear');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Linear Shale Volume');
      expect(methodology!.methodology).toContain('Vsh = IGR');
      expect(methodology!.limitations).toContain('Oversimplifies the gamma ray-clay relationship');
    });

    it('should provide Clavier methodology', () => {
      const methodology = registry.getMethodology('shale_volume_clavier');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Clavier');
      expect(methodology!.methodology).toContain('Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)²)');
    });
  });

  describe('Saturation Methodologies', () => {
    it('should provide Archie methodology', () => {
      const methodology = registry.getMethodology('saturation_archie');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Archie Water Saturation');
      expect(methodology!.industryReferences).toContain('Archie, G.E. - The Electrical Resistivity Log as an Aid in Determining Some Reservoir Characteristics (1942)');
      expect(methodology!.methodology).toContain('Sw = ((a × Rw) / (φ^m × Rt))^(1/n)');
      expect(methodology!.assumptions).toContain('Formation is clean (low clay content)');
    });

    it('should provide Waxman-Smits methodology', () => {
      const methodology = registry.getMethodology('saturation_waxman_smits');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Waxman-Smits');
      expect(methodology!.description).toContain('shaly formations');
      expect(methodology!.limitations).toContain('Requires additional clay property measurements');
    });

    it('should provide Dual Water methodology', () => {
      const methodology = registry.getMethodology('saturation_dual_water');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Dual Water Model');
      expect(methodology!.assumptions).toContain('Two distinct water types: clay-bound and free water');
    });
  });

  describe('Permeability Methodologies', () => {
    it('should provide Kozeny-Carman methodology', () => {
      const methodology = registry.getMethodology('permeability_kozeny_carman');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Kozeny-Carman');
      expect(methodology!.industryReferences).toContain('Kozeny, J. - Über kapillare Leitung des Wassers im Boden (1927)');
      expect(methodology!.methodology).toContain('k = (φ³ / (1-φ)²) × (d²/180)');
      expect(methodology!.uncertaintyRange[0]).toBe(0.50);
    });

    it('should provide Timur methodology', () => {
      const methodology = registry.getMethodology('permeability_timur');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Timur');
      expect(methodology!.methodology).toContain('k = 0.136 × (φ^4.4 / Swi²)');
    });

    it('should provide Coates-Dumanoir methodology', () => {
      const methodology = registry.getMethodology('permeability_coates_dumanoir');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Coates-Dumanoir');
      expect(methodology!.description).toContain('NMR');
    });
  });

  describe('Quality Control and Analysis Methodologies', () => {
    it('should provide data quality assessment methodology', () => {
      const methodology = registry.getMethodology('data_quality_assessment');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Data Quality Assessment');
      expect(methodology!.industryReferences).toContain('API RP 40 - Recommended Practices for Core Analysis');
      expect(methodology!.assumptions).toContain('Log curves are properly calibrated to industry standards');
    });

    it('should provide environmental corrections methodology', () => {
      const methodology = registry.getMethodology('environmental_corrections');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Environmental Corrections');
      expect(methodology!.description).toContain('borehole effects');
    });

    it('should provide uncertainty analysis methodology', () => {
      const methodology = registry.getMethodology('uncertainty_analysis');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Uncertainty Analysis');
      expect(methodology!.methodology).toContain('Monte Carlo simulation');
    });
  });

  describe('Reservoir Analysis Methodologies', () => {
    it('should provide reservoir quality assessment methodology', () => {
      const methodology = registry.getMethodology('reservoir_quality_assessment');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Reservoir Quality Assessment');
      expect(methodology!.methodology).toContain('Net-to-Gross');
    });

    it('should provide net pay calculation methodology', () => {
      const methodology = registry.getMethodology('net_pay_calculation');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Net Pay Calculation');
      expect(methodology!.methodology).toContain('Net Pay = Σ(thickness)');
    });

    it('should provide completion efficiency methodology', () => {
      const methodology = registry.getMethodology('completion_efficiency');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Completion Efficiency');
      expect(methodology!.methodology).toContain('Completion Efficiency = (Perforated Length in Net Pay)');
    });
  });

  describe('Multi-Well Analysis Methodologies', () => {
    it('should provide multi-well correlation methodology', () => {
      const methodology = registry.getMethodology('multi_well_correlation');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Multi-Well Correlation');
      expect(methodology!.industryReferences).toContain('AAPG Guidelines for Stratigraphic Correlation');
    });

    it('should provide geological correlation methodology', () => {
      const methodology = registry.getMethodology('geological_correlation');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Geological Correlation');
      expect(methodology!.description).toContain('geological markers');
    });

    it('should provide completion target ranking methodology', () => {
      const methodology = registry.getMethodology('completion_target_ranking');
      
      expect(methodology).toBeDefined();
      expect(methodology!.name).toContain('Completion Target');
      expect(methodology!.methodology).toContain('Multi-criteria ranking');
    });
  });

  describe('Methodology Retrieval by Type', () => {
    it('should retrieve methodology by calculation type', () => {
      const porosityMethodology = registry.getMethodologyByType('porosity');
      expect(porosityMethodology).toBeDefined();
      expect(porosityMethodology!.name).toContain('Porosity');

      const saturationMethodology = registry.getMethodologyByType('saturation');
      expect(saturationMethodology).toBeDefined();
      expect(saturationMethodology!.name).toContain('Saturation');
    });

    it('should retrieve methodology by type and method', () => {
      const densityPorosity = registry.getMethodologyByType('porosity', 'density');
      expect(densityPorosity).toBeDefined();
      expect(densityPorosity!.name).toContain('Density Porosity');

      const archie = registry.getMethodologyByType('saturation', 'archie');
      expect(archie).toBeDefined();
      expect(archie!.name).toContain('Archie');
    });

    it('should return undefined for non-existent methodology', () => {
      const nonExistent = registry.getMethodology('non_existent_methodology');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Methodologies by Category', () => {
    it('should retrieve all porosity methodologies', () => {
      const porosityMethodologies = registry.getMethodologiesByCategory('porosity');
      
      expect(porosityMethodologies.length).toBe(4); // density, neutron, effective, total
      expect(porosityMethodologies.every(m => m.name.includes('Porosity'))).toBe(true);
    });

    it('should retrieve all shale volume methodologies', () => {
      const shaleVolumeMethodologies = registry.getMethodologiesByCategory('shale_volume');
      
      expect(shaleVolumeMethodologies.length).toBe(4); // larionov_tertiary, larionov_pre_tertiary, linear, clavier
      expect(shaleVolumeMethodologies.every(m => m.name.includes('Shale Volume') || m.name.includes('Larionov') || m.name.includes('Linear') || m.name.includes('Clavier'))).toBe(true);
    });
  });

  describe('Industry Compliance', () => {
    it('should include industry references for all methodologies', () => {
      const allMethodologies = registry.getAvailableMethodologies();
      
      allMethodologies.forEach(key => {
        const methodology = registry.getMethodology(key);
        expect(methodology!.industryReferences.length).toBeGreaterThan(0);
        expect(methodology!.industryReferences.some(ref => 
          ref.includes('SPE') || ref.includes('SPWLA') || ref.includes('API') || 
          ref.includes('AAPG') || ref.includes('Schlumberger') || ref.includes('Archie') ||
          ref.includes('Larionov') || ref.includes('Kozeny')
        )).toBe(true);
      });
    });

    it('should include uncertainty ranges for all methodologies', () => {
      const allMethodologies = registry.getAvailableMethodologies();
      
      allMethodologies.forEach(key => {
        const methodology = registry.getMethodology(key);
        expect(methodology!.uncertaintyRange.length).toBe(2);
        expect(methodology!.uncertaintyRange[0]).toBeGreaterThanOrEqual(0);
        expect(methodology!.uncertaintyRange[1]).toBeGreaterThan(methodology!.uncertaintyRange[0]);
        expect(methodology!.uncertaintyRange[1]).toBeLessThanOrEqual(1.0);
      });
    });

    it('should include comprehensive assumptions and limitations', () => {
      const allMethodologies = registry.getAvailableMethodologies();
      
      allMethodologies.forEach(key => {
        const methodology = registry.getMethodology(key);
        expect(methodology!.assumptions.length).toBeGreaterThan(0);
        expect(methodology!.limitations.length).toBeGreaterThan(0);
        expect(methodology!.assumptions.every(assumption => assumption.length > 10)).toBe(true);
        expect(methodology!.limitations.every(limitation => limitation.length > 10)).toBe(true);
      });
    });
  });

  describe('Default Registry Instance', () => {
    it('should provide a default registry instance', () => {
      expect(methodologyRegistry).toBeDefined();
      expect(methodologyRegistry).toBeInstanceOf(MethodologyDocumentationRegistry);
      
      const availableMethodologies = methodologyRegistry.getAvailableMethodologies();
      expect(availableMethodologies.length).toBeGreaterThan(15);
    });

    it('should be consistent across multiple accesses', () => {
      const methodology1 = methodologyRegistry.getMethodology('porosity_density');
      const methodology2 = methodologyRegistry.getMethodology('porosity_density');
      
      expect(methodology1).toEqual(methodology2);
    });
  });

  describe('Methodology Content Quality', () => {
    it('should have detailed methodology descriptions', () => {
      const allMethodologies = registry.getAvailableMethodologies();
      
      allMethodologies.forEach(key => {
        const methodology = registry.getMethodology(key);
        expect(methodology!.description.length).toBeGreaterThan(50);
        expect(methodology!.methodology.length).toBeGreaterThan(20);
      });
    });

    it('should include mathematical formulas where appropriate', () => {
      const formulaMethodologies = [
        'porosity_density', 'shale_volume_larionov_tertiary', 
        'saturation_archie', 'permeability_kozeny_carman'
      ];
      
      formulaMethodologies.forEach(key => {
        const methodology = registry.getMethodology(key);
        expect(methodology!.methodology).toMatch(/[=×\^]/); // Contains mathematical symbols
      });
    });

    it('should have realistic uncertainty ranges', () => {
      const methodology = registry.getMethodology('porosity_density');
      expect(methodology!.uncertaintyRange[0]).toBe(0.02); // 2%
      expect(methodology!.uncertaintyRange[1]).toBe(0.05); // 5%
      
      const permeabilityMethodology = registry.getMethodology('permeability_kozeny_carman');
      expect(permeabilityMethodology!.uncertaintyRange[0]).toBe(0.50); // 50%
      expect(permeabilityMethodology!.uncertaintyRange[1]).toBe(1.00); // 100%
    });
  });
});