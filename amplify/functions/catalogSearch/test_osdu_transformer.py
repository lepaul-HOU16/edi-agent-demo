"""
Test OSDUDataTransformer with actual OSDU API response format
"""

import json
from osdu_data_transformer import OSDUDataTransformer


def test_osdu_response_format():
    """Test transformer with actual OSDU search API response format."""
    
    # Sample OSDU response based on provided format
    osdu_response = [
        {
            "data": {
                "FacilityName": "Test Well 001",
                "NameAliases": [
                    {
                        "AliasName": "WELL-001",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:WELL_NAME:"
                    },
                    {
                        "AliasName": "DUMMY_UWI_WELL-001",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:UWI:"
                    }
                ],
                "SpatialLocation.Wgs84Coordinates": {
                    "geometries": [
                        {
                            "coordinates": [
                                114.454742,
                                10.46812
                            ],
                            "type": "point"
                        }
                    ],
                    "type": "geometrycollection"
                }
            },
            "id": "osdu:master-data--Well:fac2538fa7ec42e4bdf2ce807a56fdbd"
        },
        {
            "data": {
                "FacilityName": "Test Well 002",
                "NameAliases": [
                    {
                        "AliasName": "WELL-002",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:WELL_NAME:"
                    }
                ],
                "SpatialLocation.Wgs84Coordinates": {
                    "geometries": [
                        {
                            "coordinates": [
                                115.123456,
                                11.234567
                            ],
                            "type": "point"
                        }
                    ],
                    "type": "geometrycollection"
                }
            },
            "id": "osdu:master-data--Well:abc123def456"
        }
    ]
    
    # Initialize transformer
    transformer = OSDUDataTransformer()
    
    # Test transform_well_data
    print("Testing transform_well_data()...")
    metadata = transformer.transform_well_data(osdu_response)
    
    print(f"\n✅ Transformed {len(metadata)} wells")
    print(f"\nFirst well metadata:")
    print(json.dumps(metadata[0], indent=2))
    
    # Verify structure
    assert len(metadata) == 2, "Should have 2 wells"
    assert metadata[0]['well_id'] == "osdu:master-data--Well:fac2538fa7ec42e4bdf2ce807a56fdbd"
    assert metadata[0]['facilityName'] == "Test Well 001"
    assert len(metadata[0]['nameAliases']) == 2
    assert metadata[0]['nameAliases'][0] == "WELL-001"
    assert metadata[0]['nameAliases'][1] == "DUMMY_UWI_WELL-001"
    assert metadata[0]['location']['latitude'] == 10.46812
    assert metadata[0]['location']['longitude'] == 114.454742
    
    print("\n✅ All metadata assertions passed")
    
    # Test to_geojson
    print("\nTesting to_geojson()...")
    geojson = transformer.to_geojson(metadata)
    
    print(f"\n✅ Created GeoJSON with {len(geojson['features'])} features")
    print(f"\nFirst feature:")
    print(json.dumps(geojson['features'][0], indent=2))
    
    # Verify GeoJSON structure
    assert geojson['type'] == 'FeatureCollection'
    assert len(geojson['features']) == 2
    assert geojson['features'][0]['type'] == 'Feature'
    assert geojson['features'][0]['geometry']['type'] == 'Point'
    assert geojson['features'][0]['geometry']['coordinates'] == [114.454742, 10.46812]
    assert geojson['features'][0]['properties']['facilityName'] == "Test Well 001"
    assert geojson['features'][0]['properties']['wellboreCount'] == 0
    assert geojson['features'][0]['properties']['welllogCount'] == 0
    
    print("\n✅ All GeoJSON assertions passed")
    
    # Test build_hierarchy
    print("\nTesting build_hierarchy()...")
    hierarchy = transformer.build_hierarchy(metadata)
    
    print(f"\n✅ Built hierarchy for {len(hierarchy)} wells")
    print(f"\nFirst hierarchical well:")
    print(json.dumps(hierarchy[0], indent=2))
    
    # Verify hierarchy structure
    assert len(hierarchy) == 2
    assert hierarchy[0]['well_id'] == "osdu:master-data--Well:fac2538fa7ec42e4bdf2ce807a56fdbd"
    assert hierarchy[0]['data']['FacilityName'] == "Test Well 001"
    assert hierarchy[0]['data']['NameAliases'] == ["WELL-001", "DUMMY_UWI_WELL-001"]
    assert 'SpatialLocation.Wgs84Coordinates' in hierarchy[0]['data']
    assert hierarchy[0]['data']['SpatialLocation.Wgs84Coordinates']['type'] == 'geometrycollection'
    assert len(hierarchy[0]['data']['SpatialLocation.Wgs84Coordinates']['geometries']) == 1
    assert hierarchy[0]['data']['SpatialLocation.Wgs84Coordinates']['geometries'][0]['coordinates'] == [114.454742, 10.46812]
    
    print("\n✅ All hierarchy assertions passed")
    
    print("\n" + "="*50)
    print("✅ ALL TESTS PASSED!")
    print("="*50)


def test_wellbore_parsing():
    """Test parsing standalone wellbore records."""
    
    print("\n" + "="*50)
    print("Testing Wellbore Parsing")
    print("="*50)
    
    # Sample OSDU wellbore response
    osdu_wellbore_response = [
        {
            "data": {
                "NameAliases": [
                    {
                        "AliasName": "NPD-7405",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:UWBI:"
                    }
                ],
                "FacilityName": "15/9-F-1 C",
                "WellID": "osdu:master-data--Well:15%2F9-F-1:"
            },
            "id": "osdu:master-data--Wellbore:NPD-7405"
        },
        {
            "data": {
                "NameAliases": [
                    {
                        "AliasName": "NPD-7406",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:UWBI:"
                    },
                    {
                        "AliasName": "WELLBORE-002-A",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:WELLBORE_NAME:"
                    }
                ],
                "FacilityName": "15/9-F-2 A",
                "WellID": "osdu:master-data--Well:15%2F9-F-2:"
            },
            "id": "osdu:master-data--Wellbore:NPD-7406"
        }
    ]
    
    transformer = OSDUDataTransformer()
    
    # Parse wellbores directly
    print("\nParsing wellbore records...")
    wellbores = []
    for wb_record in osdu_wellbore_response:
        wellbore = transformer._parse_osdu_wellbore(wb_record)
        if wellbore:
            wellbores.append(wellbore)
    
    print(f"\n✅ Parsed {len(wellbores)} wellbores")
    print(f"\nFirst wellbore:")
    print(json.dumps(wellbores[0], indent=2))
    
    # Verify structure (IDs should be normalized without trailing colons)
    assert len(wellbores) == 2
    assert wellbores[0]['wellbore_id'] == "osdu:master-data--Wellbore:NPD-7405"
    assert wellbores[0]['well_id'] == "osdu:master-data--Well:15%2F9-F-1"  # Normalized (no trailing colon)
    assert wellbores[0]['facilityName'] == "15/9-F-1 C"
    assert wellbores[0]['nameAliases'] == ["NPD-7405"]
    assert wellbores[0]['welllogs'] == []
    
    assert wellbores[1]['wellbore_id'] == "osdu:master-data--Wellbore:NPD-7406"
    assert wellbores[1]['well_id'] == "osdu:master-data--Well:15%2F9-F-2"  # Normalized (no trailing colon)
    assert wellbores[1]['facilityName'] == "15/9-F-2 A"
    assert wellbores[1]['nameAliases'] == ["NPD-7406", "WELLBORE-002-A"]
    
    print("\n✅ All wellbore assertions passed")
    
    print("\n" + "="*50)
    print("✅ WELLBORE TESTS PASSED!")
    print("="*50)


def test_welllog_parsing():
    """Test parsing standalone welllog records."""
    
    print("\n" + "="*50)
    print("Testing Welllog Parsing")
    print("="*50)
    
    # Sample OSDU welllog response
    osdu_welllog_response = [
        {
            "data": {
                "WellboreID": "osdu:master-data--Wellbore:1574:",
                "Datasets": [
                    "osdu:dataset--File.Generic:323844bfcd221e5410307a2110aaefcb496e494265c36137b60c3ac566584592"
                ],
                "Name": "1574_lrm02_1974_comp.las",
                "Curves": [
                    {
                        "NumberOfColumns": 1,
                        "Mnemonic": "DEPT",
                        "BaseDepth": 3015.9004,
                        "TopDepth": 2655.4002,
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:M:"
                    },
                    {
                        "NumberOfColumns": 1,
                        "Mnemonic": "GR",
                        "BaseDepth": 3015.9004,
                        "TopDepth": 2655.9002,
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:GAPI:"
                    },
                    {
                        "NumberOfColumns": 1,
                        "Mnemonic": "DT",
                        "BaseDepth": 3013.6004,
                        "TopDepth": 2756.4004,
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:US%2FF:"
                    },
                    {
                        "NumberOfColumns": 1,
                        "Mnemonic": "RHOB",
                        "BaseDepth": 3015.7004,
                        "TopDepth": 2756.1004,
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:G%2FC3:"
                    },
                    {
                        "NumberOfColumns": 1,
                        "Mnemonic": "DRHO",
                        "BaseDepth": 3015.9004,
                        "TopDepth": 2756.0004,
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:G%2FC3:"
                    }
                ]
            },
            "id": "osdu:work-product-component--WellLog:ffc3294b3b5c87ad7323e1e1c0112815ea1300f504a0b6643f398afdc1e19d3e"
        },
        {
            "data": {
                "WellboreID": "osdu:master-data--Wellbore:1575:",
                "Datasets": [
                    "osdu:dataset--File.Generic:abc123"
                ],
                "Name": "test_welllog_002.las",
                "Curves": [
                    {
                        "Mnemonic": "DEPT",
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:M:"
                    },
                    {
                        "Mnemonic": "CALI",
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:IN:"
                    }
                ]
            },
            "id": "osdu:work-product-component--WellLog:abc123def456"
        }
    ]
    
    transformer = OSDUDataTransformer()
    
    # Parse welllogs directly
    print("\nParsing welllog records...")
    welllogs = []
    for wl_record in osdu_welllog_response:
        welllog = transformer._parse_osdu_welllog(wl_record)
        if welllog:
            welllogs.append(welllog)
    
    print(f"\n✅ Parsed {len(welllogs)} welllogs")
    print(f"\nFirst welllog:")
    print(json.dumps(welllogs[0], indent=2))
    
    # Verify structure (IDs should be normalized without trailing colons)
    assert len(welllogs) == 2
    assert welllogs[0]['welllog_id'] == "osdu:work-product-component--WellLog:ffc3294b3b5c87ad7323e1e1c0112815ea1300f504a0b6643f398afdc1e19d3e"
    assert welllogs[0]['wellbore_id'] == "osdu:master-data--Wellbore:1574"  # Normalized (no trailing colon)
    assert welllogs[0]['name'] == "1574_lrm02_1974_comp.las"
    assert len(welllogs[0]['datasets']) == 1
    assert welllogs[0]['datasets'][0] == "osdu:dataset--File.Generic:323844bfcd221e5410307a2110aaefcb496e494265c36137b60c3ac566584592"
    assert len(welllogs[0]['curves']) == 5
    
    # Check curve structure
    curve_mnemonics = [curve['mnemonic'] for curve in welllogs[0]['curves']]
    assert curve_mnemonics == ["DEPT", "GR", "DT", "RHOB", "DRHO"]
    
    # Check that additional curve metadata is captured
    assert 'unit' in welllogs[0]['curves'][0]
    assert 'topDepth' in welllogs[0]['curves'][0]
    assert 'baseDepth' in welllogs[0]['curves'][0]
    assert welllogs[0]['curves'][0]['unit'] == "osdu:reference-data--UnitOfMeasure:M:"
    
    # Check second welllog
    assert welllogs[1]['welllog_id'] == "osdu:work-product-component--WellLog:abc123def456"
    assert welllogs[1]['wellbore_id'] == "osdu:master-data--Wellbore:1575"  # Normalized (no trailing colon)
    assert welllogs[1]['name'] == "test_welllog_002.las"
    assert len(welllogs[1]['curves']) == 2
    
    print("\n✅ All welllog assertions passed")
    
    print("\n" + "="*50)
    print("✅ WELLLOG TESTS PASSED!")
    print("="*50)


def test_complete_hierarchy_with_welllogs():
    """Test complete hierarchy with wells, wellbores, and welllogs."""
    
    print("\n" + "="*50)
    print("Testing Complete Hierarchy with Welllogs")
    print("="*50)
    
    # Create a complete well with wellbores and welllogs
    transformer = OSDUDataTransformer()
    
    # Manually construct metadata with nested structure
    metadata = [
        {
            'well_id': 'osdu:master-data--Well:well001',
            'name': 'Test Well 001',
            'facilityName': 'Test Well 001',
            'nameAliases': ['WELL-001'],
            'location': {'latitude': 10.5, 'longitude': 114.5},
            'category': 'search_result',
            'type': 'exploration',
            'wellbores': [
                {
                    'wellbore_id': 'osdu:master-data--Wellbore:wb001',
                    'facilityName': 'Wellbore 001-A',
                    'nameAliases': ['WB-001-A'],
                    'welllogs': [
                        {
                            'welllog_id': 'osdu:work-product-component--WellLog:wl001',
                            'name': 'test_log_001.las',
                            'datasets': ['osdu:dataset--File.Generic:ds001'],
                            'curves': [
                                {'mnemonic': 'DEPT', 'unit': 'M'},
                                {'mnemonic': 'GR', 'unit': 'GAPI'},
                                {'mnemonic': 'RHOB', 'unit': 'G/C3'}
                            ]
                        }
                    ]
                }
            ]
        }
    ]
    
    # Build hierarchy
    print("\nBuilding hierarchy with welllogs...")
    hierarchy = transformer.build_hierarchy(metadata)
    
    print(f"\n✅ Built hierarchy for {len(hierarchy)} wells")
    print(f"\nComplete hierarchical structure:")
    print(json.dumps(hierarchy[0], indent=2))
    
    # Verify complete structure
    assert len(hierarchy) == 1
    assert hierarchy[0]['well_id'] == 'osdu:master-data--Well:well001'
    assert len(hierarchy[0]['wellbores']) == 1
    assert hierarchy[0]['wellbores'][0]['wellbore_id'] == 'osdu:master-data--Wellbore:wb001'
    assert len(hierarchy[0]['wellbores'][0]['welllogs']) == 1
    
    welllog = hierarchy[0]['wellbores'][0]['welllogs'][0]
    assert welllog['welllog_id'] == 'osdu:work-product-component--WellLog:wl001'
    assert welllog['data']['Name'] == 'test_log_001.las'
    assert len(welllog['data']['Curves']) == 3
    assert welllog['data']['Curves'][0]['Mnemonic'] == 'DEPT'
    assert welllog['data']['Curves'][1]['Mnemonic'] == 'GR'
    assert welllog['data']['Curves'][2]['Mnemonic'] == 'RHOB'
    
    print("\n✅ All complete hierarchy assertions passed")
    
    print("\n" + "="*50)
    print("✅ COMPLETE HIERARCHY TESTS PASSED!")
    print("="*50)


def test_linking_welllogs_to_wellbores():
    """Test linking welllogs to wellbores using WellboreID."""
    
    print("\n" + "="*50)
    print("Testing Linking Welllogs to Wellbores")
    print("="*50)
    
    transformer = OSDUDataTransformer()
    
    # Create wellbores (IDs normalized without trailing colons)
    wellbores = [
        {
            'wellbore_id': 'osdu:master-data--Wellbore:1574',
            'facilityName': 'Wellbore 1574',
            'nameAliases': ['WB-1574'],
            'welllogs': []
        },
        {
            'wellbore_id': 'osdu:master-data--Wellbore:1575',
            'facilityName': 'Wellbore 1575',
            'nameAliases': ['WB-1575'],
            'welllogs': []
        }
    ]
    
    # Create welllogs with wellbore_id references (IDs normalized without trailing colons)
    welllogs = [
        {
            'welllog_id': 'osdu:work-product-component--WellLog:log001',
            'wellbore_id': 'osdu:master-data--Wellbore:1574',
            'name': 'log_1574_001.las',
            'datasets': ['ds001'],
            'curves': [{'mnemonic': 'GR'}]
        },
        {
            'welllog_id': 'osdu:work-product-component--WellLog:log002',
            'wellbore_id': 'osdu:master-data--Wellbore:1574',
            'name': 'log_1574_002.las',
            'datasets': ['ds002'],
            'curves': [{'mnemonic': 'RHOB'}]
        },
        {
            'welllog_id': 'osdu:work-product-component--WellLog:log003',
            'wellbore_id': 'osdu:master-data--Wellbore:1575',
            'name': 'log_1575_001.las',
            'datasets': ['ds003'],
            'curves': [{'mnemonic': 'DT'}]
        }
    ]
    
    # Link welllogs to wellbores
    print("\nLinking welllogs to wellbores...")
    linked_wellbores = transformer.link_welllogs_to_wellbores(wellbores, welllogs)
    
    print(f"\n✅ Linked wellbores:")
    for wb in linked_wellbores:
        print(f"  - {wb['wellbore_id']}: {len(wb['welllogs'])} welllogs")
    
    # Verify linking (IDs normalized)
    assert len(linked_wellbores) == 2
    assert len(linked_wellbores[0]['welllogs']) == 2  # Wellbore 1574 has 2 welllogs
    assert len(linked_wellbores[1]['welllogs']) == 1  # Wellbore 1575 has 1 welllog
    
    # Verify wellbore_id was removed from nested welllogs
    assert 'wellbore_id' not in linked_wellbores[0]['welllogs'][0]
    assert 'wellbore_id' not in linked_wellbores[0]['welllogs'][1]
    assert 'wellbore_id' not in linked_wellbores[1]['welllogs'][0]
    
    # Verify correct welllogs are under correct wellbores
    assert linked_wellbores[0]['welllogs'][0]['welllog_id'] == 'osdu:work-product-component--WellLog:log001'
    assert linked_wellbores[0]['welllogs'][1]['welllog_id'] == 'osdu:work-product-component--WellLog:log002'
    assert linked_wellbores[1]['welllogs'][0]['welllog_id'] == 'osdu:work-product-component--WellLog:log003'
    
    print("\n✅ All linking assertions passed")
    
    print("\n" + "="*50)
    print("✅ LINKING TESTS PASSED!")
    print("="*50)


def test_linking_wellbores_to_wells():
    """Test linking wellbores to wells using WellID."""
    
    print("\n" + "="*50)
    print("Testing Linking Wellbores to Wells")
    print("="*50)
    
    transformer = OSDUDataTransformer()
    
    # Create wells (IDs normalized without trailing colons)
    wells = [
        {
            'well_id': 'osdu:master-data--Well:15%2F9-F-1',
            'name': 'Well 15/9-F-1',
            'facilityName': 'Well 15/9-F-1',
            'nameAliases': ['WELL-F-1'],
            'location': {'latitude': 58.5, 'longitude': 2.5},
            'category': 'search_result',
            'wellbores': []
        },
        {
            'well_id': 'osdu:master-data--Well:15%2F9-F-2',
            'name': 'Well 15/9-F-2',
            'facilityName': 'Well 15/9-F-2',
            'nameAliases': ['WELL-F-2'],
            'location': {'latitude': 58.6, 'longitude': 2.6},
            'category': 'search_result',
            'wellbores': []
        }
    ]
    
    # Create wellbores with well_id references (IDs normalized without trailing colons)
    wellbores = [
        {
            'wellbore_id': 'osdu:master-data--Wellbore:NPD-7405',
            'well_id': 'osdu:master-data--Well:15%2F9-F-1',
            'facilityName': '15/9-F-1 C',
            'nameAliases': ['NPD-7405'],
            'welllogs': []
        },
        {
            'wellbore_id': 'osdu:master-data--Wellbore:NPD-7406',
            'well_id': 'osdu:master-data--Well:15%2F9-F-1',
            'facilityName': '15/9-F-1 A',
            'nameAliases': ['NPD-7406'],
            'welllogs': []
        },
        {
            'wellbore_id': 'osdu:master-data--Wellbore:NPD-7407',
            'well_id': 'osdu:master-data--Well:15%2F9-F-2',
            'facilityName': '15/9-F-2 A',
            'nameAliases': ['NPD-7407'],
            'welllogs': []
        }
    ]
    
    # Link wellbores to wells
    print("\nLinking wellbores to wells...")
    linked_wells = transformer.link_wellbores_to_wells(wells, wellbores)
    
    print(f"\n✅ Linked wells:")
    for well in linked_wells:
        print(f"  - {well['well_id']}: {len(well['wellbores'])} wellbores")
    
    # Verify linking (IDs normalized)
    assert len(linked_wells) == 2
    assert len(linked_wells[0]['wellbores']) == 2  # Well 15/9-F-1 has 2 wellbores
    assert len(linked_wells[1]['wellbores']) == 1  # Well 15/9-F-2 has 1 wellbore
    
    # Verify well_id was removed from nested wellbores
    assert 'well_id' not in linked_wells[0]['wellbores'][0]
    assert 'well_id' not in linked_wells[0]['wellbores'][1]
    assert 'well_id' not in linked_wells[1]['wellbores'][0]
    
    # Verify correct wellbores are under correct wells
    assert linked_wells[0]['wellbores'][0]['wellbore_id'] == 'osdu:master-data--Wellbore:NPD-7405'
    assert linked_wells[0]['wellbores'][1]['wellbore_id'] == 'osdu:master-data--Wellbore:NPD-7406'
    assert linked_wells[1]['wellbores'][0]['wellbore_id'] == 'osdu:master-data--Wellbore:NPD-7407'
    
    print("\n✅ All wellbore-to-well linking assertions passed")
    
    print("\n" + "="*50)
    print("✅ WELLBORE-TO-WELL LINKING TESTS PASSED!")
    print("="*50)


def test_complete_linking_workflow():
    """Test complete workflow: wells + wellbores + welllogs all linked together."""
    
    print("\n" + "="*50)
    print("Testing Complete Linking Workflow")
    print("="*50)
    
    transformer = OSDUDataTransformer()
    
    # Simulate separate OSDU API queries
    
    # 1. Wells from well query
    wells = [
        {
            'well_id': 'osdu:master-data--Well:well001',
            'name': 'Test Well 001',
            'facilityName': 'Test Well 001',
            'nameAliases': ['WELL-001'],
            'location': {'latitude': 10.5, 'longitude': 114.5},
            'category': 'search_result',
            'wellbores': []
        }
    ]
    
    # 2. Wellbores from wellbore query (with WellID)
    wellbores = [
        {
            'wellbore_id': 'osdu:master-data--Wellbore:wb001',
            'well_id': 'osdu:master-data--Well:well001',
            'facilityName': 'Wellbore 001-A',
            'nameAliases': ['WB-001-A'],
            'welllogs': []
        },
        {
            'wellbore_id': 'osdu:master-data--Wellbore:wb002',
            'well_id': 'osdu:master-data--Well:well001',
            'facilityName': 'Wellbore 001-B',
            'nameAliases': ['WB-001-B'],
            'welllogs': []
        }
    ]
    
    # 3. Welllogs from welllog query (with WellboreID)
    welllogs = [
        {
            'welllog_id': 'osdu:work-product-component--WellLog:wl001',
            'wellbore_id': 'osdu:master-data--Wellbore:wb001',
            'name': 'log_001.las',
            'datasets': ['ds001'],
            'curves': [{'mnemonic': 'GR'}, {'mnemonic': 'RHOB'}]
        },
        {
            'welllog_id': 'osdu:work-product-component--WellLog:wl002',
            'wellbore_id': 'osdu:master-data--Wellbore:wb002',
            'name': 'log_002.las',
            'datasets': ['ds002'],
            'curves': [{'mnemonic': 'DT'}]
        }
    ]
    
    # Link in order: welllogs → wellbores → wells
    print("\nStep 1: Linking welllogs to wellbores...")
    wellbores_with_logs = transformer.link_welllogs_to_wellbores(wellbores, welllogs)
    
    print("Step 2: Linking wellbores to wells...")
    complete_wells = transformer.link_wellbores_to_wells(wells, wellbores_with_logs)
    
    print("\n✅ Complete hierarchy created")
    print(f"\nComplete structure:")
    print(json.dumps(complete_wells[0], indent=2))
    
    # Verify complete structure
    assert len(complete_wells) == 1
    assert len(complete_wells[0]['wellbores']) == 2
    assert len(complete_wells[0]['wellbores'][0]['welllogs']) == 1
    assert len(complete_wells[0]['wellbores'][1]['welllogs']) == 1
    
    # Verify IDs are correct
    assert complete_wells[0]['well_id'] == 'osdu:master-data--Well:well001'
    assert complete_wells[0]['wellbores'][0]['wellbore_id'] == 'osdu:master-data--Wellbore:wb001'
    assert complete_wells[0]['wellbores'][0]['welllogs'][0]['welllog_id'] == 'osdu:work-product-component--WellLog:wl001'
    assert complete_wells[0]['wellbores'][1]['wellbore_id'] == 'osdu:master-data--Wellbore:wb002'
    assert complete_wells[0]['wellbores'][1]['welllogs'][0]['welllog_id'] == 'osdu:work-product-component--WellLog:wl002'
    
    # Verify linking IDs were removed
    assert 'well_id' not in complete_wells[0]['wellbores'][0]
    assert 'wellbore_id' not in complete_wells[0]['wellbores'][0]['welllogs'][0]
    
    print("\n✅ All complete workflow assertions passed")
    
    print("\n" + "="*50)
    print("✅ COMPLETE WORKFLOW TESTS PASSED!")
    print("="*50)


def test_id_normalization():
    """Test that trailing colons are removed from IDs for consistent linking."""
    
    print("\n" + "="*50)
    print("Testing ID Normalization")
    print("="*50)
    
    transformer = OSDUDataTransformer()
    
    # Test normalize_id function
    print("\nTesting normalize_id()...")
    assert transformer.normalize_id("osdu:master-data--Well:1015:") == "osdu:master-data--Well:1015"
    assert transformer.normalize_id("osdu:master-data--Well:1015") == "osdu:master-data--Well:1015"
    assert transformer.normalize_id("osdu:master-data--Wellbore:1014:") == "osdu:master-data--Wellbore:1014"
    assert transformer.normalize_id("") == ""
    print("✅ normalize_id() works correctly")
    
    # Test with actual OSDU data that has inconsistent trailing colons
    wells_with_trailing_colon = [
        {
            "id": "osdu:master-data--Well:1015:",  # Has trailing colon
            "data": {
                "FacilityName": "Well 1015",
                "NameAliases": [{"AliasName": "WELL-1015"}],
                "SpatialLocation.Wgs84Coordinates": {
                    "geometries": [{"coordinates": [114.5, 10.5], "type": "point"}],
                    "type": "geometrycollection"
                }
            }
        }
    ]
    
    wellbores_with_trailing_colon = [
        {
            "id": "osdu:master-data--Wellbore:wb1015:",  # Has trailing colon
            "data": {
                "FacilityName": "Wellbore 1015-A",
                "WellID": "osdu:master-data--Well:1015:",  # Has trailing colon
                "NameAliases": [{"AliasName": "WB-1015-A"}]
            }
        }
    ]
    
    welllogs_with_trailing_colon = [
        {
            "id": "osdu:work-product-component--WellLog:wl1015:",  # Has trailing colon
            "data": {
                "Name": "log_1015.las",
                "WellboreID": "osdu:master-data--Wellbore:wb1015:",  # Has trailing colon
                "Datasets": ["ds001"],
                "Curves": [{"Mnemonic": "GR"}]
            }
        }
    ]
    
    # Transform data
    print("\nTransforming data with trailing colons...")
    wells = transformer.transform_well_data(wells_with_trailing_colon)
    wellbores = [transformer._parse_osdu_wellbore(wb) for wb in wellbores_with_trailing_colon]
    wellbores = [wb for wb in wellbores if wb]
    welllogs = [transformer._parse_osdu_welllog(wl) for wl in welllogs_with_trailing_colon]
    welllogs = [wl for wl in welllogs if wl]
    
    # Verify IDs are normalized (no trailing colons)
    print("\nVerifying normalized IDs...")
    assert wells[0]['well_id'] == "osdu:master-data--Well:1015"  # No trailing colon
    assert wellbores[0]['wellbore_id'] == "osdu:master-data--Wellbore:wb1015"  # No trailing colon
    assert wellbores[0]['well_id'] == "osdu:master-data--Well:1015"  # No trailing colon
    assert welllogs[0]['welllog_id'] == "osdu:work-product-component--WellLog:wl1015"  # No trailing colon
    assert welllogs[0]['wellbore_id'] == "osdu:master-data--Wellbore:wb1015"  # No trailing colon
    print("✅ All IDs normalized correctly")
    
    # Test linking with normalized IDs
    print("\nTesting linking with normalized IDs...")
    wellbores_linked = transformer.link_welllogs_to_wellbores(wellbores, welllogs)
    wells_linked = transformer.link_wellbores_to_wells(wells, wellbores_linked)
    
    # Verify linking worked
    assert len(wells_linked[0]['wellbores']) == 1
    assert len(wells_linked[0]['wellbores'][0]['welllogs']) == 1
    assert wells_linked[0]['wellbores'][0]['wellbore_id'] == "osdu:master-data--Wellbore:wb1015"
    assert wells_linked[0]['wellbores'][0]['welllogs'][0]['welllog_id'] == "osdu:work-product-component--WellLog:wl1015"
    print("✅ Linking works correctly with normalized IDs")
    
    print("\n" + "="*50)
    print("✅ ID NORMALIZATION TESTS PASSED!")
    print("="*50)


if __name__ == '__main__':
    test_osdu_response_format()
    test_wellbore_parsing()
    test_welllog_parsing()
    test_complete_hierarchy_with_welllogs()
    test_linking_welllogs_to_wellbores()
    test_linking_wellbores_to_wells()
    test_complete_linking_workflow()
    test_id_normalization()
