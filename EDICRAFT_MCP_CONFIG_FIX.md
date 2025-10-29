# EDIcraft MCP Configuration Fix

## Problem
MCP server was failing to start with error:
```
Error connecting to MCP server: spawn python ENOENT
```

## Root Causes
1. **Wrong Python command**: Config used `python` but macOS uses `python3`
2. **Wrong path**: Config pointed to `EDIcraft-main/agent.py` (reference repo) instead of `edicraft-agent/agent.py` (working directory)
3. **Missing dependencies**: System Python doesn't have required packages; need to use virtual environment

## Solution

### Changes Made to `.kiro/settings/mcp.json`:

**Before:**
```json
"edicraft": {
  "command": "python",
  "args": ["EDIcraft-main/agent.py"],
  ...
}
```

**After:**
```json
"edicraft": {
  "command": "edicraft-agent/venv/bin/python",
  "args": ["edicraft-agent/agent.py"],
  ...
}
```

### Key Fixes:
1. ✅ Changed command from `python` to `edicraft-agent/venv/bin/python` (uses virtual environment)
2. ✅ Changed path from `EDIcraft-main/agent.py` to `edicraft-agent/agent.py` (correct working directory)
3. ✅ Virtual environment already has all required dependencies installed

## Verification

### Dependencies Check:
```bash
$ edicraft-agent/venv/bin/python -c "import bedrock_agentcore; import strands; print('OK')"
✅ Dependencies installed correctly
```

### Python Version:
```bash
$ python3 --version
Python 3.12.8
```

### File Exists:
```bash
$ ls -la edicraft-agent/agent.py
-rw-r--r--@ 1 lepaul  staff  6169 Oct 29 10:02 edicraft-agent/agent.py
```

## Next Steps

1. **Restart Kiro** - The MCP server should now connect successfully
2. **Check MCP Logs** - Verify no more "spawn python ENOENT" errors
3. **Test EDIcraft Agent** - Try sending a message to the EDIcraft agent in chat

## Expected Behavior After Fix

- ✅ MCP server starts without errors
- ✅ EDIcraft tools are available
- ✅ Agent can call tools to build wellbores and visualize data in Minecraft
- ✅ No more welcome messages - agent performs actual work

## Related Files
- `.kiro/settings/mcp.json` - MCP server configuration
- `edicraft-agent/agent.py` - Python agent with simplified system prompt
- `edicraft-agent/venv/` - Virtual environment with dependencies
- `EDICRAFT_TOOL_CALLING_FIX.md` - Related fix for agent behavior
