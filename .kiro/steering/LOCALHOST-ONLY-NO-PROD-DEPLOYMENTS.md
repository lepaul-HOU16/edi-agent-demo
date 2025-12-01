---
inclusion: always
---

# CRITICAL: LOCALHOST ONLY - NEVER DEPLOY TO PRODUCTION

## ABSOLUTE RULE: NO PRODUCTION DEPLOYMENTS

**I AM FORBIDDEN FROM DEPLOYING TO PRODUCTION. PERIOD.**

## COMMANDS I MUST NEVER RUN

```bash
# ❌ FORBIDDEN - NEVER RUN THESE
./deploy-frontend.sh
npm run deploy
cd cdk && npm run deploy
aws s3 sync dist/ s3://...
aws cloudfront create-invalidation
cdk deploy
```

## COMMANDS I AM ALLOWED TO RUN

```bash
# ✅ ALLOWED - Local development only
npm run dev              # Start local dev server
npm run build            # Verify build works locally
npm test                 # Run tests
npm run lint             # Check code quality
```

## THE ONLY CORRECT WORKFLOW

1. **Make code changes**
2. **Test EXCLUSIVELY on localhost** - `npm run dev` at http://localhost:5173
3. **Wait for user to validate** - User must confirm fixes work
4. **User commits and pushes** - User triggers CI/CD by pushing to main
5. **CI/CD deploys automatically** - Not my job

## WHY THIS RULE EXISTS

- **CI/CD exists for deployment** - That's its entire purpose
- **Testing must happen first** - Localhost testing is mandatory
- **User must validate** - User confirms fixes work before production
- **No untested code in prod** - Production is not a testing environment
- **I keep making this mistake** - This rule prevents me from repeating it

## WHAT I MUST SAY INSTEAD

### ❌ WRONG (What I keep doing):
"I've deployed the fixes to production. Test at https://..."

### ✅ CORRECT (What I should say):
"I've made the fixes. Please test on localhost:

```bash
npm run dev
```

Open http://localhost:5173 and verify the fixes work.

Once confirmed, commit and push to main to trigger CI/CD deployment."

## IF USER SAYS "DEPLOY THIS"

Even if user explicitly says "deploy", I respond:

"The changes are ready for testing. To deploy to production:

1. **Test on localhost first**: `npm run dev`
2. **Verify it works**: Open http://localhost:5173
3. **Commit changes**: `git add . && git commit -m "Fix ChatBox issues"`
4. **Push to main**: `git push origin main`
5. **CI/CD deploys automatically**

Would you like me to help test on localhost?"

## MY ONLY JOB WITH DEPLOYMENT

- ✅ Write code
- ✅ Ensure code builds locally (`npm run build`)
- ✅ Help user test on localhost (`npm run dev`)
- ✅ Verify no errors locally
- ❌ **NEVER TOUCH PRODUCTION**

## CONSEQUENCES OF BREAKING THIS RULE

- Untested code in production
- Bypassing CI/CD safeguards
- User frustration and anger
- Wasted time
- Breaking production
- Losing user trust

## THIS IS NON-NEGOTIABLE

**I MUST NEVER DEPLOY TO PRODUCTION.**
**LOCALHOST TESTING ONLY.**
**CI/CD HANDLES PRODUCTION.**
**THIS IS ABSOLUTE.**

## REMINDER TO MYSELF

Every time I think about deploying:
1. STOP
2. Remember: CI/CD deploys, not me
3. Tell user to test on localhost
4. Wait for user validation
5. User pushes to trigger CI/CD

**NEVER. DEPLOY. TO. PRODUCTION.**
