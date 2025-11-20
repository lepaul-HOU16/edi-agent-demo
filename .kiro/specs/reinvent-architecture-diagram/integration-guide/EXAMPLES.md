# Example Agent Integrations

This document provides complete, real-world examples of agent integrations at different complexity levels.

## Table of Contents

1. [Example 1: Simple Agent (Weather Agent)](#example-1-simple-agent)
2. [Example 2: Agent with Tool (Geology Agent)](#example-2-agent-with-tool)
3. [Example 3: Complex Orchestrator (Seismic Analysis)](#example-3-complex-orchestrator)

---

## Example 1: Simple Agent

### Weather Agent - No Tools Required

**Complexity:** ⭐ Simple  
**Time to Implement:** 2-4 hours  
**Components:** Agent only (uses Bedrock)

#### Use Case

Users ask weather-related questions:
- "What's the weather in Houston?"
- "Will it rain tomorrow in Dallas?"
- "Temperature forecast for next week"

#### Implementation

**Step 1: Create Agent Class**

```typescript
// cdk/lambda-functions/chat/agents/weatherAgent.ts

import { BaseEnhancedAgent } from './BaseEnhancedAgent';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export class WeatherAgent extends BaseEnhancedAgent {
  private bedrockClient: BedrockRuntimeClient;
  
  constructor() {
    super(true);
    this.bedrockClient = new BedrockRuntimeClient({ region: 'us-east-1' });
  }

  async processMessage(message: string): Promise<any> {
    const thoughtSteps = [];
    
    // Step 1: Intent Detection
    thoughtSteps.push({
      id: `step_${Date.now()}`,
      type: 'intent_detection',
      timestamp: Date.now(),
      title: 'Understanding Weather Query',
      summary: 'Analyzing location and weather information requested',
      status: 'complete'
    });

    // Step 2: Extract location
    const location = this.extractLocation(message);
    
    thoughtSteps.push({
      id: `step_${Date.now() + 1}`,
      type: 'parameter_extraction',
      timestamp: Date.now(),
      title: 'Location Identified',
      summary: `Location: ${location || 'Not specified'}`,
      status: 'complete'
    });

    // Step 3: Generate response using Bedrock
    thoughtSteps.push({
      id: `step_${Date.now() + 2}`,
      type: 'execution',
      timestamp: Date.now(),
      title: 'Fetching Weather Information',
      summary: 'Querying weather data and generating response',
      status: 'in_progress'
    });

    const response = await this.generateWeatherResponse(message, location);
    
    thoughtSteps[2].status = 'complete';
    thoughtSteps[2].summary = 'Weather information retrieved successfully';

    return {
      success: true,
      message: response,
      thoughtSteps
    };
  }

  private extractLocation(message: string): string | null {
    // Simple location extraction
    const locationMatch = message.match(/in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return locationMatch ? locationMatch[1] : null;
  }

  private async generateWeatherResponse(message: string, location: string | null): Promise<string> {
    const prompt = `You are a helpful weather assistant. Answer this weather question: "${message}"
    
${location ? `Location: ${location}` : 'No specific location mentioned'}

Provide a helpful response. If you don't have real-time weather data, explain that you can provide general weather information and suggest checking a weather service for current conditions.`;

    const command = new InvokeModelCommand({
      modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    const response = await this.bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.content[0].text;
  }
}
```

**Step 2: Register in Agent Router**

```typescript
// cdk/lambda-functions/chat/agents/agentRouter.ts

import { WeatherAgent } from './weatherAgent';

export class AgentRouter {
  private weatherAgent: WeatherAgent;
  
  constructor() {
    // ... existing agents
    this.weatherAgent = new WeatherAgent();
  }
  
  private determineAgentType(message: string): AgentType {
    const lowerMessage = message.toLowerCase();
    
    // Weather patterns (high priority)
    const weatherPatterns = [
      /weather/i,
      /temperature/i,
      /forecast/i,
      /rain/i,
      /sunny/i,
      /cloudy/i,
      /storm/i
    ];
    
    if (this.matchesPatterns(lowerMessage, weatherPatterns)) {
      return 'weather';
    }
    
    // ... existing patterns
  }
  
  async routeQuery(message: string, context?: SessionContext) {
    const agentType = this.determineAgentType(message);
    
    switch (agentType) {
      case 'weather':
        return await this.weatherAgent.processMessage(message);
      // ... existing cases
    }
  }
}
```

**Step 3: Test**

```bash
# Test the agent
curl -X POST https://your-api/api/chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "chatSessionId": "test-session",
    "message": "What is the weather in Houston?"
  }'
```

**Expected Response:**

```json
{
  "success": true,
  "message": "I can provide general weather information for Houston, Texas. For current conditions, I recommend checking weather.gov or weather.com. Houston typically has a humid subtropical climate with hot summers and mild winters. Would you like information about typical weather patterns for a specific time of year?",
  "thoughtSteps": [
    {
      "type": "intent_detection",
      "title": "Understanding Weather Query",
      "status": "complete"
    },
    {
      "type": "parameter_extraction",
      "title": "Location Identified",
      "summary": "Location: Houston",
      "status": "complete"
    },
    {
      "type": "execution",
      "title": "Fetching Weather Information",
      "status": "complete"
    }
  ]
}
```

#### Lessons Learned

✅ **What Worked:**
- Simple pattern matching for intent detection
- Direct Bedrock integration without tools
- Clear thought steps for transparency

⚠️ **Challenges:**
- No real-time weather data (would need API integration)
- Location extraction could be more sophisticated

💡 **Improvements:**
- Add weather API integration for real data
- Use NER (Named Entity Recognition) for better location extraction
- Cache common queries to reduce Bedrock calls

---

## Example 2: Agent with Tool

### Geology Agent - Facies Classification

**Complexity:** ⭐⭐ Moderate  
**Time to Implement:** 1-2 days  
**Components:** Agent + Tool Lambda

#### Use Case

Geologists analyze well logs to identify rock types (facies):
- "Classify facies for WELL-001 from 5000-6000 ft"
- "Identify depositional environments in this interval"
- "Show facies log with gamma ray and resistivity"

#### Implementation

**Step 1: Create Tool Lambda (Python)**

```python
# cdk/lambda-functions/geology-tool/handler.py

import json
import logging
import numpy as np
import boto3
from typing import Dict, Any, List

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')

class FaciesClassifier:
    """Classify facies based on well log data"""
    
    def __init__(self):
        self.bucket = os.environ.get('STORAGE_BUCKET')
    
    def classify(self, well_name: str, depth_start: float, depth_end: float) -> Dict[str, Any]:
        """Classify facies for given depth interval"""
        
        # Step 1: Load well log data
        log_data = self._load_well_logs(well_name)
        
        # Step 2: Filter to depth range
        filtered_data = self._filter_depth_range(log_data, depth_start, depth_end)
        
        # Step 3: Classify facies
        facies = self._classify_facies(filtered_data)
        
        # Step 4: Generate visualization
        visualization = self._generate_facies_log(filtered_data, facies)
        
        # Step 5: Store in S3
        viz_key = f"geology/{well_name}/facies_{depth_start}_{depth_end}.html"
        s3_client.put_object(
            Bucket=self.bucket,
            Key=viz_key,
            Body=visualization,
            ContentType='text/html'
        )
        
        return {
            'success': True,
            'well_name': well_name,
            'depth_range': [depth_start, depth_end],
            'facies_summary': self._summarize_facies(facies),
            'visualization_key': viz_key
        }
    
    def _load_well_logs(self, well_name: str) -> Dict[str, np.ndarray]:
        """Load well log data from S3"""
        # Implementation here
        pass
    
    def _filter_depth_range(self, data: Dict, start: float, end: float) -> Dict:
        """Filter data to depth range"""
        # Implementation here
        pass
    
    def _classify_facies(self, data: Dict) -> np.ndarray:
        """Classify facies using log responses"""
        gr = data['GR']
        rt = data['RT']
        
        # Simple classification rules
        facies = np.zeros(len(gr))
        
        # Shale: High GR, Low RT
        facies[(gr > 100) & (rt < 10)] = 1
        
        # Sand: Low GR, High RT
        facies[(gr < 50) & (rt > 20)] = 2
        
        # Silt: Medium GR, Medium RT
        facies[(gr >= 50) & (gr <= 100) & (rt >= 10) & (rt <= 20)] = 3
        
        return facies
    
    def _generate_facies_log(self, data: Dict, facies: np.ndarray) -> str:
        """Generate HTML visualization"""
        # Use plotly or matplotlib to create facies log
        # Return HTML string
        pass
    
    def _summarize_facies(self, facies: np.ndarray) -> Dict[str, float]:
        """Calculate facies percentages"""
        unique, counts = np.unique(facies, return_counts=True)
        total = len(facies)
        
        return {
            'shale_percent': (counts[unique == 1][0] / total * 100) if 1 in unique else 0,
            'sand_percent': (counts[unique == 2][0] / total * 100) if 2 in unique else 0,
            'silt_percent': (counts[unique == 3][0] / total * 100) if 3 in unique else 0
        }

def handler(event, context):
    """Lambda handler"""
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        params = json.loads(event['body']) if 'body' in event else event
        
        classifier = FaciesClassifier()
        result = classifier.classify(
            well_name=params['well_name'],
            depth_start=params['depth_start'],
            depth_end=params['depth_end']
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps(result)
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({'success': False, 'error': str(e)})
        }
```

**Step 2: Create Agent**

```typescript
// cdk/lambda-functions/chat/agents/geologyAgent.ts

import { BaseEnhancedAgent } from './BaseEnhancedAgent';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

export class GeologyAgent extends BaseEnhancedAgent {
  private lambdaClient: LambdaClient;
  
  constructor() {
    super(true);
    this.lambdaClient = new LambdaClient({});
  }

  async processMessage(message: string): Promise<any> {
    const thoughtSteps = [];
    
    // Step 1: Intent Detection
    thoughtSteps.push(this.createThoughtStep(
      'intent_detection',
      'Analyzing Geological Query',
      'Understanding facies classification request'
    ));
    
    const intent = this.detectIntent(message);
    thoughtSteps[0].status = 'complete';
    thoughtSteps[0].summary = `Intent: ${intent}`;
    
    // Step 2: Extract Parameters
    thoughtSteps.push(this.createThoughtStep(
      'parameter_extraction',
      'Extracting Well and Depth Information',
      'Identifying well name and depth interval'
    ));
    
    const params = this.extractParameters(message);
    
    if (!params.wellName || !params.depthStart || !params.depthEnd) {
      thoughtSteps[1].status = 'error';
      thoughtSteps[1].summary = 'Missing required parameters';
      
      return {
        success: false,
        message: 'Please specify well name and depth range (e.g., "WELL-001 from 5000 to 6000 ft")',
        thoughtSteps
      };
    }
    
    thoughtSteps[1].status = 'complete';
    thoughtSteps[1].summary = `Well: ${params.wellName}, Depth: ${params.depthStart}-${params.depthEnd} ft`;
    
    // Step 3: Invoke Tool Lambda
    thoughtSteps.push(this.createThoughtStep(
      'execution',
      'Classifying Facies',
      'Analyzing well logs and identifying rock types'
    ));
    
    const result = await this.invokeGeologyTool(params);
    
    thoughtSteps[2].status = 'complete';
    thoughtSteps[2].summary = `Classified ${result.facies_summary.sand_percent.toFixed(1)}% sand, ${result.facies_summary.shale_percent.toFixed(1)}% shale`;
    
    // Step 4: Format Response
    const artifacts = [{
      type: 'facies_log',
      data: {
        messageContentType: 'facies_log',
        title: `Facies Classification - ${params.wellName}`,
        s3Key: result.visualization_key,
        bucket: process.env.STORAGE_BUCKET,
        metadata: {
          wellName: params.wellName,
          depthRange: [params.depthStart, params.depthEnd],
          faciesSummary: result.facies_summary
        }
      }
    }];
    
    const message = this.generateResponseMessage(result);
    
    return {
      success: true,
      message,
      artifacts,
      thoughtSteps
    };
  }
  
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (/facies|rock.*type|lithology/.test(lowerMessage)) {
      return 'facies_classification';
    }
    if (/depositional.*environment/.test(lowerMessage)) {
      return 'depositional_environment';
    }
    
    return 'general_geology';
  }
  
  private extractParameters(message: string): any {
    const params: any = {};
    
    // Extract well name
    const wellMatch = message.match(/WELL[-_]?\d+/i);
    if (wellMatch) {
      params.wellName = wellMatch[0].toUpperCase();
    }
    
    // Extract depth range
    const depthMatch = message.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:ft|feet)?/i);
    if (depthMatch) {
      params.depthStart = parseFloat(depthMatch[1]);
      params.depthEnd = parseFloat(depthMatch[2]);
    }
    
    return params;
  }
  
  private async invokeGeologyTool(params: any): Promise<any> {
    const command = new InvokeCommand({
      FunctionName: process.env.GEOLOGY_TOOL_FUNCTION_NAME,
      Payload: JSON.stringify(params)
    });
    
    const response = await this.lambdaClient.send(command);
    const result = JSON.parse(new TextDecoder().decode(response.Payload));
    
    if (result.statusCode !== 200) {
      throw new Error(result.body);
    }
    
    return JSON.parse(result.body);
  }
  
  private generateResponseMessage(result: any): string {
    const { facies_summary } = result;
    
    return `I've analyzed the facies for ${result.well_name} from ${result.depth_range[0]} to ${result.depth_range[1]} ft.

The interval contains:
- ${facies_summary.sand_percent.toFixed(1)}% sand
- ${facies_summary.shale_percent.toFixed(1)}% shale
- ${facies_summary.silt_percent.toFixed(1)}% silt

The facies log is displayed below showing the vertical distribution of rock types.`;
  }
  
  private createThoughtStep(type: string, title: string, summary: string): any {
    return {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      title,
      summary,
      status: 'in_progress'
    };
  }
}
```

**Step 3: Configure CDK**

```typescript
// cdk/lib/main-stack.ts

// Create geology tool Lambda
const geologyToolFunction = new lambda.Function(this, 'GeologyToolFunction', {
  functionName: 'geology-tool',
  runtime: lambda.Runtime.PYTHON_3_12,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, '../lambda-functions/geology-tool')),
  timeout: cdk.Duration.minutes(5),
  memorySize: 2048,
  environment: {
    STORAGE_BUCKET: storageBucket.bucketName
  }
});

// Grant permissions
storageBucket.grantReadWrite(geologyToolFunction);
geologyToolFunction.grantInvoke(chatFunction.function);

// Add environment variable
chatFunction.addEnvironment(
  'GEOLOGY_TOOL_FUNCTION_NAME',
  geologyToolFunction.functionName
);
```

**Step 4: Create Frontend Component**

```typescript
// src/components/artifacts/FaciesLogArtifact.tsx

import React, { useState, useEffect } from 'react';
import { Container, Box, SpaceBetween } from '@cloudscape-design/components';

export const FaciesLogArtifact: React.FC<{ artifact: any }> = ({ artifact }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadVisualization();
  }, [artifact]);
  
  const loadVisualization = async () => {
    try {
      // Fetch HTML from S3 via API
      const response = await fetch(
        `/api/artifacts/${artifact.data.bucket}/${artifact.data.s3Key}`
      );
      const html = await response.text();
      setHtmlContent(html);
      setLoading(false);
    } catch (error) {
      console.error('Error loading facies log:', error);
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Box>Loading facies log...</Box>;
  }
  
  return (
    <Container header={<h3>{artifact.data.title}</h3>}>
      <SpaceBetween size="l">
        {/* Metadata */}
        <Box>
          <div><strong>Well:</strong> {artifact.data.metadata.wellName}</div>
          <div><strong>Depth Range:</strong> {artifact.data.metadata.depthRange[0]} - {artifact.data.metadata.depthRange[1]} ft</div>
        </Box>
        
        {/* Facies Summary */}
        <Box>
          <h4>Facies Distribution</h4>
          <div>Sand: {artifact.data.metadata.faciesSummary.sand_percent.toFixed(1)}%</div>
          <div>Shale: {artifact.data.metadata.faciesSummary.shale_percent.toFixed(1)}%</div>
          <div>Silt: {artifact.data.metadata.faciesSummary.silt_percent.toFixed(1)}%</div>
        </Box>
        
        {/* Visualization */}
        <Box>
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </Box>
      </SpaceBetween>
    </Container>
  );
};
```

#### Lessons Learned

✅ **What Worked:**
- Clear separation between agent (NLP) and tool (computation)
- Python for scientific computation
- S3 for storing visualizations

⚠️ **Challenges:**
- Parameter extraction from natural language
- Handling missing well data gracefully
- Visualization size optimization

💡 **Improvements:**
- Add machine learning for better facies classification
- Support multiple wells for correlation
- Add export functionality (PDF, CSV)

---

## Example 3: Complex Orchestrator

### Seismic Analysis Orchestrator

**Complexity:** ⭐⭐⭐ Complex  
**Time to Implement:** 1-2 weeks  
**Components:** Proxy Agent + Orchestrator + Multiple Tool Lambdas

#### Use Case

Geophysicists perform comprehensive seismic analysis:
- "Analyze seismic survey SURVEY-001"
- "Generate structural interpretation for Block A"
- "Create seismic attribute maps and horizon picks"

#### Architecture

```
User Query
    ↓
Seismic Proxy Agent (Route to Orchestrator)
    ↓
Seismic Orchestrator (Workflow Management)
    ├─→ Seismic Loading Tool
    ├─→ Attribute Calculation Tool
    ├─→ Horizon Picking Tool
    ├─→ Structural Interpretation Tool
    └─→ Report Generation Tool
    ↓
Multiple Artifacts (Maps, Cross-sections, Reports)
```

#### Implementation Overview

Due to complexity, showing key components only:

**Orchestrator Structure:**

```typescript
// cdk/lambda-functions/seismic-orchestrator/orchestrator.ts

export class SeismicOrchestrator {
  async processRequest(params: any): Promise<any> {
    const intent = this.detectIntent(params.message);
    
    switch (intent) {
      case 'full_analysis':
        return await this.runFullAnalysis(params);
      case 'attribute_analysis':
        return await this.runAttributeAnalysis(params);
      case 'structural_interpretation':
        return await this.runStructuralInterpretation(params);
    }
  }
  
  private async runFullAnalysis(params: any): Promise<any> {
    const artifacts = [];
    
    // Step 1: Load seismic data
    const seismicData = await this.invokeTool('seismic-loader', {
      surveyName: params.surveyName
    });
    
    // Step 2: Calculate attributes
    const attributes = await this.invokeTool('attribute-calculator', {
      seismicData: seismicData.dataKey,
      attributes: ['amplitude', 'coherence', 'curvature']
    });
    
    artifacts.push(...attributes.artifacts);
    
    // Step 3: Pick horizons
    const horizons = await this.invokeTool('horizon-picker', {
      seismicData: seismicData.dataKey,
      attributes: attributes.attributeKeys
    });
    
    artifacts.push(...horizons.artifacts);
    
    // Step 4: Structural interpretation
    const interpretation = await this.invokeTool('structural-interpreter', {
      horizons: horizons.horizonKeys,
      attributes: attributes.attributeKeys
    });
    
    artifacts.push(...interpretation.artifacts);
    
    // Step 5: Generate report
    const report = await this.invokeTool('report-generator', {
      surveyName: params.surveyName,
      analysis: {
        attributes,
        horizons,
        interpretation
      }
    });
    
    artifacts.push(report.artifact);
    
    return {
      success: true,
      message: this.generateSummary(attributes, horizons, interpretation),
      artifacts
    };
  }
}
```

#### Key Learnings

✅ **What Worked:**
- Sequential tool invocation with data passing
- Project-based artifact organization
- Comprehensive error handling at each step

⚠️ **Challenges:**
- Managing state across multiple tool invocations
- Handling partial failures gracefully
- Optimizing for long processing times

💡 **Best Practices:**
- Save intermediate results to S3
- Implement resume capability for failed workflows
- Provide progress updates to user
- Use DynamoDB for workflow state management

---

## Comparison Summary

| Aspect | Simple Agent | Agent + Tool | Orchestrator |
|--------|-------------|--------------|--------------|
| **Complexity** | Low | Medium | High |
| **Time to Build** | 2-4 hours | 1-2 days | 1-2 weeks |
| **Components** | 1 (Agent) | 2 (Agent + Tool) | 4+ (Agent + Orch + Tools) |
| **Testing Effort** | Low | Medium | High |
| **Maintenance** | Easy | Moderate | Complex |
| **Use Cases** | Simple queries | Single analysis | Multi-step workflows |
| **Best For** | Prototyping | Production features | Enterprise workflows |

---

## Next Steps

After reviewing these examples:

1. **Identify your use case complexity**
2. **Choose the appropriate pattern**
3. **Start with the simplest solution**
4. **Add complexity only when needed**
5. **Test thoroughly at each step**

For more details, see:
- [Integration Guide](./README.md)
- [Code Templates](./templates/)
- [Decision Tree](./DECISION-TREE.md)
