# Catalog Search Lambda Function

Single Python Lambda function for OSDU catalog search functionality with Strands Agents integration.

## Architecture

This Lambda function consolidates all catalog search functionality:
- **S3 Session Management** - Store/retrieve metadata, GeoJSON, and history
- **Strands Agent Integration** - Natural language query processing
- **OSDU API Client** - Search and retrieve well data
- **Command Router** - Handle hardcoded commands (/getdata, /reset)

## File Structure

```
amplify/functions/catalogSearch/
├── handler.py                      # Main Lambda handler
├── s3_session_manager.py          # S3 session management
├── strands_agent_processor.py     # Strands Agent integration
├── command_router.py              # Command detection
├── osdu_client.py                 # OSDU API client
├── requirements.txt               # Python dependencies
├── resource.ts                    # Amplify Gen 2 Lambda definition
└── README.md                      # This file
```

## Components

### 1. Main Handler (`handler.py`)

Entry point for all catalog search requests. Routes to:
- Command handlers for `/getdata` and `/reset`
- Strands Agent processor for natural language queries

### 2. S3 Session Manager (`s3_session_manager.py`)

Manages session-based file storage in S3:
- `store_metadata()` - Store all_well_metadata.json and filtered versions
- `store_geojson()` - Store all_well_geojson.json and filtered versions
- `store_history()` - Store session_history.json
- `get_next_version()` - Automatic version numbering (001, 002, 003...)
- `get_metadata()`, `get_geojson()`, `get_history()` - Retrieve files
- `get_signed_url()` - Generate S3 signed URLs for frontend access
- `reset_session()` - Clean up filtered files

### 3. Strands Agent Processor (`strands_agent_processor.py`)

Processes natural language queries using Strands Agents framework:

**Key Features:**
- Initializes Strands Agent with OSDU-specific tools
- Uses `@tool` decorator to define custom tools
- Processes queries with context awareness
- Extracts thought steps from agent execution
- Suppresses intermediate output with `callback_handler=None`

**Agent Initialization Pattern:**
```python
from strands import Agent, tool

agent = Agent(
    system_prompt=CATALOG_SEARCH_SYSTEM_PROMPT,
    tools=[search_osdu, filter_wells, transform_to_geojson],
    callback_handler=None  # Suppress intermediate output
)
```

**Tool Definition Pattern:**
```python
@tool
def search_osdu(query: str, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Search OSDU for wells matching the query and filters.
    
    Args:
        query: Search query string
        filters: Optional filters (depth, location, type, etc.)
        
    Returns:
        Dictionary with search results
    """
    # Implementation here
    pass
```

**Processing Pattern:**
```python
# Invoke agent with query
response = agent(query)

# Extract message
message = str(response.message)

# Extract metrics and tool usage
if hasattr(response, 'metrics'):
    tool_metrics = response.metrics.tool_metrics
```

### 4. Command Router (`command_router.py`)

Detects and routes hardcoded commands:
- `/getdata` - Fetch all OSDU wells and store in S3
- `/reset` - Clear filtered files and history

### 5. OSDU Client (`osdu_client.py`)

Handles communication with OSDU API:
- `fetch_all_wells()` - Retrieve all wells
- `search_wells()` - Search with query

## Strands Agents Integration

### System Prompt

The agent uses a specialized system prompt for OSDU catalog search:
- Understands well/wellbore/welllog hierarchy
- Applies filters based on natural language
- Generates GeoJSON for map visualization
- Provides clear explanations and statistics

### Custom Tools

Three OSDU-specific tools are defined:

1. **search_osdu** - Search OSDU API
2. **filter_wells** - Filter wells from existing context
3. **transform_to_geojson** - Convert to GeoJSON format

### Thought Steps

The processor extracts thought steps from agent execution:
- Tool usage (which tools were called, how many times)
- Processing steps (query analysis, response generation)
- Timestamps and status

### Context Awareness

The agent can work with existing context:
```python
if existing_context and existing_context.get('allWells'):
    context_info = f"You have access to {len(existing_context['allWells'])} wells"
    full_query = query + context_info
```

## Environment Variables

- `CATALOG_S3_BUCKET` - S3 bucket for session storage
- `OSDU_BASE_URL` - OSDU instance base URL
- `OSDU_PARTITION_ID` - OSDU data partition ID

## Lambda Configuration

- **Runtime**: Python 3.12
- **Timeout**: 300 seconds (5 minutes)
- **Memory**: 1024 MB
- **Handler**: `handler.lambda_handler`

## Dependencies

See `requirements.txt`:
- `boto3` - AWS SDK
- `requests` - HTTP client
- `strands-agents` - Strands Agents framework
- `strands-agents-tools` - Pre-built tools

## Usage Flow

### 1. /getdata Command

```
User → /getdata → Lambda
                    ↓
              OSDU Client → Fetch all wells
                    ↓
              Transform to metadata + GeoJSON
                    ↓
              S3 Manager → Store files
                    ↓
              Generate signed URLs
                    ↓
              Update history
                    ↓
User ← Return URLs and stats
```

### 2. Natural Language Query

```
User → "Show wells deeper than 3000m" → Lambda
                                          ↓
                                    Strands Agent
                                          ↓
                                    Load context from S3
                                          ↓
                                    Process with tools
                                          ↓
                                    Filter wells
                                          ↓
                                    Transform to GeoJSON
                                          ↓
                                    Get next version (001, 002...)
                                          ↓
                                    Store filtered files
                                          ↓
                                    Generate signed URLs
                                          ↓
                                    Update history
                                          ↓
User ← Return results with thought steps
```

### 3. /reset Command

```
User → /reset → Lambda
                  ↓
            S3 Manager → Delete filtered_* files
                  ↓
            Clear session_history.json
                  ↓
            Keep all_well_* files
                  ↓
User ← Success message
```

## File Naming Convention

### All Wells (No Version)
- `all_well_metadata.json`
- `all_well_geojson.json`

### Filtered Wells (Versioned)
- `filtered_well_metadata_001.json`
- `filtered_well_geojson_001.json`
- `filtered_well_metadata_002.json`
- `filtered_well_geojson_002.json`
- etc.

### Session History
- `session_history.json`

### S3 Structure
```
s3://bucket/
  {session_id}/
    ├── all_well_metadata.json
    ├── all_well_geojson.json
    ├── filtered_well_metadata_001.json
    ├── filtered_well_geojson_001.json
    ├── filtered_well_metadata_002.json
    ├── filtered_well_geojson_002.json
    └── session_history.json
```

## Response Format

### Success Response
```json
{
  "type": "complete",
  "data": {
    "message": "Found 15 wells matching criteria",
    "thoughtSteps": [
      {
        "id": "tool_search_osdu",
        "type": "tool_execution",
        "title": "Using search_osdu",
        "summary": "Executed search_osdu tool 1 time(s)",
        "status": "completed",
        "timestamp": 1234
      }
    ],
    "files": {
      "metadata": "https://s3.../filtered_well_metadata_001.json?...",
      "geojson": "https://s3.../filtered_well_geojson_001.json?..."
    },
    "stats": {
      "wellCount": 15,
      "wellboreCount": 45,
      "welllogCount": 120
    }
  }
}
```

### Error Response
```json
{
  "type": "error",
  "error": "Error message here"
}
```

## Next Steps

1. Implement OSDU API integration in `osdu_client.py`
2. Implement data transformation functions in `handler.py`
3. Enhance Strands Agent tools with actual OSDU logic
4. Add comprehensive error handling
5. Add logging and monitoring
6. Write unit tests
7. Deploy and test end-to-end

## References

- [Strands Agents Documentation](https://github.com/strands-agents/docs)
- [AWS Lambda Python](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [Amplify Gen 2](https://docs.amplify.aws/gen2/)
