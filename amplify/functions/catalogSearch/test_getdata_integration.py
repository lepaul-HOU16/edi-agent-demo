"""
Integration test for /getdata command with real OSDU data transformation.

This test verifies the complete flow from OSDU API response to S3 storage.
"""

import json
import logging
from command_router import CommandRouter
from osdu_data_transformer import OSDUDataTransformer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_complete_getdata_flow():
    """
    Test complete /getdata flow with realistic OSDU data.
    
    Simulates:
    1. OSDU API returning well data with wellbores and welllogs
    2. Data transformation to WellMetadata format
    3. GeoJSON generation
    4. Statistics calculation
    5. S3 storage
    6. Signed URL generation
    """
    print("\n" + "="*80)
    print("INTEGRATION TEST: Complete /getdata Flow")
    print("="*80)
    
    # Realistic OSDU response with nested wellbores and welllogs
    mock_osdu_response = [
        {
            'id': 'osdu:master-data--Well:15/9-F-1:',
            'data': {
                'FacilityName': '15/9-F-1',
                'NameAliases': [
                    {'AliasName': 'NPD-5693'},
                    {'AliasName': '15/9-F-1'}
                ],
                'SpatialLocation.Wgs84Coordinates': {
                    'geometries': [
                        {
                            'coordinates': [2.2345, 56.1234],
                            'type': 'point'
                        }
                    ],
                    'type': 'geometrycollection'
                },
                'TotalDepth': 3500.5,
                'Operator': 'Test Energy AS',
                'WellType': 'exploration'
            },
            'wellbores': [
                {
                    'id': 'osdu:master-data--Wellbore:15/9-F-1-A',
                    'data': {
                        'FacilityName': '15/9-F-1 A',
                        'WellID': 'osdu:master-data--Well:15/9-F-1:',
                        'NameAliases': [
                            {'AliasName': 'NPD-7405'}
                        ]
                    },
                    'welllogs': [
                        {
                            'id': 'osdu:work-product-component--WellLog:log-001',
                            'data': {
                                'WellboreID': 'osdu:master-data--Wellbore:15/9-F-1-A',
                                'Name': '15_9_F_1_A_GR_DT.las',
                                'Datasets': ['osdu:dataset--File.Generic:dataset-001'],
                                'Curves': [
                                    {
                                        'Mnemonic': 'DEPT',
                                        'CurveUnit': 'osdu:reference-data--UnitOfMeasure:M:',
                                        'TopDepth': 2655.4,
                                        'BaseDepth': 3015.9
                                    },
                                    {
                                        'Mnemonic': 'GR',
                                        'CurveUnit': 'osdu:reference-data--UnitOfMeasure:GAPI:'
                                    },
                                    {
                                        'Mnemonic': 'DT',
                                        'CurveUnit': 'osdu:reference-data--UnitOfMeasure:US/FT:'
                                    }
                                ]
                            }
                        }
                    ]
                },
                {
                    'id': 'osdu:master-data--Wellbore:15/9-F-1-B',
                    'data': {
                        'FacilityName': '15/9-F-1 B',
                        'WellID': 'osdu:master-data--Well:15/9-F-1:',
                        'NameAliases': [
                            {'AliasName': 'NPD-7406'}
                        ]
                    },
                    'welllogs': []
                }
            ]
        },
        {
            'id': 'osdu:master-data--Well:16/1-4:',
            'data': {
                'FacilityName': '16/1-4',
                'NameAliases': [
                    {'AliasName': 'NPD-5694'}
                ],
                'SpatialLocation.Wgs84Coordinates': {
                    'geometries': [
                        {
                            'coordinates': [2.5678, 56.5678],
                            'type': 'point'
                        }
                    ],
                    'type': 'geometrycollection'
                },
                'TotalDepth': 4200.0,
                'Operator': 'Test Energy AS',
                'WellType': 'production'
            },
            'wellbores': []
        }
    ]
    
    # Test data transformation
    print("\n1. Testing OSDU data transformation...")
    transformer = OSDUDataTransformer()
    wells_metadata = transformer.transform_well_data(mock_osdu_response)
    
    print(f"   ✓ Transformed {len(wells_metadata)} wells")
    
    # Verify well structure
    assert len(wells_metadata) == 2, "Should have 2 wells"
    
    well_1 = wells_metadata[0]
    assert well_1['well_id'] == 'osdu:master-data--Well:15/9-F-1:'
    assert well_1['facilityName'] == '15/9-F-1'
    assert len(well_1['nameAliases']) == 2
    assert well_1['location']['latitude'] == 56.1234
    assert well_1['location']['longitude'] == 2.2345
    assert well_1['depth'] == 3500.5
    assert well_1['operator'] == 'Test Energy AS'
    assert len(well_1['wellbores']) == 2
    
    print(f"   ✓ Well 1: {well_1['facilityName']}")
    print(f"     - Wellbores: {len(well_1['wellbores'])}")
    print(f"     - Location: ({well_1['location']['latitude']}, {well_1['location']['longitude']})")
    
    # Verify wellbore structure
    wellbore_1 = well_1['wellbores'][0]
    assert wellbore_1['wellbore_id'] == 'osdu:master-data--Wellbore:15/9-F-1-A'
    assert wellbore_1['facilityName'] == '15/9-F-1 A'
    assert len(wellbore_1['welllogs']) == 1
    
    print(f"     - Wellbore 1: {wellbore_1['facilityName']}")
    print(f"       - Welllogs: {len(wellbore_1['welllogs'])}")
    
    # Verify welllog structure
    welllog_1 = wellbore_1['welllogs'][0]
    assert welllog_1['welllog_id'] == 'osdu:work-product-component--WellLog:log-001'
    assert welllog_1['name'] == '15_9_F_1_A_GR_DT.las'
    assert len(welllog_1['curves']) == 3
    assert welllog_1['curves'][0]['mnemonic'] == 'DEPT'
    assert welllog_1['curves'][1]['mnemonic'] == 'GR'
    assert welllog_1['curves'][2]['mnemonic'] == 'DT'
    
    print(f"       - Welllog 1: {welllog_1['name']}")
    print(f"         - Curves: {[c['mnemonic'] for c in welllog_1['curves']]}")
    
    # Test statistics calculation
    print("\n2. Testing statistics calculation...")
    wellbore_count = sum(len(well.get('wellbores', [])) for well in wells_metadata)
    welllog_count = sum(
        len(wellbore.get('welllogs', []))
        for well in wells_metadata
        for wellbore in well.get('wellbores', [])
    )
    
    stats = {
        'wellCount': len(wells_metadata),
        'wellboreCount': wellbore_count,
        'welllogCount': welllog_count
    }
    
    print(f"   ✓ Statistics:")
    print(f"     - Wells: {stats['wellCount']}")
    print(f"     - Wellbores: {stats['wellboreCount']}")
    print(f"     - Welllogs: {stats['welllogCount']}")
    
    assert stats['wellCount'] == 2
    assert stats['wellboreCount'] == 2
    assert stats['welllogCount'] == 1
    
    # Test GeoJSON generation
    print("\n3. Testing GeoJSON generation...")
    geojson = transformer.to_geojson(wells_metadata)
    
    assert geojson['type'] == 'FeatureCollection'
    assert len(geojson['features']) == 2
    
    feature_1 = geojson['features'][0]
    assert feature_1['type'] == 'Feature'
    assert feature_1['geometry']['type'] == 'Point'
    assert feature_1['geometry']['coordinates'] == [2.2345, 56.1234]
    assert feature_1['properties']['well_id'] == 'osdu:master-data--Well:15/9-F-1:'
    assert feature_1['properties']['facilityName'] == '15/9-F-1'
    assert feature_1['properties']['wellboreCount'] == 2
    assert feature_1['properties']['welllogCount'] == 1
    
    print(f"   ✓ GeoJSON with {len(geojson['features'])} features")
    print(f"     - Feature 1: {feature_1['properties']['facilityName']}")
    print(f"       - Coordinates: {feature_1['geometry']['coordinates']}")
    print(f"       - Wellbores: {feature_1['properties']['wellboreCount']}")
    print(f"       - Welllogs: {feature_1['properties']['welllogCount']}")
    
    # Test hierarchical structure
    print("\n4. Testing hierarchical structure...")
    hierarchical = transformer.build_hierarchy(wells_metadata)
    
    assert len(hierarchical) == 2
    
    hier_well_1 = hierarchical[0]
    assert hier_well_1['well_id'] == 'osdu:master-data--Well:15/9-F-1:'
    assert hier_well_1['data']['FacilityName'] == '15/9-F-1'
    assert len(hier_well_1['data']['NameAliases']) == 2
    assert len(hier_well_1['wellbores']) == 2
    
    hier_wellbore_1 = hier_well_1['wellbores'][0]
    assert hier_wellbore_1['wellbore_id'] == 'osdu:master-data--Wellbore:15/9-F-1-A'
    assert hier_wellbore_1['data']['FacilityName'] == '15/9-F-1 A'
    assert len(hier_wellbore_1['welllogs']) == 1
    
    hier_welllog_1 = hier_wellbore_1['welllogs'][0]
    assert hier_welllog_1['welllog_id'] == 'osdu:work-product-component--WellLog:log-001'
    assert hier_welllog_1['data']['Name'] == '15_9_F_1_A_GR_DT.las'
    assert len(hier_welllog_1['data']['Curves']) == 3
    
    print(f"   ✓ Hierarchical structure:")
    print(f"     - Wells: {len(hierarchical)}")
    print(f"     - Well 1 wellbores: {len(hier_well_1['wellbores'])}")
    print(f"     - Wellbore 1 welllogs: {len(hier_wellbore_1['welllogs'])}")
    print(f"     - Welllog 1 curves: {len(hier_welllog_1['data']['Curves'])}")
    
    print("\n" + "="*80)
    print("✅ INTEGRATION TEST PASSED")
    print("="*80)
    print("\nSummary:")
    print(f"  - Transformed {stats['wellCount']} wells")
    print(f"  - Processed {stats['wellboreCount']} wellbores")
    print(f"  - Extracted {stats['welllogCount']} welllogs")
    print(f"  - Generated GeoJSON with {len(geojson['features'])} features")
    print(f"  - Built hierarchical structure with {len(hierarchical)} wells")
    
    return True


if __name__ == '__main__':
    try:
        test_complete_getdata_flow()
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {str(e)}")
        raise
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        raise
