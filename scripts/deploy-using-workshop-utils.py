#!/usr/bin/env python3
"""
Deployment using proven workshop utilities
This uses the tested utilities from the workshop that are known to work
"""

import sys
import os
from pathlib import Path

# Add workshop assets to path
workshop_path = Path(__file__).parent.parent / 'agentic-ai-for-renewable-site-design-mainline' / 'workshop-assets'
sys.path.insert(0, str(workshop_path))
sys.path.insert(0, str(workshop_path / 'agent_core'))

# Change to the Lambda gateway directory for Docker build
lambda_dir = workshop_path / 'agent_core' / '02_host_local_tools_to_lambda_gateway'
os.chdir(lambda_dir)

print("="*80)
print("DEPLOYMENT USING WORKSHOP UTILITIES")
print("="*80)
print(f"Working directory: {os.getcwd()}")
print("="*80)

# Import utilities that are known to work
from utils import (
    create_lambda_function,
    create_agentcore_gateway_role,
    setup_cognito_user_pool,
    list_agentcore_resources
)

import boto3
import json
import time

def main():
    print("\n🚀 Starting deployment with workshop utilities...\n")
    
    # Initialize clients
    agentcore_client = boto3.client('bedrock-agentcore-control')
    ssm_client = boto3.client('ssm')
    
    # Step 1: Deploy Lambda using workshop utility
    print("="*80)
    print("STEP 1: Deploying Lambda Function (using workshop utility)")
    print("="*80)
    try:
        function_arn = create_lambda_function()
        print(f"✅ Lambda deployed: {function_arn}\n")
    except Exception as e:
        print(f"❌ Lambda deployment failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 2: Create Gateway Role
    print("="*80)
    print("STEP 2: Creating Gateway IAM Role")
    print("="*80)
    try:
        gateway_role = create_agentcore_gateway_role("agentcore-gateway")
        gateway_role_arn = gateway_role["Role"]["Arn"]
        print(f"✅ Gateway role created: {gateway_role_arn}")
        print("⏳ Waiting 30 seconds for IAM role to propagate...")
        time.sleep(30)
        print("✅ IAM propagation complete\n")
    except Exception as e:
        print(f"❌ Gateway role creation failed: {e}")
        return False
    
    # Step 3: Setup Cognito
    print("="*80)
    print("STEP 3: Setting Up Cognito")
    print("="*80)
    try:
        cognito_config = setup_cognito_user_pool()
        print(f"✅ Cognito configured\n")
    except Exception as e:
        print(f"❌ Cognito setup failed: {e}")
        return False
    
    # Step 4: Create Gateway
    print("="*80)
    print("STEP 4: Creating AgentCore Gateway")
    print("="*80)
    try:
        auth_config = {
            "customJWTAuthorizer": {
                "allowedClients": [cognito_config['client_id']],
                "discoveryUrl": cognito_config['discovery_url'],
            }
        }
        
        gateway_name = 'layout-tool'
        
        try:
            response = agentcore_client.create_gateway(
                name=gateway_name,
                roleArn=gateway_role_arn,
                protocolType='MCP',
                authorizerType='CUSTOM_JWT',
                authorizerConfiguration=auth_config,
                description='AgentCore Gateway for Wind Farm Tools',
                exceptionLevel="DEBUG"
            )
        except agentcore_client.exceptions.ConflictException:
            print('⚠️  Gateway exists, updating...')
            gateways = agentcore_client.list_gateways()
            gateway_id = next((g['gatewayId'] for g in gateways.get('items', []) 
                             if g.get('name') == gateway_name), None)
            if gateway_id:
                response = agentcore_client.update_gateway(
                    gatewayIdentifier=gateway_id,
                    name=gateway_name,
                    protocolType='MCP',
                    authorizerType='CUSTOM_JWT',
                    roleArn=gateway_role_arn,
                    authorizerConfiguration=auth_config,
                    description='AgentCore Gateway for Wind Farm Tools',
                    exceptionLevel="DEBUG"
                )
        
        gateway_id = response['gatewayId']
        gateway_url = response['gatewayUrl']
        
        # Store gateway URL
        ssm_client.put_parameter(
            Name='/nrel-mcp/gateway-url',
            Value=gateway_url,
            Type='String',
            Description='Gateway URL',
            Overwrite=True
        )
        
        print(f"✅ Gateway created: {gateway_url}\n")
    except Exception as e:
        print(f"❌ Gateway creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 5: Create Gateway Target
    print("="*80)
    print("STEP 5: Creating Gateway Target")
    print("="*80)
    try:
        inline_payload = [
            {
                "name": "get_wind_conditions",
                "description": "Fetch wind data from NREL API for a specific location and year",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "longitude": {"description": "Longitude coordinate", "type": "number"},
                        "latitude": {"description": "Latitude coordinate", "type": "number"},
                        "year": {"description": "Year for wind data", "type": "number"}
                    },
                    "required": ["longitude", "latitude"]
                }
            }
        ]
        
        lambda_target_config = {
            "mcp": {
                "lambda": {
                    "lambdaArn": function_arn,
                    "toolSchema": {"inlinePayload": inline_payload}
                }
            }
        }
        
        targetname = 'wind-data-tools'
        credential_config = [{"credentialProviderType": "GATEWAY_IAM_ROLE"}]
        
        try:
            agentcore_client.create_gateway_target(
                gatewayIdentifier=gateway_id,
                name=targetname,
                description='Lambda Tools Target',
                targetConfiguration=lambda_target_config,
                credentialProviderConfigurations=credential_config
            )
        except agentcore_client.exceptions.ConflictException:
            print('⚠️  Target exists, updating...')
            targets = agentcore_client.list_gateway_targets(gatewayIdentifier=gateway_id)
            target_id = next((t['targetId'] for t in targets.get('items', []) 
                            if t.get('name') == targetname), None)
            if target_id:
                agentcore_client.update_gateway_target(
                    gatewayIdentifier=gateway_id,
                    targetId=target_id,
                    name=targetname,
                    description='Lambda Tools Target',
                    targetConfiguration=lambda_target_config,
                    credentialProviderConfigurations=credential_config
                )
        
        print(f"✅ Target '{targetname}' created\n")
    except Exception as e:
        print(f"❌ Target creation failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Summary
    print("\n" + "="*80)
    print("DEPLOYMENT COMPLETE!")
    print("="*80)
    print(f"\n✅ Lambda Function: {function_arn}")
    print(f"✅ Gateway URL: {gateway_url}")
    print(f"✅ Cognito Pool: {cognito_config['user_pool_id']}")
    print("\nConfiguration stored in:")
    print("  - Parameter Store: /nrel-mcp/gateway-url")
    print("  - Secrets Manager: workshop/cognito/credentials")
    print("\n" + "="*80)
    
    # List all resources
    print("\nCurrent AgentCore Resources:")
    list_agentcore_resources()
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
