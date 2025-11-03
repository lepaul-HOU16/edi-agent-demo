# Renewable Energy Integration - Troubleshooting Guide

## Overview

This guide provides solutions to common issues encountered when using the renewable energy integration. Issues are organized by category with diagnostic steps and solutions.

## Quick Diagnostic Checklist

Before diving into specific issues, run this quick diagnostic:

```bash
# 1. Check environment variables
echo $NEXT_PUBLIC_RENEWABLE_ENABLED
echo $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT
echo $NEXT_PUBLIC_RENEWABLE_S3_BUCKET

# 2. Run validation script
./scripts/validate-renewable-integration.sh

# 3. Check browser console (F12)
# Look for errors in Console tab

# 4. Check network requests
# Look for failed requests in Network tab
```

## Connection Issues

### Issue: "Renewable energy service is temporarily unavailable"

**Symptoms**:
- Error message in chat
- No response from renewable queries
- Thought steps show connection error

**Possible Causes**:
1. AgentCore endpoint is incorrect or unreachable
2. Network connectivity issues
3. AgentCore service is down
4. IAM permissions missing

**Diagnostic Steps**:

```bash
# 1. Verify endpoint URL
echo $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT

# 2. Test endpoint connectivity
curl -I $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT

# 3. Check AgentCore status
aws bedrock-agentcore describe-agent-runtime \
  --agent-runtime-id <runtime-id> \
  --region us-west-2

# 4. Check CloudWatch logs
aws logs tail /aws/bedrock/agentcore/renewable-wind-farm --follow
```

**Solutions**:

1. **Verify Endpoint URL**:
   ```bash
   # Check .env.local
   cat .env.local | grep AGENTCORE_ENDPOINT
   
   # Update if incorrect
   export NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT="<correct-url>"
   ```

2. **Test Network Connectivity**:
   ```bash
   # Test from your machine
   curl -v $NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT
   
   # Check firewall rules
   # Check VPC security groups
   ```

3. **Verify AgentCore Deployment**:
   ```bash
   # Redeploy if needed
   cd agentic-ai-for-renewable-site-design-mainline/workshop-assets/
   ./deploy-to-agentcore.sh
   ```

4. **Check IAM Permissions**:
   ```bash
   # Verify Lambda has AgentCore permissions
   aws lambda get-policy \
     --function-name <lightweightAgentFunction-name>
   ```

---

### Issue: "Authentication failed. Please sign in again"

**Symptoms**:
- 401 or 403 error in network tab
- Authentication error message
- Prompted to sign in again

**Possible Causes**:
1. Cognito token expired
2. IAM permissions missing
3. Cognito user pool misconfigured
4. Token not being passed correctly

**Diagnostic Steps**:

```bash
# 1. Check Cognito configuration
aws cognito-idp describe-user-pool \
  --user-pool-id <pool-id>

# 2. Check IAM role permissions
aws iam get-role \
  --role-name <lambda-execution-role>

# 3. Check browser console for token
# Look for Authorization header in Network tab
```

**Solutions**:

1. **Sign Out and Sign In**:
   - Click sign out
   - Clear browser cache
   - Sign in again
   - Try query again

2. **Verify IAM Permissions**:
   ```typescript
   // Check amplify/backend.ts has:
   backend.lightweightAgentFunction.resources.lambda.addToRolePolicy(
     new iam.PolicyStatement({
       actions: [
         "bedrock-agentcore:InvokeAgentRuntime",
         "bedrock-agentcore:InvokeAgent",
       ],
       resources: ["*"],
     })
   );
   ```

3. **Check Token Passing**:
   ```typescript
   // Verify RenewableClient includes token
   headers: {
     'Authorization': `Bearer ${this.cognitoToken}`,
     'Content-Type': 'application/json'
   }
   ```

4. **Refresh Cognito Configuration**:
   ```bash
   # Redeploy Amplify backend
   npx ampx sandbox
   ```

---

## Visualization Issues

### Issue: Maps not displaying

**Symptoms**:
- Blank iframe where map should be
- "Failed to load resource" in console
- Map container visible but empty

**Possible Causes**:
1. Folium HTML is malformed
2. iframe sandbox restrictions
3. CORS issues
4. JavaScript errors in map HTML

**Diagnostic Steps**:

```bash
# 1. Check browser console
# Look for iframe-related errors

# 2. Check network tab
# Look for blocked requests

# 3. Inspect iframe content
# Right-click iframe > Inspect
```

**Solutions**:

1. **Check iframe Sandbox Attributes**:
   ```typescript
   // Verify TerrainMapArtifact.tsx has:
   <iframe
     srcDoc={data.mapHtml}
     sandbox="allow-scripts allow-same-origin"
     style={{ width: '100%', height: '600px', border: 'none' }}
     title="Terrain Analysis Map"
   />
   ```

2. **Verify Folium HTML**:
   ```typescript
   // Check that mapHtml is valid HTML
   console.log(data.mapHtml.substring(0, 100));
   // Should start with: <!DOCTYPE html> or <html>
   ```

3. **Check CORS Configuration**:
   ```bash
   # If map tiles are blocked, check CORS
   # Folium uses external tile servers
   # Ensure browser allows external resources
   ```

4. **Try Different Browser**:
   - Test in Chrome, Firefox, Safari
   - Check if issue is browser-specific
   - Disable browser extensions

---

### Issue: Charts not displaying

**Symptoms**:
- Broken image icon
- "Failed to load image" error
- Blank space where chart should be

**Possible Causes**:
1. Base64 image data is invalid
2. Image size too large
3. Browser memory issues
4. Image format not supported

**Diagnostic Steps**:

```bash
# 1. Check browser console
# Look for image loading errors

# 2. Inspect image src
# Right-click image > Inspect
# Check src attribute

# 3. Verify base64 data
console.log(data.chartImages.wakeMap.substring(0, 50));
# Should start with: data:image/png;base64,
```

**Solutions**:

1. **Verify Base64 Format**:
   ```typescript
   // Check SimulationChartArtifact.tsx
   <img
     src={data.chartImages.wakeMap}  // Should be data:image/png;base64,...
     alt="Wake Analysis Map"
     style={{ maxWidth: '100%', height: 'auto' }}
   />
   ```

2. **Check Image Size**:
   ```typescript
   // Log image size
   const base64Length = data.chartImages.wakeMap.length;
   const sizeInBytes = (base64Length * 3) / 4;
   console.log(`Image size: ${sizeInBytes / 1024 / 1024} MB`);
   // Should be < 5MB
   ```

3. **Clear Browser Cache**:
   ```bash
   # Chrome: Cmd+Shift+Delete (Mac) or Ctrl+Shift+Delete (Windows)
   # Select "Cached images and files"
   # Clear data
   ```

4. **Try Different Image Format**:
   - Check if PNG vs JPEG makes a difference
   - Verify matplotlib is generating valid images

---

## Query Issues

### Issue: Query not recognized as renewable

**Symptoms**:
- Query routes to wrong agent
- Generic response instead of renewable analysis
- No renewable artifacts generated

**Possible Causes**:
1. Query pattern not matching
2. Renewable integration disabled
3. Agent router not updated
4. Pattern detection logic issue

**Diagnostic Steps**:

```bash
# 1. Check if renewable is enabled
echo $NEXT_PUBLIC_RENEWABLE_ENABLED

# 2. Check browser console
# Look for routing logs

# 3. Test with known working query
# "Analyze terrain for wind farm at 35.067482, -101.395466"
```

**Solutions**:

1. **Verify Renewable is Enabled**:
   ```bash
   # Check .env.local
   grep RENEWABLE_ENABLED .env.local
   
   # Should be: NEXT_PUBLIC_RENEWABLE_ENABLED=true
   ```

2. **Use Explicit Keywords**:
   ```
   ✅ Good: "Analyze terrain for wind farm at..."
   ✅ Good: "Create a wind farm layout..."
   ✅ Good: "Run turbine simulation..."
   
   ❌ Bad: "Analyze site at..."
   ❌ Bad: "Create a layout..."
   ❌ Bad: "Run simulation..."
   ```

3. **Check Agent Router Patterns**:
   ```typescript
   // Verify agentRouter.ts has renewable patterns
   const renewablePatterns = [
     /wind\s+farm/i,
     /turbine/i,
     /renewable\s+energy/i,
     /terrain.*wind/i,
     /layout.*optimization/i,
     /wake.*simulation/i,
   ];
   ```

4. **Test Pattern Matching**:
   ```typescript
   // In browser console
   const query = "Analyze terrain for wind farm";
   const pattern = /wind\s+farm/i;
   console.log(pattern.test(query));  // Should be true
   ```

---

### Issue: Invalid coordinates error

**Symptoms**:
- Error message: "Invalid coordinates"
- No terrain analysis performed
- Guidance to use correct format

**Possible Causes**:
1. Coordinates in wrong format
2. Coordinates out of range
3. Coordinates for non-US location
4. Typo in coordinates

**Diagnostic Steps**:

```bash
# 1. Verify coordinate format
# Should be: latitude, longitude
# Example: 35.067482, -101.395466

# 2. Check coordinate ranges
# Latitude: -90 to 90
# Longitude: -180 to 180

# 3. Verify US location
# US latitude: ~25 to ~50
# US longitude: ~-125 to ~-65
```

**Solutions**:

1. **Use Correct Format**:
   ```
   ✅ Correct: 35.067482, -101.395466
   ✅ Correct: 40.7128, -74.0060
   
   ❌ Wrong: 35° 4' 2.9" N, 101° 23' 43.7" W
   ❌ Wrong: 35.07, -101.40 (insufficient precision)
   ❌ Wrong: -101.395466, 35.067482 (reversed)
   ```

2. **Verify Coordinates**:
   ```bash
   # Use Google Maps to verify
   # Right-click location > "What's here?"
   # Copy coordinates in decimal format
   ```

3. **Check US Boundaries**:
   ```
   Continental US approximate bounds:
   - North: 49° (Canadian border)
   - South: 25° (Florida Keys)
   - East: -65° (Maine)
   - West: -125° (California coast)
   ```

4. **Test with Known Location**:
   ```
   Texas Panhandle: 35.067482, -101.395466
   Chicago: 41.8781, -87.6298
   Los Angeles: 34.0522, -118.2437
   ```

---

## Performance Issues

### Issue: Slow response times (> 35 seconds)

**Symptoms**:
- Long wait for results
- Timeout errors
- Poor user experience

**Possible Causes**:
1. AgentCore cold start
2. Large dataset processing
3. Network latency
4. Resource constraints

**Diagnostic Steps**:

```bash
# 1. Check response time in Network tab
# Look for AgentCore API call duration

# 2. Check CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Duration \
  --dimensions Name=AgentName,Value=renewable-wind-farm \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average,Maximum

# 3. Check Lambda execution time
aws logs filter-log-events \
  --log-group-name /aws/lambda/lightweightAgentFunction \
  --filter-pattern "Duration"
```

**Solutions**:

1. **Warm Up AgentCore**:
   ```bash
   # Send a simple query first
   # "Hello" or "Test connection"
   # This warms up the runtime
   ```

2. **Optimize Query**:
   ```
   ✅ Specific: "Analyze terrain at 35.067482, -101.395466"
   ❌ Vague: "Tell me about wind farms in Texas"
   ```

3. **Check Network**:
   ```bash
   # Test network latency
   ping agentcore.us-west-2.amazonaws.com
   
   # Check DNS resolution
   nslookup agentcore.us-west-2.amazonaws.com
   ```

4. **Monitor Resources**:
   ```bash
   # Check Lambda memory usage
   aws logs filter-log-events \
     --log-group-name /aws/lambda/lightweightAgentFunction \
     --filter-pattern "Max Memory Used"
   ```

---

## Configuration Issues

### Issue: Environment variables not loading

**Symptoms**:
- Configuration errors
- "Required configuration missing" errors
- Features not working

**Possible Causes**:
1. .env.local not created
2. Variables not exported
3. Amplify backend not updated
4. Lambda not redeployed

**Diagnostic Steps**:

```bash
# 1. Check .env.local exists
ls -la .env.local

# 2. Check variable values
cat .env.local | grep RENEWABLE

# 3. Check Lambda environment
aws lambda get-function-configuration \
  --function-name <function-name> \
  --query 'Environment.Variables'
```

**Solutions**:

1. **Create .env.local**:
   ```bash
   # Copy from example
   cp .env.example .env.local
   
   # Add renewable configuration
   cat >> .env.local <<EOF
   NEXT_PUBLIC_RENEWABLE_ENABLED=true
   NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=<your-endpoint>
   NEXT_PUBLIC_RENEWABLE_S3_BUCKET=<your-bucket>
   NEXT_PUBLIC_RENEWABLE_AWS_REGION=us-west-2
   EOF
   ```

2. **Restart Development Server**:
   ```bash
   # Stop server (Ctrl+C)
   # Start again
   npm run dev
   ```

3. **Redeploy Amplify Backend**:
   ```bash
   # Redeploy with new environment variables
   npx ampx sandbox
   ```

4. **Verify Lambda Configuration**:
   ```bash
   # Check Lambda has variables
   aws lambda get-function-configuration \
     --function-name <function-name> \
     | grep -A 10 Environment
   ```

---

### Issue: S3 bucket access denied

**Symptoms**:
- "Access Denied" errors
- Artifacts not saving
- 403 errors in logs

**Possible Causes**:
1. Bucket doesn't exist
2. IAM permissions missing
3. Bucket policy restrictive
4. Wrong bucket name

**Diagnostic Steps**:

```bash
# 1. Check bucket exists
aws s3 ls s3://$NEXT_PUBLIC_RENEWABLE_S3_BUCKET

# 2. Check IAM permissions
aws iam get-role-policy \
  --role-name <lambda-execution-role> \
  --policy-name <policy-name>

# 3. Check bucket policy
aws s3api get-bucket-policy \
  --bucket $NEXT_PUBLIC_RENEWABLE_S3_BUCKET
```

**Solutions**:

1. **Create Bucket**:
   ```bash
   aws s3 mb s3://$NEXT_PUBLIC_RENEWABLE_S3_BUCKET \
     --region $NEXT_PUBLIC_RENEWABLE_AWS_REGION
   ```

2. **Add IAM Permissions**:
   ```typescript
   // Verify amplify/backend.ts has:
   backend.lightweightAgentFunction.resources.lambda.addToRolePolicy(
     new iam.PolicyStatement({
       actions: [
         "s3:GetObject",
         "s3:PutObject",
         "s3:ListBucket",
       ],
       resources: [
         `arn:aws:s3:::${process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET}`,
         `arn:aws:s3:::${process.env.NEXT_PUBLIC_RENEWABLE_S3_BUCKET}/*`,
       ],
     })
   );
   ```

3. **Update Bucket Policy**:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::<account-id>:role/<lambda-role>"
         },
         "Action": [
           "s3:GetObject",
           "s3:PutObject"
         ],
         "Resource": "arn:aws:s3:::<bucket-name>/*"
       }
     ]
   }
   ```

4. **Verify Bucket Name**:
   ```bash
   # Check SSM parameter matches
   aws ssm get-parameter \
     --name "/wind-farm-assistant/s3-bucket-name"
   
   # Should match NEXT_PUBLIC_RENEWABLE_S3_BUCKET
   ```

---

## Data Quality Issues

### Issue: Unexpected or incorrect results

**Symptoms**:
- Suitability scores seem wrong
- Turbine counts don't match capacity
- Performance metrics unrealistic

**Possible Causes**:
1. Data quality issues
2. Calculation errors
3. Wrong assumptions
4. Outdated data

**Diagnostic Steps**:

```bash
# 1. Check input coordinates
# Verify they're correct

# 2. Check thought steps
# Look for warnings or errors

# 3. Review calculation parameters
# Check turbine model, spacing, etc.

# 4. Compare with known benchmarks
# Industry standard capacity factors: 30-45%
```

**Solutions**:

1. **Verify Input Data**:
   - Double-check coordinates
   - Verify capacity requirements
   - Confirm turbine specifications

2. **Review Assumptions**:
   - Check turbine model used
   - Verify spacing calculations
   - Review wind resource data

3. **Compare with Benchmarks**:
   ```
   Typical Values:
   - Capacity Factor: 30-45%
   - Wake Losses: 5-15%
   - Turbine Spacing: 3-5D crosswind, 5-10D downwind
   ```

4. **Request Detailed Analysis**:
   ```
   "Provide detailed breakdown of calculations"
   "Explain suitability score components"
   "Show turbine model specifications"
   ```

---

## Logging and Debugging

### Enable Detailed Logging

**Browser Console**:
```javascript
// Enable verbose logging
localStorage.setItem('DEBUG', 'renewable:*');

// Reload page
location.reload();
```

**CloudWatch Logs**:
```bash
# View AgentCore logs
aws logs tail /aws/bedrock/agentcore/renewable-wind-farm \
  --follow \
  --format short

# View Lambda logs
aws logs tail /aws/lambda/lightweightAgentFunction \
  --follow \
  --format short

# Filter for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/lightweightAgentFunction \
  --filter-pattern "ERROR"
```

### Debug Mode

**Enable Debug Mode**:
```bash
# Add to .env.local
NEXT_PUBLIC_DEBUG_MODE=true
NEXT_PUBLIC_RENEWABLE_DEBUG=true

# Restart server
npm run dev
```

**Check Debug Output**:
- Browser console shows detailed logs
- Network tab shows full requests/responses
- Thought steps show more detail

---

## Getting Help

### Before Contacting Support

1. **Run Validation Script**:
   ```bash
   ./scripts/validate-renewable-integration.sh
   ```

2. **Check Documentation**:
   - [Integration Documentation](./RENEWABLE_INTEGRATION.md)
   - [Configuration Guide](./RENEWABLE_CONFIGURATION.md)
   - [Testing Guide](./RENEWABLE_INTEGRATION_TESTING_GUIDE.md)

3. **Collect Information**:
   - Error messages (full text)
   - Browser console logs
   - Network tab screenshots
   - Query that caused issue
   - Expected vs actual behavior

### Contact Support

**Include in Support Request**:

1. **Environment Information**:
   ```bash
   # Run and include output
   echo "Node Version: $(node --version)"
   echo "NPM Version: $(npm --version)"
   echo "OS: $(uname -a)"
   echo "Renewable Enabled: $NEXT_PUBLIC_RENEWABLE_ENABLED"
   ```

2. **Error Details**:
   - Full error message
   - Stack trace (if available)
   - Browser console logs
   - Network request/response

3. **Steps to Reproduce**:
   - Exact query used
   - Previous queries in session
   - Browser and version
   - Any custom configuration

4. **Validation Results**:
   ```bash
   # Include output
   ./scripts/validate-renewable-integration.sh > validation-results.txt
   ```

---

## Additional Resources

- [Integration Documentation](./RENEWABLE_INTEGRATION.md)
- [Configuration Guide](./RENEWABLE_CONFIGURATION.md)
- [Testing Guide](./RENEWABLE_INTEGRATION_TESTING_GUIDE.md)
- [Deployment Guide](./RENEWABLE_DEPLOYMENT.md)
- [Sample Queries](./RENEWABLE_SAMPLE_QUERIES.md)

---

**Version**: 1.0  
**Last Updated**: October 3, 2025  
**Issues Covered**: 15+ common issues

