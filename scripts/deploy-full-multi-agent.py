#!/usr/bin/env python3
"""
Complete Multi-Agent System Deployment Script
Deploys the full wind farm development workflow to AWS AgentCore
Based on lab3_agentcore_tutorial.ipynb
"""

import boto3
import json
import time
import sys
from pathlib import Path

# Add the workshop assets directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'agentic-ai-for-renewable-site-design-mainline' / 'workshop-assets'))

from agentcore_utils import (
    create_lambda_function,
    create_agentcore_gateway_role,
    setup_cognito_user_pool,
    create_agentcore_runtime_role,
    build_and_push_image_runtime,
    list_agentcore_resources
)

class MultiAgentDeployer:
    def __init__(self):
        self.agentcore_control_client = boto3.client('bedrock-agentcore-control')
        self.ssm_client = boto3.client('ssm')
        self.secrets_client = boto3.client('secretsmanager')
        
        # Store deployment artifacts
        self.function_arn = None
        self.gateway_id = None
        self.gateway_url = None
        self.gateway_arn = None
        self.cognito_config = None
        self.runtime_arn = None
        
    def step1_deploy_lambda(self):
        """Step 1: Deploy Lambda function with MCP tools"""
        print("\n" + "="*80)
        print("STEP 1: Deploying Lambda Function with MCP Tools")
        print("="*80)
        print("🚀 Building Docker image and deploying to AWS Lambda...")
        print("⏳ This may take several minutes for Docker build and push...")
        
        try:
            self.function_arn = create_lambda_function()
            print(f"✅ Lambda function deployed: {self.function_arn}")
            return True
        except Exception as e:
            print(f"❌ Failed to deploy Lambda: {e}")
            return False
    
    def step2_create_gateway_role(self):
        """Step 2: Create IAM role for AgentCore Gateway"""
        print("\n" + "="*80)
        print("STEP 2: Creating IAM Role for AgentCore Gateway")
        print("="*80)
        print("🔐 Setting up permissions for gateway to invoke Lambda...")
        
        try:
            gateway_role = create_agentcore_gateway_role("agentcore-gateway")
            self.gateway_role_arn = gateway_role["Role"]["Arn"]
            print(f"✅ Gateway IAM role created: {self.gateway_role_arn}")
            return True
        except Exception as e:
            print(f"❌ Failed to create gateway role: {e}")
            return False
    
    def step3_setup_cognito(self):
        """Step 3: Setup Cognito authentication"""
        print("\n" + "="*80)
        print("STEP 3: Setting Up Cognito Authentication")
        print("="*80)
        print("🔐 Configuring JWT authentication for gateway...")
        
        try:
            self.cognito_config = setup_cognito_user_pool()
            print(f"✅ Cognito configured:")
            print(f"   User Pool: {self.cognito_config['user_pool_id']}")
            print(f"   Client ID: {self.cognito_config['client_id']}")
            print(f"   Bearer Token: {self.cognito_config['bearer_token'][:50]}...")
            return True
        except Exception as e:
            print(f"❌ Failed to setup Cognito: {e}")
            return False
    
    def step4_create_gateway(self):
        """Step 4: Create AgentCore Gateway"""
        print("\n" + "="*80)
        print("STEP 4: Creating AgentCore Gateway")
        print("="*80)
        print("🚀 Setting up MCP gateway endpoint...")
        
        try:
            auth_config = {
                "customJWTAuthorizer": {
                    "allowedClients": [self.cognito_config['client_id']],
                    "discoveryUrl": self.cognito_config['discovery_url'],
                }
            }
            
            gateway_name = 'layout-tool'
            
            try:
                response = self.agentcore_control_client.create_gateway(
                    name=gateway_name,
                    roleArn=self.gateway_role_arn,
                    protocolType='MCP',
                    authorizerType='CUSTOM_JWT',
                    authorizerConfiguration=auth_config,
                    description='AgentCore Gateway with AWS Lambda target type',
                    exceptionLevel="DEBUG"
                )
                print('✅ Gateway created successfully!')
            except self.agentcore_control_client.exceptions.ConflictException:
                print('⚠️  Gateway already exists, updating configuration...')
                gateways = self.agentcore_control_client.list_gateways()
                gateway_id = None
                for gateway in gateways.get('items', []):
                    if gateway.get('name') == gateway_name:
                        gateway_id = gateway.get('gatewayId')
                        break
                
                if gateway_id:
                    response = self.agentcore_control_client.update_gateway(
                        gatewayIdentifier=gateway_id,
                        name=gateway_name,
                        protocolType='MCP',
                        authorizerType='CUSTOM_JWT',
                        roleArn=self.gateway_role_arn,
                        authorizerConfiguration=auth_config,
                        description='AgentCore Gateway with AWS Lambda target type',
                        exceptionLevel="DEBUG"
                    )
                    print('✅ Gateway updated successfully!')
            
            self.gateway_id = response['gatewayId']
            self.gateway_arn = response['gatewayArn']
            self.gateway_url = response['gatewayUrl']
            
            print(f"✅ Gateway deployed:")
            print(f"   ID: {self.gateway_id}")
            print(f"   ARN: {self.gateway_arn}")
            print(f"   URL: {self.gateway_url}")
            
            # Store in Parameter Store
            self.ssm_client.put_parameter(
                Name='/nrel-mcp/gateway-url',
                Value=self.gateway_url,
                Type='String',
                Description='Gateway URL',
                Overwrite=True
            )
            print("✅ Gateway URL stored in Parameter Store")
            
            return True
        except Exception as e:
            print(f"❌ Failed to create gateway: {e}")
            return False
    
    def step5_create_gateway_target(self):
        """Step 5: Create Gateway Target (connect Lambda to Gateway)"""
        print("\n" + "="*80)
        print("STEP 5: Creating Gateway Target")
        print("="*80)
        print("🔗 Connecting Lambda function to gateway...")
        
        try:
            inline_payload = [
                {
                    "name": "get_wind_conditions",
                    "description": "Fetch wind data from NREL API for a specific location and year",
                    "inputSchema": {
                        "type": "object",
                        "properties": {
                            "longitude": {
                                "description": "Latitude coordinate in decimal degrees",
                                "type": "number"
                            },
                            "latitude": {
                                "description": "Longitude coordinate in decimal degrees",
                                "type": "number"
                            },
                            "year": {
                                "description": "Year for wind data",
                                "type": "number"
                            }
                        },
                        "required": ["longitude", "latitude"]
                    }
                }
            ]
            
            lambda_target_config = {
                "mcp": {
                    "lambda": {
                        "lambdaArn": self.function_arn,
                        "toolSchema": {
                            "inlinePayload": inline_payload
                        }
                    }
                }
            }
            
            targetname = 'wind-data-tools'
            credential_config = [{"credentialProviderType": "GATEWAY_IAM_ROLE"}]
            
            try:
                response = self.agentcore_control_client.create_gateway_target(
                    gatewayIdentifier=self.gateway_id,
                    name=targetname,
                    description='Lambda Tools Target',
                    targetConfiguration=lambda_target_config,
                    credentialProviderConfigurations=credential_config
                )
                print('✅ Gateway target created successfully!')
            except self.agentcore_control_client.exceptions.ConflictException:
                print('⚠️  Target already exists, updating configuration...')
                targets = self.agentcore_control_client.list_gateway_targets(gatewayIdentifier=self.gateway_id)
                target_id = None
                for target in targets.get('items', []):
                    if target.get('name') == targetname:
                        target_id = target.get('targetId')
                        break
                
                if target_id:
                    response = self.agentcore_control_client.update_gateway_target(
                        gatewayIdentifier=self.gateway_id,
                        targetId=target_id,
                        name=targetname,
                        description='Lambda Target using SDK',
                        targetConfiguration=lambda_target_config,
                        credentialProviderConfigurations=credential_config
                    )
                    print('✅ Gateway target updated successfully!')
            
            print(f"✅ Target '{targetname}' connected to gateway")
            return True
        except Exception as e:
            print(f"❌ Failed to create gateway target: {e}")
            return False
    
    def step6_test_gateway(self):
        """Step 6: Test Gateway Integration"""
        print("\n" + "="*80)
        print("STEP 6: Testing Gateway Integration")
        print("="*80)
        print("🧪 Verifying MCP tools are accessible...")
        
        try:
            from mcp.client.streamable_http import streamablehttp_client
            from strands.tools.mcp.mcp_client import MCPClient
            
            def create_streamable_http_transport():
                return streamablehttp_client(
                    self.gateway_url,
                    headers={"Authorization": f"Bearer {self.cognito_config['bearer_token']}"}
                )
            
            client = MCPClient(create_streamable_http_transport)
            
            with client:
                # List tools
                tools = client.list_tools_sync()
                print(f'✅ Found {len(tools)} available tools:')
                for i, tool in enumerate(tools, 1):
                    print(f'   {i}. {tool.tool_name}')
                
                # Test tool call
                print('\n🔍 Testing tool call: get_wind_conditions')
                print('📍 Test location: Austin, TX (30.25, -97.74)')
                result = client.call_tool_sync(
                    tool_use_id="test_wind_conditions",
                    name='wind-data-tools___get_wind_conditions',
                    arguments={"latitude": 30.25, "longitude": -97.74},
                )
                print(f'✅ Tool response received: {result["content"][0]["text"][:100]}...')
            
            print("\n🎉 Gateway integration test passed!")
            return True
        except Exception as e:
            print(f"❌ Gateway test failed: {e}")
            return False
    
    def step7_create_runtime(self):
        """Step 7: Create AgentCore Runtime"""
        print("\n" + "="*80)
        print("STEP 7: Creating AgentCore Runtime")
        print("="*80)
        print("🚀 Deploying Strands Agent to AgentCore Runtime...")
        print("⏳ This may take several minutes for Docker build and deployment...")
        
        try:
            # Create runtime role
            print("🔐 Creating runtime IAM role...")
            runtime_role = create_agentcore_runtime_role('agentcore-runtime')
            runtime_role_arn = runtime_role['Role']['Arn']
            print(f"✅ Runtime role created: {runtime_role_arn}")
            
            # Build and push runtime image
            print("🐳 Building and pushing runtime Docker image...")
            ecr_repository = build_and_push_image_runtime()
            print(f"✅ Runtime image pushed: {ecr_repository}")
            
            # Create agent runtime
            agent_name = "wind_farm_dev_agent"
            print(f"🤖 Creating agent runtime: {agent_name}...")
            
            try:
                response = self.agentcore_control_client.create_agent_runtime(
                    agentRuntimeName=agent_name,
                    agentRuntimeArtifact={
                        'containerConfiguration': {
                            'containerUri': ecr_repository
                        }
                    },
                    roleArn=runtime_role_arn,
                    networkConfiguration={
                        'networkMode': 'PUBLIC',
                    },
                    protocolConfiguration={
                        'serverProtocol': 'HTTP'
                    }
                )
                print('✅ Agent runtime created successfully!')
            except self.agentcore_control_client.exceptions.ConflictException:
                print('⚠️  Agent runtime already exists, updating...')
                # Get existing runtime
                runtimes = self.agentcore_control_client.list_agent_runtimes()
                runtime_id = None
                for runtime in runtimes.get('items', []):
                    if runtime.get('agentRuntimeName') == agent_name:
                        runtime_id = runtime.get('agentRuntimeId')
                        break
                
                if runtime_id:
                    response = self.agentcore_control_client.update_agent_runtime(
                        agentRuntimeIdentifier=runtime_id,
                        agentRuntimeName=agent_name,
                        agentRuntimeArtifact={
                            'containerConfiguration': {
                                'containerUri': ecr_repository
                            }
                        },
                        roleArn=runtime_role_arn
                    )
                    print('✅ Agent runtime updated successfully!')
            
            self.runtime_arn = response['agentRuntimeArn']
            print(f"✅ Runtime deployed: {self.runtime_arn}")
            
            # Store in Parameter Store
            self.ssm_client.put_parameter(
                Name='/nrel-mcp/runtime-arn',
                Value=self.runtime_arn,
                Type='String',
                Description='Agent Runtime ARN',
                Overwrite=True
            )
            print("✅ Runtime ARN stored in Parameter Store")
            
            return True
        except Exception as e:
            print(f"❌ Failed to create runtime: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def step8_summary(self):
        """Step 8: Display deployment summary"""
        print("\n" + "="*80)
        print("DEPLOYMENT SUMMARY")
        print("="*80)
        
        print("\n✅ Multi-Agent System Successfully Deployed!")
        print("\n📦 Deployed Components:")
        print(f"   1. Lambda Function: {self.function_arn}")
        print(f"   2. AgentCore Gateway: {self.gateway_url}")
        print(f"   3. Gateway Target: wind-data-tools")
        print(f"   4. Agent Runtime: {self.runtime_arn}")
        
        print("\n🔐 Authentication:")
        print(f"   User Pool: {self.cognito_config['user_pool_id']}")
        print(f"   Client ID: {self.cognito_config['client_id']}")
        
        print("\n📝 Configuration Stored in:")
        print("   - Parameter Store: /nrel-mcp/gateway-url")
        print("   - Parameter Store: /nrel-mcp/runtime-arn")
        print("   - Secrets Manager: cognito-bearer-token")
        
        print("\n🚀 Next Steps:")
        print("   1. Test the multi-agent workflow from your application")
        print("   2. Monitor CloudWatch logs for agent execution")
        print("   3. Use the gateway URL to invoke MCP tools")
        print("   4. Use the runtime ARN to invoke the agent")
        
        print("\n" + "="*80)
    
    def deploy_all(self):
        """Execute complete deployment workflow"""
        print("\n" + "="*80)
        print("MULTI-AGENT SYSTEM DEPLOYMENT")
        print("="*80)
        print("This script will deploy the complete wind farm development workflow")
        print("to AWS AgentCore, including:")
        print("  - Lambda functions with MCP tools")
        print("  - AgentCore Gateway for tool access")
        print("  - AgentCore Runtime for agent execution")
        print("  - Cognito authentication")
        print("="*80)
        
        steps = [
            ("Deploy Lambda Function", self.step1_deploy_lambda),
            ("Create Gateway IAM Role", self.step2_create_gateway_role),
            ("Setup Cognito Authentication", self.step3_setup_cognito),
            ("Create AgentCore Gateway", self.step4_create_gateway),
            ("Create Gateway Target", self.step5_create_gateway_target),
            ("Test Gateway Integration", self.step6_test_gateway),
            ("Create AgentCore Runtime", self.step7_create_runtime),
        ]
        
        for i, (step_name, step_func) in enumerate(steps, 1):
            print(f"\n[{i}/{len(steps)}] {step_name}")
            if not step_func():
                print(f"\n❌ Deployment failed at step {i}: {step_name}")
                print("Please check the error messages above and try again.")
                return False
            time.sleep(2)  # Brief pause between steps
        
        self.step8_summary()
        return True

def main():
    deployer = MultiAgentDeployer()
    success = deployer.deploy_all()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
