#!/usr/bin/env python3
"""
Simple test of well data loading without MCP
"""
import os

# Simple LAS file parser
class LASParser:
    def __init__(self, filepath: str):
        self.filepath = filepath
        self.well_info = {}
        self.curves = {}
        self.data = None
        self._parse()
    
    def _parse(self):
        with open(self.filepath, 'r') as f:
            lines = f.readlines()
        
        section = None
        curve_names = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('~'):
                section = line[1:].split()[0].upper()
                continue
                
            if section == 'WELL':
                if '.' in line and ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0].split('.')[0].strip()
                        value = parts[1].strip()
                        self.well_info[key] = value
            
            elif section == 'CURVE':
                if '.' in line and ':' in line:
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        curve_name = parts[0].split('.')[0].strip()
                        curve_names.append(curve_name)
            
            elif section == 'ASCII':
                if line and not line.startswith('#'):
                    try:
                        values = [float(x) for x in line.split()]
                        if len(values) == len(curve_names):
                            if self.data is None:
                                self.data = {name: [] for name in curve_names}
                            for i, name in enumerate(curve_names):
                                self.data[name].append(values[i])
                    except ValueError:
                        continue

def test_well_data():
    print("🚀 Testing Well Data Loading...")
    
    SCRIPTS_DIR = "/Users/cmgabri/edi-agent-demo/scripts"
    wells = {}
    
    for filename in os.listdir(SCRIPTS_DIR):
        if filename.endswith('.las'):
            filepath = os.path.join(SCRIPTS_DIR, filename)
            well_name = filename.replace('.las', '')
            try:
                wells[well_name] = LASParser(filepath)
                print(f"✅ Loaded well: {well_name}")
                
                # Show well info
                well = wells[well_name]
                print(f"   📋 Well info: {well.well_info.get('WELL', 'Unknown')}")
                print(f"   📊 Curves: {list(well.data.keys()) if well.data else 'None'}")
                print(f"   📏 Data points: {len(well.data['DEPT']) if well.data and 'DEPT' in well.data else 0}")
                
            except Exception as e:
                print(f"❌ Error loading {filename}: {e}")
    
    print(f"\n📈 Summary: Loaded {len(wells)} wells")
    
    # Test data access
    if wells:
        well_name = list(wells.keys())[0]
        well = wells[well_name]
        if well.data and 'GR' in well.data:
            gr_data = well.data['GR'][:10]  # First 10 points
            print(f"🔍 Sample GR data from {well_name}: {gr_data}")
    
    return len(wells) > 0

if __name__ == '__main__':
    success = test_well_data()
    exit(0 if success else 1)
