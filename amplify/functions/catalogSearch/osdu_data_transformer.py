"""
OSDU Data Transformer
Transforms OSDU API responses to application metadata format.

Responsibilities:
- Parse OSDU well/wellbore/welllog responses
- Build hierarchical data structure (wells → wellbores → welllogs)
- Extract spatial coordinates from OSDU location data
- Convert OSDU data to GeoJSON format
"""

import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger()


class OSDUDataTransformer:
    """
    OSDUDataTransformer - Transform OSDU API responses to application format
    
    Transforms OSDU data structures to:
    1. WellMetadata format for hierarchical display
    2. GeoJSON format for map visualization
    3. Hierarchical structure matching example_well_metadata_hierarchy.json
    """
    
    def __init__(self):
        """Initialize the transformer."""
        pass
    
    @staticmethod
    def normalize_id(osdu_id: str) -> str:
        """
        Normalize OSDU ID by removing trailing colon.
        
        OSDU is inconsistent with trailing colons in IDs:
        - Some IDs: "osdu:master-data--Well:1015:" (with colon)
        - Some IDs: "osdu:master-data--Well:1015" (without colon)
        
        This causes linking failures. We normalize by removing trailing colons.
        
        Args:
            osdu_id: OSDU ID string
            
        Returns:
            Normalized ID without trailing colon
            
        Examples:
            >>> normalize_id("osdu:master-data--Well:1015:")
            "osdu:master-data--Well:1015"
            >>> normalize_id("osdu:master-data--Well:1015")
            "osdu:master-data--Well:1015"
        """
        if not osdu_id:
            return osdu_id
        return osdu_id.rstrip(':')
    
    def transform_well_data(self, osdu_response: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Transform OSDU API response to WellMetadata format.
        
        Parses OSDU well records and builds the application's metadata structure
        with wells, wellbores, and welllogs hierarchy.
        
        Args:
            osdu_response: List of OSDU well records from API
            
        Returns:
            List of WellMetadata dictionaries with structure:
            {
                'well_id': str,
                'name': str,
                'facilityName': str,
                'nameAliases': List[str],
                'location': {
                    'latitude': float,
                    'longitude': float
                },
                'depth': Optional[float],
                'operator': Optional[str],
                'type': Optional[str],
                'category': 'personal' | 'search_result',
                'wellbores': List[WellboreMetadata]
            }
        """
        logger.info(f"Transforming {len(osdu_response)} OSDU well records to WellMetadata format")
        
        wells_metadata = []
        
        for osdu_well in osdu_response:
            try:
                # Extract well data from OSDU format
                well_metadata = self._parse_osdu_well(osdu_well)
                
                if well_metadata:
                    wells_metadata.append(well_metadata)
                    
            except Exception as e:
                logger.error(f"Error transforming well {osdu_well.get('id', 'unknown')}: {str(e)}")
                continue
        
        logger.info(f"Successfully transformed {len(wells_metadata)} wells")
        return wells_metadata
    
    def _parse_osdu_well(self, osdu_well: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse a single OSDU well record.
        
        Args:
            osdu_well: OSDU well record from search API
            
        Returns:
            WellMetadata dictionary or None if parsing fails
        """
        try:
            # Extract well ID and normalize (remove trailing colon)
            well_id = self.normalize_id(osdu_well.get('id', ''))
            if not well_id:
                logger.warning("Well missing ID, skipping")
                return None
            
            # Extract data section (OSDU has data nested in 'data' field)
            data = osdu_well.get('data', {})
            if not data:
                logger.warning(f"Well {well_id} missing data section, skipping")
                return None
            
            # Extract facility name
            facility_name = data.get('FacilityName', '')
            
            # Extract name aliases - OSDU format is array of objects with AliasName
            name_aliases_raw = data.get('NameAliases', [])
            name_aliases = []
            
            if isinstance(name_aliases_raw, list):
                for alias in name_aliases_raw:
                    if isinstance(alias, dict):
                        alias_name = alias.get('AliasName', '')
                        if alias_name:
                            name_aliases.append(alias_name)
                    elif isinstance(alias, str):
                        name_aliases.append(alias)
            elif isinstance(name_aliases_raw, str):
                name_aliases = [name_aliases_raw]
            
            # Use first alias as name if FacilityName is empty
            if not facility_name and name_aliases:
                facility_name = name_aliases[0]
            
            # Extract spatial location
            location = self._extract_location(data)
            if not location:
                logger.warning(f"Well {well_id} missing location, skipping")
                return None
            
            # Extract optional fields
            depth = self._extract_depth(data)
            operator = data.get('Operator', data.get('operator'))
            well_type = data.get('WellType', data.get('type', 'unknown'))
            
            # Determine category (default to 'search_result')
            category = data.get('category', 'search_result')
            
            # Extract wellbores (may be empty for well-level queries)
            wellbores = self._extract_wellbores(osdu_well)
            
            # Build well metadata
            well_metadata = {
                'well_id': well_id,
                'name': facility_name,
                'facilityName': facility_name,
                'nameAliases': name_aliases,
                'location': location,
                'category': category,
                'wellbores': wellbores
            }
            
            # Add optional fields if present
            if depth is not None:
                well_metadata['depth'] = depth
            if operator:
                well_metadata['operator'] = operator
            if well_type:
                well_metadata['type'] = well_type
            
            return well_metadata
            
        except Exception as e:
            logger.error(f"Error parsing OSDU well: {str(e)}", exc_info=True)
            return None
    
    def _extract_location(self, data: Dict[str, Any]) -> Optional[Dict[str, float]]:
        """
        Extract spatial coordinates from OSDU location data.
        
        OSDU stores location in SpatialLocation.Wgs84Coordinates with geometrycollection format:
        {
            "SpatialLocation.Wgs84Coordinates": {
                "geometries": [
                    {
                        "coordinates": [longitude, latitude],
                        "type": "point"
                    }
                ],
                "type": "geometrycollection"
            }
        }
        
        Args:
            data: OSDU data section
            
        Returns:
            Dictionary with latitude and longitude or None
        """
        try:
            # Try SpatialLocation.Wgs84Coordinates with geometrycollection format (OSDU standard)
            spatial_location_key = 'SpatialLocation.Wgs84Coordinates'
            wgs84_coords = data.get(spatial_location_key, {})
            
            if wgs84_coords and isinstance(wgs84_coords, dict):
                geometries = wgs84_coords.get('geometries', [])
                
                if geometries and len(geometries) > 0:
                    first_geometry = geometries[0]
                    coordinates = first_geometry.get('coordinates', [])
                    
                    if len(coordinates) >= 2:
                        # OSDU format: [longitude, latitude]
                        return {
                            'latitude': float(coordinates[1]),
                            'longitude': float(coordinates[0])
                        }
            
            # Fallback: Try nested SpatialLocation.Wgs84Coordinates
            spatial_location = data.get('SpatialLocation', {})
            wgs84_coords = spatial_location.get('Wgs84Coordinates', {})
            
            if wgs84_coords:
                # Try geometrycollection format
                geometries = wgs84_coords.get('geometries', [])
                if geometries and len(geometries) > 0:
                    first_geometry = geometries[0]
                    coordinates = first_geometry.get('coordinates', [])
                    
                    if len(coordinates) >= 2:
                        return {
                            'latitude': float(coordinates[1]),
                            'longitude': float(coordinates[0])
                        }
                
                # Try direct latitude/longitude
                latitude = wgs84_coords.get('latitude')
                longitude = wgs84_coords.get('longitude')
                
                if latitude is not None and longitude is not None:
                    return {
                        'latitude': float(latitude),
                        'longitude': float(longitude)
                    }
            
            # Try GeoLocation format
            geo_location = data.get('GeoLocation', {})
            if geo_location:
                latitude = geo_location.get('latitude')
                longitude = geo_location.get('longitude')
                
                if latitude is not None and longitude is not None:
                    return {
                        'latitude': float(latitude),
                        'longitude': float(longitude)
                    }
            
            # Try location.coordinates format [longitude, latitude]
            location = data.get('location', {})
            coordinates = location.get('coordinates', [])
            
            if len(coordinates) >= 2:
                return {
                    'latitude': float(coordinates[1]),
                    'longitude': float(coordinates[0])
                }
            
            # Try direct latitude/longitude fields
            if 'latitude' in data and 'longitude' in data:
                return {
                    'latitude': float(data['latitude']),
                    'longitude': float(data['longitude'])
                }
            
            return None
            
        except (ValueError, TypeError) as e:
            logger.error(f"Error extracting location: {str(e)}", exc_info=True)
            return None
    
    def _extract_depth(self, data: Dict[str, Any]) -> Optional[float]:
        """
        Extract well depth from OSDU data.
        
        Args:
            data: OSDU data section
            
        Returns:
            Depth in meters or None
        """
        try:
            # Try various depth field names
            depth_fields = [
                'TotalDepth',
                'total_depth',
                'depth',
                'Depth',
                'MeasuredDepth',
                'measured_depth'
            ]
            
            for field in depth_fields:
                depth = data.get(field)
                if depth is not None:
                    return float(depth)
            
            return None
            
        except (ValueError, TypeError):
            return None
    
    def _extract_wellbores(self, osdu_well: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract wellbores from OSDU well record.
        
        Args:
            osdu_well: OSDU well record
            
        Returns:
            List of wellbore metadata dictionaries
        """
        wellbores = []
        
        try:
            # OSDU may include wellbores in various ways:
            # 1. As nested 'wellbores' array
            # 2. As separate records linked by well_id
            # 3. As references that need separate API calls
            
            # Try nested wellbores array
            wellbores_data = osdu_well.get('wellbores', [])
            
            for wellbore_data in wellbores_data:
                wellbore = self._parse_osdu_wellbore(wellbore_data)
                if wellbore:
                    wellbores.append(wellbore)
            
        except Exception as e:
            logger.error(f"Error extracting wellbores: {str(e)}")
        
        return wellbores
    
    def _parse_osdu_wellbore(self, osdu_wellbore: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse a single OSDU wellbore record from search API.
        
        OSDU wellbore format:
        {
            "id": "osdu:master-data--Wellbore:NPD-7405",
            "data": {
                "FacilityName": "15/9-F-1 C",
                "WellID": "osdu:master-data--Well:15%2F9-F-1:",
                "NameAliases": [
                    {
                        "AliasName": "NPD-7405",
                        "AliasNameTypeID": "osdu:reference-data--AliasNameType:UWBI:"
                    }
                ]
            }
        }
        
        Args:
            osdu_wellbore: OSDU wellbore record
            
        Returns:
            Wellbore metadata dictionary or None
        """
        try:
            # Extract wellbore ID and normalize (remove trailing colon)
            wellbore_id = self.normalize_id(osdu_wellbore.get('id', ''))
            if not wellbore_id:
                return None
            
            data = osdu_wellbore.get('data', {})
            if not data:
                logger.warning(f"Wellbore {wellbore_id} missing data section")
                return None
            
            # Extract well ID (for linking wellbores to wells) and normalize
            well_id = self.normalize_id(data.get('WellID', ''))
            
            facility_name = data.get('FacilityName', '')
            
            # Extract name aliases - same format as wells
            name_aliases_raw = data.get('NameAliases', [])
            name_aliases = []
            
            if isinstance(name_aliases_raw, list):
                for alias in name_aliases_raw:
                    if isinstance(alias, dict):
                        alias_name = alias.get('AliasName', '')
                        if alias_name:
                            name_aliases.append(alias_name)
                    elif isinstance(alias, str):
                        name_aliases.append(alias)
            elif isinstance(name_aliases_raw, str):
                name_aliases = [name_aliases_raw]
            
            # Use first alias as name if FacilityName is empty
            if not facility_name and name_aliases:
                facility_name = name_aliases[0]
            
            # Extract welllogs (may be empty for wellbore-level queries)
            welllogs = self._extract_welllogs(osdu_wellbore)
            
            wellbore_metadata = {
                'wellbore_id': wellbore_id,
                'facilityName': facility_name,
                'nameAliases': name_aliases,
                'welllogs': welllogs
            }
            
            # Add well_id if present (for linking)
            if well_id:
                wellbore_metadata['well_id'] = well_id
            
            return wellbore_metadata
            
        except Exception as e:
            logger.error(f"Error parsing wellbore: {str(e)}", exc_info=True)
            return None
    
    def _extract_welllogs(self, osdu_wellbore: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract welllogs from OSDU wellbore record.
        
        Args:
            osdu_wellbore: OSDU wellbore record
            
        Returns:
            List of welllog metadata dictionaries
        """
        welllogs = []
        
        try:
            welllogs_data = osdu_wellbore.get('welllogs', [])
            
            for welllog_data in welllogs_data:
                welllog = self._parse_osdu_welllog(welllog_data)
                if welllog:
                    welllogs.append(welllog)
            
        except Exception as e:
            logger.error(f"Error extracting welllogs: {str(e)}")
        
        return welllogs
    
    def _parse_osdu_welllog(self, osdu_welllog: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse a single OSDU welllog record from search API.
        
        OSDU welllog format:
        {
            "id": "osdu:work-product-component--WellLog:ffc3294b...",
            "data": {
                "WellboreID": "osdu:master-data--Wellbore:1574:",
                "Name": "1574_lrm02_1974_comp.las",
                "Datasets": [
                    "osdu:dataset--File.Generic:323844bf..."
                ],
                "Curves": [
                    {
                        "NumberOfColumns": 1,
                        "Mnemonic": "DEPT",
                        "BaseDepth": 3015.9004,
                        "TopDepth": 2655.4002,
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:M:"
                    },
                    {
                        "Mnemonic": "GR",
                        "CurveUnit": "osdu:reference-data--UnitOfMeasure:GAPI:"
                    }
                ]
            }
        }
        
        Args:
            osdu_welllog: OSDU welllog record
            
        Returns:
            Welllog metadata dictionary or None
        """
        try:
            # Extract welllog ID and normalize (remove trailing colon)
            welllog_id = self.normalize_id(osdu_welllog.get('id', ''))
            if not welllog_id:
                return None
            
            data = osdu_welllog.get('data', {})
            if not data:
                logger.warning(f"Welllog {welllog_id} missing data section")
                return None
            
            # Extract wellbore ID (for linking welllogs to wellbores) and normalize
            wellbore_id = self.normalize_id(data.get('WellboreID', ''))
            
            # Extract name
            name = data.get('Name', '')
            
            # Extract datasets (array of dataset IDs)
            datasets = data.get('Datasets', [])
            if not isinstance(datasets, list):
                datasets = [datasets] if datasets else []
            
            # Extract curves with mnemonics and additional metadata
            curves = []
            curves_data = data.get('Curves', [])
            
            if isinstance(curves_data, list):
                for curve in curves_data:
                    if isinstance(curve, dict):
                        mnemonic = curve.get('Mnemonic', curve.get('mnemonic'))
                        if mnemonic:
                            # Store full curve info for potential future use
                            curve_info = {'mnemonic': mnemonic}
                            
                            # Optionally include additional curve metadata
                            if 'CurveUnit' in curve:
                                curve_info['unit'] = curve['CurveUnit']
                            if 'TopDepth' in curve:
                                curve_info['topDepth'] = curve['TopDepth']
                            if 'BaseDepth' in curve:
                                curve_info['baseDepth'] = curve['BaseDepth']
                            if 'NumberOfColumns' in curve:
                                curve_info['numberOfColumns'] = curve['NumberOfColumns']
                            
                            curves.append(curve_info)
                    elif isinstance(curve, str):
                        # Handle simple string mnemonic
                        curves.append({'mnemonic': curve})
            
            welllog_metadata = {
                'welllog_id': welllog_id,
                'name': name,
                'datasets': datasets,
                'curves': curves
            }
            
            # Add wellbore_id if present (for linking)
            if wellbore_id:
                welllog_metadata['wellbore_id'] = wellbore_id
            
            return welllog_metadata
            
        except Exception as e:
            logger.error(f"Error parsing welllog: {str(e)}", exc_info=True)
            return None
    
    def link_welllogs_to_wellbores(
        self,
        wellbores: List[Dict[str, Any]],
        welllogs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Link welllogs to their parent wellbores using WellboreID.
        
        When OSDU API returns separate queries for wellbores and welllogs,
        this method links them together using the WellboreID field.
        
        Args:
            wellbores: List of wellbore metadata dictionaries
            welllogs: List of welllog metadata dictionaries (with wellbore_id field)
            
        Returns:
            List of wellbore metadata with welllogs nested under their parent wellbores
        """
        logger.info(f"Linking {len(welllogs)} welllogs to {len(wellbores)} wellbores")
        
        # Create a map of wellbore_id to wellbore for fast lookup
        wellbore_map = {wb['wellbore_id']: wb for wb in wellbores}
        
        # Link welllogs to their parent wellbores
        linked_count = 0
        unlinked_welllogs = []
        
        for welllog in welllogs:
            wellbore_id = welllog.get('wellbore_id')
            
            if wellbore_id and wellbore_id in wellbore_map:
                # Add welllog to parent wellbore
                wellbore = wellbore_map[wellbore_id]
                if 'welllogs' not in wellbore:
                    wellbore['welllogs'] = []
                
                # Remove wellbore_id from welllog before adding (not needed in nested structure)
                welllog_copy = {k: v for k, v in welllog.items() if k != 'wellbore_id'}
                wellbore['welllogs'].append(welllog_copy)
                linked_count += 1
            else:
                unlinked_welllogs.append(welllog)
                logger.warning(f"Welllog {welllog.get('welllog_id')} has no matching wellbore: {wellbore_id}")
        
        logger.info(f"Linked {linked_count} welllogs, {len(unlinked_welllogs)} unlinked")
        
        return wellbores
    
    def link_wellbores_to_wells(
        self,
        wells: List[Dict[str, Any]],
        wellbores: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Link wellbores to their parent wells using WellID.
        
        Note: OSDU wellbore records should include WellID field for linking.
        If not present, wellbores cannot be automatically linked.
        
        Args:
            wells: List of well metadata dictionaries
            wellbores: List of wellbore metadata dictionaries (with well_id field)
            
        Returns:
            List of well metadata with wellbores nested under their parent wells
        """
        logger.info(f"Linking {len(wellbores)} wellbores to {len(wells)} wells")
        
        # Create a map of well_id to well for fast lookup
        well_map = {w['well_id']: w for w in wells}
        
        # Link wellbores to their parent wells
        linked_count = 0
        unlinked_wellbores = []
        
        for wellbore in wellbores:
            well_id = wellbore.get('well_id')
            
            if well_id and well_id in well_map:
                # Add wellbore to parent well
                well = well_map[well_id]
                if 'wellbores' not in well:
                    well['wellbores'] = []
                
                # Remove well_id from wellbore before adding (not needed in nested structure)
                wellbore_copy = {k: v for k, v in wellbore.items() if k != 'well_id'}
                well['wellbores'].append(wellbore_copy)
                linked_count += 1
            else:
                unlinked_wellbores.append(wellbore)
                if well_id:
                    logger.warning(f"Wellbore {wellbore.get('wellbore_id')} has no matching well: {well_id}")
        
        logger.info(f"Linked {linked_count} wellbores, {len(unlinked_wellbores)} unlinked")
        
        return wells
    
    def build_hierarchy(self, wells: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Build hierarchical data structure matching example_well_metadata_hierarchy.json format.
        
        Structures wells → wellbores → welllogs hierarchy with proper nesting
        and includes FacilityName, NameAliases, and Curves data.
        
        Args:
            wells: List of WellMetadata dictionaries
            
        Returns:
            List of hierarchical well data matching the example format
        """
        logger.info(f"Building hierarchical structure for {len(wells)} wells")
        
        hierarchical_data = []
        
        for well in wells:
            try:
                # Build hierarchical structure with OSDU-compatible format
                hierarchical_well = {
                    'well_id': well['well_id'],
                    'data': {
                        'FacilityName': well['facilityName'],
                        'NameAliases': well['nameAliases'],
                        'SpatialLocation.Wgs84Coordinates': {
                            'geometries': [
                                {
                                    'coordinates': [
                                        well['location']['longitude'],
                                        well['location']['latitude']
                                    ],
                                    'type': 'point'
                                }
                            ],
                            'type': 'geometrycollection'
                        }
                    },
                    'wellbores': []
                }
                
                # Add optional fields to data section
                if 'depth' in well:
                    hierarchical_well['data']['TotalDepth'] = well['depth']
                if 'operator' in well:
                    hierarchical_well['data']['Operator'] = well['operator']
                if 'type' in well:
                    hierarchical_well['data']['WellType'] = well['type']
                
                # Process wellbores
                for wellbore in well.get('wellbores', []):
                    hierarchical_wellbore = {
                        'wellbore_id': wellbore['wellbore_id'],
                        'data': {
                            'FacilityName': wellbore['facilityName'],
                            'NameAliases': wellbore['nameAliases']
                        },
                        'welllogs': []
                    }
                    
                    # Process welllogs
                    for welllog in wellbore.get('welllogs', []):
                        hierarchical_welllog = {
                            'welllog_id': welllog['welllog_id'],
                            'data': {
                                'Name': welllog['name'],
                                'Datasets': welllog['datasets'],
                                'Curves': [
                                    {'Mnemonic': curve['mnemonic']}
                                    for curve in welllog.get('curves', [])
                                ]
                            }
                        }
                        hierarchical_wellbore['welllogs'].append(hierarchical_welllog)
                    
                    hierarchical_well['wellbores'].append(hierarchical_wellbore)
                
                hierarchical_data.append(hierarchical_well)
                
            except Exception as e:
                logger.error(f"Error building hierarchy for well {well.get('well_id')}: {str(e)}")
                continue
        
        logger.info(f"Built hierarchical structure for {len(hierarchical_data)} wells")
        return hierarchical_data
    
    def to_geojson(self, wells: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Convert well metadata to GeoJSON format for map visualization.
        
        Creates a GeoJSON FeatureCollection with Point features for each well.
        Includes well properties (name, depth, operator, type) and counts of
        wellbores and welllogs in the properties.
        
        Args:
            wells: List of WellMetadata dictionaries
            
        Returns:
            GeoJSON FeatureCollection dictionary:
            {
                'type': 'FeatureCollection',
                'features': [
                    {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [longitude, latitude]
                        },
                        'properties': {
                            'well_id': str,
                            'name': str,
                            'facilityName': str,
                            'depth': float,
                            'operator': str,
                            'type': str,
                            'category': str,
                            'wellboreCount': int,
                            'welllogCount': int
                        }
                    }
                ]
            }
        """
        print(f"[to_geojson] Converting {len(wells)} wells to GeoJSON format")
        print(f"[to_geojson] Wells type: {type(wells)}")
        
        if wells and len(wells) > 0:
            print(f"[to_geojson] First well keys: {list(wells[0].keys())}")
            print(f"[to_geojson] First well sample: {wells[0]}")
        
        logger.info(f"Converting {len(wells)} wells to GeoJSON format")
        
        features = []
        skipped_count = 0
        
        for idx, well in enumerate(wells):
            try:
                # Extract location - handle both flat and hierarchical formats
                location = well.get('location', {})
                latitude = location.get('latitude')
                longitude = location.get('longitude')
                
                # If location not found in flat format, try hierarchical format
                if latitude is None or longitude is None:
                    data = well.get('data', {})
                    spatial_location = data.get('SpatialLocation.Wgs84Coordinates', {})
                    geometries = spatial_location.get('geometries', [])
                    
                    if geometries and len(geometries) > 0:
                        coordinates = geometries[0].get('coordinates', [])
                        if len(coordinates) >= 2:
                            longitude = coordinates[0]
                            latitude = coordinates[1]
                
                if idx < 3:  # Debug first 3 wells
                    print(f"[to_geojson] Well {idx}: well_id={well.get('well_id')}, lat={latitude}, lon={longitude}")
                
                if latitude is None or longitude is None:
                    skipped_count += 1
                    if skipped_count <= 3:  # Only log first 3 skipped wells
                        print(f"[to_geojson] SKIPPING well {well.get('well_id')} - missing coordinates")
                    logger.warning(f"Well {well.get('well_id')} missing coordinates, skipping")
                    continue
                
                # Count wellbores and welllogs
                wellbores = well.get('wellbores', [])
                wellbore_count = len(wellbores)
                welllog_count = sum(len(wb.get('welllogs', [])) for wb in wellbores)
                
                # Extract name and other properties - handle both formats
                if 'name' in well:
                    # Flat format
                    name = well['name']
                    facility_name = well.get('facilityName', name)
                    well_type = well.get('type', 'unknown')
                    category = well.get('category', 'search_result')
                    depth = well.get('depth')
                    operator = well.get('operator')
                else:
                    # Hierarchical format
                    data = well.get('data', {})
                    facility_name = data.get('FacilityName', '')
                    name = facility_name
                    well_type = data.get('WellType', 'unknown')
                    category = 'search_result'
                    depth = data.get('TotalDepth')
                    operator = data.get('Operator')
                
                # Build properties
                properties = {
                    'well_id': well['well_id'],
                    'name': name,
                    'facilityName': facility_name,
                    'type': well_type,
                    'category': category,
                    'wellboreCount': wellbore_count,
                    'welllogCount': welllog_count
                }
                
                # Add optional properties
                if depth is not None:
                    properties['depth'] = depth
                if operator:
                    properties['operator'] = operator
                
                # Create GeoJSON feature
                feature = {
                    'type': 'Feature',
                    'geometry': {
                        'type': 'Point',
                        'coordinates': [longitude, latitude]  # GeoJSON uses [lon, lat]
                    },
                    'properties': properties
                }
                
                features.append(feature)
                
            except Exception as e:
                logger.error(f"Error converting well {well.get('well_id')} to GeoJSON: {str(e)}")
                continue
        
        geojson = {
            'type': 'FeatureCollection',
            'features': features
        }
        
        print(f"[to_geojson] Created GeoJSON with {len(features)} features (skipped {skipped_count} wells without coordinates)")
        logger.info(f"Created GeoJSON with {len(features)} features")
        return geojson
