# Live Demo Script - AWS re:Invent Chalk Talk

## Pre-Demo Checklist

### 30 Minutes Before
- [ ] Verify AWS credentials configured
- [ ] Test internet connection
- [ ] Open all required browser tabs
- [ ] Clear browser cache and cookies
- [ ] Test each demo query
- [ ] Verify CloudWatch logs accessible
- [ ] Have backup laptop ready
- [ ] Mobile hotspot ready

### 15 Minutes Before
- [ ] Sign in to application
- [ ] Verify all services running
- [ ] Test one query end-to-end
- [ ] Check CloudWatch for errors
- [ ] Clear chat history for clean demo
- [ ] Open developer console
- [ ] Set up screen recording (backup)

### 5 Minutes Before
- [ ] Final connectivity test
- [ ] Browser zoom at 125% for visibility
- [ ] Developer console open (but minimized)
- [ ] Backup slides ready
- [ ] Water nearby
- [ ] Deep breath!

---

## Demo 1: Simple Petrophysics Query

### Objective
Demonstrate basic agent routing and tool invocation with fast response time.

### Setup
- Clean chat session
- Developer console open to Network tab
- CloudWatch logs open in another tab (optional)

### Query
```
Calculate porosity for Well-001
```

### Expected Flow (2-3 seconds)

#### Step 1: Intent Detection
**What to say**: "Watch the thought steps appear in real-time. First, intent detection..."

**Expected thought step**:
```
🤔 Analyzing User Request
Understanding query intent and extracting parameters
Status: Complete ✓
```

#### Step 2: Tool Selection
**What to say**: "Now it's selecting the right tool - the petrophysics calculator..."

**Expected thought step**:
```
🔧 Selecting Analysis Tools
Identified petrophysics calculation requirement
Status: Complete ✓
```

#### Step 3: Execution
**What to say**: "Executing the calculation against real well data..."

**Expected thought step**:
```
⚙️ Executing Analysis
Calculating porosity using density method
Status: Complete ✓
```

#### Step 4: Response
**What to say**: "And here's the result - a professional porosity analysis with visualization."

**Expected output**:
- Text response with porosity values
- Log curve visualization
- Statistics table
- Professional formatting

### Key Points to Highlight
- ✅ Fast response (2-3 seconds)
- ✅ Transparent reasoning (thought steps)
- ✅ Professional output format
- ✅ Real data (not synthetic)
- ✅ Rich visualization

### If It Fails
1. **Check Network tab**: Look for 200 response
2. **Check Console**: Look for JavaScript errors
3. **Fallback**: Show pre-recorded video
4. **Explain**: "This is what should happen..." (show screenshots)

### Talking Points While Waiting
- "Notice the thought steps provide transparency"
- "This is hitting real AWS services - Bedrock, Lambda, DynamoDB"
- "The visualization is generated server-side and rendered client-side"
- "All of this is in the starter kit you can deploy"

---

## Demo 2: Complex Renewable Energy Analysis

### Objective
Demonstrate multi-agent orchestration, async processing, and multiple artifacts.

### Setup
- New chat session (or continue from Demo 1)
- Developer console Network tab visible
- Emphasize this will take longer

### Query
```
Analyze wind farm site at coordinates 35.0, -101.4
```

### Expected Flow (30-40 seconds)

#### Phase 1: Initial Response (2 seconds)
**What to say**: "This is a complex query that will trigger our orchestrator. Watch for the async processing pattern..."

**Expected response**:
```
🔄 Analysis in Progress...
Your wind farm analysis is being processed. This may take 30-60 seconds.
```

**Key point**: "Notice it returned immediately with a processing message. The actual work is happening asynchronously."

#### Phase 2: Polling (visible in Network tab)
**What to say**: "In the Network tab, you can see the frontend polling every 2 seconds for updates. This is how we handle the API Gateway timeout limitation."

**Expected**: Regular GET requests every 2 seconds to `/api/chat/sessions/{id}/messages`

#### Phase 3: Thought Steps Appear
**What to say**: "Now the thought steps are coming in as the orchestrator works..."

**Expected thought steps**:
```
🤔 Understanding Wind Farm Requirements
Analyzing site coordinates and requirements
Status: Complete ✓

🗺️ Analyzing Terrain
Fetching OpenStreetMap data and elevation information
Status: In Progress...

🗺️ Analyzing Terrain
Terrain analysis complete - 151 features identified
Status: Complete ✓

📐 Optimizing Turbine Layout
Calculating optimal turbine positions
Status: In Progress...

📐 Optimizing Turbine Layout
Layout optimization complete - 12 turbines positioned
Status: Complete ✓

💨 Simulating Wake Effects
Running wake simulation for energy prediction
Status: In Progress...

💨 Simulating Wake Effects
Wake simulation complete - 45.2 GWh annual production
Status: Complete ✓

📊 Generating Executive Report
Compiling comprehensive analysis report
Status: Complete ✓
```

#### Phase 4: Artifacts Render
**What to say**: "And here come the artifacts - multiple visualizations from different tools..."

**Expected artifacts**:
1. **Terrain Map**: Interactive map with 151 features
2. **Layout Optimization**: Turbine positions with wake zones
3. **Wake Simulation**: Energy production heatmap
4. **Executive Report**: Professional PDF summary

### Key Points to Highlight
- ✅ Async processing handles long operations
- ✅ Multiple tools coordinated by orchestrator
- ✅ Real-time progress updates
- ✅ Multiple artifact types
- ✅ Professional output quality
- ✅ No page reload needed

### If It Fails

#### Scenario 1: Timeout
**Symptom**: "Analysis in Progress" never completes
**Action**: 
1. Check CloudWatch logs for orchestrator
2. Show logs to audience
3. Explain what should happen
4. Show pre-recorded video

#### Scenario 2: Partial Results
**Symptom**: Some artifacts missing
**Action**:
1. Acknowledge: "We got partial results"
2. Show what did work
3. Explain what's missing
4. Show complete results in screenshots

#### Scenario 3: Complete Failure
**Action**:
1. Stay calm: "This is why we test in production!"
2. Show pre-recorded video
3. Walk through what should happen
4. Offer to debug after session

### Talking Points While Waiting
- "This is calling multiple AWS services in sequence"
- "The orchestrator is managing state across tool invocations"
- "Each tool is a separate Lambda function"
- "Results are being stored in S3 and DynamoDB"
- "The frontend is polling for updates every 2 seconds"
- "This pattern handles operations that exceed API Gateway timeouts"

---

## Demo 3: Multi-Well Correlation

### Objective
Demonstrate multi-well analysis and professional report generation.

### Setup
- Continue in same chat session
- Emphasize professional output format

### Query
```
Correlate porosity across Well-001, Well-002, and Well-003
```

### Expected Flow (5-7 seconds)

#### Step 1: Multi-Well Detection
**What to say**: "This query mentions multiple wells, so the agent will process them in parallel..."

**Expected thought step**:
```
🤔 Analyzing Multi-Well Request
Identified 3 wells for correlation analysis
Status: Complete ✓
```

#### Step 2: Data Retrieval
**What to say**: "Fetching data for all three wells simultaneously..."

**Expected thought step**:
```
📊 Retrieving Well Data
Loading log data for Well-001, Well-002, Well-003
Status: Complete ✓
```

#### Step 3: Correlation Analysis
**What to say**: "Now performing the correlation analysis..."

**Expected thought step**:
```
🔬 Performing Correlation Analysis
Calculating porosity correlations and statistics
Status: Complete ✓
```

#### Step 4: Visualization
**What to say**: "And generating the crossplot visualization..."

**Expected output**:
- Crossplot showing porosity correlation
- Statistics table (R², mean, std dev)
- Professional report format
- SPE/API standard references

### Key Points to Highlight
- ✅ Multi-well capability
- ✅ Parallel data processing
- ✅ Professional visualization
- ✅ Industry standard format
- ✅ Statistical analysis

### If It Fails
1. **Show screenshots** of expected output
2. **Explain** the correlation analysis
3. **Highlight** professional format
4. **Reference** starter kit implementation

---

## Demo 4: Bonus - Error Handling (If Time Permits)

### Objective
Show graceful error handling and fallback behavior.

### Query
```
Calculate porosity for NonExistentWell-999
```

### Expected Flow
**What to say**: "Let's see what happens when we query a well that doesn't exist..."

**Expected response**:
```
❌ Well Not Found
I couldn't find data for NonExistentWell-999 in the system.

Available wells:
- Well-001
- Well-002
- Well-003

Would you like to analyze one of these wells instead?
```

### Key Points to Highlight
- ✅ Graceful error handling
- ✅ Helpful error messages
- ✅ Suggested alternatives
- ✅ No system crash

---

## Post-Demo Talking Points

### What We Just Saw
1. **Simple query**: Fast, transparent, professional
2. **Complex orchestration**: Async, multi-tool, rich artifacts
3. **Multi-well analysis**: Parallel processing, correlations
4. **Error handling**: Graceful, helpful

### Architecture Highlights
- Agent routing based on intent
- Async processing for long operations
- Multiple specialized agents
- Tool coordination via orchestrator
- Real-time progress updates
- Professional output formats

### Starter Kit
"Everything you just saw is in the starter kit. You can deploy this to your AWS account and start customizing for your use case."

---

## Troubleshooting Guide

### Issue: Demo Environment Not Responding
**Symptoms**: No response to queries, blank screen
**Quick Fix**:
1. Check internet connection
2. Refresh browser
3. Sign in again
4. Try simple query first

**Fallback**: Switch to backup laptop

### Issue: Slow Response Times
**Symptoms**: Queries taking longer than expected
**Quick Fix**:
1. Acknowledge: "Network seems slow today"
2. Continue waiting
3. Show CloudWatch logs while waiting
4. Explain what's happening

**Fallback**: Show pre-recorded video

### Issue: Artifacts Not Rendering
**Symptoms**: Text response but no visualizations
**Quick Fix**:
1. Check browser console for errors
2. Check Network tab for failed requests
3. Refresh page
4. Try query again

**Fallback**: Show screenshots of expected output

### Issue: Authentication Failure
**Symptoms**: 401 errors, sign-in loop
**Quick Fix**:
1. Clear cookies
2. Sign in again
3. Check Cognito in AWS console

**Fallback**: Use pre-authenticated session

---

## Backup Materials Locations

### Pre-Recorded Videos
- `demo-videos/demo1-simple-query.mp4`
- `demo-videos/demo2-complex-orchestration.mp4`
- `demo-videos/demo3-multi-well.mp4`

### Screenshots
- `demo-screenshots/demo1-*.png`
- `demo-screenshots/demo2-*.png`
- `demo-screenshots/demo3-*.png`

### Backup Slides
- Slides 50-60 in master deck
- Static images of expected results
- Annotated with explanations

---

## Audience Interaction

### Questions to Ask
- "Who here has built AI agents before?"
- "How many have hit API Gateway timeouts?"
- "Anyone using Bedrock in production?"

### Invite Participation
- "Want to suggest a query?"
- "Any specific use case you'd like to see?"
- "Questions about what you're seeing?"

### Handle Interruptions
- Welcome questions during demo
- Pause demo to answer
- Resume where you left off
- Use questions to highlight features

---

## Success Criteria

### Demo 1 Success
- [ ] Query completes in < 5 seconds
- [ ] Thought steps visible
- [ ] Visualization renders
- [ ] Professional format

### Demo 2 Success
- [ ] Async processing visible
- [ ] Polling observable
- [ ] Multiple artifacts render
- [ ] Completes in < 60 seconds

### Demo 3 Success
- [ ] Multi-well processing works
- [ ] Crossplot renders
- [ ] Statistics displayed
- [ ] Professional format

### Overall Success
- [ ] At least 2 of 3 demos work
- [ ] Key concepts demonstrated
- [ ] Audience engaged
- [ ] Questions answered
- [ ] Starter kit promoted

---

## Post-Demo Actions

### Immediate
- [ ] Thank audience for patience
- [ ] Highlight successful aspects
- [ ] Acknowledge any issues
- [ ] Invite questions

### Follow-Up
- [ ] Debug any failures
- [ ] Update demo script
- [ ] Improve error handling
- [ ] Share learnings with team

---

## Remember

- **Stay calm** if things fail
- **Explain** what should happen
- **Use** backup materials
- **Engage** the audience
- **Highlight** key concepts
- **Promote** the starter kit
- **Have fun!**

---

**"The best demos are the ones that work, but the most memorable ones are the ones where you handle failures gracefully!"**
