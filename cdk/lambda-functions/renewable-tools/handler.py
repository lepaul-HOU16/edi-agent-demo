"""
Renewable Tools Lambda Handler
Uses the COMPLETE original tools from the renewables repository
"""
import json
import os
import sys

# Add agents directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'agents'))

from agents.tools.terrain_tools import get_unbuildable_areas

def handler(event, context):
    """
    Main Lambda handler that routes to the appropriate tool
    Uses the COMPLETE original tools with ALL functionality including water features
    """
    print(f"Renewable tools handler invoked with event: {json.dumps(event)}")
    
    try:
        # Extract parameters
        if 'parameters' in event:
            params = event['parameters']
        else:
            body = json.loads(event.get('body', '{}')) if isinstance(event.get('body'), str) else event.get('body', {})
            params = body.get('parameters', {})
        
        # Determine which tool to call based on action or tool name
        action = event.get('action') or params.get('action') or 'terrain_analysis'
        
        print(f"Action: {action}")
        print(f"Parameters: {json.dumps(params)}")
        
        if action == 'terrain_analysis' or action == 'get_unbuildable_areas':
            # Call the ORIGINAL terrain analysis tool with ALL functionality
            result = get_unbuildable_areas(
                latitude=params.get('latitude'),
                longitude=params.get('longitude'),
                project_id=params.get('project_id'),
                radius_km=params.get('radius_km', 5.0),
                setback_m=params.get('setback_m', 100)
            )
            
            print(f"Terrain analysis result: {json.dumps(result, default=str)}")
            
            return {
                'statusCode': 200,
                'body': json.dumps(result, default=str)
            }
        
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'success': False,
                    'error': f'Unknown action: {action}'
                })
            }
            
    except Exception as e:
        print(f"Error in renewable tools handler: {str(e)}")
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
