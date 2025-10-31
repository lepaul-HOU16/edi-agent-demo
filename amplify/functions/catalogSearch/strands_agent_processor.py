"""
Strands Agent Processor
Processes natural language queries using Strands Agent framework.

This module implements the Strands Agent integration for OSDU catalog search.
It provides natural language processing capabilities for filtering and searching
well, wellbore, and welllog data from OSDU.

Requirements Addressed:
- Requirement 1.2: Invoke Strands Agent to process natural language queries
- Requirement 5.1: Search OSDU for well metadata matching the request
- Requirement 5.2: Search OSDU for wellbore metadata matching the request
- Requirement 5.3: Search OSDU for welllog metadata matching the request
- Requirement 7.1: Use OSDU instance data from environment
"""

import logging
import os
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import Strands Agent framework
try:
    from strands import Agent, tool
    STRANDS_AVAILABLE = True
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"strands not available, using fallback implementation: {str(e)}")
    STRANDS_AVAILABLE = False
    # Fallback decorator - simple passthrough
    def tool(func):
        return func
    Agent = None

# Import OSDU client and transformer
from osdu_client import OSDUClient
from osdu_data_transformer import OSDUDataTransformer

logger = logging.getLogger(__name__)

# System prompt for OSDU catalog search agent
CATALOG_SEARCH_SYSTEM_PROMPT = """You are an OSDU catalog search assistant specialized in helping users find and filter well, wellbore, and welllog data.

Your capabilities:
1. Fetch all data from OSDU (wells, wellbores, welllogs)
2. Search and filter OSDU well metadata based on natural language queries
3. Apply filters like depth, location, well type, operator, etc.
4. Convert OSDU data to GeoJSON format for map visualization
5. Build hierarchical well → wellbore → welllog data structures
6. Provide clear explanations of search results and filtering operations

When processing queries:
- Understand the user's intent (fetch all data, search, filter, analyze)
- Use available tools to access and filter OSDU data
- Provide statistics (well count, wellbore count, welllog count)
- Generate thought steps to explain your reasoning
- Return filtered results in the required format

Always be precise with data filtering and provide accurate counts.

Available tools:
- get_all_osdu_data: Fetch ALL wells, wellbores, and welllogs from OSDU (use when user says "show all data", "show all wells", "load all wells", "get all data", etc.)
- search_osdu_wells: Search OSDU for wells matching criteria
- filter_existing_wells: Filter wells from existing context based on criteria
- transform_to_geojson: Convert well metadata to GeoJSON format
- calculate_statistics: Calculate well/wellbore/welllog counts

When a user asks to see all data or all wells:
1. Use get_all_osdu_data tool to fetch everything from OSDU
2. This will return the complete dataset with hierarchy
3. Transform results to GeoJSON for map visualization
4. Report statistics

When a user asks to filter or search:
1. First check if existing context has wells loaded
2. If yes, use filter_existing_wells to filter them
3. If no, use search_osdu_wells to fetch from OSDU
4. Always transform results to GeoJSON for map visualization
5. Always calculate and report statistics
"""


class StrandsAgentProcessor:
    """
    StrandsAgentProcessor - Process natural language queries with Strands Agent
    
    Responsibilities:
    - Initialize Strands Agent with Claude 3.5 Sonnet model
    - Configure OSDU API client with environment credentials
    - Create OSDU search tools for agent
    - Set up streaming response handler
    - Process user queries and generate thought steps
    - Filter and transform OSDU data
    - Convert OSDU spatial data to GeoJSON
    
    Requirements Addressed:
    - Requirement 1.2: Invoke Strands Agent to process natural language queries
    - Requirement 5.1-5.3: Search OSDU for well/wellbore/welllog metadata
    - Requirement 7.1-7.3: Use OSDU instance data and authentication from environment
    """
    
    def __init__(self, osdu_base_url: str, osdu_partition_id: str):
        """
        Initialize Strands Agent processor with OSDU tools.
        
        This initializes:
        1. OSDU API client with environment credentials
        2. OSDU data transformer for format conversion
        3. Strands Agent with Claude 4.5 Sonnet model
        4. OSDU-specific tools for the agent
        
        Args:
            osdu_base_url: OSDU instance base URL (from environment or frontend)
            osdu_partition_id: OSDU data partition ID (from environment or frontend)
            
        Note:
            OSDU authentication is handled via environment variables:
            - EDI_USERNAME: OSDU username
            - EDI_PASSWORD: OSDU password
            - EDI_CLIENT_ID: Cognito client ID
            - EDI_CLIENT_SECRET: Cognito client secret
            - COGNITO_REGION: AWS region for Cognito
            
        Raises:
            Exception: If OSDU client initialization fails
        """
        logger.info("=" * 80)
        logger.info("INITIALIZING STRANDS AGENT PROCESSOR")
        logger.info("=" * 80)
        
        self.osdu_base_url = osdu_base_url
        self.osdu_partition_id = osdu_partition_id
        
        # Step 1: Initialize OSDU API client with environment credentials
        logger.info("Step 1: Initializing OSDU API client...")
        try:
            self.osdu_client = OSDUClient(
                base_url=osdu_base_url,
                partition_id=osdu_partition_id
            )
            logger.info(f"✓ OSDU client initialized: {osdu_base_url}")
        except Exception as e:
            logger.error(f"Failed to initialize OSDU client: {str(e)}", exc_info=True)
            raise Exception(f"OSDU client initialization failed: {str(e)}")
        
        # Step 2: Initialize OSDU data transformer
        logger.info("Step 2: Initializing OSDU data transformer...")
        self.transformer = OSDUDataTransformer()
        logger.info("✓ OSDU data transformer initialized")
        
        # Step 3: Initialize Strands Agent with OSDU tools
        logger.info("Step 3: Initializing Strands Agent with Claude 4.5 Sonnet...")
        try:
            self.agent = self._initialize_agent()
            logger.info("✓ Strands Agent initialized with OSDU tools")
        except Exception as e:
            logger.error(f"Failed to initialize Strands Agent: {str(e)}", exc_info=True)
            raise Exception(f"Strands Agent initialization failed: {str(e)}")
        
        logger.info("=" * 80)
        logger.info("✅ STRANDS AGENT PROCESSOR READY")
        logger.info("=" * 80)
    
    def _initialize_agent(self):
        """
        Initialize Strands Agent with Claude 3.5 Sonnet model and OSDU-specific tools.
        
        This creates a Strands Agent configured with:
        1. Claude 4.5 Sonnet model from AWS Bedrock
        2. OSDU-specific tools for searching and filtering
        3. System prompt for catalog search behavior
        4. Streaming response handler
        
        Returns:
            Configured Strands Agent instance (or None if Strands not available)
            
        Requirements Addressed:
            - Requirement 1.2: Initialize Strands Agent with Claude 4.5 Sonnet model
            - Requirement 5.1-5.3: Create OSDU search tools for agent
        """
        if not STRANDS_AVAILABLE:
            logger.warning("Strands Agents not available, using fallback mode")
            return None
        
        logger.info("Creating OSDU-specific tools for agent...")
        
        # Define OSDU-specific tools
        tools = [
            self._create_getdata_tool(),
            self._create_search_osdu_tool(),
            self._create_filter_wells_tool(),
            self._create_transform_to_geojson_tool(),
            self._create_calculate_statistics_tool()
        ]
        
        logger.info(f"✓ Created {len(tools)} OSDU tools")
        
        # Get model configuration from environment
        model_id = os.environ.get('STRANDS_AGENT_MODEL', 'global.anthropic.claude-sonnet-4-5-20250929-v1:0')
        logger.info(f"Using model: {model_id}")
        
        # Create agent with tools and system prompt
        try:
            agent = Agent(
                system_prompt=CATALOG_SEARCH_SYSTEM_PROMPT,
                tools=tools
            )
            logger.info("✓ Strands Agent created successfully")
            return agent
        except Exception as e:
            logger.error(f"Error creating Strands Agent: {str(e)}", exc_info=True)
            logger.warning("Falling back to direct tool execution mode")
            return None
    
    def _create_getdata_tool(self):
        """
        Create tool for fetching all OSDU data (wells, wellbores, welllogs).
        
        This tool allows the agent to understand natural language requests like:
        - "show all data"
        - "show all wells"
        - "load all wells"
        - "get all data"
        - "fetch all wells"
        
        And execute the equivalent of the /getdata command.
        
        Requirements Addressed:
            - Requirement 5.1: Fetch all wells from OSDU
            - Requirement 5.2: Fetch all wellbores from OSDU
            - Requirement 5.3: Fetch all welllogs from OSDU
        """
        osdu_client = self.osdu_client
        transformer = self.transformer
        
        @tool
        def get_all_osdu_data(session_id: str) -> Dict[str, Any]:
            """
            Fetch all wells, wellbores, and welllogs from OSDU and build complete hierarchy.
            
            This tool retrieves the complete dataset from OSDU, including:
            - All wells with their metadata
            - All wellbores linked to their parent wells
            - All welllogs linked to their parent wellbores
            
            Use this tool when the user asks to:
            - "show all data"
            - "show all wells"
            - "load all wells"
            - "get all data"
            - "fetch all wells"
            - "display all wells"
            
            Args:
                session_id: Session identifier for storing results
                
            Returns:
                Dictionary with:
                    - wells: Complete hierarchical well data
                    - geojson: GeoJSON representation for map display
                    - stats: Counts of wells, wellbores, and welllogs
                    - message: Success message
                    
            Example:
                result = get_all_osdu_data("session-123")
                # Returns all wells with complete hierarchy
            """
            logger.info(f"[TOOL] get_all_osdu_data called for session: {session_id}")
            
            try:
                # Step 1: Fetch all wells from OSDU
                logger.info("Fetching all wells from OSDU...")
                osdu_wells = osdu_client.fetch_all_wells()
                logger.info(f"✓ Fetched {len(osdu_wells)} wells")
                
                if not osdu_wells:
                    logger.warning("No wells found in OSDU")
                    return {
                        'wells': [],
                        'geojson': {'type': 'FeatureCollection', 'features': []},
                        'stats': {'wellCount': 0, 'wellboreCount': 0, 'welllogCount': 0},
                        'message': 'No wells found in OSDU instance'
                    }
                
                # Step 2: Fetch all wellbores from OSDU
                logger.info("Fetching all wellbores from OSDU...")
                osdu_wellbores = osdu_client.fetch_all_wellbores()
                logger.info(f"✓ Fetched {len(osdu_wellbores)} wellbores")
                
                # Step 3: Fetch all welllogs from OSDU
                logger.info("Fetching all welllogs from OSDU...")
                osdu_welllogs = osdu_client.fetch_all_welllogs()
                logger.info(f"✓ Fetched {len(osdu_welllogs)} welllogs")
                
                # Step 4: Transform to metadata format
                logger.info("Transforming OSDU data to metadata format...")
                wells_metadata = transformer.transform_well_data(osdu_wells)
                wellbores_metadata = [transformer._parse_osdu_wellbore(wb) for wb in osdu_wellbores]
                wellbores_metadata = [wb for wb in wellbores_metadata if wb is not None]
                welllogs_metadata = [transformer._parse_osdu_welllog(wl) for wl in osdu_welllogs]
                welllogs_metadata = [wl for wl in welllogs_metadata if wl is not None]
                
                # Step 5: Link hierarchy (welllogs → wellbores → wells)
                logger.info("Linking data hierarchy...")
                wellbores_with_logs = transformer.link_welllogs_to_wellbores(wellbores_metadata, welllogs_metadata)
                wells_complete = transformer.link_wellbores_to_wells(wells_metadata, wellbores_with_logs)
                
                # Step 6: Build hierarchical structure
                logger.info("Building hierarchical structure...")
                hierarchical_wells = transformer.build_hierarchy(wells_complete)
                
                # Step 7: Generate GeoJSON
                logger.info("Generating GeoJSON...")
                geojson = transformer.to_geojson(wells_complete)
                
                # Step 8: Calculate statistics
                stats = self._calculate_stats(wells_complete)
                
                logger.info(f"[TOOL] get_all_osdu_data complete: {stats['wellCount']} wells, {stats['wellboreCount']} wellbores, {stats['welllogCount']} welllogs")
                
                # Build success message
                message_parts = [f"{stats['wellCount']} wells"]
                if stats.get('wellboreCount', 0) > 0:
                    message_parts.append(f"{stats['wellboreCount']} wellbores")
                if stats.get('welllogCount', 0) > 0:
                    message_parts.append(f"{stats['welllogCount']} welllogs")
                
                message = f"Successfully retrieved {', '.join(message_parts)} from OSDU"
                
                return {
                    'wells': hierarchical_wells,
                    'geojson': geojson,
                    'stats': stats,
                    'message': message,
                    'is_getdata_equivalent': True  # Flag to indicate this is equivalent to /getdata
                }
                
            except Exception as e:
                logger.error(f"[TOOL] get_all_osdu_data error: {str(e)}", exc_info=True)
                return {
                    'wells': [],
                    'geojson': {'type': 'FeatureCollection', 'features': []},
                    'stats': {'wellCount': 0, 'wellboreCount': 0, 'welllogCount': 0},
                    'message': f'Error fetching data from OSDU: {str(e)}',
                    'error': str(e)
                }
        
        return get_all_osdu_data
    
    def _create_search_osdu_tool(self):
        """
        Create tool for analyzing user query and determining filter criteria.
        
        This tool helps the agent understand what the user is asking for and
        translate it into structured filter criteria that can be applied to
        the all_well_metadata.json data.
        
        Requirements Addressed:
            - Requirement 5.1: Understand user query intent
            - Requirement 5.2: Determine which fields to filter on
        """
        @tool
        def analyze_query(user_query: str) -> Dict[str, Any]:
            """
            Analyze the user's natural language query to determine filter criteria.
            
            This tool helps understand what the user is asking for and identifies
            which fields in the well metadata should be used for filtering.
            
            Args:
                user_query: The user's natural language query
                
            Returns:
                Dictionary with:
                    - filter_type: Type of filter (depth, location, name, operator, type, etc.)
                    - criteria: Structured criteria to apply
                    - explanation: Human-readable explanation of what will be filtered
                    
            Example:
                Input: "Show me wells deeper than 3000 meters"
                Output: {
                    "filter_type": "depth",
                    "criteria": {"depth": {"min": 3000}},
                    "explanation": "Filtering wells with depth greater than 3000 meters"
                }
            """
            logger.info(f"[TOOL] analyze_query called: '{user_query}'")
            
            # This is a placeholder - the actual analysis will be done by the LLM
            # The agent will use its understanding to populate this
            return {
                'filter_type': 'unknown',
                'criteria': {},
                'explanation': f'Analyzing query: {user_query}'
            }
        
        return analyze_query
    
    def _create_filter_wells_tool(self):
        """
        Create tool for filtering wells from all_well_metadata.json.
        
        This is the main filtering tool. The agent will:
        1. Receive the all_well_metadata dict from context
        2. Understand what the user is asking for
        3. Filter the wells based on the criteria
        4. Return a new dict with only the matching well IDs
        
        Requirements Addressed:
            - Requirement 5.1: Filter well metadata based on user query
            - Requirement 5.4: Create filtered subset
        """
        @tool
        def filter_wells_by_criteria(
            all_wells_data: Dict[str, Any],
            filter_field: str,
            filter_value: Any,
            comparison: str = "equals"
        ) -> Dict[str, Any]:
            """
            Filter wells from all_well_metadata based on specific criteria.
            
            This tool examines the all_well_metadata dict and filters wells based on
            the specified field and value. It returns a new dict with only the wells
            that match the criteria.
            
            Args:
                all_wells_data: The complete all_well_metadata dict loaded from S3
                filter_field: The field to filter on (e.g., "depth", "FacilityName", "operator", "location")
                filter_value: The value to compare against (e.g., 3000, "Well-001", "Company Name")
                comparison: Type of comparison ("equals", "greater_than", "less_than", "contains", "within_radius")
                
            Returns:
                Dictionary with:
                    - matching_well_ids: List of well IDs that match the criteria
                    - filtered_wells: Complete well data for matching wells
                    - count: Number of matching wells
                    - wellbore_count: Number of wellbores in matching wells
                    - welllog_count: Number of welllogs in matching wells
                    
            Examples:
                # Filter by depth
                filter_wells(all_data, "depth", 3000, "greater_than")
                
                # Filter by name
                filter_wells(all_data, "FacilityName", "Well-001", "contains")
                
                # Filter by operator
                filter_wells(all_data, "operator", "Company A", "equals")
            """
            logger.info(f"[TOOL] filter_wells_by_criteria called: field='{filter_field}', value={filter_value}, comparison='{comparison}'")
            
            try:
                matching_wells = []
                matching_well_ids = []
                
                # Iterate through all wells in the data
                for well in all_wells_data:
                    well_id = well.get('well_id')
                    well_data = well.get('data', {})
                    
                    # Check if this well matches the criteria
                    matches = False
                    
                    if comparison == "equals":
                        if well_data.get(filter_field) == filter_value:
                            matches = True
                    elif comparison == "greater_than":
                        field_value = well_data.get(filter_field)
                        if field_value is not None and field_value > filter_value:
                            matches = True
                    elif comparison == "less_than":
                        field_value = well_data.get(filter_field)
                        if field_value is not None and field_value < filter_value:
                            matches = True
                    elif comparison == "contains":
                        field_value = str(well_data.get(filter_field, ""))
                        if filter_value.lower() in field_value.lower():
                            matches = True
                    elif comparison == "within_radius":
                        # For location-based filtering
                        # filter_value should be {"latitude": X, "longitude": Y, "radius_km": Z}
                        well_location = well_data.get('SpatialLocation', {}).get('Wgs84Coordinates', {})
                        if well_location:
                            # Calculate distance (simplified - would need proper geospatial calc)
                            matches = True  # Placeholder
                    
                    if matches:
                        matching_wells.append(well)
                        matching_well_ids.append(well_id)
                
                logger.info(f"✓ Found {len(matching_wells)} matching wells")
                
                # Calculate statistics
                stats = self._calculate_stats(matching_wells)
                
                logger.info(f"[TOOL] filter_wells_by_criteria complete: {stats['wellCount']} wells, {stats['wellboreCount']} wellbores, {stats['welllogCount']} welllogs")
                
                return {
                    'matching_well_ids': matching_well_ids,
                    'filtered_wells': matching_wells,
                    'count': stats['wellCount'],
                    'wellbore_count': stats['wellboreCount'],
                    'welllog_count': stats['welllogCount']
                }
                
            except Exception as e:
                logger.error(f"[TOOL] filter_wells_by_criteria error: {str(e)}", exc_info=True)
                return {
                    'matching_well_ids': [],
                    'filtered_wells': [],
                    'count': 0,
                    'wellbore_count': 0,
                    'welllog_count': 0,
                    'error': str(e)
                }
        
        return filter_wells_by_criteria
    
    def _create_transform_to_geojson_tool(self):
        """
        Create tool for transforming filtered wells to GeoJSON format.
        
        Requirements Addressed:
            - Requirement 5.5: Convert OSDU spatial data into GeoJSON format
        """
        transformer = self.transformer
        
        @tool
        def transform_to_geojson(wells: List[Dict[str, Any]]) -> Dict[str, Any]:
            """
            Transform well metadata to GeoJSON format for map visualization.
            
            This tool converts the filtered well metadata into GeoJSON FeatureCollection
            format that can be displayed on the MapLibre map component.
            
            Args:
                wells: List of well metadata dictionaries
                
            Returns:
                GeoJSON FeatureCollection with Point features for each well
                
            Example:
                geojson = transform_to_geojson(filtered_wells)
            """
            logger.info(f"[TOOL] transform_to_geojson called: {len(wells)} wells")
            
            try:
                # Use the transformer to convert to GeoJSON
                geojson = transformer.to_geojson(wells)
                logger.info(f"✓ Transformed to GeoJSON with {len(geojson.get('features', []))} features")
                
                logger.info(f"[TOOL] transform_to_geojson complete")
                return geojson
                
            except Exception as e:
                logger.error(f"[TOOL] transform_to_geojson error: {str(e)}", exc_info=True)
                return {
                    'type': 'FeatureCollection',
                    'features': [],
                    'error': str(e)
                }
        
        return transform_to_geojson
    
    def _create_calculate_statistics_tool(self):
        """
        Create tool for calculating well/wellbore/welllog statistics.
        
        Requirements Addressed:
            - Requirement 6.4: Stream count of wells, wellbores, and welllogs found
        """
        @tool
        def calculate_statistics(wells: List[Dict[str, Any]]) -> Dict[str, int]:
            """
            Calculate statistics for wells, wellbores, and welllogs.
            
            Args:
                wells: List of well metadata dictionaries
                
            Returns:
                Dictionary with wellCount, wellboreCount, and welllogCount
                
            Example:
                stats = calculate_statistics(filtered_wells)
                # Returns: {"wellCount": 10, "wellboreCount": 25, "welllogCount": 150}
            """
            logger.info(f"[TOOL] calculate_statistics called: {len(wells)} wells")
            
            try:
                stats = self._calculate_stats(wells)
                logger.info(f"[TOOL] calculate_statistics complete: {stats}")
                return stats
                
            except Exception as e:
                logger.error(f"[TOOL] calculate_statistics error: {str(e)}", exc_info=True)
                return {
                    'wellCount': 0,
                    'wellboreCount': 0,
                    'welllogCount': 0,
                    'error': str(e)
                }
        
        return calculate_statistics
    
    def process_query(
        self, 
        query: str, 
        session_id: str,
        existing_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Process a natural language query using Strands Agent with context awareness.
        
        This method implements comprehensive query processing:
        1. Loads all_well_metadata from existing context (S3)
        2. Determines which hierarchy level needs filtering (well, wellbore, or welllog)
        3. Processes natural language filter queries with intelligent understanding
        4. Generates thought steps during processing for realtime streaming
        
        Args:
            query: User's natural language query (e.g., "Show wells deeper than 3000m")
            session_id: Session identifier
            existing_context: Dict with 'allWells' key containing all_well_metadata.json data
            
        Returns:
            Dictionary with:
                - message: Response message explaining what was found
                - thought_steps: List of thought steps showing agent reasoning
                - filtered_data: Dict with 'metadata' and 'geojson' keys
                - stats: Well/wellbore/welllog counts
                
        Requirements Addressed:
            - Requirement 5.4: Load existing all_well_metadata.json from S3
            - Requirement 6.1: Determine which level of hierarchy needs to be filtered
            - Requirement 6.2: Process natural language filter queries
            - Requirement 6.1: Generate thought steps during processing
        """
        logger.info("=" * 80)
        logger.info(f"PROCESSING QUERY WITH CONTEXT AWARENESS")
        logger.info(f"Query: {query}")
        logger.info(f"Session ID: {session_id}")
        logger.info(f"Has existing context: {existing_context is not None}")
        if existing_context:
            logger.info(f"Context type: {type(existing_context)}")
            logger.info(f"Context keys: {list(existing_context.keys()) if hasattr(existing_context, 'keys') else 'Not a dict'}")
            logger.info(f"Context has allWells: {'allWells' in existing_context if hasattr(existing_context, '__contains__') else 'N/A'}")
        logger.info("=" * 80)
        
        thought_steps = []
        
        try:
            # Step 1: Load existing all_well_metadata.json from context
            logger.info("Step 1: Loading existing well metadata from context...")
            thought_step_loading = {
                'id': 'load_context',
                'type': 'data_loading',
                'title': 'Loading Well Data',
                'summary': 'Loading existing well metadata from session',
                'status': 'processing',
                'timestamp': int(datetime.now().timestamp() * 1000)
            }
            thought_steps.append(thought_step_loading)
            
            # Check if we have existing context with wells
            logger.info(f"Existing context type: {type(existing_context)}")
            logger.info(f"Existing context keys: {existing_context.keys() if existing_context else 'None'}")
            if existing_context:
                logger.info(f"allWells present: {'allWells' in existing_context}")
                logger.info(f"allWells type: {type(existing_context.get('allWells'))}")
                if existing_context.get('allWells'):
                    logger.info(f"allWells length: {len(existing_context.get('allWells'))}")
            
            if not existing_context or not existing_context.get('allWells'):
                logger.warning("No existing context with wells data")
                logger.info("Automatically fetching all wells from OSDU before processing query")
                
                thought_step_loading['status'] = 'processing'
                thought_step_loading['summary'] = 'No existing data - fetching all wells from OSDU first'
                
                # Always fetch all data first if no existing context
                getdata_tool = self._create_getdata_tool()
                tool_result = getdata_tool(session_id=session_id)
                
                # Check if tool execution was successful
                if tool_result.get('error'):
                    thought_step_loading['status'] = 'error'
                    thought_step_loading['summary'] = f"Error fetching data: {tool_result['error']}"
                    return {
                        'message': tool_result.get('message', 'Failed to fetch data from OSDU'),
                        'thought_steps': thought_steps,
                        'filtered_data': None,
                        'stats': tool_result.get('stats', {'wellCount': 0, 'wellboreCount': 0, 'welllogCount': 0})
                    }
                
                # Successfully fetched all wells - now set up context for filtering
                thought_step_loading['status'] = 'complete'
                thought_step_loading['summary'] = f"Loaded {tool_result.get('stats', {}).get('wellCount', 0)} wells from OSDU"
                
                # Check if this is a "show all" query - if so, return immediately
                query_lower = query.lower()
                is_show_all_query = any(phrase in query_lower for phrase in [
                    'show all', 'load all', 'get all', 'fetch all', 'display all',
                    'show me all', 'give me all', 'load everything', 'get everything'
                ])
                
                if is_show_all_query:
                    logger.info("Query is 'show all' - returning all fetched data")
                    return {
                        'message': tool_result.get('message', 'Successfully loaded all data from OSDU'),
                        'thought_steps': thought_steps,
                        'filtered_data': {
                            'metadata': tool_result.get('wells', []),
                            'geojson': tool_result.get('geojson', {'type': 'FeatureCollection', 'features': []})
                        },
                        'stats': tool_result.get('stats', {'wellCount': 0, 'wellboreCount': 0, 'welllogCount': 0})
                    }
                
                # Not a "show all" query - set up context for filtering
                logger.info("Query is a filter - setting up context for filtering")
                existing_context = {
                    'allWells': tool_result.get('wells', []),
                    'previousFilters': [],
                    'queryType': 'filter',
                    'isFilterOperation': True
                }
                
                # Continue to filtering logic below
                logger.info(f"Context set up with {len(existing_context['allWells'])} wells for filtering")
            
            # If we reach here, we have existing_context with allWells
            if not existing_context or not existing_context.get('allWells'):
                # This should not happen, but handle it gracefully
                thought_step_loading['status'] = 'error'
                thought_step_loading['summary'] = 'Failed to load well data'
                return {
                        'message': 'No well data loaded. Please run /getdata first to load well data.',
                        'thought_steps': thought_steps,
                        'filtered_data': None,
                        'stats': {
                            'wellCount': 0,
                            'wellboreCount': 0,
                            'welllogCount': 0
                        }
                    }
            
            all_wells = existing_context['allWells']
            initial_stats = self._calculate_stats(all_wells)
            logger.info(f"Loaded {initial_stats['wellCount']} wells, {initial_stats['wellboreCount']} wellbores, {initial_stats['welllogCount']} welllogs")
            
            thought_step_loading['status'] = 'complete'
            thought_step_loading['summary'] = f"Loaded {initial_stats['wellCount']} wells with {initial_stats['wellboreCount']} wellbores and {initial_stats['welllogCount']} welllogs"
            
            # Step 2: Determine which hierarchy level needs to be filtered
            logger.info("Step 2: Analyzing query to determine hierarchy level...")
            thought_step_analysis = {
                'id': 'analyze_hierarchy',
                'type': 'analysis',
                'title': 'Analyzing Query Intent',
                'summary': 'Determining which data level to filter (well, wellbore, or welllog)',
                'status': 'processing',
                'timestamp': int(datetime.now().timestamp() * 1000)
            }
            thought_steps.append(thought_step_analysis)
            
            hierarchy_level = self._determine_hierarchy_level(query)
            logger.info(f"Determined hierarchy level: {hierarchy_level}")
            
            thought_step_analysis['status'] = 'complete'
            thought_step_analysis['summary'] = f"Query targets {hierarchy_level} level filtering"
            thought_step_analysis['details'] = f"Will filter at the {hierarchy_level} level based on query criteria"
            
            # Step 3: Process natural language filter query
            logger.info("Step 3: Processing natural language filter query...")
            thought_step_filtering = {
                'id': 'apply_filters',
                'type': 'filtering',
                'title': 'Applying Filters',
                'summary': f'Filtering {hierarchy_level}s based on query criteria',
                'status': 'processing',
                'timestamp': int(datetime.now().timestamp() * 1000)
            }
            thought_steps.append(thought_step_filtering)
            
            # If agent is not available, use intelligent fallback filtering
            if not self.agent:
                logger.warning("Strands Agent not available, using intelligent fallback filtering")
                result = self._intelligent_filtering(query, all_wells, hierarchy_level, thought_steps)
                return result
            
            # Use OSDU search to filter wells
            logger.info("Using OSDU search to filter wells...")
            
            # Add thought step for OSDU search
            thought_step_osdu_search = {
                'id': 'osdu_search',
                'type': 'search',
                'title': 'Searching OSDU',
                'summary': f'Searching OSDU at {hierarchy_level} level',
                'status': 'processing',
                'timestamp': int(datetime.now().timestamp() * 1000)
            }
            thought_steps.append(thought_step_osdu_search)
            
            # Perform OSDU search and filter
            try:
                search_result = self.osdu_client.search_and_filter_wells(query, all_wells)
                
                filtered_wells = search_result['filtered_wells']
                search_stats = search_result['stats']
                
                thought_step_osdu_search['status'] = 'complete'
                thought_step_osdu_search['summary'] = f"Found {search_stats['total_search_matches']} matches in OSDU, filtered to {search_stats['filtered_wells']} wells currently displayed"
                thought_step_osdu_search['details'] = f"Searched at {search_stats['hierarchy_level']} level"
                
                logger.info(f"OSDU search complete: {search_stats['filtered_wells']} wells match both search and current display")
                
            except Exception as search_error:
                logger.error(f"OSDU search error: {str(search_error)}", exc_info=True)
                thought_step_osdu_search['status'] = 'error'
                thought_step_osdu_search['summary'] = f'OSDU search failed: {str(search_error)[:100]}'
                
                # Fall back to intelligent filtering
                logger.warning("Falling back to intelligent filtering")
                result = self._intelligent_filtering(query, all_wells, hierarchy_level, thought_steps)
                return result
            
            # Generate GeoJSON from filtered wells
            logger.info("Generating GeoJSON from filtered wells...")
            geojson = self.transformer.to_geojson(filtered_wells)
            
            # Calculate stats
            stats = self._calculate_stats(filtered_wells)
            
            # Build response message
            message = f"Found {stats['wellCount']} wells matching your query"
            if stats['wellboreCount'] > 0:
                message += f" with {stats['wellboreCount']} wellbores"
            if stats['welllogCount'] > 0:
                message += f" and {stats['welllogCount']} welllogs"
            
            message += f". Searched at {hierarchy_level} level in OSDU."
            
            thought_step_filtering['status'] = 'complete'
            thought_step_filtering['summary'] = f"Filtered to {stats['wellCount']} wells, {stats['wellboreCount']} wellbores, {stats['welllogCount']} welllogs"
            
            # Step 4: Generate final thought step with results
            thought_step_results = {
                'id': 'results_summary',
                'type': 'results',
                'title': 'Results Summary',
                'summary': f"Found {stats['wellCount']} matching wells with {stats['wellboreCount']} wellbores and {stats['welllogCount']} welllogs",
                'status': 'complete',
                'timestamp': int(datetime.now().timestamp() * 1000),
                'details': message
            }
            thought_steps.append(thought_step_results)
            
            logger.info("=" * 80)
            logger.info("✅ CONTEXT-AWARE QUERY PROCESSING COMPLETE")
            logger.info(f"   Hierarchy level: {hierarchy_level}")
            logger.info(f"   Filtered to {stats['wellCount']} wells")
            logger.info(f"   {stats['wellboreCount']} wellbores")
            logger.info(f"   {stats['welllogCount']} welllogs")
            logger.info(f"   Generated {len(thought_steps)} thought steps")
            logger.info("=" * 80)
            
            return {
                'message': message,
                'thought_steps': thought_steps,
                'filtered_data': {
                    'metadata': filtered_wells,
                    'geojson': geojson
                },
                'stats': stats
            }
            
        except Exception as e:
            logger.error(f"Error in context-aware query processing: {str(e)}", exc_info=True)
            
            # Mark any in-progress thought steps as errored
            for thought_step in thought_steps:
                if thought_step.get('status') == 'processing':
                    thought_step['status'] = 'error'
                    thought_step['summary'] = f'Error: {str(e)[:100]}'
            
            raise Exception(f"Query processing failed: {str(e)}")
    
    def _determine_hierarchy_level(self, query: str) -> str:
        """
        Determine which hierarchy level the query is targeting.
        
        Analyzes the query to understand if the user wants to filter:
        - Wells (top level)
        - Wellbores (middle level)
        - Welllogs/Curves (bottom level)
        
        Args:
            query: User's natural language query
            
        Returns:
            'well', 'wellbore', or 'welllog' indicating the target hierarchy level
            
        Requirements Addressed:
            - Requirement 6.1: Determine which level of hierarchy needs to be filtered
        """
        query_lower = query.lower()
        
        # Check for welllog/curve-specific keywords
        welllog_keywords = [
            'curve', 'curves', 'log', 'logs', 'welllog', 'welllogs',
            'mnemonic', 'mnemonics', 'gr', 'density', 'porosity', 'resistivity',
            'sonic', 'neutron', 'caliper', 'gamma ray'
        ]
        
        for keyword in welllog_keywords:
            if keyword in query_lower:
                logger.info(f"Detected welllog-level query (keyword: '{keyword}')")
                return 'welllog'
        
        # Check for wellbore-specific keywords
        wellbore_keywords = [
            'wellbore', 'wellbores', 'bore', 'bores',
            'lateral', 'laterals', 'sidetrack', 'sidetracks'
        ]
        
        for keyword in wellbore_keywords:
            if keyword in query_lower:
                logger.info(f"Detected wellbore-level query (keyword: '{keyword}')")
                return 'wellbore'
        
        # Default to well-level filtering
        logger.info("Defaulting to well-level query")
        return 'well'
    
    def _intelligent_filtering(
        self, 
        query: str, 
        all_wells: List[Dict[str, Any]], 
        hierarchy_level: str,
        thought_steps: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Intelligent filtering when Strands Agent is not available.
        
        This provides enhanced keyword-based filtering with hierarchy awareness.
        It generates thought steps to explain the filtering process.
        
        Args:
            query: User query
            all_wells: All wells data
            hierarchy_level: Target hierarchy level ('well', 'wellbore', or 'welllog')
            thought_steps: List to append thought steps to
            
        Returns:
            Filtered results with thought steps
            
        Requirements Addressed:
            - Requirement 5.4: Process natural language filter queries
            - Requirement 6.1: Generate thought steps during processing
        """
        logger.info(f"Using intelligent filtering at {hierarchy_level} level")
        
        # Add thought step for intelligent filtering
        thought_step_intelligent = {
            'id': 'intelligent_filtering',
            'type': 'filtering',
            'title': 'Intelligent Filtering',
            'summary': f'Applying keyword-based filtering at {hierarchy_level} level',
            'status': 'processing',
            'timestamp': int(datetime.now().timestamp() * 1000)
        }
        thought_steps.append(thought_step_intelligent)
        
        query_lower = query.lower()
        filtered_wells = all_wells
        filter_description = []
        
        # Extract filter criteria based on query
        import re
        
        # Check for depth filters
        if 'deeper than' in query_lower or 'depth >' in query_lower or 'depth greater' in query_lower:
            numbers = re.findall(r'\d+', query)
            if numbers:
                min_depth = int(numbers[0])
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('depth') and w['data']['depth'] > min_depth
                ]
                filter_description.append(f"depth > {min_depth}m")
                logger.info(f"Applied depth filter: > {min_depth}m")
        
        elif 'shallower than' in query_lower or 'depth <' in query_lower or 'depth less' in query_lower:
            numbers = re.findall(r'\d+', query)
            if numbers:
                max_depth = int(numbers[0])
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('depth') and w['data']['depth'] < max_depth
                ]
                filter_description.append(f"depth < {max_depth}m")
                logger.info(f"Applied depth filter: < {max_depth}m")
        
        # Check for name filters
        if 'named' in query_lower or 'called' in query_lower or 'name' in query_lower:
            # Extract quoted text or capitalized words
            quoted = re.findall(r'"([^"]*)"', query)
            if quoted:
                name_filter = quoted[0].lower()
                filtered_wells = [
                    w for w in filtered_wells
                    if name_filter in w.get('data', {}).get('FacilityName', '').lower()
                ]
                filter_description.append(f"name contains '{quoted[0]}'")
                logger.info(f"Applied name filter: contains '{quoted[0]}'")
        
        # Check for operator filters
        if 'operator' in query_lower or 'operated by' in query_lower:
            quoted = re.findall(r'"([^"]*)"', query)
            if quoted:
                operator_filter = quoted[0].lower()
                filtered_wells = [
                    w for w in filtered_wells
                    if operator_filter in w.get('data', {}).get('operator', '').lower()
                ]
                filter_description.append(f"operator contains '{quoted[0]}'")
                logger.info(f"Applied operator filter: contains '{quoted[0]}'")
        
        # Check for type filters
        if 'oil well' in query_lower or 'type oil' in query_lower:
            filtered_wells = [
                w for w in filtered_wells
                if w.get('data', {}).get('type', '').lower() == 'oil'
            ]
            filter_description.append("type = Oil")
            logger.info("Applied type filter: Oil")
        
        elif 'gas well' in query_lower or 'type gas' in query_lower:
            filtered_wells = [
                w for w in filtered_wells
                if w.get('data', {}).get('type', '').lower() == 'gas'
            ]
            filter_description.append("type = Gas")
            logger.info("Applied type filter: Gas")
        
        # Check for location filters
        if 'near' in query_lower or 'within' in query_lower or 'around' in query_lower:
            # Extract coordinates if present
            coord_pattern = r'(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)'
            coords = re.findall(coord_pattern, query)
            if coords:
                target_lat = float(coords[0][0])
                target_lon = float(coords[0][1])
                
                # Extract radius
                radius_match = re.search(r'(\d+)\s*(km|kilometer|mile)', query_lower)
                radius_km = 50  # default
                if radius_match:
                    radius_km = int(radius_match.group(1))
                    if 'mile' in radius_match.group(2):
                        radius_km = int(radius_km * 1.60934)  # Convert miles to km
                
                # Filter by distance
                import math
                
                def distance_km(lat1, lon1, lat2, lon2):
                    """Calculate distance using Haversine formula."""
                    R = 6371  # Earth radius in km
                    dlat = math.radians(lat2 - lat1)
                    dlon = math.radians(lon2 - lon1)
                    a = (math.sin(dlat / 2) ** 2 +
                         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                         math.sin(dlon / 2) ** 2)
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    return R * c
                
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('SpatialLocation', {}).get('Wgs84Coordinates')
                    and distance_km(
                        target_lat, target_lon,
                        w['data']['SpatialLocation']['Wgs84Coordinates'].get('latitude', 0),
                        w['data']['SpatialLocation']['Wgs84Coordinates'].get('longitude', 0)
                    ) <= radius_km
                ]
                filter_description.append(f"within {radius_km}km of ({target_lat}, {target_lon})")
                logger.info(f"Applied location filter: within {radius_km}km")
        
        # Apply hierarchy-specific filtering
        if hierarchy_level == 'wellbore':
            # Filter wells that have wellbores matching criteria
            # For now, keep all wellbores in matching wells
            logger.info(f"Filtering at wellbore level: keeping all wellbores in {len(filtered_wells)} matching wells")
        
        elif hierarchy_level == 'welllog':
            # Filter wells that have welllogs matching criteria
            # For now, keep all welllogs in matching wells
            logger.info(f"Filtering at welllog level: keeping all welllogs in {len(filtered_wells)} matching wells")
        
        # Generate GeoJSON
        geojson = self.transformer.to_geojson(filtered_wells)
        
        # Calculate stats
        stats = self._calculate_stats(filtered_wells)
        
        # Update thought step
        thought_step_intelligent['status'] = 'complete'
        if filter_description:
            thought_step_intelligent['summary'] = f"Applied filters: {', '.join(filter_description)}"
            thought_step_intelligent['details'] = f"Filtered {len(all_wells)} wells to {stats['wellCount']} wells"
        else:
            # Check if this was actually a filter query that we couldn't parse
            is_likely_filter = any(word in query_lower for word in [
                'show', 'find', 'filter', 'where', 'with', 'in', 'by', 'operated',
                'deeper', 'shallower', 'near', 'around', 'within', 'named', 'called'
            ]) and not any(phrase in query_lower for phrase in [
                'show all', 'all wells', 'all data', 'everything'
            ])
            
            if is_likely_filter:
                thought_step_intelligent['summary'] = f"⚠️ Could not parse filter criteria from query - returning all {stats['wellCount']} wells"
                thought_step_intelligent['status'] = 'warning'
                logger.warning(f"Filter query detected but could not parse: {query}")
            else:
                thought_step_intelligent['summary'] = f"No specific filters detected, returning all {stats['wellCount']} wells"
        
        # Build message
        if filter_description:
            message = f"Found {stats['wellCount']} wells matching criteria: {', '.join(filter_description)}"
        else:
            message = f"Showing all {stats['wellCount']} wells (no specific filters detected in query)"
        
        if stats['wellboreCount'] > 0:
            message += f" with {stats['wellboreCount']} wellbores"
        if stats['welllogCount'] > 0:
            message += f" and {stats['welllogCount']} welllogs"
        
        return {
            'message': message,
            'thought_steps': thought_steps,
            'filtered_data': {
                'metadata': filtered_wells,
                'geojson': geojson
            },
            'stats': stats
        }
    
    def _fallback_filtering(self, query: str, all_wells: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Fallback filtering when Strands Agent is not available.
        
        This provides basic keyword-based filtering as a fallback.
        
        Args:
            query: User query
            all_wells: All wells data
            
        Returns:
            Filtered results
        """
        logger.info("Using fallback filtering (keyword-based)")
        
        # Simple keyword-based filtering
        query_lower = query.lower()
        filtered_wells = all_wells
        
        # Check for depth filters
        if 'deeper than' in query_lower or 'depth >' in query_lower:
            # Extract number
            import re
            numbers = re.findall(r'\d+', query)
            if numbers:
                min_depth = int(numbers[0])
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('depth') and w['data']['depth'] > min_depth
                ]
                logger.info(f"Applied depth filter: > {min_depth}m")
        
        # Check for name filters
        if 'named' in query_lower or 'called' in query_lower:
            # Extract quoted text or last word
            import re
            quoted = re.findall(r'"([^"]*)"', query)
            if quoted:
                name_filter = quoted[0].lower()
                filtered_wells = [
                    w for w in filtered_wells
                    if name_filter in w.get('data', {}).get('FacilityName', '').lower()
                ]
                logger.info(f"Applied name filter: contains '{name_filter}'")
        
        # Generate GeoJSON
        geojson = self.transformer.to_geojson(filtered_wells)
        
        # Calculate stats
        stats = self._calculate_stats(filtered_wells)
        
        message = f"Found {stats['wellCount']} wells matching your query (using basic filtering)"
        
        return {
            'message': message,
            'thought_steps': [{
                'id': 'fallback_filtering',
                'type': 'execution',
                'title': 'Basic Filtering',
                'summary': f'Applied keyword-based filtering to {len(all_wells)} wells',
                'status': 'complete',
                'timestamp': int(datetime.now().timestamp() * 1000)
            }],
            'filtered_data': {
                'metadata': filtered_wells,
                'geojson': geojson
            },
            'stats': stats
        }
    
    def _extract_thought_steps(self, response: Any) -> List[Dict[str, Any]]:
        """
        Extract thought steps from agent response.
        
        Args:
            response: Agent response object
            
        Returns:
            List of thought step dictionaries
        """
        thought_steps = []
        
        # Check if response has metrics with tool usage
        if hasattr(response, 'metrics') and hasattr(response.metrics, 'tool_metrics'):
            for tool_name, tool_metric in response.metrics.tool_metrics.items():
                if tool_metric.call_count > 0:
                    thought_steps.append({
                        'id': f'tool_{tool_name}',
                        'type': 'tool_execution',
                        'title': f'Using {tool_name}',
                        'summary': f'Executed {tool_name} tool {tool_metric.call_count} time(s)',
                        'status': 'complete',
                        'timestamp': int(datetime.now().timestamp() * 1000)
                    })
        
        # Add general processing step
        thought_steps.append({
            'id': 'agent_processing',
            'type': 'execution',
            'title': 'Processing Query',
            'summary': 'Analyzed query and generated response',
            'status': 'complete',
            'timestamp': int(datetime.now().timestamp() * 1000)
        })
        
        return thought_steps
    
    def _calculate_stats(self, wells: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Calculate statistics for wells, wellbores, and welllogs.
        
        Args:
            wells: List of well metadata dictionaries
            
        Returns:
            Dictionary with wellCount, wellboreCount, and welllogCount
        """
        well_count = len(wells)
        wellbore_count = 0
        welllog_count = 0
        
        for well in wells:
            wellbores = well.get('wellbores', [])
            wellbore_count += len(wellbores)
            
            for wellbore in wellbores:
                welllogs = wellbore.get('welllogs', [])
                welllog_count += len(welllogs)
        
        return {
            'wellCount': well_count,
            'wellboreCount': wellbore_count,
            'welllogCount': welllog_count
        }
    
    def _apply_filters(self, wells: List[Dict[str, Any]], criteria: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Apply filter criteria to wells list.
        
        This is a helper method that applies various filter criteria to a list of wells.
        It supports filtering by depth, location, name, operator, type, etc.
        
        Args:
            wells: List of well metadata dictionaries
            criteria: Filter criteria dictionary
            
        Returns:
            Filtered list of wells
        """
        filtered_wells = wells
        
        # Apply depth filter
        if 'depth' in criteria:
            depth_criteria = criteria['depth']
            if 'min' in depth_criteria:
                min_depth = depth_criteria['min']
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('depth') and w['data']['depth'] >= min_depth
                ]
            if 'max' in depth_criteria:
                max_depth = depth_criteria['max']
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('depth') and w['data']['depth'] <= max_depth
                ]
        
        # Apply name filter
        if 'name' in criteria:
            name_filter = criteria['name'].lower()
            filtered_wells = [
                w for w in filtered_wells
                if name_filter in w.get('data', {}).get('FacilityName', '').lower()
            ]
        
        # Apply operator filter
        if 'operator' in criteria:
            operator_filter = criteria['operator'].lower()
            filtered_wells = [
                w for w in filtered_wells
                if operator_filter in w.get('data', {}).get('operator', '').lower()
            ]
        
        # Apply type filter
        if 'type' in criteria:
            type_filter = criteria['type']
            filtered_wells = [
                w for w in filtered_wells
                if w.get('data', {}).get('type') == type_filter
            ]
        
        # Apply location filter (within radius)
        if 'location' in criteria:
            location_criteria = criteria['location']
            target_lat = location_criteria.get('latitude')
            target_lon = location_criteria.get('longitude')
            radius_km = location_criteria.get('radius_km', 50)
            
            if target_lat is not None and target_lon is not None:
                # Simple distance calculation (would need proper geospatial library for accuracy)
                import math
                
                def distance_km(lat1, lon1, lat2, lon2):
                    """Calculate approximate distance in km using Haversine formula."""
                    R = 6371  # Earth radius in km
                    dlat = math.radians(lat2 - lat1)
                    dlon = math.radians(lon2 - lon1)
                    a = (math.sin(dlat / 2) ** 2 +
                         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
                         math.sin(dlon / 2) ** 2)
                    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
                    return R * c
                
                filtered_wells = [
                    w for w in filtered_wells
                    if w.get('data', {}).get('SpatialLocation', {}).get('Wgs84Coordinates')
                    and distance_km(
                        target_lat, target_lon,
                        w['data']['SpatialLocation']['Wgs84Coordinates'].get('latitude', 0),
                        w['data']['SpatialLocation']['Wgs84Coordinates'].get('longitude', 0)
                    ) <= radius_km
                ]
        
        return filtered_wells
