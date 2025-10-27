"""
Lambda handler for Strands Agent invocation
Wraps the multi-agent system for AWS Lambda execution
Build: 2025-10-23-11:35-complete-dependencies
Task 10: Enhanced dependency loading time tracking
"""
import json
import logging
import os
import sys
import time
from typing import Dict, Any
import uuid

# Task 10: Track total import time
_module_load_start = time.time()

# Add current directory to Python path for imports
sys.path.insert(0, os.path.dirname(__file__))

# Task 10: Track boto3 import time
_boto3_import_start = time.time()
import boto3
_boto3_import_time = time.time() - _boto3_import_start

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('renewable_agent_lambda')

# Task 10: Track psutil import time
_psutil_import_start = time.time()
try:
    import psutil
    PSUTIL_AVAILABLE = True
    _psutil_import_time = time.time() - _psutil_import_start
except ImportError:
    logger.warning("psutil not available - memory tracking will be limited")
    PSUTIL_AVAILABLE = False
    _psutil_import_time = 0.0

# Task 10: Track agent imports time
_agents_import_start = time.time()
try:
    from multi_agent import create_agent_graph
    from terrain_agent import terrain_agent
    from layout_agent import layout_agent
    from simulation_agent import simulation_agent
    from report_agent import report_agent
    _agents_import_time = time.time() - _agents_import_start
except ImportError as e:
    logger.error(f"Failed to import agents: {e}")
    _agents_import_time = 0.0
    raise

# Task 10: Track CloudWatch metrics import time
_cloudwatch_import_start = time.time()
try:
    from cloudwatch_metrics import publish_all_performance_metrics
    _cloudwatch_import_time = time.time() - _cloudwatch_import_start
except ImportError as e:
    logger.warning(f"CloudWatch metrics module not available: {e}")
    _cloudwatch_import_time = 0.0
    # Define no-op function if import fails
    def publish_all_performance_metrics(*args, **kwargs):
        pass

# Task 10: Calculate total module load time
_total_module_load_time = time.time() - _module_load_start

# Task 10: Log dependency loading times
logger.info(f"📦 Dependency loading times:")
logger.info(f"  - boto3: {_boto3_import_time:.3f}s")
logger.info(f"  - psutil: {_psutil_import_time:.3f}s")
logger.info(f"  - agents: {_agents_import_time:.3f}s")
logger.info(f"  - cloudwatch_metrics: {_cloudwatch_import_time:.3f}s")
logger.info(f"  - TOTAL: {_total_module_load_time:.3f}s")

# Global agent instances (initialized once per Lambda container)
_agent_graph = None
_terrain_agent_instance = None
_layout_agent_instance = None
_simulation_agent_instance = None
_report_agent_instance = None

# Performance monitoring globals (Task 2.1: Cold/warm start detection)
_init_complete = False
_init_start_time = time.time()
_init_time = 0.0

# Task 10: Dependency loading time tracking (populated at module load time)
_dependency_load_times = {
    'boto3': _boto3_import_time,
    'psutil': _psutil_import_time,
    'agents': _agents_import_time,
    'cloudwatch_metrics': _cloudwatch_import_time,
    'total_imports': _total_module_load_time
}

# Progress tracking (Task 3: Progress updates during initialization)
_progress_updates = []

# DynamoDB client for progress storage (Task 4.2)
_dynamodb = None
_agent_progress_table = os.environ.get('AGENT_PROGRESS_TABLE', 'AgentProgress')

# Task 7.1: Bedrock connection pooling
_bedrock_client = None
_bedrock_connection_time = 0.0


def publish_dependency_load_metrics(agent_type: str):
    """
    Publish dependency loading time metrics to CloudWatch
    
    Task 10: Log dependency loading times for cold start analysis
    
    Args:
        agent_type: Type of agent (terrain, layout, simulation, report)
    """
    try:
        cloudwatch = boto3.client('cloudwatch')
        
        metric_data = []
        
        # Publish individual dependency load times
        for dep_name, load_time in _dependency_load_times.items():
            if load_time > 0:
                metric_data.append({
                    'MetricName': 'DependencyLoadTime',
                    'Value': load_time,
                    'Unit': 'Seconds',
                    'Timestamp': time.time(),
                    'Dimensions': [
                        {
                            'Name': 'AgentType',
                            'Value': agent_type
                        },
                        {
                            'Name': 'Dependency',
                            'Value': dep_name
                        }
                    ]
                })
        
        # Publish all metrics in batch
        if metric_data:
            cloudwatch.put_metric_data(
                Namespace='StrandsAgent/Performance',
                MetricData=metric_data
            )
            logger.info(f"📊 Published {len(metric_data)} dependency load time metrics")
        
    except Exception as e:
        # Don't fail the request if metrics fail
        logger.error(f"Failed to publish dependency load metrics: {e}", exc_info=True)


def get_bedrock_client():
    """
    Get or create Bedrock runtime client (singleton pattern for connection pooling)
    
    Task 7.1: Create global Bedrock client variable and initialize on first use.
    This client is reused across warm Lambda invocations to save connection time.
    
    Returns:
        boto3.client: Bedrock runtime client
    """
    global _bedrock_client, _bedrock_connection_time
    
    if _bedrock_client is None:
        connection_start = time.time()
        logger.info("🔌 Creating new Bedrock runtime client (connection pooling)")
        
        _bedrock_client = boto3.client(
            'bedrock-runtime',
            region_name=os.environ.get('AWS_REGION', 'us-west-2'),
            config=boto3.session.Config(
                read_timeout=300,  # 5 minutes for reading responses
                connect_timeout=60,  # 1 minute for initial connection
                retries={
                    'max_attempts': 5,
                    'total_max_attempts': 10
                }
            )
        )
        
        _bedrock_connection_time = time.time() - connection_start
        logger.info(f"✅ Bedrock client created in {_bedrock_connection_time:.2f}s")
    else:
        logger.info("♻️  Reusing existing Bedrock client (connection pooled)")
    
    return _bedrock_client


def get_dynamodb_client():
    """Get or create DynamoDB client (singleton pattern)"""
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb')
    return _dynamodb


def write_progress_to_dynamodb(request_id: str, progress_updates: list, status: str):
    """
    Write progress updates to DynamoDB for polling
    
    Args:
        request_id: Unique request identifier
        progress_updates: List of progress update dictionaries
        status: Current status ('in_progress', 'complete', 'error')
    """
    try:
        dynamodb = get_dynamodb_client()
        table = dynamodb.Table(_agent_progress_table)
        
        # Calculate TTL (24 hours from now)
        ttl = int(time.time()) + (24 * 60 * 60)
        
        # Write to DynamoDB
        table.put_item(
            Item={
                'requestId': request_id,
                'steps': progress_updates,
                'status': status,
                'createdAt': int(time.time() * 1000),  # milliseconds
                'updatedAt': int(time.time() * 1000),  # milliseconds
                'expiresAt': ttl
            }
        )
        
        logger.info(f"✅ Progress written to DynamoDB: {request_id} (status: {status})")
        
    except Exception as e:
        # Don't fail the request if progress tracking fails
        logger.error(f"Failed to write progress to DynamoDB: {e}", exc_info=True)


# Task 3.1: Implement send_progress function
def send_progress(step: str, message: str, elapsed_time: float, progress_list: list) -> Dict[str, Any]:
    """
    Send progress update with structured format
    
    Args:
        step: Step identifier (e.g., 'init', 'bedrock', 'tools', 'agent', 'thinking', 'executing', 'complete')
        message: Human-readable progress message
        elapsed_time: Time elapsed since handler start (seconds)
        progress_list: List to append progress update to
    
    Returns:
        Progress update dictionary
    """
    progress = {
        'type': 'progress',
        'step': step,
        'message': message,
        'elapsed': round(elapsed_time, 2),
        'timestamp': time.time()
    }
    
    # Log progress with structured format
    logger.info(f"PROGRESS: {json.dumps(progress)}")
    
    # Store progress update for return
    progress_list.append(progress)
    
    return progress


# Removed initialize_agents() - agents are called directly as functions


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for renewable energy agent invocations
    
    Event structure:
    {
        "agent": "multi" | "terrain" | "layout" | "simulation" | "report",
        "query": "user query string",
        "parameters": {
            "project_id": "...",
            "latitude": 35.0,
            "longitude": -101.0,
            ...
        }
    }
    """
    # Task 2.2: Track execution time
    handler_start_time = time.time()
    
    # Task 3: Initialize progress tracking list
    progress_updates = []
    
    # Task 2.1: Detect cold vs warm start
    global _init_complete, _init_time
    is_cold_start = not _init_complete
    
    if is_cold_start:
        logger.info("🥶 COLD START - First invocation of this Lambda container")
        _init_time = time.time() - _init_start_time
        logger.info(f"⏱️  Initialization time: {_init_time:.2f}s")
        
        # Task 10: Publish dependency loading metrics on cold start
        agent_type = event.get('agent', 'unknown')
        publish_dependency_load_metrics(agent_type)
        
        # Task 3: Send progress update for cold start initialization
        send_progress(
            'init',
            '🚀 Initializing Strands Agent system...',
            time.time() - handler_start_time,
            progress_updates
        )
    else:
        logger.info("⚡ WARM START - Reusing initialized Lambda container")
        
        # Task 3: Send progress update for warm start
        send_progress(
            'warm',
            '⚡ Using warm agent instance (fast response)',
            time.time() - handler_start_time,
            progress_updates
        )
    
    # Task 2.3: Track memory usage at start
    memory_start_mb = 0.0
    if PSUTIL_AVAILABLE:
        process = psutil.Process()
        memory_info = process.memory_info()
        memory_start_mb = memory_info.rss / 1024 / 1024
        logger.info(f"💾 Memory at start: {memory_start_mb:.2f} MB")
    
    try:
        logger.info(f"Received event: {json.dumps(event, default=str)}")
        
        # Task 4.2: Generate unique request ID for progress tracking
        request_id = event.get('requestId', str(uuid.uuid4()))
        logger.info(f"📋 Request ID: {request_id}")
        
        # Extract parameters
        agent_type = event.get('agent', 'layout')
        query = event.get('query', '')
        parameters = event.get('parameters', {})
        
        # Build full query with parameters
        if parameters:
            # Add parameters to query context
            param_str = "\n".join([f"{k}: {v}" for k, v in parameters.items()])
            full_query = f"{query}\n\nParameters:\n{param_str}"
        else:
            full_query = query
        
        logger.info(f"Invoking {agent_type} agent with query: {full_query[:200]}...")
        
        # Task 7.2: Get pooled Bedrock client (creates on first use, reuses on warm starts)
        bedrock_client_start = time.time()
        bedrock_client = get_bedrock_client()
        bedrock_client_time = time.time() - bedrock_client_start
        logger.info(f"⏱️  Bedrock client ready in {bedrock_client_time:.2f}s")
        
        # Task 3.2: Send progress update for Bedrock connection (during cold start)
        if is_cold_start:
            send_progress(
                'bedrock',
                f'🤖 Bedrock connection established ({bedrock_client_time:.1f}s)',
                time.time() - handler_start_time,
                progress_updates
            )
            # Task 4.2: Write progress to DynamoDB
            write_progress_to_dynamodb(request_id, progress_updates, 'in_progress')
        
        # Task 3.3: Send progress update for tool loading (during cold start)
        if is_cold_start:
            send_progress(
                'tools',
                f'🔧 Loading {agent_type} agent tools...',
                time.time() - handler_start_time,
                progress_updates
            )
            # Task 4.2: Write progress to DynamoDB
            write_progress_to_dynamodb(request_id, progress_updates, 'in_progress')
        
        # Task 3.4: Send progress update for agent initialization (during cold start)
        if is_cold_start:
            send_progress(
                'agent',
                f'🧠 Initializing {agent_type} AI agent with extended thinking...',
                time.time() - handler_start_time,
                progress_updates
            )
            # Task 4.2: Write progress to DynamoDB
            write_progress_to_dynamodb(request_id, progress_updates, 'in_progress')
        
        # Task 3.5: Send progress update for agent execution
        send_progress(
            'thinking',
            '💭 Agent analyzing your request...',
            time.time() - handler_start_time,
            progress_updates
        )
        # Task 4.2: Write progress to DynamoDB
        write_progress_to_dynamodb(request_id, progress_updates, 'in_progress')
        
        # Task 7.2: Call agent functions with pooled Bedrock client
        # The @tool decorated functions return string responses
        agent_execution_start = time.time()
        
        if agent_type == 'terrain':
            response_text = terrain_agent(query=full_query, bedrock_client=bedrock_client)
        elif agent_type == 'layout':
            response_text = layout_agent(query=full_query, bedrock_client=bedrock_client)
        elif agent_type == 'simulation':
            response_text = simulation_agent(query=full_query, bedrock_client=bedrock_client)
        elif agent_type == 'report':
            response_text = report_agent(query=full_query, bedrock_client=bedrock_client)
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': f'Unknown agent type: {agent_type}. Available: terrain, layout, simulation, report',
                    'errorCategory': 'INVALID_AGENT',
                    'progress': progress_updates
                })
            }
        
        # Task 3.5: Send progress update for tool execution
        send_progress(
            'executing',
            '⚙️ Executing tools and generating results...',
            time.time() - handler_start_time,
            progress_updates
        )
        # Task 4.2: Write progress to DynamoDB
        write_progress_to_dynamodb(request_id, progress_updates, 'in_progress')
        
        logger.info(f"Agent response received: {str(response_text)[:200]}...")
        
        # Mark initialization as complete after first successful execution
        if is_cold_start:
            _init_complete = True
            logger.info("✅ Cold start complete - container now warm")
            
            # Task 3.4: Send progress update for agent ready (cold start complete)
            send_progress(
                'ready',
                f'✅ Agent ready! (initialized in {time.time() - handler_start_time:.1f}s)',
                time.time() - handler_start_time,
                progress_updates
            )
        
        # Extract artifacts from response (if any)
        # The agents save artifacts to S3 and include URLs in their responses
        artifacts = extract_artifacts_from_response(response_text, agent_type, parameters)
        
        # Task 2.2: Calculate execution time
        execution_time = time.time() - handler_start_time
        logger.info(f"⏱️  Total execution time: {execution_time:.2f}s")
        
        # Task 3.5: Send final completion progress update
        send_progress(
            'complete',
            f'✅ Complete! (total time: {execution_time:.1f}s)',
            execution_time,
            progress_updates
        )
        # Task 4.2: Write final progress to DynamoDB with 'complete' status
        write_progress_to_dynamodb(request_id, progress_updates, 'complete')
        
        # Task 2.3: Track peak memory usage
        memory_peak_mb = 0.0
        memory_used_mb = 0.0
        if PSUTIL_AVAILABLE:
            process = psutil.Process()
            memory_info = process.memory_info()
            memory_peak_mb = memory_info.rss / 1024 / 1024
            memory_used_mb = memory_peak_mb - memory_start_mb
            logger.info(f"💾 Peak memory: {memory_peak_mb:.2f} MB (used: {memory_used_mb:.2f} MB)")
        
        # Task 2.4: Build performance metrics object
        performance_metrics = {
            'coldStart': is_cold_start,
            'initTime': round(_init_time, 2) if is_cold_start else 0.0,
            'executionTime': round(execution_time, 2),
            'memoryUsed': round(memory_peak_mb, 2) if PSUTIL_AVAILABLE else 0.0,
            'memoryDelta': round(memory_used_mb, 2) if PSUTIL_AVAILABLE else 0.0,
            # Task 10: Include dependency loading times
            'dependencyLoadTimes': {
                k: round(v, 3) for k, v in _dependency_load_times.items()
            } if is_cold_start else {}
        }
        
        logger.info(f"📊 Performance metrics: {json.dumps(performance_metrics)}")
        
        # Task 11.1: Publish performance metrics to CloudWatch
        publish_all_performance_metrics(
            is_cold_start=is_cold_start,
            execution_time=execution_time,
            memory_mb=memory_peak_mb,
            agent_type=agent_type,
            timed_out=False  # Success case - no timeout
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'agent': agent_type,
                'response': response_text,
                'artifacts': artifacts,
                'parameters': parameters,
                'performance': performance_metrics,
                'progress': progress_updates,  # Task 3: Include all progress updates
                'requestId': request_id  # Task 4.2: Include request ID for progress polling
            })
        }
        
    except Exception as e:
        logger.error(f"Error in Lambda handler: {e}", exc_info=True)
        
        # Task 2.2: Calculate execution time even on error
        execution_time = time.time() - handler_start_time
        logger.info(f"⏱️  Execution time (error): {execution_time:.2f}s")
        
        # Task 3.5: Send error progress update
        send_progress(
            'error',
            f'❌ Error occurred: {str(e)[:100]}',
            execution_time,
            progress_updates
        )
        # Task 4.2: Write error progress to DynamoDB
        request_id = event.get('requestId', 'unknown')
        write_progress_to_dynamodb(request_id, progress_updates, 'error')
        
        # Task 2.3: Track memory even on error
        memory_peak_mb = 0.0
        if PSUTIL_AVAILABLE:
            process = psutil.Process()
            memory_info = process.memory_info()
            memory_peak_mb = memory_info.rss / 1024 / 1024
            logger.info(f"💾 Peak memory (error): {memory_peak_mb:.2f} MB")
        
        # Task 2.4: Include performance metrics in error response
        performance_metrics = {
            'coldStart': is_cold_start,
            'initTime': round(_init_time, 2) if is_cold_start else 0.0,
            'executionTime': round(execution_time, 2),
            'memoryUsed': round(memory_peak_mb, 2) if PSUTIL_AVAILABLE else 0.0
        }
        
        # Task 11.1: Publish performance metrics to CloudWatch (error case)
        # Determine if this was a timeout error
        agent_type = event.get('agent', 'unknown')
        is_timeout = 'timeout' in str(e).lower() or 'timed out' in str(e).lower()
        
        publish_all_performance_metrics(
            is_cold_start=is_cold_start,
            execution_time=execution_time,
            memory_mb=memory_peak_mb,
            agent_type=agent_type,
            timed_out=is_timeout
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'errorCategory': 'AGENT_ERROR',
                'details': {
                    'error_type': type(e).__name__
                },
                'performance': performance_metrics,
                'progress': progress_updates,  # Task 3: Include progress updates even on error
                'requestId': request_id  # Task 4.2: Include request ID for progress polling
            })
        }


def extract_artifacts_from_response(response_text: str, agent_type: str, parameters: dict) -> list:
    """
    Extract artifact information from agent response
    
    For layout agent, we need to fetch the complete layout data from S3
    including GeoJSON for proper frontend rendering.
    
    Agents include artifact URLs in their responses like:
    - Map saved to: s3://bucket/path/map.html
    - Layout saved to: s3://bucket/path/layout.geojson
    """
    artifacts = []
    
    # Look for S3 URLs in response
    import re
    s3_pattern = r's3://([^/]+)/(.+?)(?:\s|$)'
    matches = re.findall(s3_pattern, response_text)
    
    # Look for project_id in response footer or parameters
    project_id_pattern = r'🤖 Project ID: (\S+)'
    project_match = re.search(project_id_pattern, response_text)
    project_id = project_match.group(1) if project_match else parameters.get('project_id', 'unknown')
    
    # CRITICAL FIX: For layout agent, fetch complete layout data from S3
    if agent_type == 'layout':
        logger.info(f"🔍 Layout agent detected - fetching complete layout data for project {project_id}")
        
        try:
            # Fetch the complete layout JSON from S3
            s3_client = boto3.client('s3')
            bucket = os.environ.get('S3_BUCKET', 'amplify-digitalassistant--workshopstoragebucketd9b-mx1aevbdpmqy')
            layout_key = f'renewable/layout/{project_id}/layout.json'
            
            logger.info(f"📥 Fetching layout data from s3://{bucket}/{layout_key}")
            
            try:
                response = s3_client.get_object(Bucket=bucket, Key=layout_key)
                layout_data = json.loads(response['Body'].read().decode('utf-8'))
                
                logger.info(f"✅ Layout data fetched successfully")
                logger.info(f"   - Turbines: {len(layout_data.get('turbines', []))}")
                logger.info(f"   - Features: {len(layout_data.get('features', []))}")
                logger.info(f"   - Algorithm: {layout_data.get('algorithm', 'unknown')}")
                
                # Build complete GeoJSON with turbines AND terrain features
                geojson_features = []
                
                # Add terrain features (OSM data) first
                for feature in layout_data.get('features', []):
                    geojson_features.append(feature)
                
                # Add perimeter
                if layout_data.get('perimeter'):
                    perimeter_feature = {
                        'type': 'Feature',
                        'geometry': layout_data['perimeter'],
                        'properties': {
                            'type': 'perimeter',
                            'fill': 'transparent',
                            'fill-opacity': 0,
                            'stroke': '#00ff00',  # Green
                            'stroke-width': 3,
                            'stroke-dasharray': '10, 5',
                            'stroke-opacity': 0.8
                        }
                    }
                    geojson_features.append(perimeter_feature)
                
                # Add turbines
                for turbine in layout_data.get('turbines', []):
                    turbine_feature = {
                        'type': 'Feature',
                        'geometry': {
                            'type': 'Point',
                            'coordinates': [turbine['longitude'], turbine['latitude']]
                        },
                        'properties': {
                            'type': 'turbine',
                            'turbine_id': turbine['id'],
                            'hub_height_m': turbine.get('hub_height', 80),
                            'rotor_diameter_m': turbine.get('rotor_diameter', 100),
                            'marker-color': '#0000ff',  # Blue
                            'marker-size': 'large',
                            'marker-symbol': 'wind-turbine'
                        }
                    }
                    geojson_features.append(turbine_feature)
                
                # Build complete GeoJSON
                complete_geojson = {
                    'type': 'FeatureCollection',
                    'features': geojson_features
                }
                
                # Extract turbine positions for frontend
                turbine_positions = []
                for turbine in layout_data.get('turbines', []):
                    turbine_positions.append({
                        'lat': turbine['latitude'],
                        'lng': turbine['longitude'],
                        'id': turbine['id']
                    })
                
                # Create complete layout artifact with all data
                layout_artifact = {
                    'messageContentType': 'wind_farm_layout',
                    'projectId': project_id,
                    'turbineCount': len(layout_data.get('turbines', [])),
                    'totalCapacity': layout_data.get('metadata', {}).get('total_capacity_mw', 0),
                    'turbinePositions': turbine_positions,
                    'layoutType': layout_data.get('algorithm', 'grid').title(),
                    'spacing': {
                        'downwind': layout_data.get('metadata', {}).get('spacing_d', 9),
                        'crosswind': layout_data.get('metadata', {}).get('spacing_d', 9)
                    },
                    # CRITICAL: Include complete GeoJSON with turbines AND terrain features
                    'geojson': complete_geojson,
                    
                    # CRITICAL: Track completed steps for wake button
                    'completedSteps': ['terrain', 'layout'],
                    
                    # Include S3 key for wake simulation
                    'layoutS3Key': layout_key,
                    
                    # Include metadata
                    'title': f"Wind Farm Layout - {project_id}",
                    'subtitle': f"{len(layout_data.get('turbines', []))} turbines, {layout_data.get('metadata', {}).get('total_capacity_mw', 0):.1f}MW"
                }
                
                logger.info(f"✅ Created complete layout artifact with {len(geojson_features)} GeoJSON features")
                logger.info(f"   - Turbines: {len([f for f in geojson_features if f.get('properties', {}).get('type') == 'turbine'])}")
                logger.info(f"   - OSM features: {len([f for f in geojson_features if f.get('properties', {}).get('type') not in ['turbine', 'perimeter']])}")
                logger.info(f"   - Perimeter: {len([f for f in geojson_features if f.get('properties', {}).get('type') == 'perimeter'])}")
                
                artifacts.append(layout_artifact)
                
            except s3_client.exceptions.NoSuchKey:
                logger.warning(f"⚠️  Layout data not found at s3://{bucket}/{layout_key}")
                logger.warning("   Falling back to basic artifact extraction from response text")
                
        except Exception as e:
            logger.error(f"❌ Error fetching layout data from S3: {e}", exc_info=True)
            logger.warning("   Falling back to basic artifact extraction from response text")
    
    # Fallback: Extract artifacts from S3 URLs in response text
    for bucket, key in matches:
        artifact_type = determine_artifact_type(key)
        artifact = {
            'type': artifact_type,
            'bucket': bucket,
            'key': key,
            'url': f's3://{bucket}/{key}',
            'project_id': project_id
        }
        
        # Don't duplicate layout artifacts
        if not (agent_type == 'layout' and artifact_type in ['layout_optimization', 'geojson_data']):
            artifacts.append(artifact)
    
    return artifacts


def determine_artifact_type(s3_key: str) -> str:
    """Determine artifact type from S3 key"""
    if 'terrain' in s3_key or 'boundaries' in s3_key:
        return 'terrain_analysis'
    elif 'layout' in s3_key or 'turbine' in s3_key:
        return 'layout_optimization'
    elif 'simulation' in s3_key or 'wake' in s3_key:
        return 'wake_simulation'
    elif 'wind_rose' in s3_key or 'windrose' in s3_key:
        return 'wind_rose'
    elif 'report' in s3_key:
        return 'project_report'
    elif s3_key.endswith('.html'):
        return 'map_visualization'
    elif s3_key.endswith('.geojson'):
        return 'geojson_data'
    else:
        return 'unknown'


# For local testing
if __name__ == "__main__":
    # Test event
    test_event = {
        "agent": "terrain",
        "query": "Analyze terrain for wind farm development",
        "parameters": {
            "project_id": "test_123",
            "latitude": 35.067482,
            "longitude": -101.395466,
            "radius_km": 2.0
        }
    }
    
    class MockContext:
        def __init__(self):
            self.function_name = "test"
            self.memory_limit_in_mb = 512
    
    result = handler(test_event, MockContext())
    print(json.dumps(result, indent=2))
