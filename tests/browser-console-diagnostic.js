/**
 * Browser Console Diagnostic Script
 * 
 * Paste this into your browser console while the application is running
 * to diagnose renewable agent issues.
 * 
 * Usage:
 * 1. Open your application in browser
 * 2. Open Developer Tools (F12)
 * 3. Go to Console tab
 * 4. Copy and paste this entire script
 * 5. Press Enter
 * 6. The diagnostic will run automatically
 */

(function() {
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold');
    console.log('%c🔍 RENEWABLE AGENT DIAGNOSTIC TOOL', 'color: #4fc3f7; font-weight: bold; font-size: 16px');
    console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold');
    console.log('');
    console.log('%cThis tool will monitor your next renewable agent query', 'color: #81c784');
    console.log('%cand provide detailed diagnostic information.', 'color: #81c784');
    console.log('');
    console.log('%c📋 INSTRUCTIONS:', 'color: #ffb74d; font-weight: bold');
    console.log('1. This script is now active and monitoring');
    console.log('2. Send a renewable query through the UI');
    console.log('3. Example: "Analyze terrain at 40.7128, -74.0060"');
    console.log('4. Watch this console for diagnostic output');
    console.log('');
    console.log('%c⏳ Waiting for renewable query...', 'color: #4fc3f7');
    console.log('');
    
    // Store original fetch
    const originalFetch = window.fetch;
    let diagnosticRun = false;
    
    // Intercept fetch requests
    window.fetch = async function(...args) {
        const url = args[0];
        const options = args[1] || {};
        
        // Check if this is a chat API call
        if (url && (url.includes('/api/chat') || url.includes('/chat'))) {
            console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold');
            console.log('%c🔍 DIAGNOSTIC: Chat API Request Detected', 'color: #4fc3f7; font-weight: bold');
            console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold');
            console.log('');
            console.log('%c📤 REQUEST DETAILS:', 'color: #ffb74d; font-weight: bold');
            console.log('  URL:', url);
            console.log('  Method:', options.method || 'GET');
            console.log('  Headers:', options.headers);
            
            if (options.body) {
                try {
                    const body = JSON.parse(options.body);
                    console.log('  Body:', body);
                    console.log('    Message:', body.message);
                    console.log('    Session ID:', body.chatSessionId);
                } catch (e) {
                    console.log('  Body:', options.body);
                }
            }
            console.log('');
            
            const startTime = performance.now();
            
            try {
                // Make the actual request
                const response = await originalFetch.apply(this, args);
                const duration = performance.now() - startTime;
                
                // Clone response to read it
                const clone = response.clone();
                
                console.log('%c📥 RESPONSE DETAILS:', 'color: #ffb74d; font-weight: bold');
                console.log('  Status:', response.status, response.statusText);
                console.log('  Duration:', duration.toFixed(0), 'ms');
                console.log('  OK:', response.ok);
                console.log('');
                
                // Try to parse response
                try {
                    const data = await clone.json();
                    
                    console.log('%c📊 RESPONSE DATA:', 'color: #ffb74d; font-weight: bold');
                    console.log('  Full Response:', data);
                    console.log('');
                    
                    // Validate structure
                    console.log('%c✓ STRUCTURE VALIDATION:', 'color: #81c784; font-weight: bold');
                    const checks = {
                        'Has success field': data.hasOwnProperty('success'),
                        'success value': data.success,
                        'Has message field': data.hasOwnProperty('message'),
                        'Has response field': data.hasOwnProperty('response'),
                        'Has response.text': data.response?.hasOwnProperty('text'),
                        'response.text length': data.response?.text?.length || 0,
                        'Has response.artifacts': data.response?.hasOwnProperty('artifacts'),
                        'artifacts is array': Array.isArray(data.response?.artifacts),
                        'Artifact count': data.response?.artifacts?.length || 0
                    };
                    
                    Object.entries(checks).forEach(([key, value]) => {
                        const icon = value ? '✅' : '❌';
                        const color = value ? '#81c784' : '#e57373';
                        console.log(`%c  ${icon} ${key}: ${value}`, `color: ${color}`);
                    });
                    console.log('');
                    
                    // Check artifacts
                    if (data.response?.artifacts && data.response.artifacts.length > 0) {
                        console.log('%c📦 ARTIFACT DETAILS:', 'color: #ffb74d; font-weight: bold');
                        data.response.artifacts.forEach((artifact, i) => {
                            console.log(`  Artifact ${i + 1}:`);
                            console.log('    Type:', artifact.type);
                            console.log('    Content Type:', artifact.messageContentType);
                            console.log('    Has Data:', !!artifact.data);
                            console.log('    Data Keys:', artifact.data ? Object.keys(artifact.data) : 'none');
                        });
                        console.log('');
                    } else {
                        console.log('%c⚠️  NO ARTIFACTS IN RESPONSE', 'color: #ffb74d; font-weight: bold');
                        console.log('  This is the likely cause of the issue!');
                        console.log('');
                    }
                    
                    // Diagnosis
                    console.log('%c🔬 DIAGNOSIS:', 'color: #4fc3f7; font-weight: bold');
                    
                    if (!response.ok) {
                        console.log('%c❌ HTTP Error:', 'color: #e57373; font-weight: bold');
                        console.log('  Status:', response.status);
                        console.log('  Issue: API request failed');
                        console.log('  Action: Check API Gateway and Lambda logs');
                    } else if (!data.success) {
                        console.log('%c❌ API Error:', 'color: #e57373; font-weight: bold');
                        console.log('  Message:', data.message || data.error);
                        console.log('  Issue: Backend returned error');
                        console.log('  Action: Check Lambda logs for errors');
                    } else if (!data.response?.artifacts || data.response.artifacts.length === 0) {
                        console.log('%c❌ Missing Artifacts:', 'color: #e57373; font-weight: bold');
                        console.log('  Issue: Response has no artifacts');
                        console.log('  Action: Check orchestrator and tool Lambda logs');
                        console.log('  Expected: At least 1 artifact for renewable queries');
                    } else if (!data.response?.text) {
                        console.log('%c⚠️  Missing Response Text:', 'color: #ffb74d; font-weight: bold');
                        console.log('  Issue: Response has artifacts but no text');
                        console.log('  Action: Check orchestrator response formatting');
                    } else {
                        console.log('%c✅ Response Looks Good!', 'color: #81c784; font-weight: bold');
                        console.log('  Backend is working correctly');
                        console.log('  If UI still shows issues, check:');
                        console.log('    1. Frontend state management (ChatBox)');
                        console.log('    2. Message rendering (ChatMessage)');
                        console.log('    3. Artifact components');
                    }
                    
                } catch (parseError) {
                    console.error('%c❌ Failed to parse response:', 'color: #e57373; font-weight: bold');
                    console.error('  Error:', parseError);
                    console.error('  This usually means the response is not valid JSON');
                }
                
                console.log('');
                console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold');
                console.log('%c✅ DIAGNOSTIC COMPLETE', 'color: #81c784; font-weight: bold');
                console.log('%c═══════════════════════════════════════════════════════════', 'color: #4fc3f7; font-weight: bold');
                console.log('');
                console.log('%c📋 Next Steps:', 'color: #ffb74d; font-weight: bold');
                console.log('1. Review the diagnosis above');
                console.log('2. Check the recommended actions');
                console.log('3. If needed, check CloudWatch logs');
                console.log('4. Report findings to continue debugging');
                console.log('');
                
                // Restore original fetch after first diagnostic
                if (!diagnosticRun) {
                    diagnosticRun = true;
                    console.log('%c💡 TIP: Diagnostic will continue monitoring for more requests', 'color: #4fc3f7');
                    console.log('%c     Send another query to run diagnostic again', 'color: #4fc3f7');
                    console.log('');
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                console.error('%c❌ REQUEST FAILED:', 'color: #e57373; font-weight: bold');
                console.error('  Duration:', duration.toFixed(0), 'ms');
                console.error('  Error:', error);
                console.error('  Error Type:', error.constructor.name);
                console.error('  Error Message:', error.message);
                console.log('');
                console.log('%c🔬 DIAGNOSIS:', 'color: #4fc3f7; font-weight: bold');
                console.log('%c❌ Network Error:', 'color: #e57373; font-weight: bold');
                console.log('  Issue: Request failed before reaching server');
                console.log('  Possible causes:');
                console.log('    - Network connectivity issue');
                console.log('    - CORS error');
                console.log('    - API endpoint not configured');
                console.log('    - Server not running');
                console.log('');
                
                throw error;
            }
        }
        
        // For non-chat requests, just pass through
        return originalFetch.apply(this, args);
    };
    
    console.log('%c✅ Diagnostic tool installed successfully!', 'color: #81c784; font-weight: bold');
    console.log('%c   Send a renewable query to start diagnosis', 'color: #81c784');
    console.log('');
    
})();
