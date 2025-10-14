"""
Minimal test handler to debug InvalidEntrypoint error
"""
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handler(event, context):
    """Minimal test handler"""
    logger.info("Test handler invoked successfully!")
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'success': True,
            'message': 'Test handler works!'
        })
    }
