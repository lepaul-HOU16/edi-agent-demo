"""
LAS File Curve Verification Script
Examines all LAS files in S3 bucket to confirm available curves
"""

import boto3
import io
import re
from typing import Dict, List, Set
import pandas as pd

class LASCurveAnalyzer:
    """Analyzes LAS files to identify available curves"""
    
    def __init__(self, bucket_name: str):
        """
        Initialize analyzer with S3 bucket
        
        Args:
            bucket_name: Name of S3 bucket containing LAS files
        """
        self.bucket_name = bucket_name
        self.s3_client = boto3.client('s3')
        
        # Standard petrophysical curves we're looking for
        self.required_curves = {
            'DEPT': 'Depth',
            'GR': 'Gamma Ray', 
            'RT': 'True Resistivity',
            'RHOB': 'Bulk Density',
            'NPHI': 'Neutron Porosity'
        }
        
        # Alternative curve names that might be used
        self.curve_aliases = {
            'GR': ['GAMMA', 'GAMMA_RAY', 'GR_CORR', 'CGR'],
            'RT': ['RES', 'RESISTIVITY', 'ILD', 'LLD', 'DEEP_RES', 'SHALLOWRESISTIVITY'],
            'RHOB': ['DENSITY', 'BULK_DENSITY', 'RHOZ', 'DEN'],
            'NPHI': ['NEUTRON', 'NEUTRON_POROSITY', 'PHIN', 'NEU']
        }

    def analyze_all_wells(self) -> Dict[str, Dict]:
        """
        Analyze all LAS files in the bucket
        
        Returns:
            Dictionary with well analysis results
        """
        print("🔍 Scanning S3 bucket for LAS files...")
        
        # List all LAS files in bucket
        las_files = self._list_las_files()
        print(f"Found {len(las_files)} LAS files")
        
        results = {}
        
        for las_file in las_files:
            print(f"\n📄 Analyzing: {las_file}")
            well_name = self._extract_well_name(las_file)
            
            try:
                curves = self._analyze_las_file(las_file)
                results[well_name] = {
                    'file_path': las_file,
                    'available_curves': curves['available'],
                    'missing_curves': curves['missing'],
                    'curve_count': len(curves['available']),
                    'analysis_status': 'success'
                }
                
                print(f"  ✅ Available curves: {', '.join(curves['available'])}")
                print(f"  ❌ Missing curves: {', '.join(curves['missing'])}")
                
            except Exception as e:
                print(f"  ⚠️ Error analyzing {las_file}: {str(e)}")
                results[well_name] = {
                    'file_path': las_file,
                    'available_curves': [],
                    'missing_curves': list(self.required_curves.keys()),
                    'curve_count': 0,
                    'analysis_status': f'error: {str(e)}'
                }
        
        return results

    def _list_las_files(self) -> List[str]:
        """List all LAS files in the S3 bucket"""
        las_files = []
        
        try:
            paginator = self.s3_client.get_paginator('list_objects_v2')
            pages = paginator.paginate(Bucket=self.bucket_name)
            
            for page in pages:
                if 'Contents' in page:
                    for obj in page['Contents']:
                        key = obj['Key']
                        if key.lower().endswith('.las'):
                            las_files.append(key)
                            
        except Exception as e:
            print(f"Error listing S3 objects: {str(e)}")
            
        return las_files

    def _extract_well_name(self, file_path: str) -> str:
        """Extract well name from file path"""
        # Remove path and extension
        filename = file_path.split('/')[-1]
        well_name = filename.replace('.las', '').replace('.LAS', '')
        return well_name

    def _analyze_las_file(self, file_path: str) -> Dict[str, List[str]]:
        """
        Analyze individual LAS file for curve content
        
        Args:
            file_path: S3 key for the LAS file
            
        Returns:
            Dictionary with available and missing curves
        """
        # Download LAS file content
        response = self.s3_client.get_object(Bucket=self.bucket_name, Key=file_path)
        las_content = response['Body'].read().decode('utf-8', errors='ignore')
        
        # Parse LAS file to extract curve information
        curves_in_file = self._parse_las_curves(las_content)
        
        # Map to standard curve names
        available_curves = []
        for standard_curve in self.required_curves.keys():
            if self._curve_exists(standard_curve, curves_in_file):
                available_curves.append(standard_curve)
        
        missing_curves = [curve for curve in self.required_curves.keys() 
                         if curve not in available_curves]
        
        return {
            'available': available_curves,
            'missing': missing_curves,
            'raw_curves': curves_in_file
        }

    def _parse_las_curves(self, las_content: str) -> List[str]:
        """Parse LAS file content to extract curve names"""
        curves = []
        
        # Look for curve section in LAS file
        lines = las_content.split('\n')
        in_curve_section = False
        
        for line in lines:
            line = line.strip()
            
            # Start of curve section
            if line.startswith('~C') or line.startswith('~CURVE'):
                in_curve_section = True
                continue
                
            # End of curve section
            if line.startswith('~') and not line.startswith('~C'):
                in_curve_section = False
                continue
                
            # Parse curve definitions
            if in_curve_section and line and not line.startswith('#'):
                # Extract curve name (first part before period or space)
                curve_match = re.match(r'^([A-Za-z0-9_]+)', line)
                if curve_match:
                    curve_name = curve_match.group(1).upper()
                    curves.append(curve_name)
        
        return curves

    def _curve_exists(self, standard_curve: str, curves_in_file: List[str]) -> bool:
        """Check if a standard curve exists in the file (including aliases)"""
        # Direct match
        if standard_curve in curves_in_file:
            return True
            
        # Check aliases
        if standard_curve in self.curve_aliases:
            for alias in self.curve_aliases[standard_curve]:
                if alias in curves_in_file:
                    return True
                    
        return False

    def generate_summary_report(self, results: Dict[str, Dict]) -> str:
        """Generate comprehensive summary report"""
        
        total_wells = len(results)
        successful_analyses = sum(1 for r in results.values() if r['analysis_status'] == 'success')
        
        # Group wells by available curves
        curve_groups = {}
        for well_name, data in results.items():
            curve_signature = tuple(sorted(data['available_curves']))
            if curve_signature not in curve_groups:
                curve_groups[curve_signature] = []
            curve_groups[curve_signature].append(well_name)
        
        # Generate report
        report = f"""
# 📊 **LAS File Curve Analysis Report**

## **Summary Statistics**
- **Total Wells Analyzed**: {total_wells}
- **Successful Analyses**: {successful_analyses}
- **Failed Analyses**: {total_wells - successful_analyses}
- **Unique Curve Combinations**: {len(curve_groups)}

## **Curve Availability by Group**

"""
        
        for i, (curves, wells) in enumerate(curve_groups.items(), 1):
            curve_list = list(curves) if curves else ['No curves']
            missing_curves = [c for c in self.required_curves.keys() if c not in curves]
            
            report += f"""### **Group {i}: {len(wells)} Wells**
**Available Curves**: {', '.join(curve_list) if curve_list != ['No curves'] else 'None'}
**Missing Curves**: {', '.join(missing_curves) if missing_curves else 'None'}
**Wells**: {', '.join(wells[:5])}{'...' if len(wells) > 5 else ''}

"""

        # Add detailed well-by-well analysis
        report += """## **Detailed Well Analysis**

| Well Name | Available Curves | Missing Curves | Status |
|-----------|------------------|----------------|---------|
"""
        
        for well_name, data in sorted(results.items()):
            available = ', '.join(data['available_curves']) if data['available_curves'] else 'None'
            missing = ', '.join(data['missing_curves']) if data['missing_curves'] else 'None'
            status = '✅' if data['analysis_status'] == 'success' else '❌'
            
            report += f"| {well_name} | {available} | {missing} | {status} |\n"
        
        # Add recommendations
        report += f"""
## **Recommendations**

### **For Complete Petrophysical Analysis**
To enable full petrophysical analysis capabilities, wells need:
- **GR (Gamma Ray)**: Required for shale volume calculations
- **RT (True Resistivity)**: Required for water saturation calculations  
- **RHOB (Bulk Density)**: Required for density porosity calculations
- **NPHI (Neutron Porosity)**: Required for neutron porosity calculations

### **Current Limitations**
Based on this analysis:
- **Shale Volume Calculations**: {'✅ Possible' if any(any('GR' in r['available_curves'] for r in results.values())) else '❌ Not possible - no GR curves found'}
- **Water Saturation Calculations**: {'✅ Possible' if any(any('RT' in r['available_curves'] for r in results.values())) else '❌ Not possible - no RT curves found'}
- **Porosity Calculations**: {'✅ Possible' if any(any('RHOB' in r['available_curves'] for r in results.values())) else '❌ Limited - check individual wells'}

### **Next Steps**
1. **Verify curve naming conventions** - some curves might use different names
2. **Check for additional LAS files** with complete log suites
3. **Consider curve aliasing** - update MCP server to recognize alternative names
4. **Request complete log data** if missing curves are available elsewhere
"""
        
        return report

def main():
    """Main execution function"""
    # Replace with your actual S3 bucket name
    bucket_name = "your-s3-bucket-name"  # Update this!
    
    print("🔍 **LAS File Curve Analysis Starting**")
    print("=" * 50)
    
    analyzer = LASCurveAnalyzer(bucket_name)
    
    try:
        # Analyze all wells
        results = analyzer.analyze_all_wells()
        
        # Generate and display report
        report = analyzer.generate_summary_report(results)
        print(report)
        
        # Save report to file
        with open('las_curve_analysis_report.md', 'w') as f:
            f.write(report)
        
        print("\n📄 **Report saved to: las_curve_analysis_report.md**")
        
    except Exception as e:
        print(f"❌ **Analysis failed**: {str(e)}")
        print("Please check:")
        print("1. S3 bucket name is correct")
        print("2. AWS credentials are configured")
        print("3. Bucket permissions allow read access")

if __name__ == "__main__":
    main()