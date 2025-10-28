# EDIcraft Credential Search Results

## Summary

I've searched for EDIcraft credentials in multiple locations. Here's what I found:

### ✅ What's Confirmed Working:
1. **Minecraft Server**: `edicraft.nigelgardiner.com` is online and accessible
2. **SSH Port (22)**: Open and accessible
3. **RCON Port (49000)**: Open and accessible
4. **AWS Account**: Configured (Account: 484907533441)

### ❌ What's Missing:
1. **MINECRAFT_RCON_PASSWORD** - Not found in AWS or local files
2. **EDI_USERNAME** - Not found
3. **EDI_PASSWORD** - Not found
4. **EDI_CLIENT_ID** - Not found
5. **EDI_CLIENT_SECRET** - Not found
6. **EDI_PARTITION** - Not found
7. **EDI_PLATFORM_URL** - Not found

### 🔍 Where I Searched:
- ✅ AWS Systems Manager Parameters (us-west-2)
- ✅ AWS Secrets Manager (us-west-2)
- ✅ Local environment files (.env.local, .env.example)
- ✅ EDIcraft-main repository files
- ✅ Network connectivity tests

## Next Steps to Find Credentials

### Option 1: SSH into the Minecraft Server (RECOMMENDED)

Since SSH port 22 is open, you can access the server directly:

```bash
# SSH into the server (you'll need the SSH key or password)
ssh <username>@edicraft.nigelgardiner.com

# Once logged in, find the docker-compose file
find ~ -name "docker-compose.yml" -path "*minecraft*"

# Check the RCON password
cat /path/to/minecraft-server/docker-compose.yml | grep RCON_PASSWORD

# Or if it's in environment variables
docker inspect <container_name> | grep RCON_PASSWORD
```

**You'll need:**
- SSH username for edicraft.nigelgardiner.com
- SSH password or private key

### Option 2: Contact Server Administrator

If you don't have SSH access, contact whoever manages `edicraft.nigelgardiner.com`:

**Ask for:**
1. Minecraft RCON password
2. SSH access to retrieve it yourself

**Likely administrators:**
- Based on whitelisted players: rastaruby3, DarkDragnet, naginata9, LEPAUL337, Fantaros
- Check if you (LEPAUL337) have admin access

### Option 3: OSDU Platform Credentials

For OSDU credentials, you need to:

1. **Identify your OSDU platform provider:**
   - AWS EDI (Energy Data Initiative)
   - Azure OSDU
   - Google Cloud OSDU
   - Company-hosted OSDU

2. **Access the platform:**
   - Log into the OSDU web portal
   - Navigate to API/Developer settings
   - Generate OAuth credentials

3. **Common OSDU platform URLs:**
   - AWS EDI: https://edi.aws.amazon.com
   - Check your company's internal documentation

4. **Contact OSDU administrator:**
   - Request API credentials
   - Specify you need: username, password, client_id, client_secret, partition, platform_url

## Testing Tools Available

Once you find credentials, use these scripts to test them:

### Test Minecraft RCON:
```bash
./edicraft-agent/test-minecraft-connection.sh <rcon_password>
```

### Test OSDU Connection:
```bash
python ./edicraft-agent/test-osdu-connection.py
```

### Check AWS (other regions):
```bash
AWS_REGION=us-east-1 ./edicraft-agent/check-aws-credentials.sh
```

## Immediate Actions You Can Take

### 1. Try SSH Access
```bash
# Try SSH with your username
ssh lepaul@edicraft.nigelgardiner.com
# or
ssh LEPAUL337@edicraft.nigelgardiner.com
# or
ssh ubuntu@edicraft.nigelgardiner.com
```

### 2. Check Your Local SSH Config
```bash
cat ~/.ssh/config | grep -A 5 edicraft
```

### 3. Check for SSH Keys
```bash
ls -la ~/.ssh/ | grep edicraft
```

### 4. Check Your Password Manager
Search for:
- "edicraft"
- "minecraft"
- "rcon"
- "osdu"
- "edi"

### 5. Check Email/Slack
Search for:
- "edicraft setup"
- "minecraft server"
- "rcon password"
- "osdu credentials"

## Temporary Workaround (Not Recommended)

If you can't find credentials immediately, you could:

1. **Reset the Minecraft RCON password** (requires server access)
2. **Create new OSDU credentials** (if you have platform access)
3. **Deploy without OSDU** (Minecraft-only features would work)

## What Happens Next

Once you provide the credentials:

1. I'll update `edicraft-agent/config.ini`
2. We'll test the connections
3. We'll deploy the Bedrock AgentCore agent
4. We'll update the Lambda configuration
5. We'll test end-to-end functionality

## Questions to Answer

To help find credentials faster, please answer:

1. **Do you have SSH access to edicraft.nigelgardiner.com?**
   - If yes, what's your SSH username?
   - Do you have the SSH key?

2. **Do you have access to an OSDU platform?**
   - Which provider? (AWS EDI, Azure, Google, Other)
   - What's the platform URL?
   - Can you log into the web interface?

3. **Who set up the Minecraft server?**
   - Can you contact them?
   - Are you one of the admins (LEPAUL337)?

4. **Do you have a password manager?**
   - Have you searched for "edicraft" or "minecraft"?

5. **Do you have access to company documentation?**
   - Confluence, Notion, SharePoint, etc.
   - Search for "OSDU setup" or "EDI credentials"

## Support

If you're stuck, I can help with:
- SSH connection troubleshooting
- OSDU platform navigation
- Credential testing
- Alternative deployment strategies
