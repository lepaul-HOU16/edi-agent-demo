# Migration Plan: Remove Amplify/Next.js from Frontend

## What to REMOVE:
1. All `import ... from 'aws-amplify'` 
2. All `import ... from '@aws-amplify'`
3. All `import ... from 'next/...'`
4. All `generateClient()` calls
5. All `amplifyClient` variables
6. All `dynamic()` imports (replace with React.lazy)
7. ConfigureAmplify component
8. Amplify auth hooks

## What to KEEP/REPLACE:
1. REST API calls (fetch/axios to backend)
2. S3 operations → Replace with backend API endpoints
3. Auth → Replace with standard auth solution
4. File uploads → Replace with backend endpoints

## Files to DELETE entirely:
- src/components/ConfigureAmplify.tsx
- src/utils/testUtils.ts (Amplify specific)
- Any file that can't work without Amplify

## Files to MODIFY:
- Remove Amplify imports, replace with REST API calls
- Remove Next.js imports, replace with React Router
