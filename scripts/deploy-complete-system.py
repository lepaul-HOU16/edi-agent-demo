#!/usr/bin/env python3
"""
Complete Multi-Agent System Deployment
Deploys Gateway + Lambda + Runtime in one go
"""

import sys
import os
import subprocess
import base64
import time
import json
from pathlib import Path

# Add workshop assets to path
workshop_path = Path(__file__).parent.parent / 'agentic-ai-for-renewable-site-design-mainline' / 'workshop-assets'
sys.path.insert(0, str(workshop_path))
sys.path.insert(0, str(workshop_path / 'agent_core'))

import boto3
from boto3.session import Session

# Import existing utilities
from utils import (
    create_agentcore_gateway_role,
    setup_cognito_user_pool,
    create_agentcore_runtime_role,
    list_agentcore_resources
)

class CompleteDeployer:
    def __init__(self):
        self.session = Session()
        self.region = self.session.region_name
        self.account_id = boto3.client("sts").get_caller_identity()["Account"]
        
        self.agentcore_client = boto3.client('bedrock-agentcore-control')
        self.ssm_client = boto3.client('ssm')
        self.ecr_client = boto3.client('ecr')
        self.lambda_client = boto3.client('lambda')
        self.iam_client = boto3.client('iam')
        
        self.function_arn = None
        self.gateway_id = None
        self.gateway_url = None
        self.cognito_config = None
        self.runtime_arn = None
    
    def build_and_push_image(self, repository_name, image_tag, dockerfile_dir):
        """Build and push Docker image to ECR"""
        print(f"📦 Building image from {dockerfile_dir}")
        
        # Create repository if needed
        try:
            self.ecr_client.create_repository(repositoryName=repository_name)
            print(f"✅ Created ECR repository: {repository_name}")
        except self.ecr_client.exceptions.RepositoryAlreadyExistsException:
            print(f"✅ Repository {repository_name} already exists")
        
        # Login to AWS ECR Public (for pulling base images)
        print("🔐 Authenticating with AWS ECR Public...")
        try:
            ecr_public_client = boto3.client('ecr-public', region_name='us-east-1')
            public_token = ecr_public_client.get_authorization_token()
            public_password = public_token['authorizationData']['authorizationToken']
            subprocess.run([
                'docker', 'login',
                '--username', 'AWS',
                '--password', public_password,
                'public.ecr.aws'
            ], check=True, capture_output=True)
            print("✅ Authenticated with ECR Public")
        except Exception as e:
            print(f"⚠️  ECR Public auth failed (may not be needed): {e}")
        
        # Get ECR login
        token = self.ecr_client.get_authorization_token()
        username, password = base64.b64decode(
            token['authorizationData'][0]['authorizationToken']
        ).decode().split(':')
        registry = token['authorizationData'][0]['proxyEndpoint']
        
        # Login to ECR
        subprocess.run([
            'docker', 'login',
            '--username', username,
            '--password', password,
            registry
        ], check=True, capture_output=True)
        
        # Build image for x86_64 platform (Lambda default) using buildx
        image_uri = f"{self.account_id}.dkr.ecr.{self.region}.amazonaws.com/{repository_name}:{image_tag}"
        
        print(f"🔨 Building and pushing Docker image for x86_64 platform...")
        # Use buildx to build and push in one step with proper manifest
        result = subprocess.run([
            'docker', 'buildx', 'build',
            '--platform', 'linux/amd64',
            '--push',
            '-t', image_uri,
            str(dockerfile_dir)
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"❌ Docker build/push failed: {result.stderr}")
            print(f"Output: {result.stdout}")
            raise Exception("Docker build/push failed")
        
        print(f"✅ Image pushed: {image_uri}")
        return image_uri
    
    def create_lambda_role(self, role_name='agentcore-gateway-lambda-role'):
        """Create Lambda IAM role"""
        try:
            role = self.iam_client.get_role(RoleName=role_name)
            print(f"✅ Role '{role_name}' already exists")
            return role['Role']['Arn']
        except self.iam_client.exceptions.NoSuchEntityException:
            pass
        
        role = self.iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            })
        )
        
        self.iam_client.attach_role_policy(
            RoleName=role_name,
            PolicyArn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        )
        
        print(f"✅ Created role: {role_name}")
        time.sleep(10)  # Wait for role propagation
        return role['Role']['Arn']
    
    def deploy_lambda(self):
        """Deploy Lambda function"""
        print("\n" + "="*80)
        print("STEP 1: Deploying Lambda Function")
        print("="*80)
        
        lambda_dir = workshop_path / 'agent_core' / '02_host_local_tools_to_lambda_gateway'
        
        # Build and push image
        image_uri = self.build_and_push_image(
            'agentcore-gateway-lambda-container',
            'latest',
            lambda_dir
        )
        
        # Create role
        role_arn = self.create_lambda_role()
        
        # Create or update function
        function_name = 'agentcore-gateway-lambda'
        
        try:
            response = self.lambda_client.create_function(
                FunctionName=function_name,
                PackageType='Image',
                Code={'ImageUri': image_uri},
                Role=role_arn,
                Timeout=900,
                MemorySize=1024,
                Publish=True,
                Architectures=['x86_64'],
            )
            print(f"✅ Created Lambda function")
            time.sleep(30)
        except self.lambda_client.exceptions.ResourceConflictException:
            response = self.lambda_client.update_function_code(
                FunctionName=function_name,
                ImageUri=image_uri
            )
            print(f"✅ Updated Lambda function")
        
        self.function_arn = response['FunctionArn']
        print(f"✅ Lambda ARN: {self.function_arn}")
        return True
    
    def deploy_gateway(self):
        """Deploy AgentCore Gateway"""
        print("\n" + "="*80)
        print("STEP 2: Deploying AgentCore Gateway")
        print("="*80)
        
        # Create gateway role
        print("🔐 Creating gateway role...")
        gateway_role = create_agentcore_gateway_role("agentcore-gateway")
        gateway_role_arn = gateway_role["Role"]["Arn"]
        
        # Setup Cognito
        print("🔐 Setting up Cognito...")
        self.cognito_config = setup_cognito_user_pool()
        
        # Create gateway
        print("🚀 Creating gateway...")
        auth_config = {
            "customJWTAuthorizer": {
                "allowedClients": [self.cognito_config['client_id']],
                "discoveryUrl": self.cognito_config['discovery_url'],
            }
        }
        
        gateway_name = 'layout-tool'
        
        try:
            response = self.agentcore_client.create_gateway(
                name=gateway_name,
                roleArn=gateway_role_arn,
                protocolType='MCP',
                authorizerType='CUSTOM_JWT',
                authorizerConfiguration=auth_config,
                description='AgentCore Gateway for Wind Farm Tools',
                exceptionLevel="DEBUG"
            )
        except self.agentcore_client.exceptions.ConflictException:
            print('⚠️  Gateway exists, updating...')
            gateways = self.agentcore_client.list_gateways()
            gateway_id = next((g['gatewayId'] for g in gateways.get('items', []) 
                             if g.get('name') == gateway_name), None)
            if gateway_id:
                response = self.agentcore_client.update_gateway(
                    gatewayIdentifier=gateway_id,
                    name=gateway_name,
                    protocolType='MCP',
                    authorizerType='CUSTOM_JWT',
                    roleArn=gateway_role_arn,
                    authorizerConfiguration=auth_config,
                    description='AgentCore Gateway for Wind Farm Tools',
                    exceptionLevel="DEBUG"
                )
        
        self.gateway_id = response['gatewayId']
        self.gateway_url = response['gatewayUrl']
        
        # Store gateway URL
        self.ssm_client.put_parameter(
            Name='/nrel-mcp/gateway-url',
            Value=self.gateway_url,
            Type='String',
            Description='Gateway URL',
            Overwrite=True
        )
        
        print(f"✅ Gateway URL: {self.gateway_url}")
        
        # Create gateway target
        print("🔗 Creating gateway target...")
        inline_payload = [{
            "name": "get_wind_conditions",
            "description": "Fetch wind data from NREL API",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "longitude": {"type": "number"},
                    "latitude": {"type": "number"},
                    "year": {"type": "number"}
                },
                "required": ["longitude", "latitude"]
            }
        }]
        
        lambda_target_config = {
            "mcp": {
                "lambda": {
                    "lambdaArn": self.function_arn,
                    "toolSchema": {"inlinePayload": inline_payload}
                }
            }
        }
        
        targetname = 'wind-data-tools'
        
        try:
            self.agentcore_client.create_gateway_target(
                gatewayIdentifier=self.gateway_id,
                name=targetname,
                description='Lambda Tools Target',
                targetConfiguration=lambda_target_config,
                credentialProviderConfigurations=[{"credentialProviderType": "GATEWAY_IAM_ROLE"}]
            )
        except self.agentcore_client.exceptions.ConflictException:
            targets = self.agentcore_client.list_gateway_targets(gatewayIdentifier=self.gateway_id)
            target_id = next((t['targetId'] for t in targets.get('items', []) 
                            if t.get('name') == targetname), None)
            if target_id:
                self.agentcore_client.update_gateway_target(
                    gatewayIdentifier=self.gateway_id,
                    targetId=target_id,
                    name=targetname,
                    description='Lambda Tools Target',
                    targetConfiguration=lambda_target_config,
                    credentialProviderConfigurations=[{"credentialProviderType": "GATEWAY_IAM_ROLE"}]
                )
        
        print(f"✅ Gateway target created")
        return True
    
    def deploy_runtime(self):
        """Deploy AgentCore Runtime"""
        print("\n" + "="*80)
        print("STEP 3: Deploying AgentCore Runtime")
        print("="*80)
        
        # Create runtime role
        print("🔐 Creating runtime role...")
        runtime_role = create_agentcore_runtime_role('agentcore-runtime')
        runtime_role_arn = runtime_role['Role']['Arn']
        
        # Build and push runtime image
        runtime_dir = workshop_path / 'agent_core' / '03_host_agent_to_runtime'
        image_uri = self.build_and_push_image(
            'agentcore-runtime-container',
            'latest',
            runtime_dir
        )
        
        # Create agent runtime
        agent_name = "wind_farm_dev_agent"
        print(f"🤖 Creating agent runtime: {agent_name}...")
        
        try:
            response = self.agentcore_client.create_agent_runtime(
                agentRuntimeName=agent_name,
                agentRuntimeArtifact={
                    'containerConfiguration': {
                        'containerUri': image_uri
                    }
                },
                roleArn=runtime_role_arn,
                networkConfiguration={'networkMode': 'PUBLIC'},
                protocolConfiguration={'serverProtocol': 'HTTP'}
            )
        except self.agentcore_client.exceptions.ConflictException:
            print('⚠️  Runtime exists, updating...')
            runtimes = self.agentcore_client.list_agent_runtimes()
            runtime_id = next((r['agentRuntimeId'] for r in runtimes.get('items', []) 
                             if r.get('agentRuntimeName') == agent_name), None)
            if runtime_id:
                response = self.agentcore_client.update_agent_runtime(
                    agentRuntimeIdentifier=runtime_id,
                    agentRuntimeName=agent_name,
                    agentRuntimeArtifact={
                        'containerConfiguration': {
                            'containerUri': image_uri
                        }
                    },
                    roleArn=runtime_role_arn
                )
        
        self.runtime_arn = response['agentRuntimeArn']
        
        # Store runtime ARN
        self.ssm_client.put_parameter(
            Name='/nrel-mcp/runtime-arn',
            Value=self.runtime_arn,
            Type='String',
            Description='Agent Runtime ARN',
            Overwrite=True
        )
        
        print(f"✅ Runtime ARN: {self.runtime_arn}")
        return True
    
    def print_summary(self):
        """Print deployment summary"""
        print("\n" + "="*80)
        print("DEPLOYMENT COMPLETE!")
        print("="*80)
        print("\n📦 Deployed Components:")
        print(f"  1. Lambda Function: {self.function_arn}")
        print(f"  2. AgentCore Gateway: {self.gateway_url}")
        print(f"  3. Agent Runtime: {self.runtime_arn}")
        
        print("\n🔐 Authentication:")
        print(f"  User Pool: {self.cognito_config['user_pool_id']}")
        print(f"  Client ID: {self.cognito_config['client_id']}")
        
        print("\n📝 Configuration Stored:")
        print("  - Parameter Store: /nrel-mcp/gateway-url")
        print("  - Parameter Store: /nrel-mcp/runtime-arn")
        print("  - Secrets Manager: workshop/cognito/credentials")
        
        print("\n🚀 Next Steps:")
        print("  1. Test the gateway with MCP client")
        print("  2. Invoke the agent runtime")
        print("  3. Monitor CloudWatch logs")
        
        print("\n" + "="*80)
        print("\nCurrent AgentCore Resources:")
        list_agentcore_resources()
    
    def deploy_all(self):
        """Execute complete deployment"""
        try:
            self.deploy_lambda()
            self.deploy_gateway()
            self.deploy_runtime()
            self.print_summary()
            return True
        except Exception as e:
            print(f"\n❌ Deployment failed: {e}")
            import traceback
            traceback.print_exc()
            return False

def main():
    print("="*80)
    print("COMPLETE MULTI-AGENT SYSTEM DEPLOYMENT")
    print("="*80)
    print("This will deploy:")
    print("  - Lambda function with MCP tools")
    print("  - AgentCore Gateway")
    print("  - AgentCore Runtime with Strands Agent")
    print("="*80)
    
    deployer = CompleteDeployer()
    success = deployer.deploy_all()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
