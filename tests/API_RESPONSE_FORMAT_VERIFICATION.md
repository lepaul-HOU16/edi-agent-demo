# API Response Format Verification Guide

## Overview

This guide helps you verify that the Chat API is returning responses in the correct format expected by the frontend.

## Expected Response Structure

The frontend expects this exact structure:

```typescript
{
  success: boolean;           // Required: Indicates if request was successful
  message: string;            // Required: Human-readable status message
  response: {                 // Required: The actual response data
    text: string;             // Required: AI response text
    artifacts: Array<{        // Required: Array of artifacts (can be empty)
      type: string;           // Required: Artifact type identifier
      messageContentType: string;  // Required: MIME-like content type
      data: object;           // Required: Artifact data
      metadata?: object;      // Optional: Additional metadata
    }>;
  };
  data?: {                    // Optional: Additional response data
    artifacts: Array;         // Duplicate of response.artifacts
    thoughtSteps: Array;      // Optional: Chain of thought steps
    sourceAttribution: Array; // Optional: Source citations
    agentUsed: string;        // Optional: Which agent processed the request
  };
  error?: string;             // Optional: Error message if success is false
}
```

## Method 1: Browser Network Tab (Visual)

### Step 1: Open Developer Tools

1. Open your application in browser
2. Press F12 or Right-click → Inspect
3. Go to "Network" tab
4. Clear existing requests (trash icon)

### Step 2: Send Test Query

1. Send a renewable energy query
2. Example: "Analyze terrain at 40.7128, -74.0060"

### Step 3: Find the Request

1. Look for POST request to `/api/chat`
2. Click on the request
3. Go to "Response" tab

### Step 4: Verify Response Structure

Check each required field:

#### Top Level Fields:

```
✅ success: true
✅ message: "Message processed successfully" (or similar)
✅ response: { ... }
```

#### Response Object:

```
✅ response.text: "AI response text..." (non-empty string)
✅ response.artifacts: [ ... ] (array, may be empty)
```

#### Artifacts Array (if present):

```
✅ artifacts[0].type: "wind_farm_terrain_analysis" (string)
✅ artifacts[0].messageContentType: "application/vnd.renewable.terrain+json" (string)
✅ artifacts[0].data: { ... } (object with data)
```

### Step 5: Copy Response for Analysis

1. Right-click on the response
2. Select "Copy value"
3. Paste into a text editor
4. Format as JSON for readability

## Method 2: Browser Console (Programmatic)

### Intercept Fetch Requests

Add this to browser console before sending message:

```javascript
// Intercept fetch to log responses
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  console.log('🌐 Fetch Request:', args[0]);
  const response = await originalFetch.apply(this, args);
  const clone = response.clone();
  
  if (args[0].includes('/api/chat')) {
    const data = await clone.json();
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🌐 API Response Format Verification');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Full Response:', JSON.stringify(data, null, 2));
    console.log('');
    console.log('Structure Checks:');
    console.log('  ✓ Has success:', data.hasOwnProperty('success'), '→', data.success);
    console.log('  ✓ Has message:', data.hasOwnProperty('message'), '→', data.message);
    console.log('  ✓ Has response:', data.hasOwnProperty('response'));
    console.log('  ✓ Has response.text:', data.response?.hasOwnProperty('text'));
    console.log('  ✓ Has response.artifacts:', data.response?.hasOwnProperty('artifacts'));
    console.log('  ✓ Artifacts is array:', Array.isArray(data.response?.artifacts));
    console.log('  ✓ Artifact count:', data.response?.artifacts?.length || 0);
    console.log('');
    
    if (data.response?.artifacts && data.response.artifacts.length > 0) {
      console.log('Artifact Details:');
      data.response.artifacts.forEach((artifact, i) => {
        console.log(`  Artifact ${i + 1}:`);
        console.log('    ✓ Has type:', artifact.hasOwnProperty('type'), '→', artifact.type);
        console.log('    ✓ Has messageContentType:', artifact.hasOwnProperty('messageContentType'), '→', artifact.messageContentType);
        console.log('    ✓ Has data:', artifact.hasOwnProperty('data'));
        console.log('    ✓ Data is object:', typeof artifact.data === 'object');
      });
    }
    console.log('═══════════════════════════════════════════════════════════');
  }
  
  return response;
};

console.log('✅ Fetch interceptor installed. Send a message to see response format.');
```

### Automated Validation Function

Add this to browser console:

```javascript
function validateAPIResponse(response) {
  const issues = [];
  
  // Check top-level fields
  if (!response.hasOwnProperty('success')) {
    issues.push('❌ Missing field: success');
  } else if (typeof response.success !== 'boolean') {
    issues.push('❌ Invalid type: success should be boolean');
  }
  
  if (!response.hasOwnProperty('message')) {
    issues.push('❌ Missing field: message');
  } else if (typeof response.message !== 'string') {
    issues.push('❌ Invalid type: message should be string');
  }
  
  if (!response.hasOwnProperty('response')) {
    issues.push('❌ Missing field: response');
  } else {
    // Check response object
    if (!response.response.hasOwnProperty('text')) {
      issues.push('❌ Missing field: response.text');
    } else if (typeof response.response.text !== 'string') {
      issues.push('❌ Invalid type: response.text should be string');
    } else if (response.response.text.trim().length === 0) {
      issues.push('⚠️  Warning: response.text is empty');
    }
    
    if (!response.response.hasOwnProperty('artifacts')) {
      issues.push('❌ Missing field: response.artifacts');
    } else if (!Array.isArray(response.response.artifacts)) {
      issues.push('❌ Invalid type: response.artifacts should be array');
    } else {
      // Check each artifact
      response.response.artifacts.forEach((artifact, i) => {
        if (!artifact.hasOwnProperty('type')) {
          issues.push(`❌ Artifact ${i}: Missing field: type`);
        }
        if (!artifact.hasOwnProperty('messageContentType')) {
          issues.push(`❌ Artifact ${i}: Missing field: messageContentType`);
        }
        if (!artifact.hasOwnProperty('data')) {
          issues.push(`❌ Artifact ${i}: Missing field: data`);
        } else if (typeof artifact.data !== 'object') {
          issues.push(`❌ Artifact ${i}: Invalid type: data should be object`);
        }
      });
      
      if (response.response.artifacts.length === 0) {
        issues.push('⚠️  Warning: artifacts array is empty (expected for renewable queries)');
      }
    }
  }
  
  // Print results
  console.log('═══════════════════════════════════════════════════════════');
  console.log('API Response Format Validation');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (issues.length === 0) {
    console.log('✅ Response format is VALID');
    console.log('All required fields present and correct types');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):`);
    issues.forEach(issue => console.log(issue));
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  
  return issues.length === 0;
}

// Usage: Copy response from Network tab and validate
// validateAPIResponse(yourResponseObject);
```

## Method 3: cURL Command Line

### Send Request via cURL

```bash
# Set your API endpoint
API_ENDPOINT="https://your-api-endpoint.com/api/chat"

# Send request
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze terrain at 40.7128, -74.0060",
    "chatSessionId": "test-'$(date +%s)'",
    "conversationHistory": []
  }' | jq '.'
```

### Validate Response Structure

```bash
# Save response to file
curl -X POST "$API_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Analyze terrain at 40.7128, -74.0060",
    "chatSessionId": "test-'$(date +%s)'",
    "conversationHistory": []
  }' > response.json

# Check structure
echo "Checking response structure..."
echo ""

# Check success field
echo -n "✓ Has success: "
jq 'has("success")' response.json

echo -n "✓ success value: "
jq '.success' response.json

# Check message field
echo -n "✓ Has message: "
jq 'has("message")' response.json

# Check response field
echo -n "✓ Has response: "
jq 'has("response")' response.json

# Check response.text
echo -n "✓ Has response.text: "
jq '.response | has("text")' response.json

echo -n "✓ response.text length: "
jq '.response.text | length' response.json

# Check response.artifacts
echo -n "✓ Has response.artifacts: "
jq '.response | has("artifacts")' response.json

echo -n "✓ Artifacts is array: "
jq '.response.artifacts | type == "array"' response.json

echo -n "✓ Artifact count: "
jq '.response.artifacts | length' response.json

# Check first artifact structure
echo ""
echo "First artifact structure:"
jq '.response.artifacts[0] | {type, messageContentType, hasData: has("data")}' response.json
```

## Method 4: Automated Test Script

Create a Node.js script:

```javascript
// test-api-response-format.js

const https = require('https');

const API_ENDPOINT = process.env.API_ENDPOINT || 'https://your-api-endpoint.com/api/chat';
const TEST_QUERY = 'Analyze terrain at 40.7128, -74.0060';

async function testAPIResponseFormat() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('API Response Format Test');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Endpoint:', API_ENDPOINT);
  console.log('Query:', TEST_QUERY);
  console.log('');
  
  const postData = JSON.stringify({
    message: TEST_QUERY,
    chatSessionId: `test-${Date.now()}`,
    conversationHistory: []
  });
  
  const url = new URL(API_ENDPOINT);
  const options = {
    hostname: url.hostname,
    port: 443,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          validateResponse(response);
          resolve(response);
        } catch (error) {
          console.error('❌ Failed to parse response:', error);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request failed:', error);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

function validateResponse(response) {
  const issues = [];
  
  console.log('Validating response structure...');
  console.log('');
  
  // Top-level fields
  checkField(response, 'success', 'boolean', issues);
  checkField(response, 'message', 'string', issues);
  checkField(response, 'response', 'object', issues);
  
  if (response.response) {
    // Response object fields
    checkField(response.response, 'text', 'string', issues, 'response.');
    checkField(response.response, 'artifacts', 'array', issues, 'response.');
    
    // Check artifacts
    if (Array.isArray(response.response.artifacts)) {
      console.log(`  ✓ Artifact count: ${response.response.artifacts.length}`);
      
      response.response.artifacts.forEach((artifact, i) => {
        checkField(artifact, 'type', 'string', issues, `response.artifacts[${i}].`);
        checkField(artifact, 'messageContentType', 'string', issues, `response.artifacts[${i}].`);
        checkField(artifact, 'data', 'object', issues, `response.artifacts[${i}].`);
      });
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  
  if (issues.length === 0) {
    console.log('✅ RESPONSE FORMAT IS VALID');
    console.log('All required fields present with correct types');
  } else {
    console.log(`❌ FOUND ${issues.length} ISSUE(S):`);
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  console.log('═══════════════════════════════════════════════════════════');
  
  return issues.length === 0;
}

function checkField(obj, field, expectedType, issues, prefix = '') {
  const fullPath = prefix + field;
  
  if (!obj.hasOwnProperty(field)) {
    issues.push(`❌ Missing field: ${fullPath}`);
    console.log(`  ❌ ${fullPath}: MISSING`);
    return false;
  }
  
  const actualType = Array.isArray(obj[field]) ? 'array' : typeof obj[field];
  
  if (actualType !== expectedType) {
    issues.push(`❌ Invalid type: ${fullPath} (expected ${expectedType}, got ${actualType})`);
    console.log(`  ❌ ${fullPath}: ${actualType} (expected ${expectedType})`);
    return false;
  }
  
  console.log(`  ✓ ${fullPath}: ${actualType}`);
  return true;
}

// Run test
testAPIResponseFormat()
  .then(() => {
    console.log('\n✅ Test complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
```

**Usage:**
```bash
export API_ENDPOINT="https://your-api-endpoint.com/api/chat"
node test-api-response-format.js
```

## Common Issues and Solutions

### Issue 1: Missing `success` Field

**Symptom:** Response doesn't have `success` field

**Impact:** Frontend can't determine if request succeeded

**Solution:** Check Chat Lambda response formatting
```typescript
// Ensure response includes success field
return {
  statusCode: 200,
  body: JSON.stringify({
    success: true,  // ← Must be present
    message: 'Message processed successfully',
    response: { ... }
  })
};
```

### Issue 2: Missing `response.artifacts` Field

**Symptom:** Response has `response.text` but no `response.artifacts`

**Impact:** Frontend expects artifacts array (even if empty)

**Solution:** Always include artifacts array
```typescript
return {
  success: true,
  message: 'Success',
  response: {
    text: aiResponse,
    artifacts: artifacts || []  // ← Always include, even if empty
  }
};
```

### Issue 3: Artifacts Not an Array

**Symptom:** `response.artifacts` is null or object instead of array

**Impact:** Frontend expects array and will fail

**Solution:** Ensure artifacts is always an array
```typescript
// Wrong
artifacts: null

// Wrong
artifacts: { type: 'terrain' }

// Correct
artifacts: []

// Correct
artifacts: [{ type: 'terrain', ... }]
```

### Issue 4: Artifact Missing Required Fields

**Symptom:** Artifact object missing `type`, `messageContentType`, or `data`

**Impact:** Frontend can't render artifact

**Solution:** Ensure all artifacts have required fields
```typescript
{
  type: 'wind_farm_terrain_analysis',           // ← Required
  messageContentType: 'application/vnd.renewable.terrain+json',  // ← Required
  data: {                                       // ← Required
    // Artifact data here
  },
  metadata: {                                   // ← Optional
    // Additional metadata
  }
}
```

### Issue 5: HTTP Error Status

**Symptom:** Response has 4xx or 5xx status code

**Impact:** Frontend treats as error

**Solution:** Return 200 even for application errors
```typescript
// Wrong - returns 500
return {
  statusCode: 500,
  body: JSON.stringify({ error: 'Failed' })
};

// Correct - returns 200 with error info
return {
  statusCode: 200,
  body: JSON.stringify({
    success: false,
    message: 'Processing failed',
    error: 'Detailed error message',
    response: {
      text: 'I encountered an error...',
      artifacts: []
    }
  })
};
```

## Verification Checklist

```
□ Response has HTTP 200 status code
□ Response body is valid JSON
□ Has success field (boolean)
□ Has message field (string)
□ Has response field (object)
□ response has text field (string)
□ response has artifacts field (array)
□ response.text is non-empty
□ Each artifact has type field
□ Each artifact has messageContentType field
□ Each artifact has data field
□ Artifact data is an object
□ No extra/unexpected fields that break parsing
```

## Next Steps

After verifying API response format:

1. **If format is correct:**
   - Issue is in frontend display logic
   - Check ChatMessage component
   - Check artifact rendering components

2. **If format is incorrect:**
   - Fix Chat Lambda response formatting
   - Ensure all required fields are present
   - Test again after fix

3. **If artifacts are missing:**
   - Check orchestrator artifact generation
   - Verify artifact transformation in Proxy Agent
   - Ensure artifacts are included in response
