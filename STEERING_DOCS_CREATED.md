# Steering Documents Created

## Date: November 27, 2025

## Documents Created

Three steering documents have been created in `.kiro/steering/` to enforce frontend-first development and mandatory deployment:

### 1. mandatory-frontend-deployment.md
**Purpose**: Enforce that frontend deployment happens after EVERY code change, no matter how small.

**Key Rules**:
- Frontend deployment is MANDATORY after any code change
- No exceptions - even backend-only changes require frontend deployment
- Deployment is part of task completion, not optional
- Frontend is the only user-facing component

### 2. frontend-first-development.md
**Purpose**: Establish frontend-first development philosophy where frontend drives backend requirements.

**Key Principles**:
- Frontend is the product, backend is infrastructure
- Design UI/UX before writing backend code
- Frontend requirements define backend API contracts
- Users only see the frontend, so it's the priority

### 3. deployment-checklist.md
**Purpose**: Provide a mandatory checklist that must be completed before marking any task as done.

**Required Steps**:
- Code implementation
- Local testing
- Frontend deployment (MANDATORY)
- Cache propagation wait
- Production verification
- Documentation

## How These Work

These steering documents are automatically included in every agent execution. They will:

1. **Remind agents** to deploy frontend after every change
2. **Enforce** frontend-first thinking in design and implementation
3. **Provide** clear deployment commands and procedures
4. **Prevent** the mistake of completing work without deployment

## Impact

Going forward, agents will:
- ✅ Always deploy frontend after code changes
- ✅ Think about user experience first
- ✅ Verify changes in production before marking tasks complete
- ✅ Follow a consistent deployment workflow

## Deployment Commands

### Frontend (ALWAYS)
```bash
./deploy-frontend.sh
```

### Backend (When Needed)
```bash
cd cdk
npm run deploy
cd ..
./deploy-frontend.sh  # Yes, deploy frontend again after backend
```

## Production URL
https://d2hkqpgqguj4do.cloudfront.net

## Why This Matters

The issue with "for-wind-farm-4" generating layouts for "for-wind-farm" happened because:
1. Frontend changes were made
2. Frontend was NOT deployed
3. Testing happened on undeployed code
4. Time was wasted debugging phantom issues

These steering documents prevent this from happening again by making deployment mandatory and automatic.
