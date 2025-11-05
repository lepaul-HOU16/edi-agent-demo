#!/usr/bin/env python3
"""
Petrophysical Calculation Modules for MCP Server
Python implementation of porosity, shale volume, and saturation calculations
Based on requirements 2.1, 2.4, 2.8
"""

import math
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum


class PorosityMethod(Enum):
    DENSITY = "density"
    NEUTRON = "neutron" 
    EFFECTIVE = "effective"
    TOTAL = "total"


class ShaleVolumeMethod(Enum):
    LARIONOV_TERTIARY = "larionov_tertiary"
    LARIONOV_PRE_TERTIARY = "larionov_pre_tertiary"
    LINEAR = "linear"
    CLAVIER = "clavier"


class SaturationMethod(Enum):
    ARCHIE = "archie"
    WAXMAN_SMITS = "waxman_smits"
    DUAL_WATER = "dual_water"


@dataclass
class CalculationResult:
    values: List[float]
    depths: List[float]
    uncertainty: List[float]
    methodology: str
    parameters: Dict[str, Any]
    statistics: Dict[str, float]
    quality_metrics: Dict[str, Any]


@dataclass
class ValidationResult:
    is_valid: bool
    errors: List[Dict[str, str]]
    warnings: List[Dict[str, str]]


class PorosityCalculator:
    """
    Porosity Calculator Class
    Implements industry-standard porosity calculation methods
    """
    
    def __init__(self):
        self.default_parameters = {
            'matrix_density': 2.65,  # Sandstone matrix density (g/cc)
            'fluid_density': 1.0,    # Water density (g/cc)
        }
    
    def calculate_density_porosity(self, rhob_data: List[float], parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate density porosity using formula: φD = (ρma - ρb) / (ρma - ρf)
        Standard formula: φD = (2.65 - RHOB) / (2.65 - 1.0)
        """
        params = {**self.default_parameters, **(parameters or {})}
        matrix_density = params['matrix_density']
        fluid_density = params['fluid_density']
        
        result = []
        for rhob in rhob_data:
            # Handle null values
            if rhob == -999.25 or math.isnan(rhob) or not math.isfinite(rhob):
                result.append(-999.25)
                continue
            
            # Validate input range (typical bulk density range: 1.5 - 3.0 g/cc)
            if rhob < 1.0 or rhob > 4.0:
                result.append(-999.25)
                continue
            
            # Calculate density porosity: φD = (ρma - ρb) / (ρma - ρf)
            porosity = (matrix_density - rhob) / (matrix_density - fluid_density)
            
            # Validate result (porosity should be between 0 and 1)
            if porosity < 0 or porosity > 1:
                result.append(-999.25)
                continue
            
            result.append(porosity)
        
        return result
    
    def calculate_neutron_porosity(self, nphi_data: List[float], parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate neutron porosity using formula: φN = NPHI / 100
        Converts neutron porosity from percentage to decimal
        """
        result = []
        for nphi in nphi_data:
            # Handle null values
            if nphi == -999.25 or math.isnan(nphi) or not math.isfinite(nphi):
                result.append(-999.25)
                continue
            
            # Validate input range (typical neutron porosity range: 0 - 100%)
            if nphi < 0 or nphi > 100:
                result.append(-999.25)
                continue
            
            # Convert from percentage to decimal: φN = NPHI / 100
            porosity = nphi / 100
            result.append(porosity)
        
        return result
    
    def calculate_effective_porosity(self, density_porosity: List[float], neutron_porosity: List[float]) -> List[float]:
        """
        Calculate effective porosity as average of density and neutron porosity
        Formula: φE = (φD + φN) / 2
        """
        if len(density_porosity) != len(neutron_porosity):
            raise ValueError('Density and neutron porosity arrays must have the same length')
        
        result = []
        for phi_d, phi_n in zip(density_porosity, neutron_porosity):
            # Handle null values
            if (phi_d == -999.25 or phi_n == -999.25 or 
                math.isnan(phi_d) or math.isnan(phi_n) or 
                not math.isfinite(phi_d) or not math.isfinite(phi_n)):
                result.append(-999.25)
                continue
            
            # Calculate effective porosity: φE = (φD + φN) / 2
            effective_porosity = (phi_d + phi_n) / 2
            
            # Validate result
            if effective_porosity < 0 or effective_porosity > 1:
                result.append(-999.25)
                continue
            
            result.append(effective_porosity)
        
        return result
    
    def calculate_porosity(self, method: str, input_data: Dict[str, List[float]], 
                          parameters: Optional[Dict] = None, depth_range: Optional[Tuple[float, float]] = None) -> CalculationResult:
        """
        Main porosity calculation method that handles different porosity types
        """
        params = {**self.default_parameters, **(parameters or {})}
        
        try:
            if method == PorosityMethod.DENSITY.value:
                if 'rhob' not in input_data:
                    raise ValueError('RHOB curve is required for density porosity calculation')
                values = self.calculate_density_porosity(input_data['rhob'], params)
                methodology = f"Density Porosity: φD = ({params['matrix_density']} - RHOB) / ({params['matrix_density']} - {params['fluid_density']})"
                
            elif method == PorosityMethod.NEUTRON.value:
                if 'nphi' not in input_data:
                    raise ValueError('NPHI curve is required for neutron porosity calculation')
                values = self.calculate_neutron_porosity(input_data['nphi'], params)
                methodology = "Neutron Porosity: φN = NPHI / 100"
                
            elif method == PorosityMethod.EFFECTIVE.value:
                if 'rhob' not in input_data or 'nphi' not in input_data:
                    raise ValueError('Both RHOB and NPHI curves are required for effective porosity calculation')
                density_phi = self.calculate_density_porosity(input_data['rhob'], params)
                neutron_phi = self.calculate_neutron_porosity(input_data['nphi'], params)
                values = self.calculate_effective_porosity(density_phi, neutron_phi)
                methodology = f"Effective Porosity: φE = (φD + φN) / 2, where φD = ({params['matrix_density']} - RHOB) / ({params['matrix_density']} - {params['fluid_density']}) and φN = NPHI / 100"
                
            elif method == PorosityMethod.TOTAL.value:
                if 'nphi' not in input_data:
                    raise ValueError('NPHI curve is required for total porosity calculation')
                values = self.calculate_neutron_porosity(input_data['nphi'], params)
                methodology = "Total Porosity: φT = NPHI / 100 (neutron porosity represents total porosity)"
                
            else:
                raise ValueError(f"Unsupported porosity method: {method}")
            
            # Apply depth range filter if specified
            depths = input_data.get('depth', list(range(len(values))))
            if depth_range:
                filtered_indices = [i for i, depth in enumerate(depths) 
                                  if depth_range[0] <= depth <= depth_range[1]]
                depths = [depths[i] for i in filtered_indices]
                values = [values[i] for i in filtered_indices]
            
            # Calculate uncertainty (±2% for density, ±3% for neutron)
            base_uncertainty = 0.02 if method == PorosityMethod.DENSITY.value else 0.03
            uncertainty = [abs(val * base_uncertainty) if val != -999.25 else -999.25 for val in values]
            
            # Calculate statistics
            statistics = self._calculate_statistics(values)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(values, method)
            
            return CalculationResult(
                values=values,
                depths=depths,
                uncertainty=uncertainty,
                methodology=methodology,
                parameters=params,
                statistics=statistics,
                quality_metrics=quality_metrics
            )
            
        except Exception as e:
            raise ValueError(f"Porosity calculation failed: {str(e)}")
    
    def _calculate_statistics(self, data: List[float]) -> Dict[str, float]:
        """Calculate statistical summary for porosity data"""
        valid_data = [val for val in data if val != -999.25 and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return {
                'mean': float('nan'),
                'median': float('nan'),
                'std_dev': float('nan'),
                'min': float('nan'),
                'max': float('nan'),
                'count': len(data),
                'valid_count': 0
            }
        
        valid_data.sort()
        mean = sum(valid_data) / len(valid_data)
        variance = sum((val - mean) ** 2 for val in valid_data) / len(valid_data)
        std_dev = math.sqrt(variance)
        
        return {
            'mean': mean,
            'median': valid_data[len(valid_data) // 2],
            'std_dev': std_dev,
            'min': valid_data[0],
            'max': valid_data[-1],
            'count': len(data),
            'valid_count': len(valid_data)
        }
    
    def _calculate_quality_metrics(self, values: List[float], method: str) -> Dict[str, Any]:
        """Calculate quality metrics for porosity calculations"""
        valid_count = sum(1 for val in values if val != -999.25 and not math.isnan(val) and math.isfinite(val))
        data_completeness = valid_count / len(values) if values else 0
        
        uncertainty_ranges = {
            PorosityMethod.DENSITY.value: [0.02, 0.03],
            PorosityMethod.NEUTRON.value: [0.03, 0.05],
            PorosityMethod.EFFECTIVE.value: [0.02, 0.04],
            PorosityMethod.TOTAL.value: [0.03, 0.05]
        }
        
        uncertainty_range = uncertainty_ranges.get(method, [0.05, 0.10])
        
        if data_completeness < 0.8:
            uncertainty_range = [ur * 1.5 for ur in uncertainty_range]
        
        confidence_level = 'high' if data_completeness > 0.9 else 'medium' if data_completeness > 0.7 else 'low'
        
        return {
            'data_completeness': data_completeness,
            'uncertainty_range': uncertainty_range,
            'confidence_level': confidence_level,
            'validation_notes': f'Porosity calculated using {method} method'
        }


class ShaleVolumeCalculator:
    """
    Shale Volume Calculator Class
    Implements industry-standard shale volume calculation methods
    """
    
    def __init__(self):
        self.default_parameters = {
            'gr_clean': 25,   # Clean sand gamma ray value (API units)
            'gr_shale': 150,  # Shale gamma ray value (API units)
        }
    
    def _calculate_gamma_ray_index(self, gr_data: List[float], gr_clean: float, gr_shale: float) -> List[float]:
        """
        Calculate Gamma Ray Index (IGR) from gamma ray log
        Formula: IGR = (GR - GRclean) / (GRshale - GRclean)
        """
        result = []
        for gr in gr_data:
            # Handle null values
            if gr == -999.25 or math.isnan(gr) or not math.isfinite(gr):
                result.append(-999.25)
                continue
            
            # Validate input range (typical GR range: 0 - 300 API)
            if gr < 0 or gr > 500:
                result.append(-999.25)
                continue
            
            # Calculate IGR
            igr = (gr - gr_clean) / (gr_shale - gr_clean)
            
            # Clamp IGR to valid range [0, 1]
            result.append(max(0, min(1, igr)))
        
        return result
    
    def calculate_larionov_tertiary(self, gr_data: List[float], parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate shale volume using Larionov method for Tertiary rocks
        Formula: Vsh = 0.083 * (2^(3.7 * IGR) - 1)
        """
        params = {**self.default_parameters, **(parameters or {})}
        gr_clean = params['gr_clean']
        gr_shale = params['gr_shale']
        
        igr_data = self._calculate_gamma_ray_index(gr_data, gr_clean, gr_shale)
        
        result = []
        for igr in igr_data:
            # Handle null values
            if igr == -999.25:
                result.append(-999.25)
                continue
            
            # Larionov Tertiary formula: Vsh = 0.083 * (2^(3.7 * IGR) - 1)
            vsh = 0.083 * (math.pow(2, 3.7 * igr) - 1)
            
            # Clamp to valid range [0, 1]
            result.append(max(0, min(1, vsh)))
        
        return result
    
    def calculate_larionov_pre_tertiary(self, gr_data: List[float], parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate shale volume using Larionov method for Pre-Tertiary rocks
        Formula: Vsh = 0.33 * (2^(2 * IGR) - 1)
        """
        params = {**self.default_parameters, **(parameters or {})}
        gr_clean = params['gr_clean']
        gr_shale = params['gr_shale']
        
        igr_data = self._calculate_gamma_ray_index(gr_data, gr_clean, gr_shale)
        
        result = []
        for igr in igr_data:
            # Handle null values
            if igr == -999.25:
                result.append(-999.25)
                continue
            
            # Larionov Pre-Tertiary formula: Vsh = 0.33 * (2^(2 * IGR) - 1)
            vsh = 0.33 * (math.pow(2, 2 * igr) - 1)
            
            # Clamp to valid range [0, 1]
            result.append(max(0, min(1, vsh)))
        
        return result
    
    def calculate_linear(self, gr_data: List[float], parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate shale volume using Linear method
        Formula: Vsh = IGR
        """
        params = {**self.default_parameters, **(parameters or {})}
        gr_clean = params['gr_clean']
        gr_shale = params['gr_shale']
        
        return self._calculate_gamma_ray_index(gr_data, gr_clean, gr_shale)
    
    def calculate_clavier(self, gr_data: List[float], parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate shale volume using Clavier method
        Formula: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
        """
        params = {**self.default_parameters, **(parameters or {})}
        gr_clean = params['gr_clean']
        gr_shale = params['gr_shale']
        
        igr_data = self._calculate_gamma_ray_index(gr_data, gr_clean, gr_shale)
        
        result = []
        for igr in igr_data:
            # Handle null values
            if igr == -999.25:
                result.append(-999.25)
                continue
            
            # Clavier formula: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2)
            term = 3.38 - math.pow(igr + 0.7, 2)
            
            # Check if the term under square root is negative
            if term < 0:
                result.append(-999.25)
                continue
            
            vsh = 1.7 - math.sqrt(term)
            
            # Clamp to valid range [0, 1]
            result.append(max(0, min(1, vsh)))
        
        return result
    
    def calculate_shale_volume(self, method: str, input_data: Dict[str, List[float]], 
                              parameters: Optional[Dict] = None, depth_range: Optional[Tuple[float, float]] = None) -> CalculationResult:
        """
        Main shale volume calculation method that handles different methods
        """
        params = {**self.default_parameters, **(parameters or {})}
        
        try:
            if 'gr' not in input_data:
                raise ValueError('GR curve is required for shale volume calculation')
            
            if method == ShaleVolumeMethod.LARIONOV_TERTIARY.value:
                values = self.calculate_larionov_tertiary(input_data['gr'], params)
                methodology = f"Larionov Tertiary: Vsh = 0.083 * (2^(3.7 * IGR) - 1), where IGR = (GR - {params['gr_clean']}) / ({params['gr_shale']} - {params['gr_clean']})"
                
            elif method == ShaleVolumeMethod.LARIONOV_PRE_TERTIARY.value:
                values = self.calculate_larionov_pre_tertiary(input_data['gr'], params)
                methodology = f"Larionov Pre-Tertiary: Vsh = 0.33 * (2^(2 * IGR) - 1), where IGR = (GR - {params['gr_clean']}) / ({params['gr_shale']} - {params['gr_clean']})"
                
            elif method == ShaleVolumeMethod.LINEAR.value:
                values = self.calculate_linear(input_data['gr'], params)
                methodology = f"Linear: Vsh = IGR, where IGR = (GR - {params['gr_clean']}) / ({params['gr_shale']} - {params['gr_clean']})"
                
            elif method == ShaleVolumeMethod.CLAVIER.value:
                values = self.calculate_clavier(input_data['gr'], params)
                methodology = f"Clavier: Vsh = 1.7 - sqrt(3.38 - (IGR + 0.7)^2), where IGR = (GR - {params['gr_clean']}) / ({params['gr_shale']} - {params['gr_clean']})"
                
            else:
                raise ValueError(f"Unsupported shale volume method: {method}")
            
            # Apply depth range filter if specified
            depths = input_data.get('depth', list(range(len(values))))
            if depth_range:
                filtered_indices = [i for i, depth in enumerate(depths) 
                                  if depth_range[0] <= depth <= depth_range[1]]
                depths = [depths[i] for i in filtered_indices]
                values = [values[i] for i in filtered_indices]
            
            # Calculate uncertainty (±5% for shale volume calculations)
            base_uncertainty = 0.05
            uncertainty = [abs(val * base_uncertainty) if val != -999.25 else -999.25 for val in values]
            
            # Calculate statistics
            statistics = self._calculate_statistics(values)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(values, method)
            
            return CalculationResult(
                values=values,
                depths=depths,
                uncertainty=uncertainty,
                methodology=methodology,
                parameters=params,
                statistics=statistics,
                quality_metrics=quality_metrics
            )
            
        except Exception as e:
            raise ValueError(f"Shale volume calculation failed: {str(e)}")
    
    def _calculate_statistics(self, data: List[float]) -> Dict[str, float]:
        """Calculate statistical summary for shale volume data"""
        valid_data = [val for val in data if val != -999.25 and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return {
                'mean': float('nan'),
                'median': float('nan'),
                'std_dev': float('nan'),
                'min': float('nan'),
                'max': float('nan'),
                'count': len(data),
                'valid_count': 0
            }
        
        valid_data.sort()
        mean = sum(valid_data) / len(valid_data)
        variance = sum((val - mean) ** 2 for val in valid_data) / len(valid_data)
        std_dev = math.sqrt(variance)
        
        return {
            'mean': mean,
            'median': valid_data[len(valid_data) // 2],
            'std_dev': std_dev,
            'min': valid_data[0],
            'max': valid_data[-1],
            'count': len(data),
            'valid_count': len(valid_data)
        }
    
    def _calculate_quality_metrics(self, values: List[float], method: str) -> Dict[str, Any]:
        """Calculate quality metrics for shale volume calculations"""
        valid_count = sum(1 for val in values if val != -999.25 and not math.isnan(val) and math.isfinite(val))
        data_completeness = valid_count / len(values) if values else 0
        
        uncertainty_ranges = {
            ShaleVolumeMethod.LARIONOV_TERTIARY.value: [0.05, 0.10],
            ShaleVolumeMethod.LARIONOV_PRE_TERTIARY.value: [0.05, 0.10],
            ShaleVolumeMethod.LINEAR.value: [0.10, 0.15],
            ShaleVolumeMethod.CLAVIER.value: [0.05, 0.08]
        }
        
        uncertainty_range = uncertainty_ranges.get(method, [0.05, 0.10])
        
        if data_completeness < 0.8:
            uncertainty_range = [ur * 1.5 for ur in uncertainty_range]
        
        confidence_level = 'high' if data_completeness > 0.9 else 'medium' if data_completeness > 0.7 else 'low'
        
        return {
            'data_completeness': data_completeness,
            'uncertainty_range': uncertainty_range,
            'confidence_level': confidence_level,
            'validation_notes': f'Shale volume calculated using {method} method'
        }


class SaturationCalculator:
    """
    Water Saturation Calculator Class
    Implements industry-standard water saturation calculation methods
    """
    
    def __init__(self):
        self.default_parameters = {
            'rw': 0.1,    # Formation water resistivity (ohm-m)
            'a': 1.0,     # Tortuosity factor
            'm': 2.0,     # Cementation exponent
            'n': 2.0,     # Saturation exponent
            'b': 0.045,   # Waxman-Smits coefficient
            'qv': 0.1,    # Cation exchange capacity
        }
    
    def calculate_archie(self, rt_data: List[float], porosity_data: List[float], 
                        parameters: Optional[Dict] = None) -> List[float]:
        """
        Calculate water saturation using Archie's equation
        Formula: Sw = ((a * Rw) / (φ^m * RT))^(1/n)
        """
        params = {**self.default_parameters, **(parameters or {})}
        rw = params['rw']
        a = params['a']
        m = params['m']
        n = params['n']
        
        if len(rt_data) != len(porosity_data):
            raise ValueError('Resistivity and porosity arrays must have the same length')
        
        result = []
        for rt, porosity in zip(rt_data, porosity_data):
            # Handle null values
            if (rt == -999.25 or porosity == -999.25 or 
                math.isnan(rt) or math.isnan(porosity) or 
                not math.isfinite(rt) or not math.isfinite(porosity)):
                result.append(-999.25)
                continue
            
            # Validate input ranges
            if rt <= 0 or porosity <= 0 or porosity > 1:
                result.append(-999.25)
                continue
            
            # Calculate formation factor: F = a / φ^m
            formation_factor = a / math.pow(porosity, m)
            
            # Calculate water saturation: Sw = ((F * Rw) / RT)^(1/n)
            sw = math.pow((formation_factor * rw) / rt, 1 / n)
            
            # Clamp to valid range [0, 1]
            result.append(max(0, min(1, sw)))
        
        return result
    
    def calculate_saturation(self, method: str, input_data: Dict[str, List[float]], 
                           parameters: Optional[Dict] = None, depth_range: Optional[Tuple[float, float]] = None) -> CalculationResult:
        """
        Main water saturation calculation method that handles different methods
        """
        params = {**self.default_parameters, **(parameters or {})}
        
        try:
            if method == SaturationMethod.ARCHIE.value:
                if 'rt' not in input_data or 'porosity' not in input_data:
                    raise ValueError('RT and POROSITY curves are required for Archie calculation')
                values = self.calculate_archie(input_data['rt'], input_data['porosity'], params)
                methodology = f"Archie Equation: Sw = (({params['a']} * {params['rw']}) / (φ^{params['m']} * RT))^(1/{params['n']})"
                
            else:
                raise ValueError(f"Unsupported saturation method: {method}")
            
            # Apply depth range filter if specified
            depths = input_data.get('depth', list(range(len(values))))
            if depth_range:
                filtered_indices = [i for i, depth in enumerate(depths) 
                                  if depth_range[0] <= depth <= depth_range[1]]
                depths = [depths[i] for i in filtered_indices]
                values = [values[i] for i in filtered_indices]
            
            # Calculate uncertainty (±15% for Archie)
            base_uncertainty = 0.15
            uncertainty = [abs(val * base_uncertainty) if val != -999.25 else -999.25 for val in values]
            
            # Calculate statistics
            statistics = self._calculate_statistics(values)
            
            # Calculate quality metrics
            quality_metrics = self._calculate_quality_metrics(values, method)
            
            return CalculationResult(
                values=values,
                depths=depths,
                uncertainty=uncertainty,
                methodology=methodology,
                parameters=params,
                statistics=statistics,
                quality_metrics=quality_metrics
            )
            
        except Exception as e:
            raise ValueError(f"Saturation calculation failed: {str(e)}")
    
    def _calculate_statistics(self, data: List[float]) -> Dict[str, float]:
        """Calculate statistical summary for saturation data"""
        valid_data = [val for val in data if val != -999.25 and not math.isnan(val) and math.isfinite(val)]
        
        if not valid_data:
            return {
                'mean': float('nan'),
                'median': float('nan'),
                'std_dev': float('nan'),
                'min': float('nan'),
                'max': float('nan'),
                'count': len(data),
                'valid_count': 0
            }
        
        valid_data.sort()
        mean = sum(valid_data) / len(valid_data)
        variance = sum((val - mean) ** 2 for val in valid_data) / len(valid_data)
        std_dev = math.sqrt(variance)
        
        return {
            'mean': mean,
            'median': valid_data[len(valid_data) // 2],
            'std_dev': std_dev,
            'min': valid_data[0],
            'max': valid_data[-1],
            'count': len(data),
            'valid_count': len(valid_data)
        }
    
    def _calculate_quality_metrics(self, values: List[float], method: str) -> Dict[str, Any]:
        """Calculate quality metrics for saturation calculations"""
        valid_count = sum(1 for val in values if val != -999.25 and not math.isnan(val) and math.isfinite(val))
        data_completeness = valid_count / len(values) if values else 0
        
        uncertainty_ranges = {
            SaturationMethod.ARCHIE.value: [0.15, 0.25],
        }
        
        uncertainty_range = uncertainty_ranges.get(method, [0.15, 0.25])
        
        if data_completeness < 0.8:
            uncertainty_range = [ur * 1.5 for ur in uncertainty_range]
        
        confidence_level = 'high' if data_completeness > 0.9 else 'medium' if data_completeness > 0.7 else 'low'
        
        return {
            'data_completeness': data_completeness,
            'uncertainty_range': uncertainty_range,
            'confidence_level': confidence_level,
            'validation_notes': f'Water saturation calculated using {method} method'
        }