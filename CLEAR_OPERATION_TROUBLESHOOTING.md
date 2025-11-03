# Clear Operation Failed - Troubleshooting Guide

## Common Causes and Solutions

### 1. Minecraft Server Not Running

**Symptom:** "Clear operation failed" with connection error

**Check:**
```bash
# Check if Minecraft server is running
ps aux | grep minecraft
# or
docker ps | grep minecraft
```

**Solution:**
- Start the Minecraft server
- Verify it's accessible at the configured host and port

### 2. RCON Not Enabled

**Symptom:** "Connection refused" or "Authentication failed"

**Check:**
```bash
# Check server.properties
grep rcon server.properties
```

**Should show:**
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_password
```

**Solution:**
1. Edit `server.properties`
2. Set `enable-rcon=true`
3. Set `rcon.port=25575`
4. Set `rcon.password=your_password`
5. Restart Minecraft server

### 3. Incorrect RCON Password

**Symptom:** "Authentication failed"

**Check:**
```bash
# Verify environment variable matches server.properties
echo $MINECRAFT_RCON_PASSWORD
grep rcon.password server.properties
```

**Solution:**
- Update environment variable to match server.properties
- Or update server.properties to match environment variable
- Restart Minecraft server after changing password

### 4. Firewall Blocking RCON Port

**Symptom:** "Connection timeout" or "Connection refused"

**Check:**
```bash
# Test if port is accessible
telnet your-server-host 25575
# or
nc -zv your-server-host 25575
```

**Solution:**
```bash
# Allow RCON port through firewall
sudo ufw allow 25575
# or
sudo iptables -A INPUT -p tcp --dport 25575 -j ACCEPT
```

### 5. Server Under Heavy Load

**Symptom:** "Command timed out" or slow response

**Check:**
```bash
# Check server TPS (in Minecraft console)
/tps
```

**Solution:**
- Wait for server load to decrease
- Reduce clear region size
- Increase timeout value in configuration

### 6. Insufficient Permissions

**Symptom:** "Permission denied" or "Not allowed"

**Check:**
```bash
# Check if RCON user has operator permissions
# In Minecraft console:
/op rcon_user
```

**Solution:**
- Grant operator permissions to RCON user
- Check `op-permission-level` in server.properties (should be 4)

### 7. Configuration Not Loaded

**Symptom:** "Configuration error" or missing environment variables

**Check:**
```bash
# Verify all required environment variables are set
echo $MINECRAFT_HOST
echo $MINECRAFT_RCON_PORT
echo $MINECRAFT_RCON_PASSWORD
```

**Solution:**
```bash
# Set environment variables
export MINECRAFT_HOST="your-server-host"
export MINECRAFT_RCON_PORT="25575"
export MINECRAFT_RCON_PASSWORD="your-password"
```

### 8. Lambda Function Not Updated

**Symptom:** Clear operation uses old code without reliability fixes

**Check:**
```bash
# Check Lambda function last modified date
aws lambda get-function --function-name edicraft-agent --query "Configuration.LastModified"
```

**Solution:**
```bash
# Redeploy Lambda function
cd edicraft-agent
docker build -t edicraft-agent:latest .
# Push to ECR and update Lambda
# (See deployment guide for full steps)
```

## Quick Diagnosis

Run the diagnostic script to identify the specific issue:

```bash
python3 tests/diagnose-clear-failure.py
```

This will test:
1. Configuration loading
2. RCON connection
3. Clear tool initialization
4. Small clear operation
5. Full clear operation

## Manual Test

Test RCON connection manually:

```bash
# Install rcon client
pip3 install mcrcon

# Test connection
python3 << 'EOF'
from rcon.source import Client

host = "your-server-host"
port = 25575
password = "your-password"

try:
    with Client(host, port, passwd=password) as client:
        response = client.run('list')
        print(f"Success: {response}")
except Exception as e:
    print(f"Failed: {str(e)}")
EOF
```

## Check CloudWatch Logs

If running in AWS Lambda:

```bash
# Get recent logs
aws logs tail /aws/lambda/edicraft-agent --follow

# Search for errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/edicraft-agent \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '5 minutes ago' +%s)000
```

## Common Error Messages

### "Connection refused"
- Minecraft server not running
- Wrong host or port
- Firewall blocking connection

### "Authentication failed"
- Wrong RCON password
- RCON not enabled
- Server not fully started

### "Command timed out"
- Server under heavy load
- Operation too large
- Network issues

### "Permission denied"
- RCON user not operator
- Insufficient op-permission-level
- Command not allowed via RCON

### "Invalid command"
- Minecraft version incompatibility
- Command syntax error
- Command not available

## Step-by-Step Troubleshooting

1. **Verify Minecraft server is running:**
   ```bash
   systemctl status minecraft
   # or
   docker ps | grep minecraft
   ```

2. **Test RCON connection:**
   ```bash
   python3 tests/diagnose-clear-failure.py
   ```

3. **Check server logs:**
   ```bash
   tail -f /path/to/minecraft/logs/latest.log
   ```

4. **Verify configuration:**
   ```bash
   cat server.properties | grep rcon
   ```

5. **Test manual clear:**
   ```bash
   # In Minecraft console
   /fill 0 65 0 10 70 10 air replace obsidian
   ```

6. **Check Lambda logs (if deployed):**
   ```bash
   aws logs tail /aws/lambda/edicraft-agent --follow
   ```

## Still Having Issues?

If you've tried all the above and still experiencing issues:

1. **Collect diagnostic information:**
   ```bash
   # Run diagnostic script and save output
   python3 tests/diagnose-clear-failure.py > clear-diagnosis.txt 2>&1
   
   # Check Minecraft server logs
   tail -100 /path/to/minecraft/logs/latest.log > minecraft-logs.txt
   
   # Check Lambda logs (if deployed)
   aws logs tail /aws/lambda/edicraft-agent --since 5m > lambda-logs.txt
   ```

2. **Review the error details:**
   - What is the exact error message?
   - When did it start failing?
   - Did it ever work before?
   - What changed recently?

3. **Try a minimal test:**
   ```bash
   # Test with smallest possible operation
   python3 << 'EOF'
   from rcon.source import Client
   
   with Client('localhost', 25575, passwd='your-password') as client:
       # Test simple command
       print(client.run('list'))
       
       # Test small fill
       print(client.run('fill 0 65 0 1 66 1 air'))
   EOF
   ```

4. **Check for known issues:**
   - Review `docs/RCON_RELIABILITY_DEPLOYMENT_VALIDATION.md`
   - Check GitHub issues (if applicable)
   - Review recent changes to the codebase

## Contact Support

If you need additional help, provide:
- Output from `diagnose-clear-failure.py`
- Minecraft server logs
- Lambda function logs (if deployed)
- Exact error message from UI
- Steps to reproduce the issue

---

**Quick Fix Checklist:**
- [ ] Minecraft server is running
- [ ] RCON is enabled in server.properties
- [ ] RCON password is correct
- [ ] Firewall allows RCON port
- [ ] RCON user has operator permissions
- [ ] Environment variables are set
- [ ] Lambda function is updated (if deployed)
- [ ] Server is not under heavy load
