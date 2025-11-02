"""
Catalog Search Lambda Handler
Main entry point for OSDU catalog search functionality.

This Lambda function serves as the backend for the catalog search feature,
handling both hardcoded commands (/getdata, /reset) and natural language
queries through Strands Agent integration.

Responsibilities:
- Parse and validate incoming AppSync GraphQL requests
- Route requests to appropriate handlers (commands vs. natural language)
- Manage S3 session storage (metadata, GeoJSON, history)
- Integrate with Strands Agent for natural language processing
- Transform OSDU API responses to application format
- Stream responses back to frontend via AppSync

Architecture:
- Entry Point: lambda_handler() - validates and routes requests
- Command Handler: handle_command() - processes /getdata and /reset
- Query Handler: handle_natural_language_query() - processes AI queries
- Components: CommandRouter, S3SessionManager, OSDUClient, StrandsAgentProcessor

Requirements Addressed:
- Requirement 1.1: Process requests through AppSync GraphQL streaming endpoint
- Requirement 1.5: Initialize logging and error handling
"""

import json
import os
import sys
import logging
import traceback
from typing import Dict, List, Any, Optional
from datetime import datetime

# Debug: Print Python path to see if layer is mounted
print(f"Python version: {sys.version}")
print(f"Python path: {sys.path}")
print(f"Contents of /opt: {os.listdir('/opt') if os.path.exists('/opt') else 'NOT FOUND'}")
if os.path.exists('/opt/python'):
    print(f"Contents of /opt/python: {os.listdir('/opt/python')[:20]}")

# Configure logging with detailed format
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Import modules
from s3_session_manager import S3SessionManager
from osdu_client import OSDUClient
from osdu_data_transformer import OSDUDataTransformer
from strands_agent_processor import StrandsAgentProcessor
from command_router import CommandRouter

# Environment variables
S3_BUCKET = os.environ.get('CATALOG_S3_BUCKET', os.environ.get('STORAGE_BUCKET_NAME', ''))
OSDU_BASE_URL = os.environ.get('OSDU_BASE_URL', 'https://community.opensubsurface.org')
OSDU_PARTITION_ID = os.environ.get('OSDU_PARTITION_ID', 'opendes')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler entry point for catalog search requests.
    
    This function serves as the primary entry point for all catalog search operations.
    It handles AppSync GraphQL streaming requests, validates input parameters,
    initializes logging and error handling, and routes requests to appropriate handlers.
    
    Request Flow:
    1. Parse incoming AppSync GraphQL event
    2. Extract and validate required parameters (prompt, sessionId)
    3. Initialize logging with request context
    4. Set up error handling
    5. Route to command handler or natural language query handler
    6. Return structured response
    
    Note: OSDU authentication is handled via Lambda environment variables:
          - OSDU_BASE_URL: OSDU instance base URL
          - OSDU_PARTITION_ID: OSDU data partition ID
          - OSDU_CLIENT_ID: Cognito client ID
          - OSDU_CLIENT_SECRET: Cognito client secret
          - OSDU_USER_POOL_ID: Cognito user pool ID
          - OSDU_USERNAME: OSDU username
          - OSDU_PASSWORD: OSDU password
    
    Args:
        event: AppSync GraphQL event containing:
            - arguments: Request parameters
                - prompt (str, required): User's search query or command
                - sessionId (str, required): Unique session identifier for S3 storage
                - existingContext (dict, optional): Previous search context for continuity
        context: AWS Lambda context object with runtime information
        
    Returns:
        Dict[str, Any]: Structured response containing:
            - type (str): Response type ('complete', 'stream', 'error')
            - data (dict, optional): Response data with message, files, stats, thoughtSteps
            - error (str, optional): Error message if type is 'error'
    
    Raises:
        No exceptions raised - all errors caught and returned as error responses
        
    Requirements Addressed:
        - Requirement 1.1: Process requests through AppSync GraphQL streaming endpoint
        - Requirement 1.5: Initialize logging and error handling
        
    Example Event:
        {
            "arguments": {
                "prompt": "/getdata",
                "sessionId": "abc-123-def-456",
                "existingContext": null
            }
        }
    """
    # Initialize request logging
    request_id = context.request_id if hasattr(context, 'request_id') else 'unknown'
    logger.info("=" * 80)
    logger.info(f"CATALOG SEARCH LAMBDA INVOCATION - Request ID: {request_id}")
    logger.info("=" * 80)
    
    # Log event details (sanitize sensitive data)
    sanitized_event = sanitize_event_for_logging(event)
    logger.info(f"Event received: {json.dumps(sanitized_event, indent=2, default=str)}")
    
    # Log Lambda context information
    if hasattr(context, 'function_name'):
        logger.info(f"Function: {context.function_name}")
        logger.info(f"Memory: {context.memory_limit_in_mb}MB")
        logger.info(f"Remaining time: {context.get_remaining_time_in_millis()}ms")
    
    try:
        # Step 1: Parse incoming request
        logger.info("Step 1: Parsing AppSync GraphQL request")
        arguments = event.get('arguments', {})
        
        if not arguments:
            logger.error("No arguments found in event")
            return create_error_response("Invalid request: missing arguments")
        
        # Step 2: Extract required parameters
        logger.info("Step 2: Extracting request parameters")
        prompt = arguments.get('prompt', '').strip()
        session_id = arguments.get('sessionId', '').strip()
        existing_context = arguments.get('existingContext')
        polygon_filters = arguments.get('polygonFilters')
        
        # Parse polygon filters if provided as JSON string
        if polygon_filters and isinstance(polygon_filters, str):
            try:
                polygon_filters = json.loads(polygon_filters)
                logger.info(f"✓ Parsed polygonFilters from JSON string")
            except json.JSONDecodeError as json_error:
                logger.warning(f"Failed to parse polygonFilters JSON: {str(json_error)}")
                polygon_filters = None
        
        # Log extracted parameters (sanitized)
        logger.info(f"  - Prompt: '{prompt[:50]}{'...' if len(prompt) > 50 else ''}'")
        logger.info(f"  - Session ID: {session_id}")
        logger.info(f"  - OSDU Auth: Using environment variables (OSDU_BASE_URL, OSDU_PARTITION_ID, OSDU_CLIENT_ID, OSDU_CLIENT_SECRET)")
        logger.info(f"  - Existing Context: {'provided' if existing_context else 'none'}")
        logger.info(f"  - Polygon Filters: {len(polygon_filters) if polygon_filters else 0} polygon(s)")
        
        # Step 3: Validate required parameters
        logger.info("Step 3: Validating required parameters")
        validation_errors = []
        
        if not prompt:
            validation_errors.append("prompt is required and cannot be empty")
        if not session_id:
            validation_errors.append("sessionId is required and cannot be empty")
        
        if validation_errors:
            error_message = "Validation failed: " + "; ".join(validation_errors)
            logger.error(f"Parameter validation failed: {error_message}")
            return create_error_response(error_message, error_type="VALIDATION_ERROR")
        
        logger.info("✓ All required parameters validated successfully")
        
        # Step 4: Validate S3 bucket configuration
        logger.info("Step 4: Validating S3 bucket configuration")
        if not S3_BUCKET:
            logger.error("S3_BUCKET environment variable not configured")
            return create_error_response(
                "Server configuration error: S3 bucket not configured",
                error_type="S3_CONFIG_ERROR"
            )
        logger.info(f"✓ S3 Bucket configured: {S3_BUCKET}")
        
        # Step 5: Initialize components
        logger.info("Step 5: Initializing Lambda components")
        try:
            s3_manager = S3SessionManager(S3_BUCKET)
            command_router = CommandRouter(S3_BUCKET)
            logger.info("✓ Components initialized successfully")
        except Exception as init_error:
            logger.error(f"Component initialization failed: {str(init_error)}", exc_info=True)
            return create_error_response(
                f"Initialization error: {str(init_error)}",
                error_type="INIT_ERROR"
            )
        
        # Step 6: Route request to appropriate handler
        logger.info("Step 6: Routing request")
        
        # Check if this is a hardcoded command
        if command_router.is_command(prompt):
            command_type = command_router.get_command_type(prompt)
            logger.info(f"✓ Detected hardcoded command: {command_type}")
            logger.info(f"Routing to command handler: {command_type}")
            
            return handle_command(
                prompt=prompt,
                session_id=session_id,
                s3_manager=s3_manager,
                command_router=command_router
            )
        else:
            logger.info("✓ Detected natural language query")
            logger.info("Routing to Strands Agent processor")
            
            return handle_natural_language_query(
                prompt=prompt,
                session_id=session_id,
                existing_context=existing_context,
                polygon_filters=polygon_filters,
                s3_manager=s3_manager
            )
        
    except Exception as e:
        # Comprehensive error handling
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()
        }
        
        logger.error("=" * 80)
        logger.error("UNHANDLED EXCEPTION IN LAMBDA HANDLER")
        logger.error("=" * 80)
        logger.error(f"Error Type: {error_details['error_type']}")
        logger.error(f"Error Message: {error_details['error_message']}")
        logger.error(f"Traceback:\n{error_details['traceback']}")
        logger.error("=" * 80)
        
        return create_error_response(
            f"Internal server error: {error_details['error_type']} - {error_details['error_message']}"
        )
    finally:
        # Log completion
        logger.info("=" * 80)
        logger.info(f"CATALOG SEARCH LAMBDA COMPLETED - Request ID: {request_id}")
        logger.info("=" * 80)


def handle_command(
    prompt: str,
    session_id: str,
    s3_manager: S3SessionManager,
    command_router: CommandRouter
) -> Dict[str, Any]:
    """
    Handle hardcoded commands (/getdata, /reset).
    
    Args:
        prompt: Command string
        session_id: Session identifier
        s3_manager: S3 session manager instance
        command_router: Command router instance
        
    Note:
        OSDU authentication is handled via environment variables (OSDU_BASE_URL, OSDU_PARTITION_ID, etc.)
        
    Returns:
        Command execution result
    """
    logger.info(f"=== HANDLING COMMAND: {prompt} ===")
    
    try:
        command_type = command_router.get_command_type(prompt)
        
        if command_type == 'getdata':
            return handle_getdata_command(
                session_id=session_id,
                s3_manager=s3_manager
            )
        elif command_type == 'reset':
            return handle_reset_command(
                session_id=session_id,
                s3_manager=s3_manager
            )
        else:
            return create_error_response(
                f"Unknown command: {prompt}",
                error_type="UNKNOWN_COMMAND_ERROR"
            )
            
    except Exception as e:
        logger.error(f"Error handling command: {str(e)}", exc_info=True)
        return create_error_response(
            f"Command execution failed: {str(e)}",
            error_type="COMMAND_EXECUTION_ERROR"
        )


def handle_getdata_command(
    session_id: str,
    s3_manager: S3SessionManager
) -> Dict[str, Any]:
    """
    Handle /getdata command - fetch all OSDU wells, wellbores, and welllogs and store in S3.
    
    This function delegates to CommandRouter which handles the complete data fetching:
    1. Fetch wells from OSDU
    2. Fetch wellbores for all wells
    3. Fetch welllogs for all wellbores
    4. Link them together in hierarchical structure
    5. Transform to metadata and GeoJSON formats
    6. Store in S3 and generate signed URLs
    
    Args:
        session_id: Session identifier
        s3_manager: S3 session manager instance
        
    Note:
        OSDU authentication is handled via environment variables:
        - OSDU_BASE_URL: OSDU instance base URL
        - OSDU_PARTITION_ID: OSDU data partition ID
        - OSDU_CLIENT_ID: Cognito client ID for authentication
        - OSDU_CLIENT_SECRET: Cognito client secret for authentication
        - OSDU_USER_POOL_ID: Cognito user pool ID
        - OSDU_USERNAME: OSDU username
        - OSDU_PASSWORD: OSDU password
        
    Returns:
        Response with file references and statistics
        
    Error Handling:
        - OSDU API errors (401, 404, 500): Returns user-friendly error messages
        - S3 storage errors: Logs error and returns error response
        - Data transformation errors: Logs error and returns error response
    """
    logger.info("=== EXECUTING /getdata COMMAND ===")
    
    try:
        # Initialize command router
        logger.info("Initializing command router...")
        try:
            command_router = CommandRouter(S3_BUCKET)
            logger.info("✓ Command router initialized")
        except Exception as router_error:
            logger.error(f"Failed to initialize command router: {str(router_error)}", exc_info=True)
            return create_error_response(
                "Failed to initialize command router.",
                error_type="ROUTER_INIT_ERROR"
            )
        
        # Execute /getdata command via command router
        # This handles: wells, wellbores, welllogs fetching, linking, transformation, and S3 storage
        logger.info("Executing /getdata via command router...")
        try:
            result = command_router._execute_getdata(session_id)
            logger.info("✓ Command router execution complete")
        except Exception as exec_error:
            error_message = str(exec_error)
            logger.error(f"Command execution error: {error_message}", exc_info=True)
            
            # Handle specific error types
            if "401" in error_message or "authentication failed" in error_message.lower():
                return create_error_response(
                    "OSDU authentication failed. Please check your credentials and try again.",
                    error_type="OSDU_AUTH_ERROR"
                )
            elif "404" in error_message or "not found" in error_message.lower():
                return create_error_response(
                    "OSDU endpoint not found. Please verify your OSDU instance URL.",
                    error_type="OSDU_NOT_FOUND_ERROR"
                )
            elif "timeout" in error_message.lower():
                return create_error_response(
                    "OSDU API request timed out. Please try again.",
                    error_type="OSDU_TIMEOUT_ERROR"
                )
            elif "connection" in error_message.lower():
                return create_error_response(
                    "Failed to connect to OSDU instance. Please check the URL and network connectivity.",
                    error_type="OSDU_CONNECTION_ERROR"
                )
            else:
                return create_error_response(
                    f"Command execution failed: {error_message}",
                    error_type="COMMAND_EXECUTION_ERROR"
                )
        
        # Extract results from command router response
        stats = result.get('stats', {})
        files = result.get('files', {})
        metadata_url = files.get('metadata')
        geojson_url = files.get('geojson')
        
        # Update session history
        logger.info("Updating session history...")
        try:
            history = s3_manager.get_history(session_id)
            history['messages'].append({
                'id': generate_message_id(),
                'role': 'user',
                'content': '/getdata',
                'timestamp': int(datetime.now().timestamp() * 1000)
            })
            history['messages'].append({
                'id': generate_message_id(),
                'role': 'ai',
                'content': f"Retrieved {stats['wellCount']} wells from OSDU",
                'timestamp': int(datetime.now().timestamp() * 1000),
                'files': {
                    'metadata': 'all_well_metadata.json',
                    'geojson': 'all_well_geojson.json',
                    'version': 0
                },
                'stats': stats
            })
            s3_manager.store_history(session_id, history)
            logger.info("✓ Session history updated")
        except Exception as history_error:
            logger.error(f"Session history update error: {str(history_error)}", exc_info=True)
            # Continue even if history update fails
            logger.warning("Session history update failed, but operation completed successfully")
        
        logger.info("=" * 80)
        logger.info("✅ /getdata COMMAND COMPLETED SUCCESSFULLY")
        logger.info(f"   Wells: {stats.get('wellCount', 0)}")
        logger.info(f"   Wellbores: {stats.get('wellboreCount', 0)}")
        logger.info(f"   Welllogs: {stats.get('welllogCount', 0)}")
        logger.info("=" * 80)
        
        # Build comprehensive stats message
        message_parts = [f"{stats['wellCount']} wells"]
        if stats.get('wellboreCount', 0) > 0:
            message_parts.append(f"{stats['wellboreCount']} wellbores")
        if stats.get('welllogCount', 0) > 0:
            message_parts.append(f"{stats['welllogCount']} welllogs")
        
        stats_message = f"Successfully retrieved {', '.join(message_parts)} from OSDU"
        
        # Add note if wellbore/welllog data is not available
        if stats.get('wellboreCount', 0) == 0 and stats.get('welllogCount', 0) == 0:
            stats_message += " (well-level data only)"
        
        return {
            'type': 'complete',
            'data': {
                'message': stats_message,
                'files': {
                    'metadata': metadata_url,
                    'geojson': geojson_url
                },
                'stats': stats
            }
        }
        
    except Exception as e:
        # Catch-all for unexpected errors
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()
        }
        
        logger.error("=" * 80)
        logger.error("UNEXPECTED ERROR IN /getdata COMMAND")
        logger.error("=" * 80)
        logger.error(f"Error Type: {error_details['error_type']}")
        logger.error(f"Error Message: {error_details['error_message']}")
        logger.error(f"Traceback:\n{error_details['traceback']}")
        logger.error("=" * 80)
        
        return create_error_response(
            f"Unexpected error in /getdata: {error_details['error_message']}",
            error_type="UNEXPECTED_ERROR"
        )


def handle_reset_command(
    session_id: str,
    s3_manager: S3SessionManager
) -> Dict[str, Any]:
    """
    Handle /reset command - clear filtered files and history.
    
    Args:
        session_id: Session identifier
        s3_manager: S3 session manager instance
        
    Returns:
        Success response
        
    Error Handling:
        - S3 deletion errors: Logs error and returns error response
        - Permission errors: Returns user-friendly error message
    """
    logger.info("=== EXECUTING /reset COMMAND ===")
    logger.info(f"Session ID: {session_id}")
    
    try:
        # Reset session (delete ALL files including all_well_* and filtered files, clear history)
        logger.info("Resetting session in S3...")
        try:
            s3_manager.reset_session(session_id, keep_all_files=False)
            logger.info("✓ Session reset in S3")
        except Exception as s3_error:
            error_message = str(s3_error)
            logger.error(f"S3 reset error: {error_message}", exc_info=True)
            
            # Handle specific S3 error types
            if "AccessDenied" in error_message or "permission" in error_message.lower():
                return create_error_response(
                    "Permission denied: Unable to reset session. Please contact support.",
                    error_type="S3_PERMISSION_ERROR"
                )
            elif "NoSuchBucket" in error_message:
                return create_error_response(
                    "Storage bucket not found. Please contact support.",
                    error_type="S3_BUCKET_ERROR"
                )
            else:
                return create_error_response(
                    f"Failed to reset session: {error_message}",
                    error_type="S3_RESET_ERROR"
                )
        
        logger.info("=" * 80)
        logger.info("✅ /reset COMMAND COMPLETED SUCCESSFULLY")
        logger.info(f"   Session {session_id} reset")
        logger.info(f"   All files deleted (including all_well_* and filtered_*)")
        logger.info(f"   History cleared")
        logger.info("=" * 80)
        
        return {
            'type': 'complete',
            'data': {
                'message': 'Session reset successfully. All data and history cleared.'
            }
        }
        
    except Exception as e:
        # Catch-all for unexpected errors
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()
        }
        
        logger.error("=" * 80)
        logger.error("UNEXPECTED ERROR IN /reset COMMAND")
        logger.error("=" * 80)
        logger.error(f"Error Type: {error_details['error_type']}")
        logger.error(f"Error Message: {error_details['error_message']}")
        logger.error(f"Traceback:\n{error_details['traceback']}")
        logger.error("=" * 80)
        
        return create_error_response(
            f"Unexpected error in /reset: {error_details['error_message']}",
            error_type="UNEXPECTED_ERROR"
        )


def handle_natural_language_query(
    prompt: str,
    session_id: str,
    existing_context: Optional[Dict[str, Any]],
    polygon_filters: Optional[List[Dict[str, Any]]],
    s3_manager: S3SessionManager
) -> Dict[str, Any]:
    """
    Handle natural language query using Strands Agent with streaming response.
    
    This function implements streaming response handling for natural language queries.
    It streams thought steps from the Strands Agent as they occur, then streams the
    final results with S3 signed URLs. Errors and timeouts are handled gracefully,
    and session history is updated in S3 after successful processing.
    
    Streaming Flow:
    1. Initialize Strands Agent processor
    2. Load existing context from S3 if available
    3. Stream thought steps as agent processes query
    4. Store filtered results in S3 with versioning
    5. Generate S3 signed URLs for frontend access
    6. Stream final results with files and statistics
    7. Update session history in S3
    
    Args:
        prompt: User's natural language query
        session_id: Session identifier
        existing_context: Previous search context
        polygon_filters: List of polygon geometries for spatial filtering
        s3_manager: S3 session manager instance
        
    Note:
        OSDU authentication is handled via environment variables:
        - OSDU_BASE_URL: OSDU instance base URL
        - OSDU_PARTITION_ID: OSDU data partition ID
        - OSDU_CLIENT_ID, OSDU_CLIENT_SECRET, etc. for authentication
        
    Returns:
        Streaming response with thought steps and results
        
    Error Handling:
        - Strands Agent errors: Logs error and returns error response
        - S3 storage errors: Logs error but continues with in-memory data
        - Context loading errors: Continues without context
        - Timeout errors: Returns user-friendly timeout message
        
    Requirements Addressed:
        - Requirement 1.4: Stream responses back to frontend via AppSync
        - Requirement 1.5: Handle errors and timeouts gracefully
        - Requirement 6.1: Stream thought steps from Strands Agent
        - Requirement 6.2: Stream findings to frontend
        - Requirement 6.3: Do not stream metadata files themselves
        - Requirement 6.4: Stream count of wells, wellbores, and welllogs found
    """
    logger.info("=== PROCESSING NATURAL LANGUAGE QUERY WITH STREAMING ===")
    logger.info(f"Query: {prompt}")
    logger.info(f"Session ID: {session_id}")
    if polygon_filters:
        logger.info(f"Polygon Filters: {len(polygon_filters)} polygon(s)")
        for i, polygon in enumerate(polygon_filters):
            logger.info(f"  Polygon {i+1}: {polygon.get('name', 'Unnamed')} - Area: {polygon.get('area', 'N/A')} sq meters")
            logger.info(f"    Coordinates: {len(polygon.get('geometry', {}).get('coordinates', [[]])[0])} points")
    
    # Track streaming state
    thought_steps_streamed = []
    
    try:
        # Step 1: Initialize Strands Agent processor
        logger.info("Step 1: Initializing Strands Agent processor...")
        try:
            agent_processor = StrandsAgentProcessor(
                osdu_base_url=OSDU_BASE_URL,
                osdu_partition_id=OSDU_PARTITION_ID
            )
            logger.info("✓ Strands Agent processor initialized")
        except Exception as agent_init_error:
            logger.error(f"Failed to initialize Strands Agent: {str(agent_init_error)}", exc_info=True)
            return create_error_response(
                "Failed to initialize AI agent. Please try again.",
                error_type="AGENT_INIT_ERROR"
            )
        
        # Step 2: Load existing context if available
        logger.info("Step 2: Loading existing context...")
        session_context = None
        
        # Parse existing_context if it's a JSON string
        if existing_context and isinstance(existing_context, str):
            try:
                existing_context = json.loads(existing_context)
                logger.info("✓ Parsed existing_context from JSON string")
            except json.JSONDecodeError as json_error:
                logger.warning(f"Failed to parse existing_context JSON: {str(json_error)}")
                existing_context = None
        
        # Check if frontend indicates existing data is available
        if existing_context and existing_context.get('hasExistingData'):
            logger.info("✓ Frontend indicates existing data available")
            logger.info(f"  - Well count: {existing_context.get('wellCount', 'unknown')}")
            logger.info(f"  - Query type: {existing_context.get('queryType', 'unknown')}")
            logger.info(f"  - Is filter operation: {existing_context.get('isFilterOperation', False)}")
            
            # Load actual well data from S3 using sessionId
            try:
                all_metadata = s3_manager.get_metadata(session_id)
                session_context = {
                    'allWells': all_metadata,
                    'previousFilters': [],
                    'queryType': existing_context.get('queryType'),
                    'isFilterOperation': existing_context.get('isFilterOperation', False)
                }
                logger.info(f"✓ Loaded {len(all_metadata)} wells from S3 for session {session_id}")
            except Exception as s3_error:
                logger.warning(f"Failed to load wells from S3: {str(s3_error)}")
                logger.info("Continuing without context - will fetch fresh data from OSDU")
                session_context = None
        elif existing_context:
            # Legacy support: if context contains wells directly (old behavior)
            if 'wells' in existing_context:
                logger.warning("⚠️ Received wells in context (legacy behavior) - this should not happen")
                logger.info("✓ Using provided context with wells")
                session_context = {
                    'allWells': existing_context.get('wells', []),
                    'previousFilters': [],
                    'queryType': existing_context.get('queryType'),
                    'isFilterOperation': existing_context.get('isFilterOperation', False)
                }
            else:
                logger.info("Context provided but no hasExistingData flag - treating as fresh query")
                session_context = None
        else:
            # No context provided - try to load from S3 anyway
            try:
                all_metadata = s3_manager.get_metadata(session_id)
                session_context = {
                    'allWells': all_metadata,
                    'previousFilters': []
                }
                logger.info(f"✓ Loaded context from S3: {len(all_metadata)} wells")
            except Exception as context_error:
                logger.info(f"No existing context found in S3: {str(context_error)}")
                logger.info("Starting fresh query - will fetch from OSDU")
                logger.info("Continuing without context - agent will search OSDU directly")
        
        # Step 3: Process query with Strands Agent and stream thought steps
        logger.info("Step 3: Invoking Strands Agent with streaming...")
        
        # Create initial thought step for query processing
        initial_thought_step = {
            'id': 'query_analysis',
            'type': 'analysis',
            'title': 'Analyzing Query',
            'summary': f'Processing natural language query: "{prompt[:50]}{"..." if len(prompt) > 50 else ""}"',
            'status': 'processing',
            'timestamp': int(datetime.now().timestamp() * 1000)
        }
        thought_steps_streamed.append(initial_thought_step)
        logger.info(f"Streaming thought step: {initial_thought_step['title']}")
        
        # Process query with timeout handling
        try:
            result = agent_processor.process_query(
                query=prompt,
                session_id=session_id,
                existing_context=session_context,
                polygon_filters=polygon_filters
            )
            
            # Mark initial thought step as complete
            initial_thought_step['status'] = 'complete'
            initial_thought_step['summary'] = 'Query analysis complete'
            
            # Stream additional thought steps from agent
            if result.get('thought_steps'):
                for thought_step in result['thought_steps']:
                    thought_steps_streamed.append(thought_step)
                    logger.info(f"Streaming thought step: {thought_step.get('title', 'Unknown')}")
            
            logger.info("✓ Strands Agent processing complete")
            
        except TimeoutError as timeout_error:
            logger.error(f"Strands Agent timeout: {str(timeout_error)}", exc_info=True)
            initial_thought_step['status'] = 'error'
            initial_thought_step['summary'] = 'Query processing timed out'
            return create_error_response(
                "AI agent processing timed out. Please try a simpler query or try again.",
                error_type="AGENT_TIMEOUT_ERROR"
            )
        except Exception as agent_error:
            error_message = str(agent_error)
            logger.error(f"Strands Agent processing error: {error_message}", exc_info=True)
            initial_thought_step['status'] = 'error'
            initial_thought_step['summary'] = f'Error: {error_message[:100]}'
            
            # Handle specific agent error types
            if "timeout" in error_message.lower():
                return create_error_response(
                    "AI agent processing timed out. Please try a simpler query or try again.",
                    error_type="AGENT_TIMEOUT_ERROR"
                )
            elif "model" in error_message.lower() or "bedrock" in error_message.lower():
                return create_error_response(
                    "AI model error. Please try again.",
                    error_type="AGENT_MODEL_ERROR"
                )
            else:
                return create_error_response(
                    f"AI agent processing failed: {error_message}",
                    error_type="AGENT_PROCESSING_ERROR"
                )
        
        # Step 4: Get next version number for all results (always use versioned files)
        logger.info("Step 4: Getting next version number...")
        try:
            next_version = s3_manager.get_next_version(session_id)
            logger.info(f"✓ Next version: {next_version}")
        except Exception as version_error:
            logger.error(f"Error getting next version: {str(version_error)}", exc_info=True)
            # Default to version 1 if error
            next_version = 1
            logger.warning(f"Using default version: {next_version}")
        
        # Step 6: Store filtered results in S3 if available
        files_result = None
        if result.get('filtered_data'):
            logger.info(f"Step 5: Storing filtered results as version {next_version}...")
            
            # Create thought step for data storage
            storage_thought_step = {
                'id': 'data_storage',
                'type': 'storage',
                'title': 'Storing Results',
                'summary': f'Saving filtered data to S3 (version {next_version})',
                'status': 'processing',
                'timestamp': int(datetime.now().timestamp() * 1000)
            }
            thought_steps_streamed.append(storage_thought_step)
            logger.info(f"Streaming thought step: {storage_thought_step['title']}")
            
            filtered_metadata = result['filtered_data']['metadata']
            filtered_geojson = result['filtered_data']['geojson']
            
            # Store metadata
            try:
                s3_manager.store_metadata(session_id, filtered_metadata, next_version)
                logger.info("✓ Filtered metadata stored")
            except Exception as s3_metadata_error:
                logger.error(f"S3 metadata storage error: {str(s3_metadata_error)}", exc_info=True)
                # Continue without storing - return in-memory data
                logger.warning("Continuing with in-memory data (not persisted)")
                storage_thought_step['status'] = 'warning'
                storage_thought_step['summary'] = 'Data stored in memory only (S3 storage failed)'
            
            # Store GeoJSON
            try:
                s3_manager.store_geojson(session_id, filtered_geojson, next_version)
                logger.info("✓ Filtered GeoJSON stored")
            except Exception as s3_geojson_error:
                logger.error(f"S3 GeoJSON storage error: {str(s3_geojson_error)}", exc_info=True)
                # Continue without storing
                logger.warning("GeoJSON not persisted, but available in response")
            
            # Step 7: Generate signed URLs
            logger.info("Step 7: Generating S3 signed URLs...")
            try:
                # Always use versioned filenames
                metadata_filename = f'well_metadata_{next_version:03d}.json'
                geojson_filename = f'well_geojson_{next_version:03d}.json'
                
                metadata_url = s3_manager.get_signed_url(session_id, metadata_filename)
                geojson_url = s3_manager.get_signed_url(session_id, geojson_filename)
                
                files_result = {
                    'metadata': metadata_url,
                    'geojson': geojson_url
                }
                logger.info("✓ Signed URLs generated")
                storage_thought_step['status'] = 'complete'
                storage_thought_step['summary'] = f'Results stored successfully (version {next_version})'
            except Exception as url_error:
                logger.error(f"Signed URL generation error: {str(url_error)}", exc_info=True)
                # Continue without URLs - frontend will need to handle missing files
                logger.warning("Signed URLs not available")
                storage_thought_step['status'] = 'warning'
                storage_thought_step['summary'] = 'Data stored but URLs unavailable'
                files_result = None
        else:
            logger.info("Step 6-7: No filtered data to store, skipping S3 operations")
        
        # Step 8: Update session history in S3
        logger.info("Step 7: Updating session history...")
        try:
            history = s3_manager.get_history(session_id)
            history['messages'].append({
                'id': generate_message_id(),
                'role': 'user',
                'content': prompt,
                'timestamp': int(datetime.now().timestamp() * 1000)
            })
            # Build files object - always use versioned filenames
            files_obj = None
            if result.get('filtered_data'):
                files_obj = {
                    'metadata': f'well_metadata_{next_version:03d}.json',
                    'geojson': f'well_geojson_{next_version:03d}.json',
                    'version': next_version
                }
            
            history['messages'].append({
                'id': generate_message_id(),
                'role': 'ai',
                'content': result.get('message', 'Query processed'),
                'timestamp': int(datetime.now().timestamp() * 1000),
                'files': files_obj,
                'stats': result.get('stats')
            })
            s3_manager.store_history(session_id, history)
            logger.info("✓ Session history updated")
        except Exception as history_error:
            logger.error(f"Session history update error: {str(history_error)}", exc_info=True)
            # Continue even if history update fails
            logger.warning("Session history not updated, but query completed successfully")
        
        # Step 8: Stream final results
        logger.info("Step 8: Preparing final streaming response...")
        logger.info("=" * 80)
        logger.info("✅ NATURAL LANGUAGE QUERY PROCESSED SUCCESSFULLY")
        logger.info(f"   Query: {prompt[:50]}{'...' if len(prompt) > 50 else ''}")
        if result.get('stats'):
            logger.info(f"   Wells: {result['stats'].get('wellCount', 0)}")
            logger.info(f"   Wellbores: {result['stats'].get('wellboreCount', 0)}")
            logger.info(f"   Welllogs: {result['stats'].get('welllogCount', 0)}")
        logger.info(f"   Thought steps streamed: {len(thought_steps_streamed)}")
        logger.info("=" * 80)
        
        # Return complete response with all streamed thought steps
        # Note: In a true streaming implementation, these would be yielded incrementally
        # For AppSync GraphQL, the response structure supports streaming via the 'stream' type
        return {
            'type': 'complete',
            'data': {
                'message': result.get('message', 'Query processed successfully'),
                'thoughtSteps': thought_steps_streamed,  # All thought steps collected during processing
                'files': files_result,  # S3 signed URLs (not the files themselves)
                'stats': result.get('stats', {
                    'wellCount': 0,
                    'wellboreCount': 0,
                    'welllogCount': 0
                }),
                'isGetDataCommand': False  # All queries are now filter operations
            }
        }
        
    except Exception as e:
        # Catch-all for unexpected errors
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'traceback': traceback.format_exc()
        }
        
        logger.error("=" * 80)
        logger.error("UNEXPECTED ERROR IN NATURAL LANGUAGE QUERY")
        logger.error("=" * 80)
        logger.error(f"Error Type: {error_details['error_type']}")
        logger.error(f"Error Message: {error_details['error_message']}")
        logger.error(f"Traceback:\n{error_details['traceback']}")
        logger.error("=" * 80)
        
        # Mark any in-progress thought steps as errored
        for thought_step in thought_steps_streamed:
            if thought_step.get('status') == 'processing':
                thought_step['status'] = 'error'
                thought_step['summary'] = f'Error: {error_details["error_message"][:100]}'
        
        return create_error_response(
            f"Unexpected error processing query: {error_details['error_message']}",
            error_type="UNEXPECTED_ERROR"
        )


# Helper functions

def sanitize_event_for_logging(event: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize event data for logging by removing sensitive information.
    
    Args:
        event: Raw event dictionary
        
    Returns:
        Sanitized event dictionary safe for logging
        
    Note:
        OSDU credentials are stored in Lambda environment variables, not in event data.
    """
    import copy
    sanitized = copy.deepcopy(event)
    
    # No sensitive data expected in event - OSDU auth uses environment variables
    # This function is kept for future extensibility
    
    return sanitized


def create_error_response(error_message: str, error_type: str = "GENERAL_ERROR") -> Dict[str, Any]:
    """
    Create standardized error response.
    
    Args:
        error_message: Human-readable error message
        error_type: Error type classification for frontend handling
        
    Returns:
        Structured error response dictionary
        
    Error Types:
        - OSDU_AUTH_ERROR: OSDU authentication failure (401)
        - OSDU_NOT_FOUND_ERROR: OSDU endpoint not found (404)
        - OSDU_API_ERROR: General OSDU API error (500, etc.)
        - OSDU_TIMEOUT_ERROR: OSDU request timeout
        - OSDU_CONNECTION_ERROR: Cannot connect to OSDU
        - S3_STORAGE_ERROR: S3 storage operation failed
        - S3_PERMISSION_ERROR: S3 permission denied
        - S3_URL_ERROR: S3 signed URL generation failed
        - AGENT_INIT_ERROR: Strands Agent initialization failed
        - AGENT_PROCESSING_ERROR: Strands Agent processing failed
        - AGENT_TIMEOUT_ERROR: Strands Agent timeout
        - DATA_TRANSFORMATION_ERROR: Data transformation failed
        - VALIDATION_ERROR: Input validation failed
        - UNEXPECTED_ERROR: Unexpected/unhandled error
    """
    logger.error("=" * 80)
    logger.error(f"ERROR RESPONSE CREATED")
    logger.error(f"Type: {error_type}")
    logger.error(f"Message: {error_message}")
    logger.error("=" * 80)
    
    return {
        'type': 'error',
        'error': error_message,
        'errorType': error_type,
        'timestamp': int(datetime.now().timestamp())  # Use seconds, not milliseconds
    }


def generate_message_id() -> str:
    """Generate unique message ID."""
    import uuid
    return str(uuid.uuid4())





def calculate_statistics(metadata: List[Dict[str, Any]]) -> Dict[str, int]:
    """
    Calculate statistics from metadata.
    
    Args:
        metadata: Well metadata list
        
    Returns:
        Statistics dictionary with counts
    """
    well_count = len(metadata)
    wellbore_count = sum(len(well.get('wellbores', [])) for well in metadata)
    welllog_count = sum(
        len(wellbore.get('welllogs', []))
        for well in metadata
        for wellbore in well.get('wellbores', [])
    )
    
    return {
        'wellCount': well_count,
        'wellboreCount': wellbore_count,
        'welllogCount': welllog_count
    }
