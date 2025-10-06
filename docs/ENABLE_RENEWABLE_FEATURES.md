# 🔧 Enable Renewable Energy Features

**Issue**: "Renewable energy features are currently disabled"  
**Cause**: Dev server needs restart to load updated `.env.local`  
**Solution**: Restart your development server

---

## ✅ Quick Fix (2 Steps)

### Step 1: Stop Current Dev Server

In your terminal where `npm run dev` is running:
- Press `Ctrl + C` to stop the server

### Step 2: Restart Dev Server

```bash
npm run dev
```

That's it! The renewable features will now be enabled.

---

## 🔍 Why This Happened

Next.js loads environment variables when the dev server **starts**. Changes to `.env.local` require a restart to take effect.

Your `.env.local` is correctly configured:
```bash
NEXT_PUBLIC_RENEWABLE_ENABLED=true  ✅
NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT=arn:aws:bedrock-agentcore:us-east-1:484907533441:agent-runtime/wind_farm_layout_agent-7DnHlIBg3o  ✅
```

---

## 🧪 Verify It's Working

After restarting, open http://localhost:3000/chat and try:

```
Analyze wind farm potential at coordinates 35.067482, -101.395466
```

### Expected Behavior ✅
- No "disabled" message
- Agent processes your query
- Returns wind farm analysis (may be mock data until backend is deployed)

### If Still Disabled ❌
Check the browser console (F12) for errors and verify:
```javascript
// In browser console:
console.log(process.env.NEXT_PUBLIC_RENEWABLE_ENABLED)
// Should show: "true"
```

---

## 🚀 Full Deployment Steps

Once the feature is enabled, deploy the backend:

### 1. Deploy Amplify Backend
```bash
npx ampx sandbox --once
```

This updates Lambda functions with the AgentCore endpoint.

### 2. Restart Dev Server (if needed)
```bash
# Stop with Ctrl+C, then:
npm run dev
```

### 3. Test with Real Data
```
Analyze wind farm potential at coordinates 35.067482, -101.395466
```

Should now return **real wind data** from AgentCore!

---

## 📋 Environment Variables Reference

Your current configuration:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_RENEWABLE_ENABLED` | `true` | Feature flag to enable renewable UI |
| `NEXT_PUBLIC_RENEWABLE_AGENTCORE_ENDPOINT` | `arn:aws:bedrock-agentcore:...` | AgentCore runtime ARN |
| `NEXT_PUBLIC_RENEWABLE_S3_BUCKET` | `renewable-energy-artifacts-484907533441` | S3 bucket for artifacts |
| `NEXT_PUBLIC_RENEWABLE_REGION` | `us-east-1` | AWS region for AgentCore |
| `NEXT_PUBLIC_RENEWABLE_AWS_REGION` | `us-west-2` | AWS region for other services |

---

## 🛠️ Troubleshooting

### Issue: Still shows "disabled" after restart

**Check 1**: Verify env var is loaded
```bash
# In your project terminal (not browser):
echo $NEXT_PUBLIC_RENEWABLE_ENABLED
# Should show: true
```

**Check 2**: Verify Next.js sees it
```javascript
// In browser console (F12):
console.log(process.env.NEXT_PUBLIC_RENEWABLE_ENABLED)
// Should show: "true"
```

**Check 3**: Check for typos in `.env.local`
```bash
cat .env.local | grep RENEWABLE_ENABLED
# Should show: NEXT_PUBLIC_RENEWABLE_ENABLED=true
```

### Issue: "Cannot find module" errors

**Solution**: Reinstall dependencies
```bash
npm install
npm run dev
```

### Issue: Backend not responding

**Solution**: Deploy Amplify backend
```bash
npx ampx sandbox --once
```

---

## 📞 Quick Commands

```bash
# Stop dev server
Ctrl + C

# Start dev server
npm run dev

# Deploy backend
npx ampx sandbox --once

# Check environment variables
cat .env.local

# Verify runtime ARN
python3 scripts/get-runtime-arn.py
```

---

## ✨ What Happens After Restart

1. ✅ Next.js loads `.env.local` variables
2. ✅ `NEXT_PUBLIC_RENEWABLE_ENABLED=true` is available
3. ✅ Renewable energy UI components are enabled
4. ✅ Chat interface accepts renewable queries
5. ⏳ Backend needs deployment for real data

---

**🎯 Action Required**: Restart your dev server now!

Press `Ctrl + C` in your terminal, then run `npm run dev` again.
