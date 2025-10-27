# Quick Validation Guide - Terrain Query Routing Fix

## 🎯 What to Test

The fix prevents terrain analysis queries from being incorrectly matched as project list queries.

## ✅ Quick Test (2 minutes)

### Test 1: Terrain Analysis Query

**Open chat and enter:**
```
Analyze terrain at coordinates 35.067482, -101.395466 in Texas
```

**Expected Result:**
- ✅ Terrain analysis runs
- ✅ You see terrain map/visualization
- ❌ You should NOT see "Your Renewable Energy Projects" list

**If you see project list:** The fix is not working - check deployment

---

### Test 2: Project List Query

**Enter:**
```
list my renewable projects
```

**Expected Result:**
- ✅ You see project list (or "no projects yet" message)
- ❌ You should NOT see terrain analysis

---

## 📊 Check Logs (Optional)

```bash
# Tail CloudWatch logs
aws logs tail "/aws/lambda/amplify-digitalassistant--renewableOrchestratorlam-JnyCeSEimNhE" --follow
```

Look for:
- `[ProjectListHandler] Testing query: ...`
- `[ProjectListHandler] ❌ Rejected: Query contains action verb` (for terrain)
- `[ProjectListHandler] ✅ Matched pattern X` (for project list)

---

## ✅ Success Criteria

- [x] Terrain query runs terrain analysis (not project list)
- [x] Project list query shows projects (not terrain)
- [x] No errors in console
- [x] Routing decisions visible in CloudWatch logs

---

## 🚨 If Something's Wrong

1. Check sandbox is running: `ps aux | grep "ampx sandbox"`
2. Check Lambda exists: `aws lambda list-functions | grep renewableOrchestrator`
3. Restart sandbox if needed: Ctrl+C, then `npx ampx sandbox`
4. Check CloudWatch logs for errors

---

## 📝 Report Results

After testing, please confirm:
- ✅ Terrain analysis works correctly
- ✅ Project list works correctly
- ✅ No false positives or negatives

Then we can mark Task 7 as complete!
