# How to Verify EDIcraft Minecraft Connection is Working

## Quick Verification (30 seconds)

### Option 1: Check CloudWatch Logs (Fastest)

```bash
aws logs tail /aws/lambda/EnergyInsights-development-chat --since 5m --follow --region us-east-1 | grep -i "minecraft\|rcon"
```

Then trigger a clear command from the UI and watch the logs show:
- ✅ "Successfully connected to Minecraft server via RCON"
- ✅ "Set the weather to clear"
- ✅ "Set the time to 1000"

### Option 2: Test via Localhost UI

1. **Open the app**: http://localhost:3001

2. **Navigate to Chat page**

3. **Select EDIcraft agent** from dropdown

4. **Click "Clear Minecraft Environment" button**

5. **Verify in UI**:
   - ✅ No user message appears in chat
   - ✅ Agent response appears
   - ✅ Thought steps show:
     - "Analyzing Request"
     - "Connecting to Minecraft Server"
     - "Executing Clear Commands"
     - "Environment Cleared"
   - ✅ Success alert displays
   - ✅ Message says "Minecraft environment cleared successfully"

6. **Check CloudWatch logs** to see actual RCON commands executed

### Option 3: Test via HTML Test Page

```bash
open test-edicraft-clear-localhost.html
```

Click "Test Clear Command" and verify:
- ✅ Success: true
- ✅ Connection Status: connected
- ✅ Thought steps displayed
- ✅ Duration < 1 second

## Full In-Game Verification

To verify blocks are actually cleared in Minecraft:

### Prerequisites
- Access to Minecraft Java Edition
- Server address: `edicraft.nigelgardiner.com`

### Steps

1. **Join the Minecraft server**
   - Open Minecraft Java Edition
   - Multiplayer → Direct Connect
   - Server Address: `edicraft.nigelgardiner.com`

2. **Go to spawn area**
   - Teleport to spawn: `/spawn` (if available)
   - Or walk to coordinates near (0, 64, 0)

3. **Place some test blocks**
   - Place 10-20 blocks of any type
   - Note their locations

4. **Trigger clear from UI**
   - Open http://localhost:3001
   - Go to Chat → EDIcraft
   - Click "Clear Minecraft Environment"

5. **Verify in-game**
   - ✅ Weather changes to clear
   - ✅ Time changes to day
   - ✅ Test blocks are removed (if in loaded chunks)
   - ✅ Any entities (except players) are removed

## What You Should See

### In CloudWatch Logs:
```
[EDIcraft MCP Client] ✅ Successfully connected to Minecraft server via RCON
[EDIcraft MCP Client] 📤 [1/8] Executing: /fill -100 0 -100 100 256 100 air replace
[EDIcraft MCP Client] 📥 [1/8] Response: Successfully filled X blocks
[EDIcraft MCP Client] 📤 [6/8] Executing: /kill @e[type=!player]
[EDIcraft MCP Client] 📥 [6/8] Response: Killed X entities
[EDIcraft MCP Client] 📤 [7/8] Executing: /weather clear
[EDIcraft MCP Client] 📥 [7/8] Response: Set the weather to clear
[EDIcraft MCP Client] 📤 [8/8] Executing: /time set day
[EDIcraft MCP Client] 📥 [8/8] Response: Set the time to 1000
[EDIcraft MCP Client] ✅ All clear commands executed successfully
```

### In the UI:
```
🧠 Thought Steps:
  1. [analysis] Analyzing Request
     Detected clear environment command
  
  2. [processing] Connecting to Minecraft Server
     Established RCON connection to edicraft.nigelgardiner.com:49001
  
  3. [processing] Executing Clear Commands
     Executed 8 commands in 0.02s
  
  4. [completion] Environment Cleared
     Successfully cleared the Minecraft environment in 0.02s
```

### In Minecraft:
- Weather is clear (no rain)
- Time is day (sun is up)
- Test blocks are gone
- Entities are removed

## Troubleshooting

### If Connection Fails

1. **Check Minecraft server is running**:
   ```bash
   nc -zv edicraft.nigelgardiner.com 49001
   ```
   Should show: "Connection to edicraft.nigelgardiner.com port 49001 [tcp/*] succeeded!"

2. **Check RCON password in Secrets Manager**:
   ```bash
   aws secretsmanager get-secret-value --secret-id minecraft/rcon-password --region us-east-1 --query SecretString --output text
   ```

3. **Check Lambda has Secrets Manager permission**:
   ```bash
   aws iam get-role-policy --role-name EnergyInsights-development-ChatFunction-Role --policy-name ChatFunctionRoleDefaultPolicy --region us-east-1 | grep secretsmanager
   ```

### If Commands Don't Clear Blocks

This is normal if:
- No players are in the area (chunks not loaded)
- Coordinates are far from spawn
- Server has chunk loading limits

**Solution**: Have a player stand near spawn (0, 0) when running clear command.

### If "That position is not loaded" Appears

This is **NORMAL** and means:
- The chunks at those coordinates aren't loaded
- The command was sent successfully
- The connection is working
- Blocks would be cleared if chunks were loaded

**This is not an error!**

## Success Criteria

You can confirm the connection is working if you see:

- ✅ CloudWatch logs show "Successfully connected to Minecraft server via RCON"
- ✅ Commands are executed (logs show "Executing: /fill...")
- ✅ Responses are received (logs show "Response: ...")
- ✅ Weather and time commands succeed
- ✅ UI shows success message
- ✅ Thought steps are displayed
- ✅ No error messages in logs

**Even if fill commands say "not loaded", the connection is working!**

## Current Status

✅ **RCON Connection**: WORKING
✅ **Command Execution**: WORKING
✅ **Weather Control**: WORKING
✅ **Time Control**: WORKING
✅ **Entity Removal**: WORKING
✅ **Block Clearing**: WORKING (when chunks are loaded)

**The EDIcraft Minecraft connection is fully functional!**
