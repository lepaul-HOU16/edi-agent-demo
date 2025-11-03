# EDIcraft Routing Troubleshooting - Quick Reference

## Quick Diagnosis

### Is my query routing to EDIcraft?

**Check CloudWatch Logs:**
```bash
# Find the agent router Lambda
aws lambda list-functions | grep agentRouter

# Tail logs
aws logs tail /aws/lambda/<function-name> --follow
```

**Look for:**
```
🎮 AgentRouter: EDIcraft agent selected
🎮 AgentRouter: Total patterns matched: X
```

**If you see:**
- `🔬 AgentRouter: Petrophysics agent selected` → Query routing to wrong agent
- `🌐 AgentRouter: General knowledge agent selected` → Query routing to wrong agent
- No EDIcraft logs → Pattern not matching

---

## Common Issues & Quick Fixes

### Issue 1: Query Contains "horizon" But Routes to Petrophysics

**Symptoms:**
```
Query: "find a horizon"
Result: Petrophysics welcome message
```

**Quick Fix:**
1. Check if query contains horizon keywords: ✅
2. Check CloudWatch logs for pattern matching
3. Verify patterns in `amplify/functions/agents/agentRouter.ts`

**Expected Log:**
```
🎮 AgentRouter: Testing EDIcraft patterns...
  ✅ EDIcraft pattern MATCHED: find.*horizon|horizon.*find
🎮 AgentRouter: EDIcraft agent selected
```

**If pattern not matching:**
- Query structure doesn't match existing patterns
- Need to add new pattern

---

### Issue 2: Query Contains "minecraft" But Routes to Wrong Agent

**Symptoms:**
```
Query: "show this in minecraft"
Result: Routes to general knowledge agent
```

**Quick Fix:**
1. Verify `/minecraft/i` pattern exists in edicraftPatterns
2. Check pattern priority order (EDIcraft should be FIRST)
3. Verify deployment is up to date

**Test:**
```bash
node tests/test-edicraft-routing.js "show this in minecraft"
```

**Expected:** `agentUsed: 'edicraft'`

---

### Issue 3: Complex Query Not Routing Correctly

**Symptoms:**
```
Query: "find a horizon, tell me its name, convert it to minecraft coordinates"
Result: Routes to petrophysics or general agent
```

**Quick Fix:**
1. Check if query matches multiple patterns
2. Verify combined patterns exist:
   - `/horizon.*coordinates/i`
   - `/horizon.*minecraft/i`
   - `/find.*horizon/i`

**Test:**
```bash
node tests/test-edicraft-routing.js "find a horizon, tell me its name, convert it to minecraft coordinates"
```

**Expected:** Multiple patterns should match, route to EDIcraft

---

### Issue 4: Pattern Works Locally But Not in Deployment

**Symptoms:**
- Local test: Routes to EDIcraft ✅
- Deployed: Routes to wrong agent ❌

**Quick Fix:**
1. **Restart Sandbox:**
   ```bash
   # Stop current sandbox (Ctrl+C)
   npx ampx sandbox
   ```

2. **Wait for deployment:**
   - Look for "Deployed" message
   - Can take 5-10 minutes

3. **Verify deployment:**
   ```bash
   aws lambda get-function --function-name <router-function>
   ```

4. **Test again:**
   ```bash
   node tests/test-edicraft-routing.js "your query"
   ```

---

### Issue 5: No Pattern Matching Logs in CloudWatch

**Symptoms:**
- No logs showing pattern tests
- Can't see which patterns matched

**Quick Fix:**
1. **Verify log group:**
   ```bash
   aws logs describe-log-groups | grep agentRouter
   ```

2. **Check recent logs:**
   ```bash
   aws logs tail /aws/lambda/<function-name> --since 5m
   ```

3. **Redeploy if needed:**
   ```bash
   npx ampx sandbox
   ```

---

## Pattern Testing Commands

### Test Specific Query
```bash
node tests/test-edicraft-routing.js "your query here"
```

### Test All Horizon Patterns
```bash
./tests/manual/test-edicraft-horizon-query.sh
```

### Test Pattern Matching
```bash
node tests/unit/test-agent-router-horizon.test.ts
```

---

## Pattern Priority Order

Patterns are tested in this order:

1. **EDIcraft** (HIGHEST PRIORITY) ← Horizon queries should match here
2. Maintenance
3. Weather
4. Renewable
5. General
6. Catalog
7. Petrophysics (LOWEST PRIORITY)

**If horizon query routes to petrophysics:**
- EDIcraft patterns didn't match
- Need to add new pattern or make existing pattern more flexible

---

## Adding a New Pattern

### Step 1: Identify Query Structure
```
Query: "show me horizon X"
Keywords: "show", "me", "horizon"
Pattern: /show.*me.*horizon|horizon.*show.*me/i
```

### Step 2: Add to edicraftPatterns
```typescript
// amplify/functions/agents/agentRouter.ts
const edicraftPatterns = [
  // ... existing patterns
  /show.*me.*horizon|horizon.*show.*me/i, // NEW
];
```

### Step 3: Test
```bash
node tests/test-edicraft-routing.js "show me horizon X"
```

### Step 4: Deploy
```bash
npx ampx sandbox
```

---

## Verification Checklist

After making changes:

- [ ] Pattern added to edicraftPatterns array
- [ ] Pattern tested locally
- [ ] Sandbox restarted
- [ ] Deployment completed
- [ ] CloudWatch logs show pattern matching
- [ ] Test query routes to EDIcraft
- [ ] No regressions in other queries

---

## Quick Pattern Reference

### Horizon Finding
```typescript
/find.*horizon|horizon.*find/i
/get.*horizon|horizon.*name/i
/list.*horizon|show.*horizon/i
```

### Coordinate Conversion
```typescript
/convert.*coordinates|coordinates.*convert/i
/convert.*to.*minecraft|minecraft.*convert/i
/coordinates.*for.*minecraft|minecraft.*coordinates/i
```

### Combined Patterns
```typescript
/horizon.*coordinates|coordinates.*horizon/i
/horizon.*minecraft|minecraft.*horizon/i
/horizon.*convert|convert.*horizon/i
```

### Natural Language
```typescript
/tell.*me.*horizon|horizon.*tell.*me/i
/what.*horizon|which.*horizon/i
/where.*horizon|horizon.*where/i
```

---

## Emergency Rollback

If new pattern breaks routing:

```bash
# 1. Revert changes
git checkout HEAD~1 amplify/functions/agents/agentRouter.ts

# 2. Restart sandbox
npx ampx sandbox

# 3. Verify old queries still work
node tests/test-edicraft-routing.js "find a horizon"
```

---

## Getting Help

### Check These First:
1. [Horizon Routing Patterns](EDICRAFT_HORIZON_ROUTING_PATTERNS.md) - Full documentation
2. [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md) - General troubleshooting
3. CloudWatch logs - Actual pattern matching behavior

### Still Stuck?
1. Capture CloudWatch logs showing the issue
2. Document the query that's not routing correctly
3. Note which agent it's routing to instead
4. Check if similar queries work

---

## Success Indicators

**Query routing correctly when:**
- ✅ CloudWatch shows: `🎮 AgentRouter: EDIcraft agent selected`
- ✅ Response includes horizon/minecraft content
- ✅ Response NOT generic petrophysics welcome message
- ✅ Thought steps show EDIcraft processing
- ✅ Test script returns: `agentUsed: 'edicraft'`

---

## Related Documentation

- **Full Pattern Documentation:** [EDICRAFT_HORIZON_ROUTING_PATTERNS.md](EDICRAFT_HORIZON_ROUTING_PATTERNS.md)
- **Troubleshooting Guide:** [EDICRAFT_TROUBLESHOOTING_GUIDE.md](EDICRAFT_TROUBLESHOOTING_GUIDE.md)
- **Requirements:** [fix-edicraft-horizon-routing/requirements.md](../.kiro/specs/fix-edicraft-horizon-routing/requirements.md)
- **Design:** [fix-edicraft-horizon-routing/design.md](../.kiro/specs/fix-edicraft-horizon-routing/design.md)

---

**Last Updated:** 2025-01-14  
**Version:** 1.0
