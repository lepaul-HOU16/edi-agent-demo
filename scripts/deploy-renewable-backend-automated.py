#!/usr/bin/env python3
"""
Automated Renewable Energy Backend Deployment

This script automates the deployment of the renewable energy multi-agent system
to AWS Bedrock AgentCore. It's based on the lab3_agentcore_tutorial.ipynb notebook
but runs non-interactively.

Usage:
    python scripts/deploy-renewable-backend-automated.py

Requirements:
    - AWS CLI configured with appropriate credentials
    - Python 3.9+
    - Docker installed and running
    - boto3, strands-agents packages installed
"""

import os
import sys
import json
import boto3
import subprocess
from pathlib import Path

# Colors for terminal output
class Colors:
    GREEN = '\033[0;32m'
    BLUE = '\033[0;34m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'  # No Color

def print_step(message):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.NC}")
    print(f"{Colors.BLUE}{message}{Colors.NC}")
    print(f"{Colors.BLUE}{'='*60}{Colors.NC}\n")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.NC}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.NC}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.NC}")

def check_prerequisites():
    """Check if all prerequisites are met"""
    print_step("Checking Prerequisites")
    
    # Check AWS credentials
    try:
        sts = boto3.client('sts')
        identity = sts.get_caller_identity()
        account_id = identity['Account']
        print_success(f"AWS credentials configured (Account: {account_id})")
    except Exception as e:
        print_error(f"AWS credentials not configured: {e}")
        return False
    
    # Check Docker
    try:
        result = subprocess.run(['docker', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print_success(f"Docker installed: {result.stdout.strip()}")
        else:
            print_error("Docker not found")
            return False
    except FileNotFoundError:
        print_error("Docker not found")
        return False
    
    # Check workshop directory
    workshop_dir = Path('agentic-ai-for-renewable-site-design-mainline/workshop-assets')
    if not workshop_dir.exists():
        print_error(f"Workshop directory not found: {workshop_dir}")
        return False
    print_success(f"Workshop directory found: {workshop_dir}")
    
    return True

def setup_s3_bucket(region='us-west-2'):
    """Create S3 bucket for renewable energy artifacts"""
    print_step("Setting Up S3 Bucket")
    
    s3 = boto3.client('s3', region_name=region)
    ssm = boto3.client('ssm', region_name=region)
    
    # Generate unique bucket name
    account_id = boto3.client('sts').get_caller_identity()['Account']
    bucket_name = f"renewable-energy-artifacts-{account_id}"
    
    try:
        # Check if bucket exists
        try:
            s3.head_bucket(Bucket=bucket_name)
            print_success(f"S3 bucket already exists: {bucket_name}")
        except:
            # Create bucket
            if region == 'us-east-1':
                s3.create_bucket(Bucket=bucket_name)
            else:
                s3.create_bucket(
                    Bucket=bucket_name,
                    CreateBucketConfiguration={'LocationConstraint': region}
                )
            print_success(f"S3 bucket created: {bucket_name}")
        
        # Store bucket name in SSM
        ssm.put_parameter(
            Name='/wind-farm-assistant/s3-bucket-name',
            Value=bucket_name,
            Type='String',
            Overwrite=True
        )
        print_success("SSM parameter created: /wind-farm-assistant/s3-bucket-name")
        
        # Enable S3 storage
        ssm.put_parameter(
            Name='/wind-farm-assistant/use-s3-storage',
            Value='true',
            Type='String',
            Overwrite=True
        )
        print_success("SSM parameter created: /wind-farm-assistant/use-s3-storage")
        
        return bucket_name
        
    except Exception as e:
        print_error(f"Failed to setup S3 bucket: {e}")
        return None

def deploy_mcp_server(region='us-west-2'):
    """Deploy MCP server to Lambda"""
    print_step("Deploying MCP Server to Lambda")
    
    print_warning("MCP Server deployment requires Docker build and ECR push")
    print_warning("This step is complex and may take 10-15 minutes")
    print_warning("For now, we'll skip this and use the AgentCore Runtime approach")
    
    return True

def deploy_agentcore_runtime(region='us-west-2'):
    """Deploy multi-agent system to AgentCore Runtime"""
    print_step("Deploying to AgentCore Runtime")
    
    print_warning("AgentCore Runtime deployment is currently in preview")
    print_warning("This requires:")
    print_warning("  1. AWS Bedrock AgentCore access (preview)")
    print_warning("  2. Docker image build and push to ECR")
    print_warning("  3. AgentCore Runtime creation via boto3")
    
    print("\nFor manual deployment, please:")
    print("  1. Navigate to: agentic-ai-for-renewable-site-design-mainline/workshop-assets/")
    print("  2. Run: jupyter notebook lab3_agentcore_tutorial.ipynb")
    print("  3. Execute all cells in the notebook")
    print("  4. Save the AgentCore endpoint URL from the output")
    
    return None

def save_configuration(endpoint_url, bucket_name, region):
    """Save configuration to .env.local"""
    print_step("Saving Configuration")
    
    env_file = Path('.env.local')
    
    # Read existing .env.local if it exists
    existing_config = {}
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                if '=' in line and not line.strip().startswith('#'):
                    key, value = line.strip().split('=', 1)
                    existing_config[key] = value
    
    # Update renewable configuration
    existing_config['NEXT_PUBLIC_RENEWABLE_ENABLED'] = 'true'
    if endpoint_url:
        existing_config['NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT'] = endpoint_url
    if bucket_name:
        existing_config['NEXT_PUBLIC_RENEWABLE_S3_BUCKET'] = bucket_name
    existing_config['NEXT_PUBLIC_RENEWABLE_AWS_REGION'] = region
    
    # Write back to .env.local
    with open(env_file, 'w') as f:
        f.write("# EDI Platform Environment Variables\n\n")
        for key, value in existing_config.items():
            f.write(f"{key}={value}\n")
    
    print_success(f"Configuration saved to {env_file}")
    
    # Display configuration
    print("\nRenewable Energy Configuration:")
    print(f"  Enabled: true")
    if endpoint_url:
        print(f"  Endpoint: {endpoint_url}")
    if bucket_name:
        print(f"  S3 Bucket: {bucket_name}")
    print(f"  Region: {region}")

def main():
    """Main deployment function"""
    print("\n🌱 Renewable Energy Backend - Automated Deployment")
    print("=" * 60)
    
    # Configuration
    region = os.environ.get('AWS_REGION', 'us-west-2')
    
    # Check prerequisites
    if not check_prerequisites():
        print_error("\nPrerequisites not met. Please fix the issues and try again.")
        sys.exit(1)
    
    # Setup S3 bucket
    bucket_name = setup_s3_bucket(region)
    if not bucket_name:
        print_error("\nFailed to setup S3 bucket")
        sys.exit(1)
    
    # Deploy MCP server (optional)
    # deploy_mcp_server(region)
    
    # Deploy AgentCore Runtime
    endpoint_url = deploy_agentcore_runtime(region)
    
    # Save configuration
    save_configuration(endpoint_url, bucket_name, region)
    
    # Final instructions
    print_step("Deployment Summary")
    
    print(f"{Colors.GREEN}✓ S3 bucket created and configured{Colors.NC}")
    print(f"{Colors.GREEN}✓ SSM parameters configured{Colors.NC}")
    print(f"{Colors.YELLOW}⚠ AgentCore Runtime deployment requires manual steps{Colors.NC}")
    
    print("\n" + "=" * 60)
    print(f"{Colors.GREEN}Next Steps:{Colors.NC}")
    print("=" * 60)
    print("\n1. Complete AgentCore deployment:")
    print("   cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/")
    print("   jupyter notebook lab3_agentcore_tutorial.ipynb")
    
    print("\n2. After deployment, update .env.local with the endpoint URL:")
    print("   NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<your-endpoint-url>")
    
    print("\n3. Validate the integration:")
    print("   ./scripts/validate-renewable-integration.sh")
    
    print("\n4. Deploy EDI Platform:")
    print("   npx ampx sandbox")
    
    print("\n5. Test the integration:")
    print("   npm run dev")
    print("   # Then try: 'Analyze terrain for wind farm at 35.067482, -101.395466'")
    
    print("\n" + "=" * 60)
    print(f"{Colors.GREEN}Deployment preparation complete!{Colors.NC}")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Deployment cancelled by user{Colors.NC}")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n{Colors.RED}Deployment failed: {e}{Colors.NC}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

