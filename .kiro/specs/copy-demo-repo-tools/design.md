# Design: Copy Demo Repo Tools

## Overview

This is a SIMPLE FILE COPY operation. We copy the tool files from the demo repo and update our handlers to call those functions. That's it. No reinvention. No over-engineering.

## What to Copy

From `agentic-ai-for-renewable-site-design-mainline/workshop-assets/agents/tools/`:

1. **layout_tools.py** → `amplify/functions/renewableTools/layout/layout_tools.py`
2. **terrain_tools.py** → `amplify/functions/renewableTools/terrain/terrain_tools.py`
3. **simulation_tools.py** → `amplify/functions/renewableTools/simulation/simulation_tools.py`
4. **report_tools.py** → `amplify/functions/renewableTools/report/report_tools.py`
5. **shared_tools.py** → `amplify/functions/renewableTools/shared_tools.py`
6. **storage_utils.py** → `amplify/functions/renewableTools/storage_utils.py`

## Handler Pattern

Each handler becomes a thin wrapper:

```python
from layout_tools import create_grid_layout, create_greedy_layout, save_layout

def handler(event, context):
    # 1. Extract parameters
    params = event.get('parameters', {})
    project_id = params.get('project_id')
    center_lat = params.get('latitude')
    # ... etc
    
    # 2. Call demo repo function
    result = create_greedy_layout(
        project_id=project_id,
        center_lat=center_lat,
        center_lon=center_lon,
        # ... pass all parameters
    )
    
    # 3. Format response
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'data': result
        })
    }
```

That's it. No custom logic. No reinvention.

## Dependencies

The tool files use:
- geopandas
- shapely
- matplotlib
- PIL
- requests

These are already in requirements.txt or need to be added.

## Testing

Test that:
1. Files copied successfully
2. Imports work
3. Functions can be called
4. Results match demo repo behavior
