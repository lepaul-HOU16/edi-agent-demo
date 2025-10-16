# Maintenance Preloaded Prompts UI Test Guide

## Purpose
Verify that maintenance preloaded prompts are correctly integrated into the chat interface and that auto-agent-selection works as expected.

## Prerequisites
- Application is running (npm run dev or deployed)
- User is authenticated
- Chat interface is accessible

## Test Steps

### Test 1: Verify Maintenance Prompts Are Visible

1. **Navigate to Chat Interface**
   - Open the application
   - Navigate to a chat session
   - Look at the "AI-Powered Workflow Recommendations" panel on the left

2. **Verify Maintenance Prompts Exist**
   - Scroll through the Cards component
   - Verify you can see the following 5 maintenance prompts:
     - ✅ Equipment Health Assessment
     - ✅ Failure Prediction Analysis
     - ✅ Preventive Maintenance Planning
     - ✅ Inspection Schedule Generation
     - ✅ Asset Lifecycle Analysis

3. **Verify Prompt Details**
   - Click on each maintenance prompt
   - Verify each has:
     - ✅ Name (title)
     - ✅ Description
     - ✅ Detailed prompt text

**Expected Result:** All 5 maintenance prompts are visible and have complete information.

---

### Test 2: Verify Auto-Agent-Selection

1. **Check Initial Agent State**
   - Look at the Agent Switcher component (should show 4 options: Auto, Petro, Maintenance, Renewables)
   - Note the currently selected agent (likely "Auto")

2. **Select a Maintenance Prompt**
   - Click on "Equipment Health Assessment" prompt
   - Observe the Agent Switcher

3. **Verify Agent Auto-Selection**
   - ✅ Agent Switcher should automatically change to "Maintenance"
   - ✅ The "Maintenance" option should be highlighted/selected
   - ✅ Check browser console for log: "Auto-selecting agent based on prompt: maintenance"

4. **Repeat for Other Maintenance Prompts**
   - Select "Failure Prediction Analysis"
   - Verify agent switches to "Maintenance"
   - Select "Preventive Maintenance Planning"
   - Verify agent switches to "Maintenance"

**Expected Result:** Selecting any maintenance prompt automatically sets the agent to "Maintenance".

---

### Test 3: Verify Prompt Sends to Maintenance Agent

1. **Select a Maintenance Prompt**
   - Click on "Equipment Health Assessment"
   - Verify agent is set to "Maintenance"

2. **Apply the Workflow**
   - Click the "Apply workflow" button
   - Observe the chat interface

3. **Verify Message Sent**
   - ✅ User message appears in chat with the prompt text
   - ✅ Loading indicator appears
   - ✅ AI response appears after processing

4. **Check Browser Console**
   - Open browser developer tools (F12)
   - Check console logs for:
     - ✅ "Agent selection changed to: maintenance"
     - ✅ "Auto-selecting agent based on prompt: maintenance"
     - ✅ No JavaScript errors

**Expected Result:** Prompt is sent successfully and processed by the maintenance agent.

---

### Test 4: Verify Agent Persistence

1. **Select a Maintenance Prompt**
   - Click on "Failure Prediction Analysis"
   - Verify agent is set to "Maintenance"

2. **Send the Message**
   - Click "Apply workflow"
   - Wait for response

3. **Type a Follow-up Message**
   - Type a custom message in the chat input
   - Send the message

4. **Verify Agent Remains Selected**
   - ✅ Agent Switcher should still show "Maintenance" selected
   - ✅ Follow-up message should go to maintenance agent
   - ✅ Check sessionStorage: `sessionStorage.getItem('selectedAgent')` should be 'maintenance'

**Expected Result:** Agent selection persists across multiple messages in the same session.

---

### Test 5: Verify Switching Between Agent Types

1. **Select a Maintenance Prompt**
   - Click on "Inspection Schedule Generation"
   - Verify agent is set to "Maintenance"

2. **Select a Petrophysics Prompt**
   - Click on "Production Well Data Discovery (24 Wells)"
   - Observe the Agent Switcher

3. **Verify Agent Switches Back**
   - ✅ Agent should switch to "Auto" (or stay as is if petrophysics prompts don't have agentType)
   - ✅ If petrophysics prompts have agentType, should switch to "Petrophysics"

4. **Manually Switch to Maintenance**
   - Click on the Agent Switcher
   - Select "Maintenance" manually
   - Type a custom message and send

5. **Verify Manual Selection Works**
   - ✅ Message should go to maintenance agent
   - ✅ Agent should remain "Maintenance" until changed

**Expected Result:** Can switch between agents using both prompts and manual selection.

---

### Test 6: Verify No Console Errors

1. **Open Browser Developer Tools**
   - Press F12
   - Go to Console tab

2. **Perform All Actions**
   - Select various maintenance prompts
   - Apply workflows
   - Switch agents manually
   - Send messages

3. **Check for Errors**
   - ✅ No red error messages in console
   - ✅ No warnings about missing properties
   - ✅ No TypeScript errors
   - ✅ No React warnings about state updates

**Expected Result:** No errors or warnings in the browser console.

---

## Test Results Template

```
Date: _______________
Tester: _______________

Test 1: Verify Maintenance Prompts Are Visible
[ ] PASS  [ ] FAIL
Notes: _________________________________________________

Test 2: Verify Auto-Agent-Selection
[ ] PASS  [ ] FAIL
Notes: _________________________________________________

Test 3: Verify Prompt Sends to Maintenance Agent
[ ] PASS  [ ] FAIL
Notes: _________________________________________________

Test 4: Verify Agent Persistence
[ ] PASS  [ ] FAIL
Notes: _________________________________________________

Test 5: Verify Switching Between Agent Types
[ ] PASS  [ ] FAIL
Notes: _________________________________________________

Test 6: Verify No Console Errors
[ ] PASS  [ ] FAIL
Notes: _________________________________________________

Overall Result: [ ] ALL PASS  [ ] SOME FAIL

Issues Found:
_________________________________________________________
_________________________________________________________
_________________________________________________________
```

## Troubleshooting

### Issue: Maintenance prompts not visible
- **Check:** Verify the code changes were saved in `src/app/chat/[chatSessionId]/page.tsx`
- **Check:** Refresh the browser (Ctrl+F5 for hard refresh)
- **Check:** Verify no TypeScript compilation errors

### Issue: Agent doesn't auto-select
- **Check:** Verify `onSelectionChange` handler includes auto-selection logic
- **Check:** Verify prompts have `agentType: 'maintenance'` property
- **Check:** Check browser console for auto-selection logs

### Issue: Prompts don't send to maintenance agent
- **Check:** Verify maintenance agent is deployed and accessible
- **Check:** Verify `invokeMaintenanceAgent` GraphQL query exists
- **Check:** Check CloudWatch logs for maintenance agent Lambda

### Issue: Console errors appear
- **Check:** Run TypeScript compiler: `npx tsc --noEmit`
- **Check:** Verify all imports are correct
- **Check:** Verify no syntax errors in the code

## Success Criteria

All tests must pass with:
- ✅ All 5 maintenance prompts visible
- ✅ Auto-agent-selection works for all maintenance prompts
- ✅ Prompts send successfully to maintenance agent
- ✅ Agent selection persists during session
- ✅ Can switch between agent types
- ✅ No console errors or warnings

## Next Steps

After all tests pass:
1. Mark Task 4.4 as complete
2. Mark Task 4 as complete
3. Proceed to Task 5: Maintenance Artifacts and Visualizations
