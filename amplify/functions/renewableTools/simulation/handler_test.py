"""
Minimal test handler to verify Docker Lambda works
"""
import json

def handler(event, context):
    """Minimal test handler"""
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Docker Lambda works!', 'event': event})
    }
