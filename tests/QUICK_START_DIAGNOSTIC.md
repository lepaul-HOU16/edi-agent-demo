# Quick Start: Diagnose Renewable Agent Issue

## 🚀 Fastest Way to Diagnose

### Method 1: Browser Console Diagnostic (2 minutes) ⭐ RECOMMENDED

1. **Start your application:**
   ```bash
   npm run dev
   ```

2. **Open the application in your browser**

3. **Open Developer Tools** (F12) → Console tab

4. **Copy and paste the diagnostic script:**
   ```bash
   # Copy the contents of this file:
   cat tests/browser-console-diagnostic.js
   
   # Or open it and copy all the code
   ```

5. **Press Enter** to run the script

6. **Send a renewable query** through the UI:
   ```
   Analyze terrain at 40.7128, -74.0060
   ```

7. **Watch the console** - diagnostic output will appear automatically

8. **Report findings** (see below)

### Method 2: Manual Browser Test (10 minutes)

1. **Open your application** in browser

2. **Open Developer Tools** (F12)

3. **Go to Console tab** and clear it

4. **Send a test query:**
   ```
   Analyze terrain at 40.7128, -74.0060
   ```

5. **Observe what happens:**
   - Does user message appear?
   - Does loading indicator show?
   - Does AI response appear?
   - Are artifacts displayed?
   - Any errors in console?

6. **Check Network tab:**
   - Find POST to `/api/chat`
   - Check status code (should be 200)
   - Check response (should have artifacts)

7. **Report findings** (see below)

## 📋 What to Report

Copy this template and fill it in:

```markdown
## Diagnostic Results

### What I See in UI:
- [ ] User message appears immediately
- [ ] Loading indicator shows
- [ ] AI response appears
- [ ] Artifacts are displayed
- [ ] Error message: _______________

### Browser Console Logs:
```
[Paste relevant logs here]
```

### Network Response:
```json
{
  "success": true/false,
  "response": {
    "text": "...",
    "artifacts": [...]
  }
}
```

### Where Flow Breaks:
- [ ] Frontend (message not sent)
- [ ] API (request fails)
- [ ] Backend (no response)
- [ ] Frontend (response not displayed)
- [ ] Unknown

### Additional Notes:
[Any other observations]
```

## 🔍 Quick Checks

### Check 1: Is API responding?
```bash
# Check Network tab in browser
# Look for POST /api/chat
# Status should be 200
# Response should have success: true
```

### Check 2: Are artifacts in response?
```bash
# In Network tab, check response
# Should have: response.artifacts: [...]
# Array should have at least 1 item
```

### Check 3: Are there console errors?
```bash
# Check Console tab
# Look for red error messages
# Note any warnings
```

### Check 4: Is message in DynamoDB?
```bash
# If you have AWS access:
aws dynamodb query \
  --table-name ChatMessage \
  --key-condition-expression "chatSessionId = :sid" \
  --expression-attribute-values '{":sid":{"S":"YOUR_SESSION_ID"}}'
```

## 🎯 Common Issues Quick Reference

### Issue: "No response generated"
**Check:** API response in Network tab
**Likely:** Response missing text or artifacts
**Fix:** Backend response formatting

### Issue: User message doesn't appear
**Check:** Console logs for errors
**Likely:** Frontend state update issue
**Fix:** ChatBox message handling

### Issue: Loading never stops
**Check:** Network tab for response
**Likely:** Response not received or state not updated
**Fix:** API timeout or state management

### Issue: Artifacts not displaying
**Check:** Network response has artifacts
**Likely:** Frontend rendering issue
**Fix:** ChatMessage or artifact components

## 📚 Detailed Guides

If you need more detailed diagnostics:

1. **Complete diagnostic process:**
   - Read `DIAGNOSTIC_GUIDE.md`

2. **Trace through logs:**
   - Read `LOG_TRACING_GUIDE.md`

3. **Check message persistence:**
   - Read `MESSAGE_PERSISTENCE_VERIFICATION.md`

4. **Verify API format:**
   - Read `API_RESPONSE_FORMAT_VERIFICATION.md`

5. **Check frontend display:**
   - Read `FRONTEND_DISPLAY_VERIFICATION.md`

## ⚡ Next Steps

1. **Run diagnostics** (5-10 minutes)
2. **Report findings** using template above
3. **I'll implement targeted fix** based on findings
4. **Test the fix** using same diagnostic tools
5. **Verify no regressions**

## 💡 Tips

- **Use browser diagnostic tool first** - it's the fastest
- **Copy all logs** - more information is better
- **Note exact behavior** - what you see vs. what you expect
- **Check Network tab** - API response is critical
- **Don't skip steps** - each check narrows down the issue

## 🆘 Need Help?

If you're stuck:

1. Run the browser diagnostic tool
2. Copy the complete logs
3. Take screenshots of what you see
4. Report everything - we'll figure it out together

---

**Remember:** The comprehensive logging from Tasks 1 & 2 means we can trace exactly where the issue is. Just run the diagnostics and report what you find!
