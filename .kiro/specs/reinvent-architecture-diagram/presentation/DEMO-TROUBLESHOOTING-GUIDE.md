# Demo Troubleshooting Guide

## Quick Diagnosis Decision Tree

```
Is the application loading?
├─ NO → Check internet connection → Use backup slides
└─ YES
    ├─ Can you log in?
    │   ├─ NO → Check Cognito → Use backup authenticated tab
    │   └─ YES
    │       ├─ Does query send?
    │       │   ├─ NO → Check browser console → Refresh page
    │       │   └─ YES
    │       │       ├─ Does response appear?
    │       │       │   ├─ NO → Check CloudWatch → Wait or use backup slide
    │       │       │   └─ YES
    │       │       │       ├─ Do artifacts render?
    │       │       │       │   ├─ NO → Check S3/CORS → Show JSON or backup slide
    │       │       │       │   └─ YES → SUCCESS!
```

---

## Issue 1: Application Won't Load

### Symptoms
- Blank white screen
- "Cannot connect" error
- Infinite loading spinner
- DNS resolution failure

### Diagnosis Steps

1. **Check Internet Connection**
   ```bash
   # In terminal
   ping google.com
   ping [your-cloudfront-domain]
   ```

2. **Check Browser Console**
   - Press F12
   - Look for errors in Console tab
   - Check Network tab for failed requests

3. **Verify CloudFront Distribution**
   ```bash
   # In terminal
   curl -I https://[your-cloudfront-domain]
   ```

### Quick Fixes

**Fix 1: Use Mobile Hotspot**
- Enable mobile hotspot on phone
- Connect laptop to hotspot
- Reload application

**Fix 2: Use Backup Slides**
- Press `Cmd/Ctrl + T` for new tab
- Open `backup-slides.html`
- Press `E` to show emergency banner
- Walk through backup slides

**Fix 3: Use Pre-Recorded Video**
- Have video file ready on desktop
- Play video showing successful demo
- Narrate over the video

### Prevention
- Test venue WiFi 30 minutes before
- Have mobile hotspot ready
- Keep backup slides open in tab
- Download application for offline viewing if possible

---

## Issue 2: Authentication Fails

### Symptoms
- "Invalid credentials" error
- "User does not exist" error
- Redirect loop on sign-in page
- 401 Unauthorized errors

### Diagnosis Steps

1. **Verify Credentials**
   - Check username spelling
   - Check password (case-sensitive)
   - Verify Caps Lock is off

2. **Check Cognito User Pool**
   ```bash
   # In terminal
   aws cognito-idp list-users \
     --user-pool-id us-east-1_sC6yswGji \
     --filter "email = \"demo-user@example.com\""
   ```

3. **Check Lambda Authorizer Logs**
   - Open CloudWatch Logs
   - Find `/aws/lambda/authorizer` log group
   - Look for recent errors

### Quick Fixes

**Fix 1: Use Backup Authenticated Tab**
- Keep one browser tab logged in before demo
- If login fails, switch to that tab
- Continue demo from there

**Fix 2: Create New User On-The-Fly**
   ```bash
   # In terminal (if you have AWS CLI access)
   aws cognito-idp admin-create-user \
     --user-pool-id us-east-1_sC6yswGji \
     --username demo-user-backup@example.com \
     --temporary-password TempPass123! \
     --message-action SUPPRESS
   
   aws cognito-idp admin-set-user-password \
     --user-pool-id us-east-1_sC6yswGji \
     --username demo-user-backup@example.com \
     --password DemoPass123! \
     --permanent
   ```

**Fix 3: Skip Authentication Demo**
- Say: "I'm already authenticated using Cognito"
- Show authentication flow diagram instead
- Continue with chat demo

### Prevention
- Test login 5 minutes before demo
- Keep backup tab logged in
- Have backup credentials ready
- Write password on paper (don't rely on memory)

---

## Issue 3: Query Sends But No Response

### Symptoms
- Loading indicator never disappears
- No response after 30+ seconds
- Console shows no errors
- CloudWatch shows Lambda invoked but no completion

### Diagnosis Steps

1. **Check Browser Console**
   - Press F12
   - Look for JavaScript errors
   - Check Network tab for pending requests

2. **Check CloudWatch Logs**
   - Open CloudWatch Logs console
   - Find chat Lambda log group
   - Look for recent invocations
   - Check for errors or timeouts

3. **Check Lambda Timeout Settings**
   ```bash
   # In terminal
   aws lambda get-function-configuration \
     --function-name [chat-lambda-name] \
     --query "Timeout"
   ```

### Quick Fixes

**Fix 1: Wait Longer (Cold Start)**
- If first query, may be cold start
- Wait up to 20 seconds
- Say: "This is a cold start - Lambda is initializing"
- Use as teaching moment about Lambda optimization

**Fix 2: Refresh and Retry**
- Refresh browser page
- Log in again if needed
- Try simpler query first
- Then retry original query

**Fix 3: Use Backup Slide**
- Switch to appropriate backup slide
- Show expected output
- Explain what should have happened
- Continue with next demo section

### Prevention
- Execute warm-up query 5 minutes before demo
- Keep Lambdas warm with scheduled pings
- Have backup slides ready for each query type
- Test complete flow 30 minutes before

---

## Issue 4: Response Appears But No Artifacts

### Symptoms
- Text response appears
- "Visualization Unavailable" message
- No interactive map/chart
- Console shows 404 for S3 URLs

### Diagnosis Steps

1. **Check Response JSON**
   - Open browser DevTools
   - Check Network tab
   - Find API response
   - Verify `artifacts` array exists

2. **Check S3 Artifact URL**
   - Copy artifact URL from response
   - Try opening in new tab
   - Check for CORS errors
   - Verify S3 bucket permissions

3. **Check CloudWatch for Artifact Generation**
   - Open tool Lambda logs
   - Verify artifact was generated
   - Check S3 upload logs
   - Verify artifact size

### Quick Fixes

**Fix 1: Show Artifact JSON**
- Open browser DevTools
- Show the artifact data structure
- Say: "The artifact was generated successfully"
- Explain: "This is a rendering issue, not a generation issue"
- Show backup slide with visualization

**Fix 2: Check S3 Directly**
   ```bash
   # In terminal
   aws s3 ls s3://[bucket-name]/renewable-projects/ --recursive
   ```
- If artifact exists, it's a CORS/permissions issue
- Show that artifact was created
- Use backup slide for visualization

**Fix 3: Use Backup Slide**
- Switch to backup slide with pre-rendered artifact
- Explain what the visualization shows
- Continue with demo

### Prevention
- Test artifact rendering before demo
- Verify S3 CORS configuration
- Check CloudFront cache settings
- Have backup slides with all visualizations

---

## Issue 5: Wrong Agent Routes Query

### Symptoms
- Petrophysics query goes to general agent
- No specialized response
- Generic answer instead of analysis
- Missing expected artifacts

### Diagnosis Steps

1. **Check Query Wording**
   - Verify query matches intent patterns
   - Check for typos
   - Compare to tested queries

2. **Check CloudWatch for Routing Decision**
   - Open chat Lambda logs
   - Find "Intent detected" log line
   - Verify which agent was selected

3. **Check Agent Router Logic**
   - Verify pattern matching is working
   - Check for recent code changes
   - Verify agent registration

### Quick Fixes

**Fix 1: Rephrase Query**
- Use exact query from script
- Add more specific keywords
- Example: "Calculate porosity" → "Analyze porosity for well NLOG_F02-1 using density method"

**Fix 2: Use Pre-Tested Query**
- Copy-paste from cheat sheet
- Don't improvise query wording
- Stick to tested queries

**Fix 3: Acknowledge and Continue**
- Say: "Let me try a more specific query"
- Use tested query
- If still fails, use backup slide
- Explain: "Intent detection uses pattern matching - in production we'd tune these patterns"

### Prevention
- Use exact queries from script
- Don't improvise during demo
- Test all queries before demo
- Have backup queries ready

---

## Issue 6: Slow Response Times

### Symptoms
- Queries taking 20-30 seconds
- Audience getting restless
- Demo running over time
- Multiple timeouts

### Diagnosis Steps

1. **Check Lambda Cold Starts**
   - Open CloudWatch Logs
   - Look for "Init Duration" in logs
   - Cold starts add 5-10 seconds

2. **Check Network Latency**
   - Open browser DevTools Network tab
   - Check request timing
   - Look for slow DNS resolution

3. **Check Lambda Concurrency**
   ```bash
   # In terminal
   aws lambda get-function-concurrency \
     --function-name [lambda-name]
   ```

### Quick Fixes

**Fix 1: Acknowledge and Use Teaching Moment**
- Say: "This is a cold start - the Lambda is initializing"
- Explain: "In production, we use provisioned concurrency"
- Show CloudWatch logs while waiting
- Turn delay into educational content

**Fix 2: Skip to Next Query**
- If one query is slow, move to next
- Come back to slow query later if time permits
- Use backup slide for skipped query

**Fix 3: Adjust Demo Timing**
- Shorten CloudWatch section
- Skip one example query
- Extend Q&A time instead

### Prevention
- Execute warm-up queries before demo
- Use provisioned concurrency for demo
- Keep Lambdas warm with scheduled pings
- Have timing buffer in demo plan

---

## Issue 7: Browser Console Errors

### Symptoms
- Red errors in browser console
- JavaScript exceptions
- React rendering errors
- CORS errors

### Diagnosis Steps

1. **Read the Error Message**
   - Open DevTools Console
   - Read full error stack trace
   - Identify error source

2. **Check for CORS Issues**
   - Look for "CORS policy" in error
   - Verify API Gateway CORS settings
   - Check S3 bucket CORS

3. **Check for JavaScript Errors**
   - Look for undefined variables
   - Check for null reference errors
   - Verify component rendering

### Quick Fixes

**Fix 1: Refresh Page**
- Simple refresh often fixes transient errors
- Clear cache if needed: `Cmd/Ctrl + Shift + R`
- Log in again if session expired

**Fix 2: Use Incognito/Private Window**
- Open new incognito window
- Log in fresh
- Try query again
- Avoids cache/extension issues

**Fix 3: Ignore Non-Critical Errors**
- If demo still works, ignore console errors
- Don't show console to audience
- Focus on working functionality
- Use backup slides if needed

### Prevention
- Test in clean browser profile
- Clear cache before demo
- Disable browser extensions
- Test in multiple browsers

---

## Issue 8: CloudWatch Logs Not Showing

### Symptoms
- Log groups empty
- No recent log streams
- "No results found" message
- Can't verify Lambda execution

### Diagnosis Steps

1. **Check Log Group Name**
   - Verify correct log group selected
   - Check for typos in filter
   - Verify region (us-east-1)

2. **Check Time Range**
   - Verify time range includes recent queries
   - Adjust to "Last 15 minutes"
   - Check timezone settings

3. **Verify Lambda Executed**
   ```bash
   # In terminal
   aws lambda list-functions | grep chat
   aws logs describe-log-streams \
     --log-group-name /aws/lambda/[function-name] \
     --order-by LastEventTime \
     --descending \
     --max-items 5
   ```

### Quick Fixes

**Fix 1: Adjust Time Range**
- Change to "Last 30 minutes"
- Refresh log view
- Look for most recent stream

**Fix 2: Skip CloudWatch Demo**
- Say: "Let me show you the logs we captured earlier"
- Show backup slide with log trace
- Explain what logs would show
- Continue with demo

**Fix 3: Use AWS CLI**
   ```bash
   # In terminal
   aws logs tail /aws/lambda/[function-name] --follow
   ```

### Prevention
- Open CloudWatch logs before demo
- Set time range to "Last 1 hour"
- Refresh before showing to audience
- Have backup slide with log examples

---

## Issue 9: Artifacts Too Large / Slow to Load

### Symptoms
- Map takes 10+ seconds to render
- Browser becomes unresponsive
- "Out of memory" errors
- Visualization partially loads

### Diagnosis Steps

1. **Check Artifact Size**
   - Open Network tab in DevTools
   - Find artifact request
   - Check file size (should be < 5 MB)

2. **Check Browser Memory**
   - Open Task Manager / Activity Monitor
   - Check browser memory usage
   - Look for memory leaks

3. **Check Artifact Complexity**
   - Verify feature count (should be ~151, not 1000+)
   - Check if artifact is optimized
   - Verify compression is enabled

### Quick Fixes

**Fix 1: Wait for Complete Load**
- Give it 15-20 seconds
- Say: "This is a large dataset - 151 features"
- Use as teaching moment about optimization
- Show loading progress if visible

**Fix 2: Refresh and Retry**
- Refresh browser page
- Clear cache
- Try query again
- May load faster second time

**Fix 3: Use Backup Slide**
- Switch to backup slide with static image
- Explain what interactive map would show
- Continue with demo

### Prevention
- Test artifact sizes before demo
- Optimize artifacts for demo (fewer features if needed)
- Use browser with good performance
- Close unnecessary tabs/applications

---

## Issue 10: Demo Running Over Time

### Symptoms
- 10 minutes elapsed, only halfway through
- Audience getting restless
- Need to speed up
- Risk of being cut off

### Diagnosis Steps

1. **Check Current Time**
   - Glance at clock
   - Calculate remaining time
   - Identify what to cut

2. **Assess What's Left**
   - How many sections remaining?
   - Which are most important?
   - What can be skipped?

### Quick Fixes

**Fix 1: Skip CloudWatch Section**
- Say: "In the interest of time, let me show you the starter kit"
- Jump directly to starter kit
- Mention observability briefly
- Save time for Q&A

**Fix 2: Combine Sections**
- Show one complex query instead of two
- Skip general knowledge demo
- Combine CloudWatch and starter kit
- Rapid-fire through remaining content

**Fix 3: Cut to Q&A Early**
- Say: "Let's open it up for questions"
- Answer questions about skipped content
- More engaging than rushing through slides
- Audience appreciates the flexibility

### Prevention
- Practice demo with timer
- Build in 2-minute buffer
- Have "express version" planned
- Know what to cut if needed

---

## Emergency Procedures

### Complete Demo Failure

**If nothing works:**

1. **Stay Calm**
   - Take a breath
   - Smile
   - Acknowledge the situation

2. **Switch to Backup Slides**
   - Press `E` to show emergency banner
   - Say: "Let me show you what this looks like when it works"
   - Walk through backup slides with enthusiasm

3. **Turn It Into Teaching Moment**
   - "This is why we have backup plans"
   - "This is why we test"
   - "This is why observability matters"
   - Audience will appreciate the honesty

4. **Focus on Architecture and Patterns**
   - Spend more time on diagrams
   - Explain patterns in detail
   - Show code examples
   - Discuss design decisions

5. **Extend Q&A**
   - Open for questions early
   - Answer in depth
   - Show enthusiasm
   - Make it interactive

### Partial Demo Failure

**If some queries work:**

1. **Celebrate What Works**
   - Show successful queries
   - Explain what happened
   - Demonstrate working features

2. **Use Backup Slides for Failed Parts**
   - Seamlessly transition to backup slides
   - Don't dwell on failures
   - Keep energy high

3. **Explain What Would Have Happened**
   - Walk through expected flow
   - Show CloudWatch logs
   - Explain the architecture

### Internet Failure

**If internet goes down completely:**

1. **Switch to Offline Content Immediately**
   - Backup slides (already loaded)
   - Local code examples
   - Architecture diagrams
   - Printed materials

2. **Use Mobile Hotspot**
   - Enable phone hotspot
   - Connect laptop
   - May take 2-3 minutes
   - Fill time with Q&A

3. **Focus on Concepts**
   - Explain patterns without demo
   - Draw on whiteboard if available
   - Discuss architecture
   - Share experiences

---

## Recovery Checklist

After any issue:

- [ ] Acknowledge what happened
- [ ] Explain briefly (don't dwell)
- [ ] Show backup content
- [ ] Maintain energy and enthusiasm
- [ ] Continue with confidence
- [ ] Learn for next time

---

## Post-Demo Debrief

After the demo, document:

1. **What Worked Well**
   - Which queries succeeded
   - What got good audience reaction
   - What timing was good

2. **What Didn't Work**
   - Which queries failed
   - What took too long
   - What confused audience

3. **What to Change**
   - Query wording
   - Timing adjustments
   - Backup slide improvements
   - Technical fixes needed

4. **Lessons Learned**
   - What would you do differently?
   - What backup plans helped?
   - What should be added?

---

## Remember

- **Failures happen in live demos** - it's expected
- **Audience is on your side** - they want you to succeed
- **Backup plans are not failures** - they're professional preparation
- **Stay calm and confident** - your attitude sets the tone
- **Turn failures into teaching moments** - show authenticity
- **Have fun!** - enthusiasm is contagious

**You've got this! 🚀**
