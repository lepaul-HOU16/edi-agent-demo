# ACTION BEFORE DOCUMENTATION

## ABSOLUTE RULE: FIX FIRST, DOCUMENT NEVER (UNTIL VALIDATED)

**DO NOT CREATE:**
- Requirements documents
- Design documents  
- Task lists
- Summary documents
- Status reports
- Architecture diagrams
- ANY markdown files in docs/

**UNTIL:**
- The fix is implemented
- The fix is deployed
- The fix is tested
- The fix is VALIDATED BY THE USER

## The Problem

We have created HUNDREDS of documentation files claiming things work when NOTHING WORKS.

The user sees:
- "Visualization Unavailable" 
- Broken features
- Empty promises

We have:
- 150+ markdown files
- 50+ "COMPLETE" summaries
- Zero working features

## The New Process

1. **IDENTIFY THE ACTUAL PROBLEM**
   - Read the error
   - Find the broken code
   - Understand why it fails

2. **FIX THE PROBLEM**
   - Change the code
   - Make it work
   - Keep it simple

3. **DEPLOY THE FIX**
   - Push the code
   - Deploy to AWS
   - Verify deployment

4. **TEST THE FIX**
   - Run the actual user workflow
   - Verify it works end-to-end
   - Check for regressions

5. **GET USER VALIDATION**
   - User tests it
   - User confirms it works
   - User says "yes this is fixed"

6. **ONLY THEN** - Write a brief summary IF REQUESTED

## What This Means

### ❌ NEVER DO THIS:
```
1. Create requirements.md
2. Create design.md  
3. Create tasks.md
4. Create COMPLETE_SUMMARY.md
5. Tell user "it's done"
6. (Nothing actually works)
```

### ✅ ALWAYS DO THIS:
```
1. Fix the code
2. Deploy it
3. Test it works
4. User validates
5. Move to next problem
```

## Current Situation

**Problem:** Terrain visualizations show "Visualization Unavailable"

**What NOT to do:**
- Write requirements for visualization storage
- Design a new artifact system
- Create optimization strategies document
- Write a spec about S3 integration

**What TO do:**
1. Look at terrain handler Python code
2. See why HTML is too large
3. Make HTML smaller
4. Deploy
5. Test
6. Done

## Enforcement

If you catch yourself:
- Creating a .md file
- Writing "Requirements"
- Writing "Design"  
- Writing "Complete"
- Writing "Summary"

**STOP IMMEDIATELY**

Ask yourself:
- Is the code fixed?
- Is it deployed?
- Is it tested?
- Did the user validate it?

If any answer is NO, then NO DOCUMENTATION.

## The Only Exception

After user validates a fix, you may write ONE brief summary IF they ask:
- What was broken
- What you changed
- How to verify it works

That's it. No requirements. No design. No architecture. No task lists.

## Remember

The user has invested HUNDREDS OF HOURS.

They don't need more documentation.

They need WORKING CODE.

FIX THE PROBLEM.
TEST IT WORKS.
GET USER VALIDATION.
MOVE ON.

**NO DOCUMENTATION UNTIL VALIDATION.**
