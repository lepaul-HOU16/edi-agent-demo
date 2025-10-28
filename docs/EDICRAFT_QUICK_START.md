# EDIcraft Agent - Quick Start Guide

## 🚀 Get Started in 5 Steps

### Step 1: Deploy Bedrock AgentCore Agent

```bash
cd edicraft-agent
make install
make deploy
```

**Save the Agent ID and Alias ID from the output!**

---

### Step 2: Configure Credentials

**Option A: Interactive Setup (Recommended)**
```bash
./tests/manual/setup-edicraft-credentials.sh
```

**Option B: Manual Setup**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

**Required Credentials:**
- Bedrock Agent ID and Alias ID (from Step 1)
- Minecraft RCON password
- OSDU platform credentials

**Need help finding credentials?** See [Credential Guide](../edicraft-agent/FIND_CREDENTIALS.md)

---

### Step 3: Deploy Lambda

```bash
npx ampx sandbox
```

Wait for "Deployed" message (~5-10 minutes)

---

### Step 4: Test Deployment

```bash
node tests/manual/test-edicraft-deployment.js
```

**Expected:** All tests pass ✅

---

### Step 5: Try It Out!

Open the web application and try:

```
Get wellbore data from well001 and visualize it in minecraft
```

**Expected:**
- Query routes to EDIcraft agent
- Thought steps display execution progress
- Response includes Minecraft coordinates
- Visualization appears in Minecraft

---

## 📚 Full Documentation

- **[Documentation Index](EDICRAFT_DOCUMENTATION_INDEX.md)** - Complete documentation
- **[Deployment Guide](../edicraft-agent/DEPLOYMENT_GUIDE.md)** - Detailed deployment
- **[Environment Variables](EDICRAFT_ENVIRONMENT_VARIABLES.md)** - Variable reference
- **[Troubleshooting](EDICRAFT_TROUBLESHOOTING_GUIDE.md)** - Common issues
- **[User Workflows](EDICRAFT_USER_WORKFLOWS.md)** - How to use the agent

---

## ❓ Common Issues

### "Missing environment variable"
→ Run `./tests/manual/setup-edicraft-credentials.sh`

### "Agent not deployed"
→ Run `cd edicraft-agent && make deploy`

### "Connection refused"
→ Check Minecraft server is running: `telnet edicraft.nigelgardiner.com 49000`

### "Authentication failed"
→ Verify credentials in `.env.local`

**More help:** [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md)

---

## 🎯 Example Queries

**Wellbore Visualization:**
```
Visualize wellbore well001 in minecraft
```

**Horizon Surface:**
```
Render the horizon surface for formation XYZ in minecraft
```

**Player Position:**
```
What is my current position in minecraft?
```

**Multi-Wellbore:**
```
Show me all wellbores in the North Sea field in minecraft
```

**More examples:** [User Workflows](EDICRAFT_USER_WORKFLOWS.md)

---

## ✅ Verification Checklist

- [ ] Bedrock agent deployed
- [ ] Environment variables configured
- [ ] Amplify sandbox running
- [ ] Automated tests pass
- [ ] Minecraft queries route correctly
- [ ] Visualizations appear in Minecraft

---

## 🆘 Need Help?

1. Check [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md)
2. Run automated tests: `node tests/manual/test-edicraft-deployment.js`
3. Check CloudWatch logs
4. Review [Validation Guide](../tests/manual/EDICRAFT_VALIDATION_GUIDE.md)

---

**Ready to dive deeper?** Start with the [Documentation Index](EDICRAFT_DOCUMENTATION_INDEX.md)
