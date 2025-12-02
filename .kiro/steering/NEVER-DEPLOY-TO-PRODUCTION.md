---
inclusion: always
---

# DEPLOYMENT POLICY - CORRECTED

## Core Rule: Test Localhost First, Deploy Backend When Needed

### ❌ FORBIDDEN: Frontend Production Deployments
```bash
./deploy-frontend.sh          # FORBIDDEN - CI/CD is broken, don't use
aws s3 sync dist/             # FORBIDDEN - Frontend via CI/CD only
aws cloudfront create-invalidation  # FORBIDDEN - Don't touch frontend
```

### ✅ ALLOWED: Backend/Lambda Deployments
```bash
cd cdk && npm run deploy      # ALLOWED - Deploy Lambda functions
npm run dev                   # ALLOWED - Local development testing
npm run build                 # ALLOWED - Local build verification
npm test                      # ALLOWED - Run tests locally
```

## DEPLOYMENT WORKFLOW

### The CORRECT Process:
1. **Make code changes**
2. **Test on localhost FIRST** (`npm run dev` at http://localhost:3000)
3. **Verify fixes work locally**
4. **If backend/Lambda changes**: Deploy with `cd cdk && npm run deploy`
5. **Test backend changes on localhost** (localhost talks to deployed Lambdas)
6. **User validates everything works**
7. **User commits and pushes for CI/CD frontend deployment**

### CRITICAL RULES:
- ✅ ALWAYS test on localhost first
- ✅ Deploy Lambda/backend changes when needed for testing
- ❌ NEVER deploy frontend manually (CI/CD is broken anyway)
- ✅ Localhost connects to deployed backend for realistic testing

## WHY THIS RULE EXISTS

1. **CI/CD for frontend is broken** - Don't waste time trying to use it
2. **Backend must be deployed** - Localhost needs real Lambda functions to test against
3. **Testing required** - All changes must be tested on localhost first
4. **Validation required** - User must confirm fixes work before production
5. **Localhost + deployed backend = realistic testing** - Best of both worlds

## CORRECT WORKFLOW EXAMPLE

```bash
# 1. Make changes to Lambda function
vim cdk/lambda-functions/chat/agents/edicraftAgent.ts

# 2. Deploy backend changes
cd cdk
npm run deploy
cd ..

# 3. Test on localhost (which now talks to deployed Lambda)
npm run dev
# Open http://localhost:3000
# Test the changes thoroughly
# Verify everything works with real backend

# 4. User confirms it works
# Wait for user to say "looks good"

# 5. User commits and pushes
git add .
git commit -m "Fix EDIcraft agent"
git push origin main

# 6. CI/CD attempts frontend deployment (currently broken)
```

## WHAT TO SAY

### ✅ CORRECT:
"I've made the fixes and deployed the backend. Test on localhost with `npm run dev` at http://localhost:3000. The localhost frontend will connect to the deployed Lambda functions for realistic testing."

## LOCALHOST TESTING WITH DEPLOYED BACKEND

Your job with deployment:
- ✅ Deploy Lambda/backend changes when needed
- ✅ Ensure code runs on localhost
- ✅ Help user test on localhost (with real backend)
- ✅ Verify no build errors locally
- ❌ NEVER deploy frontend manually

## REMEMBER

- **Frontend deployment = CI/CD's job (when it's fixed)**
- **Backend deployment = Your job when needed for testing**
- **Localhost testing = ALWAYS required first**
- **Localhost + deployed backend = Realistic testing environment**
