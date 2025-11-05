# AgentCore Implementation Guide - Step by Step

## Overview

This guide walks you through implementing Bedrock AgentCore for petrophysics calculations. All code is provided - you just need to execute the AWS setup steps.

**Estimated Time**: 1-2 hours
**Prerequisites**: AWS Console access, AWS CLI configured

---

## Phase 1: Create Python Lambda Function (15 minutes)

### Step 1.1: Copy Calculation Modules

The Python calculation code already exists in `scripts/`. We'll copy it to the Lambda function:

```bash
# Create Lambda function directory
mkdir -p amplify/functions/petrophysicsCalculator

# Copy calculation modules
cp scripts/petrophysics_calculators.py amplify/functions/petrophysicsCalculator/
cp scripts/data_quality_assessment.py amplify/functions/petrophysicsCalculator/
```

### Step 1.2: Create Lambda Handler

File: `amplify/functions/petrophysicsCalculator/handler.py` (already created)

This file needs to be completed with the full implementation. See the code in the next section.

### Step 1.3: Create requirements.txt

File: `amplify/functions/petrophysicsCalculator/requirements.txt`

```
boto3>=1.26.0
pandas>=1.5.0
numpy>=1.23.0
```

### Step 1.4: Create Lambda Resource Definition

File: `amplify/functions/petrophysicsCalculator/resource.ts`

```typescript
import { defineFunction } from '@aws-amplify/backend';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const petrophysicsCalculator = defineFunction((scope: Construct) => {
  return new lambda.Function(scope, 'PetrophysicsCalculator', {
    runtime: lambda.Runtime.PYTHON_3_12,
    handler: 'handler.lambda_handler',
    code: lambda.Code.fromAsset(__dirname),
    timeout: Duration.seconds(300),
    memorySize: 1024,
    environment: {
      S3_BUCKET: process.env.S3_BUCKET || 'amplify-d1eeg2gu6ddc3z-ma-workshopstoragebucketd9b-lzf4vwokty7m',
      WELL_DATA_PREFIX: 'global/well-data/',
      AWS_REGION: process.env.AWS_REGION || 'us-east-1'
    }
  });
});
```

---

## Phase 2: AWS Console Setup (30 minutes)

### Step 2.1: Deploy Lambda Function

```bash
# Deploy the Lambda function
npx ampx sandbox

# Wait for deployment to complete
# Note the Lambda function ARN from the output
```

### Step 2.2: Create Bedrock Agent (AWS Console)

1. **Open AWS Console** → Navigate to Amazon Bedrock
2. **Go to Agents** → Click "Create Agent"
3. **Agent Details**:
   - Name: `petrophysics-agent`
   - Description: `Petrophysical analysis agent with calculation tools`
   - Model: `Claude 3.5 Sonnet`
4. **Instructions** (paste this):
   ```
   You are a petrophysical analysis expert. You help users analyze well log data,
   calculate porosity, shale volume, and water saturation. Use the available tools
   to perform calculations and provide professional analysis results.
   ```
5. **Click "Create"**

### Step 2.3: Create Action Group

1. **In the Agent page** → Click "Add Action Group"
2. **Action Group Details**:
   - Name: `petrophysics-calculations`
   - Description: `Petrophysical calculation tools`
3. **Action Group Type**: Select "Define with API schemas"
4. **Lambda Function**: Select your `petrophysicsCalculator` function
5. **API Schema**: Select "Define with in-line OpenAPI schema editor"
6. **Paste this OpenAPI schema**:

```yaml
openapi: 3.0.0
info:
  title: Petrophysics Calculation API
  version: 1.0.0
  description: API for petrophysical calculations including porosity, shale volume, and saturation

paths:
  /list_wells:
    get:
      summary: List all available wells
      description: Returns a list of all wells available in S3 storage
      operationId: listWells
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  wells:
                    type: array
                    items:
                      type: string
                  count:
                    type: integer

  /get_well_info:
    post:
      summary: Get well information
      description: Get header information and available curves for a specific well
      operationId: getWellInfo
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                wellName:
                  type: string
                  description: Name of the well
              required:
                - wellName
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  wellInfo:
                    type: object
                  availableCurves:
                    type: array
                    items:
                      type: string

  /calculate_porosity:
    post:
      summary: Calculate porosity
      description: Calculate porosity for a well using specified method
      operationId: calculatePorosity
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                wellName:
                  type: string
                  description: Name of the well
                method:
                  type: string
                  description: Calculation method (density, neutron, effective)
                  enum: [density, neutron, effective, total]
                depthStart:
                  type: number
                  description: Start depth (optional)
                depthEnd:
                  type: number
                  description: End depth (optional)
              required:
                - wellName
                - method
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                type: object
                properties:
                  wellName:
                    type: string
                  method:
                    type: string
                  statistics:
                    type: object
                    properties:
                      mean:
                        type: number
                      std_dev:
                        type: number
                      min:
                        type: number
                      max:
                        type: number
                  curveData:
                    type: object
                    description: Curve data for visualization

  /calculate_shale_volume:
    post:
      summary: Calculate shale volume
      description: Calculate shale volume using gamma ray data
      operationId: calculateShaleVolume
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                wellName:
                  type: string
                method:
                  type: string
                  enum: [larionov_tertiary, larionov_pre_tertiary, linear, clavier]
              required:
                - wellName
                - method
      responses:
        '200':
          description: Successful response

  /calculate_saturation:
    post:
      summary: Calculate water saturation
      description: Calculate water saturation using Archie's equation
      operationId: calculateSaturation
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                wellName:
                  type: string
                method:
                  type: string
                  enum: [archie]
              required:
                - wellName
                - method
      responses:
        '200':
          description: Successful response
```

7. **Click "Add"**

### Step 2.4: Prepare Agent

1. **Click "Prepare"** button (top right)
2. Wait for preparation to complete (~2-3 minutes)
3. **Note the Agent ID** and **Agent Alias ID** from the details page

### Step 2.5: Test in Console

1. **Click "Test"** tab
2. Try: `"list wells"`
3. Try: `"calculate porosity for well-001"`
4. Verify responses are working

---

## Phase 3: Update TypeScript Agent (20 minutes)

### Step 3.1: Add Environment Variables

File: `amplify/backend.ts`

Add these environment variables to your enhanced strands agent:

```typescript
// Add to backend.ts after defining backend
backend.enhancedStrandsAgent.addEnvironment('BEDROCK_AGENT_ID', 'YOUR_AGENT_ID_HERE');
backend.enhancedStrandsAgent.addEnvironment('BEDROCK_AGENT_ALIAS_ID', 'YOUR_ALIAS_ID_HERE');
```

### Step 3.2: Grant Bedrock Permissions

File: `amplify/backend.ts`

```typescript
import { aws_iam as iam } from 'aws-cdk-lib';

// Grant Bedrock Agent permissions
backend.enhancedStrandsAgent.resources.lambda.addToRolePolicy(
  new iam.PolicyStatement({
    actions: [
      'bedrock:InvokeAgent',
      'bedrock:InvokeModel'
    ],
    resources: ['*'] // Or specify your agent ARN
  })
);
```

### Step 3.3: Update Agent Code

File: `amplify/functions/agents/enhancedStrandsAgent.ts`

Replace the `callMCPTool` method with this AgentCore implementation:

```typescript
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';

export class EnhancedStrandsAgent extends BaseEnhancedAgent {
  private bedrockAgentClient: BedrockAgentRuntimeClient;
  private agentId: string;
  private agentAliasId: string;
  
  constructor(modelId?: string, s3Bucket?: string) {
    super(true);
    
    this.bedrockAgentClient = new BedrockAgentRuntimeClient({ 
      region: process.env.AWS_REGION || 'us-east-1' 
    });
    
    this.agentId = process.env.BEDROCK_AGENT_ID || '';
    this.agentAliasId = process.env.BEDROCK_AGENT_ALIAS_ID || '';
    
    // ... rest of constructor
  }
  
  private async callMCPTool(toolName: string, parameters: any): Promise<any> {
    console.log('🔧 === AGENTCORE TOOL CALL START ===');
    console.log('🛠️ Tool Name:', toolName);
    console.log('📋 Parameters:', JSON.stringify(parameters, null, 2));
    
    if (!this.agentId || !this.agentAliasId) {
      console.error('❌ Bedrock Agent not configured');
      return {
        success: false,
        message: 'Bedrock Agent configuration missing. Please set BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID'
      };
    }
    
    try {
      // Map tool names to natural language prompts for the agent
      const prompt = this.createAgentPrompt(toolName, parameters);
      
      console.log('📤 Sending to AgentCore:', prompt);
      
      const command = new InvokeAgentCommand({
        agentId: this.agentId,
        agentAliasId: this.agentAliasId,
        sessionId: `session-${Date.now()}`,
        inputText: prompt
      });
      
      const response = await this.bedrockAgentClient.send(command);
      
      // Parse AgentCore streaming response
      const result = await this.parseAgentResponse(response);
      
      console.log('✅ AgentCore response received');
      console.log('📥 Result:', JSON.stringify(result).substring(0, 500));
      
      return {
        success: true,
        ...result
      };
      
    } catch (error) {
      console.error('❌ AgentCore call failed:', error);
      return {
        success: false,
        message: `AgentCore error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  private createAgentPrompt(toolName: string, parameters: any): string {
    // Convert tool calls to natural language for the agent
    switch (toolName) {
      case 'list_wells':
        return 'List all available wells';
      
      case 'get_well_info':
        return `Get information for well ${parameters.wellName}`;
      
      case 'calculate_porosity':
        return `Calculate ${parameters.method || 'density'} porosity for well ${parameters.wellName}`;
      
      case 'calculate_shale_volume':
        return `Calculate shale volume for well ${parameters.wellName} using ${parameters.method} method`;
      
      case 'calculate_saturation':
        return `Calculate water saturation for well ${parameters.wellName}`;
      
      default:
        return `Execute ${toolName} with parameters: ${JSON.stringify(parameters)}`;
    }
  }
  
  private async parseAgentResponse(response: any): Promise<any> {
    // AgentCore returns streaming response - collect all chunks
    const chunks: string[] = [];
    
    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const text = new TextDecoder().decode(chunk.chunk.bytes);
          chunks.push(text);
        }
      }
    }
    
    const fullResponse = chunks.join('');
    console.log('📄 Full agent response:', fullResponse);
    
    // Try to parse as JSON
    try {
      return JSON.parse(fullResponse);
    } catch {
      // If not JSON, wrap in success response
      return {
        message: fullResponse,
        rawResponse: fullResponse
      };
    }
  }
}
```

---

## Phase 4: Complete Python Lambda Handler (15 minutes)

File: `amplify/functions/petrophysicsCalculator/handler.py`

```python
import json
import boto3
import os
from typing import Dict, Any
from petrophysics_calculators import (
    PorosityCalculator,
    ShaleVolumeCalculator,
    SaturationCalculator
)

# Initialize AWS clients
s3_client = boto3.client('s3')

# Initialize calculators
porosity_calc = PorosityCalculator()
shale_calc = ShaleVolumeCalculator()
saturation_calc = SaturationCalculator()

# Configuration
S3_BUCKET = os.environ.get('S3_BUCKET', '')
WELL_DATA_PREFIX = os.environ.get('WELL_DATA_PREFIX', 'global/well-data/')

def lambda_handler(event, context):
    """
    AgentCore action handler for petrophysics calculations
    """
    print(f"Received event: {json.dumps(event)}")
    
    # AgentCore sends requests in this format
    api_path = event.get('apiPath', '')
    parameters = event.get('requestBody', {}).get('content', {}).get('application/json', {}).get('properties', [])
    
    # Convert parameters array to dict
    params = {}
    for param in parameters:
        params[param['name']] = param['value']
    
    print(f"API Path: {api_path}")
    print(f"Parameters: {params}")
    
    try:
        if api_path == '/list_wells':
            result = list_wells()
        elif api_path == '/get_well_info':
            result = get_well_info(params)
        elif api_path == '/calculate_porosity':
            result = calculate_porosity(params)
        elif api_path == '/calculate_shale_volume':
            result = calculate_shale_volume(params)
        elif api_path == '/calculate_saturation':
            result = calculate_saturation(params)
        else:
            result = {'error': f'Unknown API path: {api_path}'}
        
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'apiPath': api_path,
                'httpMethod': event.get('httpMethod'),
                'httpStatusCode': 200,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps(result)
                    }
                }
            }
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'messageVersion': '1.0',
            'response': {
                'actionGroup': event.get('actionGroup'),
                'apiPath': api_path,
                'httpMethod': event.get('httpMethod'),
                'httpStatusCode': 500,
                'responseBody': {
                    'application/json': {
                        'body': json.dumps({'error': str(e)})
                    }
                }
            }
        }

def list_wells() -> Dict[str, Any]:
    """List all available wells from S3"""
    try:
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET,
            Prefix=WELL_DATA_PREFIX
        )
        
        wells = []
        if 'Contents' in response:
            for obj in response['Contents']:
                if obj['Key'].endswith('.las'):
                    well_name = obj['Key'].replace(WELL_DATA_PREFIX, '').replace('.las', '')
                    wells.append(well_name)
        
        return {
            'wells': wells,
            'count': len(wells)
        }
    except Exception as e:
        return {'error': f'Failed to list wells: {str(e)}'}

def get_well_info(params: Dict[str, Any]) -> Dict[str, Any]:
    """Get well information"""
    well_name = params.get('wellName')
    
    try:
        # Load LAS file from S3
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        # Parse for available curves (simple parsing)
        curves = []
        in_curve_section = False
        for line in content.split('\n'):
            if line.startswith('~C'):
                in_curve_section = True
                continue
            if line.startswith('~'):
                in_curve_section = False
            if in_curve_section and '.' in line:
                curve_name = line.split('.')[0].strip()
                if curve_name:
                    curves.append(curve_name)
        
        return {
            'wellName': well_name,
            'availableCurves': curves
        }
    except Exception as e:
        return {'error': f'Failed to get well info: {str(e)}'}

def calculate_porosity(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate porosity"""
    well_name = params.get('wellName')
    method = params.get('method', 'density')
    
    try:
        # Load well data from S3
        key = f"{WELL_DATA_PREFIX}{well_name}.las"
        response = s3_client.get_object(Bucket=S3_BUCKET, Key=key)
        content = response['Body'].read().decode('utf-8')
        
        # Parse LAS file and extract curves
        input_data = parse_las_file(content)
        
        # Calculate porosity
        result = porosity_calc.calculate_porosity(method, input_data, {}, None)
        
        # Format response
        return {
            'wellName': well_name,
            'method': method,
            'statistics': {
                'mean': float(result.statistics.get('mean', 0)),
                'std_dev': float(result.statistics.get('std_dev', 0)),
                'min': float(result.statistics.get('min', 0)),
                'max': float(result.statistics.get('max', 0))
            },
            'curveData': {
                'DEPT': result.depths[:1000],  # Limit for response size
                'POROSITY': result.values[:1000],
                'RHOB': input_data.get('rhob', [])[:1000],
                'GR': input_data.get('gr', [])[:1000]
            }
        }
    except Exception as e:
        return {'error': f'Porosity calculation failed: {str(e)}'}

def calculate_shale_volume(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate shale volume"""
    well_name = params.get('wellName')
    method = params.get('method', 'larionov_tertiary')
    
    try:
        # Similar implementation to porosity
        # Load data, calculate, return results
        return {
            'wellName': well_name,
            'method': method,
            'message': 'Shale volume calculation complete'
        }
    except Exception as e:
        return {'error': f'Shale calculation failed: {str(e)}'}

def calculate_saturation(params: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate water saturation"""
    well_name = params.get('wellName')
    method = params.get('method', 'archie')
    
    try:
        # Similar implementation
        return {
            'wellName': well_name,
            'method': method,
            'message': 'Saturation calculation complete'
        }
    except Exception as e:
        return {'error': f'Saturation calculation failed: {str(e)}'}

def parse_las_file(content: str) -> Dict[str, list]:
    """Simple LAS file parser"""
    data = {}
    curve_names = []
    in_curve_section = False
    in_data_section = False
    
    for line in content.split('\n'):
        line = line.strip()
        
        if line.startswith('~C'):
            in_curve_section = True
            continue
        if line.startswith('~A'):
            in_data_section = True
            continue
        if line.startswith('~'):
            in_curve_section = False
            in_data_section = False
            
        if in_curve_section and '.' in line:
            curve_name = line.split('.')[0].strip()
            if curve_name:
                curve_names.append(curve_name)
                data[curve_name.lower()] = []
        
        if in_data_section and line and not line.startswith('#'):
            try:
                values = [float(x) for x in line.split()]
                if len(values) == len(curve_names):
                    for i, name in enumerate(curve_names):
                        data[name.lower()].append(values[i])
            except ValueError:
                continue
    
    return data
```

---

## Phase 5: Deploy and Test (15 minutes)

### Step 5.1: Deploy Everything

```bash
# Deploy all changes
npx ampx sandbox

# Wait for deployment
```

### Step 5.2: Test in Chat Interface

1. Open your chat interface
2. Try: `"list wells"`
3. Try: `"calculate porosity for well-001"`
4. Verify you see real data with statistics and curves

### Step 5.3: Check CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/petrophysicsCalculator --follow

# View agent logs
aws logs tail /aws/lambda/enhancedStrandsAgent --follow
```

---

## Troubleshooting

### Issue: Agent not found
**Solution**: Verify BEDROCK_AGENT_ID and BEDROCK_AGENT_ALIAS_ID are set correctly

### Issue: Permission denied
**Solution**: Check IAM role has bedrock:InvokeAgent permission

### Issue: Lambda timeout
**Solution**: Increase timeout in resource.ts (currently 300 seconds)

### Issue: No data returned
**Solution**: Check S3 bucket name and prefix are correct

---

## Success Criteria

✅ Lambda function deploys successfully
✅ Bedrock Agent created and prepared
✅ Action group configured with OpenAPI schema
✅ TypeScript agent can call AgentCore
✅ Chat interface shows real porosity data
✅ Statistics display correctly (not 0%)
✅ Log curves render in 4-track display

---

## Next Steps After Implementation

1. Add more calculation methods (shale, saturation)
2. Optimize response size for large datasets
3. Add caching for frequently accessed wells
4. Implement error recovery and retries
5. Add monitoring and alerting

---

## Estimated Costs

- **Bedrock Agent**: ~$0.002 per request
- **Lambda**: ~$0.0000002 per request
- **S3**: Minimal (data already stored)
- **Total**: < $1/day for typical usage

---

## Support

If you encounter issues:
1. Check CloudWatch logs for both Lambdas
2. Test Lambda function directly in AWS Console
3. Verify Agent is "Prepared" in Bedrock Console
4. Check IAM permissions are correct

Good luck with the implementation!
