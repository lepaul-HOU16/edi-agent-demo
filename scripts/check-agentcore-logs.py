#!/usr/bin/env python3
"""
Script to check AgentCore CloudWatch logs for debugging deployment issues.
"""

import boto3
import json
from datetime import datetime, timedelta

def get_log_groups():
    """Find AgentCore-related log groups"""
    logs_client = boto3.client('logs', region_name='us-west-2')
    
    print("🔍 Searching for AgentCore log groups...")
    
    try:
        response = logs_client.describe_log_groups(
            logGroupNamePrefix='/aws/bedrock/agentcore'
        )
        
        if response['logGroups']:
            print(f"\n✅ Found {len(response['logGroups'])} AgentCore log groups:")
            for group in response['logGroups']:
                print(f"  - {group['logGroupName']}")
            return [g['logGroupName'] for g in response['logGroups']]
        else:
            print("\n⚠️  No AgentCore log groups found with prefix '/aws/bedrock/agentcore'")
            print("   Searching for any bedrock-related logs...")
            
            response = logs_client.describe_log_groups(
                logGroupNamePrefix='/aws/bedrock'
            )
            
            if response['logGroups']:
                print(f"\n✅ Found {len(response['logGroups'])} Bedrock log groups:")
                for group in response['logGroups']:
                    print(f"  - {group['logGroupName']}")
                return [g['logGroupName'] for g in response['logGroups']]
            else:
                print("\n❌ No Bedrock log groups found")
                return []
                
    except Exception as e:
        print(f"❌ Error listing log groups: {e}")
        return []

def get_recent_logs(log_group_name, minutes=30):
    """Get recent logs from a log group"""
    logs_client = boto3.client('logs', region_name='us-west-2')
    
    print(f"\n📋 Fetching logs from: {log_group_name}")
    print(f"   (Last {minutes} minutes)")
    
    try:
        # Get log streams
        streams_response = logs_client.describe_log_streams(
            logGroupName=log_group_name,
            orderBy='LastEventTime',
            descending=True,
            limit=5
        )
        
        if not streams_response['logStreams']:
            print("   ⚠️  No log streams found")
            return
        
        print(f"   Found {len(streams_response['logStreams'])} recent log streams")
        
        # Get logs from the most recent stream
        start_time = int((datetime.now() - timedelta(minutes=minutes)).timestamp() * 1000)
        
        for stream in streams_response['logStreams'][:3]:  # Check top 3 streams
            stream_name = stream['logStreamName']
            print(f"\n   📄 Stream: {stream_name}")
            
            try:
                events_response = logs_client.get_log_events(
                    logGroupName=log_group_name,
                    logStreamName=stream_name,
                    startTime=start_time,
                    limit=50
                )
                
                events = events_response['events']
                if events:
                    print(f"      Found {len(events)} log events:")
                    for event in events[-10:]:  # Show last 10 events
                        timestamp = datetime.fromtimestamp(event['timestamp'] / 1000)
                        message = event['message'].strip()
                        print(f"      [{timestamp.strftime('%H:%M:%S')}] {message}")
                else:
                    print("      No recent events")
                    
            except Exception as e:
                print(f"      ⚠️  Error reading stream: {e}")
                
    except Exception as e:
        print(f"   ❌ Error fetching logs: {e}")

def check_iam_role():
    """Check if the AgentCore IAM role exists and has correct permissions"""
    iam_client = boto3.client('iam')
    
    print("\n🔐 Checking IAM roles...")
    
    role_names = ['agentcore-runtime-role', 'AgentCoreExecutionRole', 'BedrockAgentCoreRole']
    
    for role_name in role_names:
        try:
            response = iam_client.get_role(RoleName=role_name)
            print(f"   ✅ Found role: {role_name}")
            print(f"      ARN: {response['Role']['Arn']}")
            
            # Check attached policies
            policies_response = iam_client.list_attached_role_policies(RoleName=role_name)
            if policies_response['AttachedPolicies']:
                print(f"      Attached policies:")
                for policy in policies_response['AttachedPolicies']:
                    print(f"        - {policy['PolicyName']}")
            
        except iam_client.exceptions.NoSuchEntityException:
            print(f"   ⚠️  Role not found: {role_name}")
        except Exception as e:
            print(f"   ❌ Error checking role {role_name}: {e}")

def check_ssm_parameters():
    """Check SSM parameters for configuration"""
    ssm_client = boto3.client('ssm', region_name='us-west-2')
    
    print("\n⚙️  Checking SSM parameters...")
    
    params = [
        '/wind-farm-assistant/s3-bucket-name',
        '/wind-farm-assistant/use-s3-storage',
        '/wind-farm-assistant/agentcore-endpoint'
    ]
    
    for param_name in params:
        try:
            response = ssm_client.get_parameter(Name=param_name)
            print(f"   ✅ {param_name}: {response['Parameter']['Value']}")
        except ssm_client.exceptions.ParameterNotFound:
            print(f"   ⚠️  {param_name}: Not found")
        except Exception as e:
            print(f"   ❌ Error checking {param_name}: {e}")

def main():
    print("=" * 70)
    print("  AgentCore Deployment Troubleshooting")
    print("=" * 70)
    
    # Check IAM roles
    check_iam_role()
    
    # Check SSM parameters
    check_ssm_parameters()
    
    # Get and display logs
    log_groups = get_log_groups()
    
    if log_groups:
        for log_group in log_groups:
            get_recent_logs(log_group, minutes=30)
    
    print("\n" + "=" * 70)
    print("  Common Issues and Solutions")
    print("=" * 70)
    print("""
1. **RuntimeClientError**: Runtime failed to start
   - Check CloudWatch logs above for specific error
   - Verify IAM role has correct permissions
   - Ensure Python dependencies are compatible

2. **Missing IAM Role**: agentcore-runtime-role not found
   - Re-run the notebook cell that creates the IAM role
   - Verify you have IAM permissions to create roles

3. **Import Errors in Logs**: Module not found
   - Check requirements.txt includes all dependencies
   - Verify Python version compatibility (3.12)

4. **Bedrock Access Denied**:
   - Ensure Bedrock model access is enabled in AWS Console
   - Check IAM role has bedrock:InvokeModel permission

5. **S3 Access Denied**:
   - Verify S3 bucket exists and is accessible
   - Check IAM role has S3 read/write permissions
    """)
    
    print("\n📚 Next Steps:")
    print("1. Review the CloudWatch logs above for specific errors")
    print("2. Fix any IAM or permission issues")
    print("3. Re-run the deployment notebook cells")
    print("4. If issues persist, check the notebook output for deployment errors")

if __name__ == "__main__":
    main()
