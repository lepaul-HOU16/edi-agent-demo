
import json
import sys
import os

# Add the handler directory to path
sys.path.insert(0, '/Users/lepaul/Dev/prototypes/edi-agent-demo/amplify/functions/renewableTools/terrain')
sys.path.insert(0, '/Users/lepaul/Dev/prototypes/edi-agent-demo/amplify/functions/renewableTools')

try:
    from handler import handler
    
    # Load event
    with open('/Users/lepaul/Dev/prototypes/edi-agent-demo/tests/temp-event-1761063498900.json', 'r') as f:
        event = json.load(f)
    
    # Create mock context
    class MockContext:
        def __init__(self):
            self.function_name = 'test-terrain-handler'
            self.function_version = '1'
            self.invoked_function_arn = 'arn:aws:lambda:us-east-1:123456789012:function:test'
            self.memory_limit_in_mb = 512
            self.remaining_time_in_millis = lambda: 30000
    
    context = MockContext()
    
    # Invoke handler
    result = handler(event, context)
    
    # Write result
    with open('/Users/lepaul/Dev/prototypes/edi-agent-demo/tests/temp-result-1761063498900.json', 'w') as f:
        json.dump(result, f)
        
except Exception as e:
    error_result = {
        'statusCode': 500,
        'body': json.dumps({
            'success': False,
            'error': str(e),
            'error_type': type(e).__name__
        })
    }
    with open('/Users/lepaul/Dev/prototypes/edi-agent-demo/tests/temp-result-1761063498900.json', 'w') as f:
        json.dump(error_result, f)
