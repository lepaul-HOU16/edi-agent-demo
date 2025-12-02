---
inclusion: always
---

# CRITICAL: TEST LOCALHOST FIRST, DEPLOY BACKEND WHEN NEEDED

## CORRECTED RULE: Smart Deployment Strategy

**Frontend CI/CD is broken. Backend deployment is necessary for testing.**

## COMMANDS I MUST NEVER RUN

```bash
# ❌ FORBIDDEN - Frontend deployment (CI/CD broken)
./deploy-frontend.sh
aws s3 sync dist/ s3://...
aws cloudfront create-invalidation
```

## COMMANDS I AM ALLOWED TO RUN

```bash
# ✅ ALLOWED - Backend and local testing
cd cdk && npm run deploy # Deploy Lambda functions and backend
npm run dev              # Start local dev server
npm run build            # Verify build works locally
npm test                 # Run tests
npm run lint             # Check code quality
```

## THE CORRECT WORKFLOW

1. **Make code changes**
2. **If backend/Lambda changes**: Deploy with `cd cdk && npm run deploy`
3. **Test on localhost** - `npm run dev` at http://localhost:3000
4. **Localhost connects to deployed backend** - Realistic testing environment
5. **Wait for user to validate** - User must confirm fixes work
6. **User commits and pushes** - User triggers CI/CD by pushing to main
7. **CI/CD attempts frontend deployment** - Currently broken, needs fixing

## WHY THIS RULE EXISTS

- **CI/CD for frontend is broken** - Don't waste time on it
- **Backend must be deployed** - Localhost needs real Lambda functions
- **Testing must happen first** - Localhost testing is mandatory
- **User must validate** - User confirms fixes work before production
- **Localhost + deployed backend** - Best testing environment

## WHAT I SHOULD SAY

### ✅ CORRECT:
"I've made the fixes and deployed the backend. Test on localhost:

```bash
npm run dev
```

Open http://localhost:3000 and verify the fixes work. The localhost frontend will connect to the deployed Lambda functions for realistic testing.

Once confirmed, commit and push to main for CI/CD frontend deployment."

## IF USER SAYS "DEPLOY THIS"

If backend changes were made:

"I'll deploy the backend changes now:

```bash
cd cdk && npm run deploy
```

Then test on localhost at http://localhost:3000. The frontend will connect to the deployed backend for realistic testing."

## MY JOB WITH DEPLOYMENT

- ✅ Write code
- ✅ Deploy backend/Lambda changes when needed
- ✅ Ensure code builds locally (`npm run build`)
- ✅ Help user test on localhost (`npm run dev`)
- ✅ Verify no errors locally
- ❌ **NEVER DEPLOY FRONTEND MANUALLY**

## CONSEQUENCES OF BREAKING THIS RULE

- Deploying frontend manually when CI/CD is broken
- Wasting time on broken deployment scripts
- Not deploying backend when needed for testing
- Testing without realistic backend connection
- User frustration

## THE CORRECT APPROACH

**Backend deployment = Necessary for realistic testing**
**Frontend deployment = CI/CD only (currently broken)**
**Localhost testing = ALWAYS required first**
**Localhost + deployed backend = Best testing environment**

## REMINDER TO MYSELF

When making changes:
1. Deploy backend if Lambda/API changes made
2. Test on localhost (connects to deployed backend)
3. Wait for user validation
4. User pushes to trigger CI/CD frontend deployment

**DEPLOY BACKEND WHEN NEEDED. TEST ON LOCALHOST. LET CI/CD HANDLE FRONTEND.**
