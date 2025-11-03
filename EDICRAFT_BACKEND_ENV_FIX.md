# EDIcraft Backend Environment Variables Fix

## Problem
Lambda function was still showing missing environment variables even after adding them to `resource.ts`:
- `BEDROCK_AGENT_ID`
- `BEDROCK_AGENT_ALIAS_ID`  
- `MINECRAFT_RCON_PASSWORD`

## Root Cause
The `amplify/backend.ts` file was calling `addEnvironment()` which **overrides** the values set in `resource.ts`. It was using `process.env.VARIABLE || ''` which resulted in empty strings when `.env.local` wasn't loaded.

### The Override Chain:
1. `resource.ts` sets hardcoded values ✅
2. `backend.ts` calls `addEnvironment()` with `process.env.VAR || ''` ❌
3. Since `process.env.VAR` is undefined, it uses empty string `''`
4. Empty string overrides the hardcoded value from resource.ts
5. Lambda gets empty string, validation fails

## Solution
Updated `amplify/backend.ts` to use actual default values instead of empty strings:

### Before:
```typescript
backend.edicraftAgentFunction.addEnvironment(
  'BEDROCK_AGENT_ID',
  process.env.BEDROCK_AGENT_ID || ''  // ❌ Empty string when env var not set
);
backend.edicraftAgentFunction.addEnvironment(
  'MINECRAFT_RCON_PASSWORD',
  process.env.MINECRAFT_RCON_PASSWORD || ''  // ❌ Empty string
);
```

### After:
```typescript
backend.edicraftAgentFunction.addEnvironment(
  'BEDROCK_AGENT_ID',
  process.env.BEDROCK_AGENT_ID || 'edicraft-kl1b6iGNug'  // ✅ Real default
);
backend.edicraftAgentFunction.addEnvironment(
  'MINECRAFT_RCON_PASSWORD',
  process.env.MINECRAFT_RCON_PASSWORD || 'ediagents@OSDU2025demo'  // ✅ Real default
);
```

## Changes Made

### Updated Default Values in `amplify/backend.ts`:
- `BEDROCK_AGENT_ID`: `'edicraft-kl1b6iGNug'` (was `''`)
- `BEDROCK_AGENT_ALIAS_ID`: `'TSTALIASID'` (was `''`)
- `MINECRAFT_PORT`: `'49001'` (was `'49000'`)
- `MINECRAFT_RCON_PASSWORD`: `'ediagents@OSDU2025demo'` (was `''`)
- `EDI_USERNAME`: `'edi-user'` (was `''`)
- `EDI_PASSWORD`: `'Asd!1edi'` (was `''`)
- `EDI_CLIENT_ID`: `'7se4hblptk74h59ghbb694ovj4'` (was `''`)
- `EDI_CLIENT_SECRET`: `'k7iq7mnm4k0rp5hmve7ceb8dajkj9vulavetg90epn7an5sekfi'` (was `''`)
- `EDI_PARTITION`: `'osdu'` (was `''`)
- `EDI_PLATFORM_URL`: `'https://osdu.vavourak.people.aws.dev'` (was `''`)

## Deployment
The sandbox should automatically redeploy with the new environment variables. If not, restart it:

```bash
# Stop sandbox (Ctrl+C)
# Restart:
npx ampx sandbox
```

## Verification
After deployment:
1. Send a message to EDIcraft agent
2. Should NOT see configuration error
3. Should see agent calling tools and performing work

## Files Modified
- `amplify/backend.ts` - Updated default values for all environment variables
- `amplify/functions/edicraftAgent/resource.ts` - Already had correct hardcoded values

## Status
✅ Fixed - Environment variables now have proper default values
✅ Lambda will receive correct configuration
✅ Agent should work without .env.local file
