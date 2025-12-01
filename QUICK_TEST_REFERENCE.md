# Quick Test Reference Card

## 🚀 Fast Testing Guide

### Production URL
```
https://d2hkqpgqguj4do.cloudfront.net
```

---

## 📋 Test Queries

### General Knowledge
```
What is the capital of France and what are its main attractions?
```

### Petrophysics
```
Analyze well data for formation evaluation and calculate porosity
```

### Maintenance
```
Check equipment status and recommend maintenance schedule for wind turbines
```

### Renewables
```
Generate wind rose analysis for the current project
```

---

## ✅ Quick Checklist

For each agent, verify:

- [ ] Thought steps appear **one at a time** (not all at once)
- [ ] Only **ONE** "Thinking..." indicator visible
- [ ] Indicator **disappears** when response completes
- [ ] **No stale indicators** after page reload

For Renewables agent, also verify:
- [ ] Project context is extracted from artifact
- [ ] Workflow buttons work with context
- [ ] Error shown when no project selected

---

## 🔍 What to Look For

### ✅ GOOD
- Steps appear every 3-5 seconds
- Single purple gradient indicator
- Clean UI after completion
- No indicators after reload

### ❌ BAD
- All steps appear at once (batching)
- Multiple indicators
- Indicator persists after done
- Stale indicators after reload

---

## 🛠️ Test Tools

### Interactive UI
```bash
open test-comprehensive-regression.html
```

### Automated Script
```bash
node test-all-agents-regression.js
```

### Full Guide
```bash
cat COMPREHENSIVE_REGRESSION_TEST_GUIDE.md
```

---

## 📊 Expected Results

| Agent | Streaming | Indicator | Cleanup | Reload |
|-------|-----------|-----------|---------|--------|
| General Knowledge | ✅ | ✅ | ✅ | ✅ |
| Petrophysics | ✅ | ✅ | ✅ | ✅ |
| Maintenance | ✅ | ✅ | ✅ | ✅ |
| Renewables | ✅ | ✅ | ✅ | ✅ |

---

## 🐛 Quick Debug

### Multiple Indicators?
Check: `src/components/ChainOfThoughtDisplay.tsx`

### Batched Streaming?
Check: `cdk/lambda-functions/chat/agents/generalKnowledgeAgent.ts`

### Stale Indicators?
Check: `cdk/lambda-functions/shared/thoughtStepStreaming.ts`

### Project Context Missing?
Check: `src/components/renewable/WorkflowCTAButtons.tsx`

---

## ⏱️ Time Estimate

- Automated tests: **5 minutes**
- Manual verification: **30 minutes**
- Backend checks: **15 minutes**
- **Total: ~50 minutes**

---

## 📝 Document Results

Fill out: `TASK_23_REGRESSION_TEST_RESULTS.md`

---

## ✨ Success = All Green

All agents must show:
- ✅ Incremental streaming
- ✅ Single indicator
- ✅ Cleanup works
- ✅ No stale indicators
