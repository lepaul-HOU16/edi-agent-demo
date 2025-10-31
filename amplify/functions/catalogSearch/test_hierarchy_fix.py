#!/usr/bin/env python3
"""
Test to verify the hierarchy fix for /getdata command.

This test verifies that:
1. Wells, wellbores, and welllogs are fetched separately
2. They are linked correctly using IDs
3. The final JSON structure matches example_well_metadata_hierarchy.json format
"""

import json
from osdu_data_transformer import OSDUDataTransformer


def test_complete_hierarchy_transformation():
    """Test the complete transformation pipeline."""
    
    print("\n" + "="*80)
    print("Testing Complete Hierarchy Transformation")
    print("="*80)
    
    # Step 1: Simulate OSDU API responses (separate queries)
    print("\nStep 1: Simulating OSDU API responses...")
    
    osdu_wells = [
        {
            'id': 'osdu:master-data--Well:well001:',
            'data': {
                'FacilityName': 'Test Well 001',
                'NameAliases': [
                    {'AliasName': 'WELL-001'},
                    {'AliasName': 'DUMMY_UWI_WELL-001'}
                ],
                'SpatialLocation.Wgs84Coordinates': {
                    'geometries': [
                        {
                            'coordinates': [114.5, 10.5],
                            'type': 'point'
                        }
                    ],
                    'type': 'geometrycollection'
                }
            }
        }
    ]
    
    osdu_wellbores = [
        {
            'id': 'osdu:master-data--Wellbore:wb001:',
            'data': {
                'WellID': 'osdu:master-data--Well:well001:',
                'FacilityName': 'Wellbore 001-A',
                'NameAliases': [
                    {'AliasName': 'WB-001-A'}
                ]
            }
        },
        {
            'id': 'osdu:master-data--Wellbore:wb002:',
            'data': {
                'WellID': 'osdu:master-data--Well:well001:',
                'FacilityName': 'Wellbore 001-B',
                'NameAliases': [
                    {'AliasName': 'WB-001-B'}
                ]
            }
        }
    ]
    
    osdu_welllogs = [
        {
            'id': 'osdu:work-product-component--WellLog:wl001:',
            'data': {
                'WellboreID': 'osdu:master-data--Wellbore:wb001:',
                'Name': 'log_001.las',
                'Datasets': ['ds001'],
                'Curves': [
                    {'Mnemonic': 'GR'},
                    {'Mnemonic': 'RHOB'}
                ]
            }
        },
        {
            'id': 'osdu:work-product-component--WellLog:wl002:',
            'data': {
                'WellboreID': 'osdu:master-data--Wellbore:wb002:',
                'Name': 'log_002.las',
                'Datasets': ['ds002'],
                'Curves': [
                    {'Mnemonic': 'DT'},
                    {'Mnemonic': 'NPHI'}
                ]
            }
        }
    ]
    
    print(f"  - {len(osdu_wells)} wells")
    print(f"  - {len(osdu_wellbores)} wellbores")
    print(f"  - {len(osdu_welllogs)} welllogs")
    
    # Step 2: Transform each type separately
    print("\nStep 2: Transforming OSDU data...")
    transformer = OSDUDataTransformer()
    
    wells_metadata = transformer.transform_well_data(osdu_wells)
    print(f"  - Transformed {len(wells_metadata)} wells")
    
    wellbores_metadata = [transformer._parse_osdu_wellbore(wb) for wb in osdu_wellbores]
    wellbores_metadata = [wb for wb in wellbores_metadata if wb is not None]
    print(f"  - Transformed {len(wellbores_metadata)} wellbores")
    
    welllogs_metadata = [transformer._parse_osdu_welllog(wl) for wl in osdu_welllogs]
    welllogs_metadata = [wl for wl in welllogs_metadata if wl is not None]
    print(f"  - Transformed {len(welllogs_metadata)} welllogs")
    
    # Step 3: Link the hierarchy
    print("\nStep 3: Linking hierarchy...")
    wellbores_with_logs = transformer.link_welllogs_to_wellbores(wellbores_metadata, welllogs_metadata)
    print(f"  - Linked welllogs to wellbores")
    
    wells_complete = transformer.link_wellbores_to_wells(wells_metadata, wellbores_with_logs)
    print(f"  - Linked wellbores to wells")
    
    # Step 4: Build hierarchical structure
    print("\nStep 4: Building hierarchical structure...")
    hierarchical_wells = transformer.build_hierarchy(wells_complete)
    print(f"  - Built hierarchy for {len(hierarchical_wells)} wells")
    
    # Step 5: Verify structure
    print("\nStep 5: Verifying structure...")
    
    assert len(hierarchical_wells) == 1, "Should have 1 well"
    
    well = hierarchical_wells[0]
    assert 'well_id' in well, "Well should have well_id"
    assert 'data' in well, "Well should have data object"
    assert 'wellbores' in well, "Well should have wellbores array"
    
    assert 'FacilityName' in well['data'], "Well data should have FacilityName"
    assert 'NameAliases' in well['data'], "Well data should have NameAliases"
    assert 'SpatialLocation.Wgs84Coordinates' in well['data'], "Well data should have coordinates"
    
    assert len(well['wellbores']) == 2, "Well should have 2 wellbores"
    
    wellbore = well['wellbores'][0]
    assert 'wellbore_id' in wellbore, "Wellbore should have wellbore_id"
    assert 'data' in wellbore, "Wellbore should have data object"
    assert 'welllogs' in wellbore, "Wellbore should have welllogs array"
    
    assert 'FacilityName' in wellbore['data'], "Wellbore data should have FacilityName"
    assert 'NameAliases' in wellbore['data'], "Wellbore data should have NameAliases"
    
    assert len(wellbore['welllogs']) == 1, "Wellbore should have 1 welllog"
    
    welllog = wellbore['welllogs'][0]
    assert 'welllog_id' in welllog, "Welllog should have welllog_id"
    assert 'data' in welllog, "Welllog should have data object"
    
    assert 'Name' in welllog['data'], "Welllog data should have Name"
    assert 'Datasets' in welllog['data'], "Welllog data should have Datasets"
    assert 'Curves' in welllog['data'], "Welllog data should have Curves"
    
    assert len(welllog['data']['Curves']) == 2, "Welllog should have 2 curves"
    assert welllog['data']['Curves'][0]['Mnemonic'] == 'GR', "First curve should be GR"
    
    print("  ✅ All structure assertions passed")
    
    # Step 6: Display final structure
    print("\nStep 6: Final hierarchical structure:")
    print(json.dumps(hierarchical_wells, indent=2))
    
    print("\n" + "="*80)
    print("✅ HIERARCHY FIX VERIFIED - Structure matches example format!")
    print("="*80)
    
    return True


if __name__ == '__main__':
    test_complete_hierarchy_transformation()
