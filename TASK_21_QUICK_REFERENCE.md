# Task 21: Quick Reference Card

## 🎯 Quick Start

### 1. Run Automated Tests
```bash
node test-task21-automated-checks.js
```
**Expected:** All 5 tests pass ✅

### 2. Open Test Guide
```bash
open test-task21-project-context-production.html
```

### 3. Test in Production
**URL:** https://d2hkqpgqguj4do.cloudfront.net

### 4. Check CloudWatch
```bash
./search-cloudwatch-project-context.sh
```

## 📋 Test Checklist

- [ ] Test 1: Load project artifact → Context extracted
- [ ] Test 2: Click workflow button → Request includes context
- [ ] Test 3: Backend logs → Context flows through chain
- [ ] Test 4: No project → Error message shown
- [ ] Test 5: Switch projects → Context updates

## 🔍 What to Look For

### Browser Console
```javascript
🎯 Setting active project: { projectId: "...", projectName: "..." }
🚀 Sending workflow request with projectContext: { ... }
```

### Network Tab
```json
{
  "projectContext": {
    "projectId": "renewable-project-...",
    "projectName": "West Texas Wind Farm"
  }
}
```

### CloudWatch Logs
```
📦 Extracted projectContext
🔄 Routing to agent with projectContext
🤖 Received projectContext
```

## ✅ Success Criteria

- Context extracted from artifacts
- Workflow buttons include context
- Backend receives context
- Agent uses context
- Error shown when missing
- Context updates on switch

## 📁 Test Files

1. `test-task21-project-context-production.html` - Interactive guide
2. `test-task21-automated-checks.js` - Automated tests
3. `TASK_21_PROJECT_CONTEXT_PRODUCTION_TEST_GUIDE.md` - Full docs

## 🚨 Common Issues

**No console logs?**
→ Open DevTools before loading page

**Buttons disabled?**
→ Verify artifact loaded, check console for 🎯

**No CloudWatch logs?**
→ Check correct region, recent streams only

**Request missing context?**
→ Verify artifact set context, check console

## 📊 Requirements

- **4.1:** Extract context ✅
- **4.2:** Include in requests ✅
- **4.3:** Maintain through chain ✅
- **4.4:** Agent access ✅
- **4.5:** Error handling ✅

## 🔗 Production URL

https://d2hkqpgqguj4do.cloudfront.net
