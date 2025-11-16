# package.json Migration Audit

## Changes Summary

### Scripts Changed
| Before (Next.js) | After (Vite) | Status |
|------------------|--------------|--------|
| `next dev` | `vite` | ✅ Correct |
| `next build` (with memory opts) | `vite build` | ✅ Correct |
| `next start` | `vite preview` | ✅ Correct |
| `next lint` | `eslint src --ext ts,tsx` | ✅ Correct |

### Dependencies Removed
- ❌ `@aws-amplify/backend-output-schemas` - **PROBLEM**: May be needed for backend
- ❌ `@aws-amplify/ui-react` - ✅ OK (not using Amplify UI components)
- ❌ `@mui/material-nextjs` - ✅ OK (Next.js specific)
- ❌ `aws-amplify` - **PROBLEM**: Replaced with `amazon-cognito-identity-js` but may need more
- ❌ `next` - ✅ OK (migrating away from Next.js)

### Dependencies Added
- ✅ `amazon-cognito-identity-js` - For Cognito auth
- ✅ `react-router-dom` - For routing
- ✅ `@vitejs/plugin-react` - For Vite
- ✅ `vite` - Build tool
- ✅ `buffer`, `stream-browserify`, `util` - Polyfills for Node.js APIs

### DevDependencies Removed
- ❌ `@aws-amplify/backend` - **CRITICAL**: This is needed for CDK backend!
- ❌ `@aws-amplify/backend-cli` - **CRITICAL**: This is needed for `npx ampx sandbox`!

## Critical Issues Found

### Issue 1: Amplify Backend Dependencies Removed ❌
**Problem**: The migration removed `@aws-amplify/backend` and `@aws-amplify/backend-cli`

**Impact**: 
- Cannot run `npx ampx sandbox`
- Cannot deploy backend
- CDK backend won't work

**Fix Required**:
```json
"devDependencies": {
  "@aws-amplify/backend": "^1.14.0",
  "@aws-amplify/backend-cli": "^1.4.9",
  // ... rest
}
```

**Status**: ❌ MUST FIX IMMEDIATELY

### Issue 2: Amplify Client Library Removed ❌
**Problem**: Removed `aws-amplify` package entirely

**Impact**:
- Cannot use Amplify client for API calls
- May break existing backend communication
- Auth may not work properly

**Analysis**:
- Replaced with `amazon-cognito-identity-js` for auth only
- But what about:
  - S3 file uploads?
  - API calls to backend?
  - Real-time subscriptions?

**Fix Required**:
Either:
1. Keep `aws-amplify` for backend communication
2. OR ensure ALL Amplify usage is replaced with REST API calls

**Status**: ⚠️ NEEDS INVESTIGATION

### Issue 3: Backend Output Schemas Removed ❌
**Problem**: Removed `@aws-amplify/backend-output-schemas`

**Impact**:
- May break type definitions for backend outputs
- May break `amplify_outputs.json` parsing

**Fix Required**:
```json
"dependencies": {
  "@aws-amplify/backend-output-schemas": "^1.4.0",
  // ... rest
}
```

**Status**: ⚠️ NEEDS INVESTIGATION

## Correct Changes ✅

### Scripts
All script changes are correct:
- `vite` for dev server
- `vite build` for production build
- `vite preview` for preview
- `eslint` for linting

### UI Dependencies
Correctly removed Next.js specific packages:
- `@mui/material-nextjs` - Not needed without Next.js
- `@aws-amplify/ui-react` - Not using Amplify UI components

### Build Tool
Correctly added Vite and related packages:
- `vite`
- `@vitejs/plugin-react`
- Polyfills for Node.js APIs

### Routing
Correctly added React Router:
- `react-router-dom`

## Recommendations

### Immediate Actions Required

1. **Restore Amplify Backend Dependencies**:
   ```bash
   npm install --save-dev @aws-amplify/backend@^1.14.0
   npm install --save-dev @aws-amplify/backend-cli@^1.4.9
   ```

2. **Investigate Amplify Client Usage**:
   ```bash
   # Find all files using Amplify client
   grep -r "generateClient\|aws-amplify" src/ --include="*.tsx" --include="*.ts"
   ```

3. **Decide on Backend Communication Strategy**:
   - Option A: Keep `aws-amplify` for backend communication
   - Option B: Replace ALL Amplify usage with REST API calls
   - **DO NOT mix both** - pick one strategy

4. **Test Backend Deployment**:
   ```bash
   npx ampx sandbox
   # Should work after restoring dependencies
   ```

### Investigation Required

1. **Check if backend output schemas are needed**:
   - Look for imports of `@aws-amplify/backend-output-schemas`
   - Check if `amplify_outputs.json` is being parsed

2. **Audit all Amplify usage**:
   - S3 file uploads
   - API calls
   - Authentication
   - Real-time subscriptions

3. **Verify polyfills are sufficient**:
   - Test that `buffer`, `stream-browserify`, `util` work
   - Check for any missing Node.js APIs

## Next Steps

1. ✅ Review this audit
2. ❌ Fix critical issues (restore backend dependencies)
3. ⚠️ Investigate Amplify client usage
4. ⚠️ Test backend deployment
5. ⚠️ Move to next file audit (vite.config.ts)

## Status

- **Critical Issues**: 1 (backend dependencies)
- **Warnings**: 2 (client library, output schemas)
- **Correct Changes**: 8
- **Overall Status**: ❌ NEEDS FIXES BEFORE PROCEEDING
