"""
Tool Lambda Template (Python)

This template provides a starting point for creating Python-based tool Lambdas.
Replace placeholders with your tool-specific implementation.
"""

import json
import logging
import os
from typing import Dict, Any, List, Optional
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# AWS clients
s3_client = boto3.client('s3')

# Environment variables
STORAGE_BUCKET = os.environ.get('STORAGE_BUCKET', '')


class YourTool:
    """
    YourTool - [Brief description of what this tool does]
    
    This tool performs [specific functionality] and generates [output type].
    """
    
    def __init__(self):
        self.bucket_name = STORAGE_BUCKET
        
    def process(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main processing method
        
        Args:
            parameters: Dictionary containing input parameters
            
        Returns:
            Dictionary containing results and artifacts
        """
        try:
            logger.info(f"Processing request with parameters: {parameters}")
            
            # Step 1: Validate parameters
            validation = self._validate_parameters(parameters)
            if not validation['valid']:
                return {
                    'success': False,
                    'error': validation['error']
                }
            
            # Step 2: Fetch required data
            data = self._fetch_data(parameters)
            
            # Step 3: Perform computation
            results = self._compute(data, parameters)
            
            # Step 4: Generate visualization (if applicable)
            visualization = self._generate_visualization(results, parameters)
            
            # Step 5: Store artifacts in S3
            artifacts = self._store_artifacts(visualization, results, parameters)
            
            # Step 6: Return response
            return {
                'success': True,
                'message': self._generate_message(results),
                'results': results,
                'artifacts': artifacts,
                'metadata': {
                    'timestamp': self._get_timestamp(),
                    'parameters': parameters
                }
            }
            
        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return {
                'success': False,
                'error': str(e)
            }
    
    def _validate_parameters(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Validate input parameters"""
        required_params = ['param1', 'param2']  # Add your required parameters
        
        for param in required_params:
            if param not in parameters:
                return {
                    'valid': False,
                    'error': f'Missing required parameter: {param}'
                }
        
        # Add specific validation logic
        # Example: Validate coordinate ranges
        if 'latitude' in parameters:
            lat = parameters['latitude']
            if not -90 <= lat <= 90:
                return {
                    'valid': False,
                    'error': 'Latitude must be between -90 and 90'
                }
        
        return {'valid': True}
    
    def _fetch_data(self, parameters: Dict[str, Any]) -> Any:
        """Fetch required data from external sources"""
        # Implement data fetching logic
        # Examples:
        # - Fetch from S3
        # - Call external API
        # - Query database
        
        logger.info("Fetching data...")
        
        # Example: Fetch from S3
        # try:
        #     response = s3_client.get_object(
        #         Bucket=self.bucket_name,
        #         Key=f"data/{parameters['data_key']}"
        #     )
        #     data = json.loads(response['Body'].read())
        #     return data
        # except ClientError as e:
        #     logger.error(f"Error fetching data from S3: {e}")
        #     raise
        
        return {}
    
    def _compute(self, data: Any, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Perform the main computation"""
        logger.info("Performing computation...")
        
        # Implement your computation logic here
        # This is where the core functionality of your tool goes
        
        results = {
            'computed_value': 0,
            'statistics': {},
            'summary': ''
        }
        
        # Example computation:
        # results['computed_value'] = self._calculate_something(data, parameters)
        # results['statistics'] = self._compute_statistics(data)
        # results['summary'] = self._generate_summary(results)
        
        return results
    
    def _generate_visualization(
        self, 
        results: Dict[str, Any], 
        parameters: Dict[str, Any]
    ) -> Optional[str]:
        """Generate visualization (HTML, image, etc.)"""
        logger.info("Generating visualization...")
        
        # Option 1: Generate HTML visualization
        # html = self._create_html_visualization(results, parameters)
        # return html
        
        # Option 2: Generate image (matplotlib, plotly, etc.)
        # image_data = self._create_image_visualization(results, parameters)
        # return image_data
        
        # Option 3: Generate interactive plot
        # plot_data = self._create_interactive_plot(results, parameters)
        # return plot_data
        
        return None
    
    def _store_artifacts(
        self,
        visualization: Optional[str],
        results: Dict[str, Any],
        parameters: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Store artifacts in S3 and return artifact metadata"""
        artifacts = []
        
        if not self.bucket_name:
            logger.warning("No storage bucket configured, skipping artifact storage")
            return artifacts
        
        try:
            # Generate unique artifact ID
            artifact_id = self._generate_artifact_id(parameters)
            
            # Store visualization
            if visualization:
                viz_key = f"artifacts/{artifact_id}/visualization.html"
                s3_client.put_object(
                    Bucket=self.bucket_name,
                    Key=viz_key,
                    Body=visualization,
                    ContentType='text/html'
                )
                
                artifacts.append({
                    'type': 'your_artifact_type',
                    'data': {
                        'messageContentType': 'your_artifact_type',
                        'title': 'Analysis Results',
                        's3Key': viz_key,
                        'bucket': self.bucket_name,
                        'metadata': {
                            'parameters': parameters,
                            'timestamp': self._get_timestamp()
                        }
                    }
                })
            
            # Store results JSON
            results_key = f"artifacts/{artifact_id}/results.json"
            s3_client.put_object(
                Bucket=self.bucket_name,
                Key=results_key,
                Body=json.dumps(results, indent=2),
                ContentType='application/json'
            )
            
            logger.info(f"Stored artifacts with ID: {artifact_id}")
            
        except ClientError as e:
            logger.error(f"Error storing artifacts in S3: {e}")
            # Don't fail the entire request if artifact storage fails
        
        return artifacts
    
    def _generate_message(self, results: Dict[str, Any]) -> str:
        """Generate human-readable response message"""
        # Create a natural language summary of the results
        return f"Analysis completed successfully. {results.get('summary', '')}"
    
    def _generate_artifact_id(self, parameters: Dict[str, Any]) -> str:
        """Generate unique artifact ID"""
        import hashlib
        import time
        
        # Create ID from parameters and timestamp
        param_str = json.dumps(parameters, sort_keys=True)
        timestamp = str(time.time())
        combined = f"{param_str}_{timestamp}"
        
        return hashlib.md5(combined.encode()).hexdigest()
    
    def _get_timestamp(self) -> str:
        """Get current timestamp in ISO format"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'


def handler(event, context):
    """
    Lambda handler function
    
    Args:
        event: Lambda event object containing parameters
        context: Lambda context object
        
    Returns:
        Response dictionary
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Extract parameters from event
        # Handle different event formats (direct invoke, API Gateway, etc.)
        if isinstance(event, str):
            parameters = json.loads(event)
        elif 'body' in event:
            parameters = json.loads(event['body'])
        else:
            parameters = event
        
        # Create tool instance and process
        tool = YourTool()
        result = tool.process(parameters)
        
        # Return response
        return {
            'statusCode': 200 if result.get('success') else 400,
            'body': json.dumps(result),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }
        
    except Exception as e:
        logger.error(f"Handler error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        }


# Example usage for local testing
if __name__ == '__main__':
    # Test event
    test_event = {
        'param1': 'value1',
        'param2': 'value2',
        'latitude': 35.0,
        'longitude': -101.0
    }
    
    # Mock context
    class MockContext:
        request_id = 'test-request-id'
        function_name = 'test-function'
    
    # Run handler
    response = handler(test_event, MockContext())
    print(json.dumps(response, indent=2))
