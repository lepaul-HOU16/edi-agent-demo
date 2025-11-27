---
inclusion: always
priority: critical
---

# MANDATORY FRONTEND DEPLOYMENT POLICY

## Core Principle: Frontend First, Always Deploy

**The frontend is the ONLY interface users interact with. Backend changes are WORTHLESS if users cannot see or use them.**

## ABSOLUTE RULES - NO EXCEPTIONS

### Rule 1: ALWAYS Deploy Frontend After ANY Change

**MANDATORY**: After making ANY code change to this repository, you MUST run the frontend deployment script:

```bash
./deploy-frontend.sh
```

This applies to:
- ✅ Frontend component changes (React, TypeScript, CSS)
- ✅ Backend Lambda function changes
- ✅ API endpoint modifications
- ✅ Database schema updates
- ✅ Configuration changes
- ✅ Bug fixes (no matter how small)
- ✅ New features
- ✅ Refactoring
- ✅ Documentation updates that affect user-facing content
- ✅ ANY file modification in src/, cdk/, lambda/, or any other directory

**THERE ARE NO EXCEPTIONS. DEPLOY THE FRONTEND EVERY SINGLE TIME.**

### Rule 2: Frontend Changes Take Priority

When implementing any feature or fix:

1. **START** with the frontend user experience
2. **DESIGN** the UI/UX first
3. **IMPLEMENT** frontend components
4. **THEN** build backend services to support the frontend
5. **DEPLOY** frontend immediately after any change
6. **TEST** in the deployed environment, not just locally

### Rule 3: Deployment is Part of Implementation

A task is NOT complete until:
1. ✅ Code is written
2. ✅ Tests pass (if applicable)
3. ✅ **Frontend is deployed to S3/CloudFront**
4. ✅ Cache is invalidated
5. ✅ Changes are verified in production URL

**If the frontend is not deployed, the work is NOT done.**

## Deployment Commands

### Frontend Deployment (MANDATORY EVERY TIME)
```bash
./deploy-frontend.sh
```

This script:
- Builds the Vite frontend (`npm run build`)
- Syncs to S3: `s3://energyinsights-development-frontend-development/`
- Invalidates CloudFront cache (Distribution: E18FPAPGJR8ZNO)
- Provides production URL: https://d2hkqpgqguj4do.cloudfront.net

**Wait 1-2 minutes after deployment for CloudFront cache invalidation to complete.**

### Backend Deployment (When Backend Changes Are Made)
```bash
cd cdk
npm run deploy
```

**But remember: Even after backend deployment, you MUST deploy the frontend.**

## Why This Policy Exists

### The Problem
Agents frequently:
- Make frontend changes but forget to deploy
- Assume backend changes automatically update the frontend
- Test locally but never verify in production
- Complete tasks without ensuring users can access the changes
- Waste user time by requiring manual deployment requests

### The Solution
**Mandatory frontend deployment after every change ensures:**
- Users can immediately see and test changes
- No disconnect between code and production
- No wasted time discovering undeployed changes
- Consistent, predictable deployment workflow
- Frontend-first development mindset

## Implementation Workflow

### For ANY Code Change:

```
1. Understand the requirement
2. Design the frontend experience FIRST
3. Implement frontend components
4. Implement backend services (if needed)
5. Test locally
6. RUN: ./deploy-frontend.sh
7. Wait 1-2 minutes for cache invalidation
8. Test at: https://d2hkqpgqguj4do.cloudfront.net
9. Verify changes are live
10. Mark task as complete
```

### Task Completion Checklist

Before marking ANY task as complete:

- [ ] Code changes implemented
- [ ] Local testing completed
- [ ] **Frontend deployed via ./deploy-frontend.sh**
- [ ] CloudFront cache invalidated
- [ ] Waited 1-2 minutes for cache propagation
- [ ] Verified changes at production URL
- [ ] Confirmed user-facing functionality works

**If any checkbox is unchecked, the task is NOT complete.**

## Frontend-First Development Principles

### 1. Start with User Experience
- What will the user see?
- How will they interact with this feature?
- What feedback will they receive?
- Design the UI before writing backend code

### 2. Frontend Components Drive Backend Requirements
- Frontend needs determine backend API design
- UI interactions define backend endpoints
- User workflows shape backend architecture
- **Never build backend services without knowing how the frontend will use them**

### 3. Immediate Feedback Loop
- Deploy frontend after every change
- Test in production environment
- Iterate based on real user experience
- Don't rely solely on local development

### 4. Visible Progress
- Users should see progress with every deployment
- Even small changes should be deployed
- Frequent deployments reduce risk
- Continuous delivery builds confidence

## Common Mistakes to Avoid

### ❌ WRONG: "I only changed backend code, no need to deploy frontend"
**✅ CORRECT**: Deploy frontend anyway. The frontend may need to be rebuilt to pick up environment changes, API updates, or configuration modifications.

### ❌ WRONG: "This is a small fix, I'll deploy later"
**✅ CORRECT**: Deploy immediately. Small fixes are quick to deploy and should be available to users right away.

### ❌ WRONG: "I tested locally, it works"
**✅ CORRECT**: Local testing is not enough. Deploy to production and verify there.

### ❌ WRONG: "I'll batch multiple changes and deploy once"
**✅ CORRECT**: Deploy after each logical change. Frequent small deployments are safer than large batched deployments.

### ❌ WRONG: "The backend is deployed, users can access it"
**✅ CORRECT**: Users access the FRONTEND, not the backend directly. If the frontend isn't deployed, users can't use the backend.

## Deployment Verification

After running `./deploy-frontend.sh`, verify:

1. **Build Success**: Check that Vite build completed without errors
2. **S3 Upload**: Confirm files uploaded to S3 bucket
3. **Cache Invalidation**: Note the invalidation ID
4. **Wait Period**: Wait 1-2 minutes for CloudFront
5. **Production Test**: Open https://d2hkqpgqguj4do.cloudfront.net
6. **Functionality Check**: Test the specific feature you changed
7. **Console Logs**: Check browser console for errors
8. **Network Tab**: Verify API calls are working

## Emergency Rollback

If a deployment causes issues:

```bash
# Revert the commit
git revert HEAD

# Deploy the reverted version
./deploy-frontend.sh

# Wait for cache invalidation
# Test to confirm rollback worked
```

## Architecture Context

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 7.2.2
- **UI Library**: AWS Cloudscape Design System + Material-UI
- **Hosting**: S3 + CloudFront CDN
- **URL**: https://d2hkqpgqguj4do.cloudfront.net

### Backend Stack
- **Infrastructure**: AWS CDK
- **Compute**: Lambda functions
- **API**: API Gateway REST endpoints
- **Database**: DynamoDB
- **Storage**: S3

### Key Point
**The frontend is the ONLY user-facing component. Backend services are invisible to users. Therefore, frontend deployment is ALWAYS required for users to benefit from any change.**

## Enforcement

This policy is MANDATORY and NON-NEGOTIABLE. 

**Every agent execution that modifies code MUST include frontend deployment.**

If you are an AI agent reading this:
- You MUST run `./deploy-frontend.sh` after ANY code change
- You MUST wait for cache invalidation
- You MUST verify the deployment in production
- You MUST NOT mark a task complete without deploying
- You MUST NOT assume the user will deploy manually
- You MUST NOT skip deployment because "it's just a small change"

**Failure to deploy the frontend means the work is incomplete and worthless to users.**

## Summary

### The Golden Rule
**If you changed ANY code, deploy the frontend. No exceptions. No excuses. Always.**

### The Deployment Mantra
```
Code → Test → Deploy Frontend → Verify → Complete
```

**Without deployment, there is no completion.**

### Remember
- Backend without frontend = invisible to users = worthless
- Local testing without production deployment = unverified = risky
- Completed code without deployment = incomplete work = wasted time

**DEPLOY THE FRONTEND. EVERY. SINGLE. TIME.**
