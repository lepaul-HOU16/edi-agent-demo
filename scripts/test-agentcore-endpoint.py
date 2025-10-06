#!/usr/bin/env python3
"""
Test the deployed AgentCore endpoint
"""

import boto3
import json

# From the .bedrock_agentcore.yaml file
AGENT_ID = "wind_farm_layout_agent-7DnHlIBg3o"
AGENT_ARN = "arn:aws:bedrock-agentcore:us-east-1:484907533441:runtime/wind_farm_layout_agent-7DnHlIBg3o"
REGION = "us-east-1"

def test_agentcore_invoke():
    """Test invoking the AgentCore runtime"""
    
    print("=" * 70)
    print("  Testing AgentCore Endpoint")
    print("=" * 70)
    print(f"\nAgent ID: {AGENT_ID}")
    print(f"Agent ARN: {AGENT_ARN}")
    print(f"Region: {REGION}")
    
    # Create bedrock-agentcore client
    try:
        client = boto3.client('bedrock-agentcore', region_name=REGION)
        print("\n✅ Bedrock AgentCore client created")
    except Exception as e:
        print(f"\n❌ Failed to create client: {e}")
        print("\nTrying bedrock-agent-runtime instead...")
        try:
            client = boto3.client('bedrock-agent-runtime', region_name=REGION)
            print("✅ Bedrock Agent Runtime client created")
        except Exception as e2:
            print(f"❌ Failed: {e2}")
            return
    
    # Test payload
    test_payload = {
        "prompt": "Analyze terrain for wind farm at 35.067482, -101.395466 with project_id test123"
    }
    
    print(f"\n🧪 Testing with payload:")
    print(json.dumps(test_payload, indent=2))
    
    # Try to invoke
    try:
        print("\n🚀 Invoking AgentCore runtime...")
        
        # Try different API methods
        methods_to_try = [
            ('invoke_agent_runtime', {'agentId': AGENT_ID, 'input': test_payload}),
            ('invoke_runtime', {'runtimeId': AGENT_ID, 'payload': json.dumps(test_payload)}),
        ]
        
        for method_name, params in methods_to_try:
            if hasattr(client, method_name):
                print(f"\n  Trying {method_name}...")
                try:
                    response = getattr(client, method_name)(**params)
                    print(f"  ✅ Success!")
                    print(f"  Response: {json.dumps(response, indent=2, default=str)}")
                    return response
                except Exception as e:
                    print(f"  ❌ {method_name} failed: {e}")
            else:
                print(f"  ⚠️  Method {method_name} not available")
        
        # If we get here, try listing available methods
        print("\n📋 Available client methods:")
        methods = [m for m in dir(client) if not m.startswith('_') and callable(getattr(client, m))]
        for method in methods[:20]:  # Show first 20
            print(f"  - {method}")
            
    except Exception as e:
        print(f"\n❌ Error invoking agent: {e}")
        import traceback
        traceback.print_exc()

def check_codebuild_status():
    """Check if the CodeBuild project completed successfully"""
    
    print("\n" + "=" * 70)
    print("  Checking CodeBuild Status")
    print("=" * 70)
    
    codebuild_client = boto3.client('codebuild', region_name=REGION)
    project_name = "bedrock-agentcore-wind_farm_layout_agent-builder"
    
    try:
        # Get recent builds
        response = codebuild_client.list_builds_for_project(
            projectName=project_name,
            sortOrder='DESCENDING'
        )
        
        if response['ids']:
            print(f"\n✅ Found {len(response['ids'])} builds")
            
            # Get details of most recent build
            build_id = response['ids'][0]
            build_details = codebuild_client.batch_get_builds(ids=[build_id])
            
            if build_details['builds']:
                build = build_details['builds'][0]
                print(f"\n📦 Most recent build:")
                print(f"  Build ID: {build_id}")
                print(f"  Status: {build['buildStatus']}")
                print(f"  Phase: {build.get('currentPhase', 'N/A')}")
                
                if build['buildStatus'] == 'FAILED':
                    print(f"\n❌ Build failed!")
                    if 'phases' in build:
                        print("\n  Build phases:")
                        for phase in build['phases']:
                            status = phase.get('phaseStatus', 'N/A')
                            phase_type = phase.get('phaseType', 'N/A')
                            print(f"    {phase_type}: {status}")
                            
                            if status == 'FAILED' and 'contexts' in phase:
                                print(f"      Error: {phase['contexts']}")
                
                elif build['buildStatus'] == 'SUCCEEDED':
                    print(f"\n✅ Build succeeded!")
                    
                elif build['buildStatus'] == 'IN_PROGRESS':
                    print(f"\n⏳ Build in progress...")
                    
        else:
            print("\n⚠️  No builds found")
            
    except Exception as e:
        print(f"\n❌ Error checking CodeBuild: {e}")

def check_ecr_image():
    """Check if the Docker image was pushed to ECR"""
    
    print("\n" + "=" * 70)
    print("  Checking ECR Image")
    print("=" * 70)
    
    ecr_client = boto3.client('ecr', region_name=REGION)
    repository_name = "bedrock-agentcore-wind_farm_layout_agent"
    
    try:
        response = ecr_client.describe_images(
            repositoryName=repository_name,
            maxResults=5
        )
        
        if response['imageDetails']:
            print(f"\n✅ Found {len(response['imageDetails'])} images in ECR")
            for image in response['imageDetails']:
                tags = image.get('imageTags', ['<untagged>'])
                pushed_at = image.get('imagePushedAt', 'N/A')
                size_mb = image.get('imageSizeInBytes', 0) / (1024 * 1024)
                print(f"\n  Image:")
                print(f"    Tags: {', '.join(tags)}")
                print(f"    Pushed: {pushed_at}")
                print(f"    Size: {size_mb:.1f} MB")
        else:
            print("\n⚠️  No images found in ECR repository")
            
    except ecr_client.exceptions.RepositoryNotFoundException:
        print(f"\n❌ ECR repository not found: {repository_name}")
    except Exception as e:
        print(f"\n❌ Error checking ECR: {e}")

if __name__ == "__main__":
    # Check build status first
    check_codebuild_status()
    
    # Check ECR image
    check_ecr_image()
    
    # Try to invoke
    test_agentcore_invoke()
    
    print("\n" + "=" * 70)
    print("  Summary")
    print("=" * 70)
    print("\nIf the build succeeded and image exists but invocation fails:")
    print("1. Check CloudWatch logs for the runtime")
    print("2. Verify the agent code has proper AgentCore decorators")
    print("3. Check that all dependencies are in requirements.txt")
    print("4. Verify IAM role has necessary permissions")
