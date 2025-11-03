# EDIcraft Agent Environment Variables Reference

## Overview

This document provides a comprehensive reference for all environment variables required by the EDIcraft agent integration.

## Table of Contents

1. [Required Variables](#required-variables)
2. [Optional Variables](#optional-variables)
3. [Configuration Methods](#configuration-methods)
4. [Validation](#validation)
5. [Security Best Practices](#security-best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Required Variables

All of these variables MUST be configured for the EDIcraft agent to function.

### Bedrock AgentCore Configuration

#### BEDROCK_AGENT_ID

**Description:** The unique identifier for your deployed Bedrock AgentCore agent.

**Format:** Alphanumeric string (10-20 characters)

**Example:** `ABCD1234EFGH`

**How to Obtain:**
1. Deploy the agent: `cd edicraft-agent && make deploy`
2. Copy the Agent ID from the deployment output
3. Or retrieve from AWS: `aws bedrock-agent list-agents --region us-east-1`

**Validation:**
- Must be alphanumeric
- No spaces or special characters
- Should match an existing agent in AWS Bedrock

**Error if Missing:**
```
Configuration Error: Missing required environment variable: BEDROCK_AGENT_ID

The EDIcraft agent requires a deployed Bedrock AgentCore agent.
Please deploy the agent following: edicraft-agent/DEPLOYMENT_GUIDE.md
```

---

#### BEDROCK_AGENT_ALIAS_ID

**Description:** The alias ID for your Bedrock AgentCore agent (typically for versioning).

**Format:** Alphanumeric string

**Example:** `TSTALIASID`

**Default:** `TSTALIASID` (test alias)

**How to Obtain:**
1. Provided during agent deployment
2. Or retrieve from AWS: `aws bedrock-agent list-agent-aliases --agent-id $BEDROCK_AGENT_ID`

**Validation:**
- Must be alphanumeric
- Typically "TSTALIASID" for test/development

**Error if Missing:**
```
Configuration Error: Missing required environment variable: BEDROCK_AGENT_ALIAS_ID

Please set this to the alias ID from your agent deployment.
Typically: TSTALIASID
```

---

#### BEDROCK_REGION

**Description:** AWS region where the Bedrock agent is deployed.

**Format:** AWS region code

**Example:** `us-east-1`

**Default:** `us-east-1`

**Valid Values:**
- `us-east-1` (US East - N. Virginia)
- `us-west-2` (US West - Oregon)
- `eu-west-1` (Europe - Ireland)
- Other regions where Bedrock is available

**Validation:**
- Must be a valid AWS region code
- Bedrock must be available in that region

**Error if Missing:**
```
Configuration Error: Missing required environment variable: BEDROCK_REGION

Please set this to the AWS region where your agent is deployed.
Example: us-east-1
```

---

### Minecraft Server Configuration

#### MINECRAFT_HOST

**Description:** Hostname or IP address of the Minecraft server.

**Format:** Hostname or IP address

**Example:** `edicraft.nigelgardiner.com`

**Default:** `edicraft.nigelgardiner.com`

**Validation:**
- Must be a valid hostname or IP
- Server must be reachable from Lambda
- DNS must resolve correctly

**Testing:**
```bash
ping edicraft.nigelgardiner.com
telnet edicraft.nigelgardiner.com 49000
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: MINECRAFT_HOST

Please set this to your Minecraft server hostname or IP address.
Example: edicraft.nigelgardiner.com
```

---

#### MINECRAFT_PORT

**Description:** Port number for Minecraft game server.

**Format:** Integer (1-65535)

**Example:** `49000`

**Default:** `49000`

**Validation:**
- Must be a valid port number
- Port must be open and accessible
- Server must be listening on this port

**Testing:**
```bash
telnet edicraft.nigelgardiner.com 49000
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: MINECRAFT_PORT

Please set this to your Minecraft server port.
Default: 49000
```

---

#### MINECRAFT_RCON_PORT

**Description:** Port number for Minecraft RCON (Remote Console) protocol.

**Format:** Integer (1-65535)

**Example:** `49001`

**Default:** `49001`

**Note:** This is different from the game port. RCON is used for server administration.

**Validation:**
- Must be a valid port number
- RCON must be enabled on server
- Port must be open and accessible

**Server Configuration:**
```properties
# In server.properties
enable-rcon=true
rcon.port=49001
rcon.password=your_password
```

**Testing:**
```bash
telnet edicraft.nigelgardiner.com 49001
# Or use mcrcon tool
mcrcon -H edicraft.nigelgardiner.com -P 49001 -p <password> "list"
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: MINECRAFT_RCON_PORT

Please set this to your Minecraft RCON port.
Default: 49001
Ensure RCON is enabled in server.properties
```

---

#### MINECRAFT_RCON_PASSWORD

**Description:** Password for authenticating with Minecraft RCON.

**Format:** String (any characters)

**Example:** `MySecurePassword123!`

**Security:** This is a sensitive credential. Never commit to Git.

**How to Obtain:**
1. Check server.properties on Minecraft server
2. Or set a new password in server.properties and restart server

**Validation:**
- Must match the password in server.properties
- Case-sensitive
- Special characters allowed

**Testing:**
```bash
mcrcon -H edicraft.nigelgardiner.com -P 49001 -p <password> "list"
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: MINECRAFT_RCON_PASSWORD

Please set this to your Minecraft RCON password.
Find it in server.properties: rcon.password=<password>
See: edicraft-agent/FIND_CREDENTIALS.md
```

---

### OSDU Platform Configuration

#### EDI_USERNAME

**Description:** Username for OSDU platform authentication.

**Format:** Email or username string

**Example:** `john.doe@company.com` or `jdoe`

**Security:** This is a sensitive credential. Never commit to Git.

**How to Obtain:**
1. Provided by OSDU platform administrator
2. Or your company's OSDU account credentials
3. Check AWS Systems Manager or Secrets Manager

**Validation:**
- Must be a valid OSDU user
- User must have necessary permissions
- Account must be active

**Testing:**
```bash
curl -X POST https://edi.aws.amazon.com/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=$EDI_USERNAME" \
  -d "password=$EDI_PASSWORD" \
  -d "client_id=$EDI_CLIENT_ID" \
  -d "client_secret=$EDI_CLIENT_SECRET"
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: EDI_USERNAME

Please set this to your OSDU platform username.
Contact your OSDU administrator if you don't have credentials.
See: edicraft-agent/FIND_CREDENTIALS.md
```

---

#### EDI_PASSWORD

**Description:** Password for OSDU platform authentication.

**Format:** String (any characters)

**Example:** `MyP@ssw0rd123!`

**Security:** This is a highly sensitive credential. Never commit to Git. Use AWS Secrets Manager in production.

**How to Obtain:**
1. Provided by OSDU platform administrator
2. Or your company's OSDU account password
3. Check AWS Secrets Manager

**Validation:**
- Must match current OSDU password
- Case-sensitive
- May have complexity requirements

**Security Best Practices:**
- Rotate regularly (every 90 days)
- Use strong password (12+ characters, mixed case, numbers, symbols)
- Store in AWS Secrets Manager for production
- Never log or display

**Error if Missing:**
```
Configuration Error: Missing required environment variable: EDI_PASSWORD

Please set this to your OSDU platform password.
SECURITY: Never commit this to Git. Use AWS Secrets Manager in production.
See: edicraft-agent/FIND_CREDENTIALS.md
```

---

#### EDI_CLIENT_ID

**Description:** OAuth client ID for OSDU platform API access.

**Format:** Long alphanumeric string (UUID or similar)

**Example:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

**Length:** Typically 32-64 characters

**How to Obtain:**
1. Create OAuth application in OSDU platform
2. Provided by OSDU administrator
3. Check AWS Systems Manager or Secrets Manager

**Validation:**
- Must be a valid OAuth client ID
- Client must be registered in OSDU
- Must have necessary scopes/permissions

**Testing:**
```bash
# Test authentication with client credentials
curl -X POST https://edi.aws.amazon.com/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=$EDI_USERNAME" \
  -d "password=$EDI_PASSWORD" \
  -d "client_id=$EDI_CLIENT_ID" \
  -d "client_secret=$EDI_CLIENT_SECRET"
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: EDI_CLIENT_ID

Please set this to your OSDU OAuth client ID.
Create an OAuth application in the OSDU platform or contact your administrator.
See: edicraft-agent/FIND_CREDENTIALS.md
```

---

#### EDI_CLIENT_SECRET

**Description:** OAuth client secret for OSDU platform API access.

**Format:** Long random string

**Example:** `AbCdEf123456789aBcDeF123456789aBcDeF123456789`

**Length:** Typically 32-128 characters

**Security:** This is a highly sensitive credential. Treat like a password.

**How to Obtain:**
1. Provided when creating OAuth application
2. Provided by OSDU administrator
3. Check AWS Secrets Manager

**Validation:**
- Must match the client secret for the client ID
- Case-sensitive
- Cannot be recovered if lost (must regenerate)

**Security Best Practices:**
- Rotate regularly
- Store in AWS Secrets Manager for production
- Never log or display
- Regenerate if compromised

**Error if Missing:**
```
Configuration Error: Missing required environment variable: EDI_CLIENT_SECRET

Please set this to your OSDU OAuth client secret.
SECURITY: Never commit this to Git. Use AWS Secrets Manager in production.
See: edicraft-agent/FIND_CREDENTIALS.md
```

---

#### EDI_PARTITION

**Description:** OSDU data partition name (logical data separation).

**Format:** Short identifier string

**Example:** `opendes`, `osdu`, `production`, `dev`

**Common Values:**
- `opendes` - Open Data Ecosystem Standard
- `osdu` - Generic OSDU partition
- `common` - Common data partition
- Company-specific names

**How to Obtain:**
1. Provided by OSDU administrator
2. Check OSDU platform documentation
3. Listed in platform configuration

**Validation:**
- Must be a valid partition in your OSDU instance
- User must have access to this partition
- Case-sensitive

**Error if Missing:**
```
Configuration Error: Missing required environment variable: EDI_PARTITION

Please set this to your OSDU data partition name.
Common values: opendes, osdu, common
Contact your OSDU administrator for the correct partition name.
```

---

#### EDI_PLATFORM_URL

**Description:** Base URL for the OSDU platform API.

**Format:** HTTPS URL

**Example:** `https://edi.aws.amazon.com` or `https://osdu.company.com`

**Validation:**
- Must start with `https://`
- Must be accessible from Lambda
- DNS must resolve correctly
- SSL certificate must be valid

**Common URLs:**
- AWS EDI: `https://edi.aws.amazon.com`
- Azure OSDU: `https://<instance>.energy.azure.com`
- Self-hosted: `https://osdu.yourcompany.com`

**Testing:**
```bash
curl -I https://edi.aws.amazon.com
```

**Error if Missing:**
```
Configuration Error: Missing required environment variable: EDI_PLATFORM_URL

Please set this to your OSDU platform base URL.
Example: https://edi.aws.amazon.com
Must start with https://
```

---

## Optional Variables

These variables have defaults but can be customized.

### BEDROCK_MODEL_ID

**Description:** The Bedrock model to use for the agent.

**Format:** Model identifier string

**Example:** `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

**Default:** `us.anthropic.claude-3-5-sonnet-20241022-v2:0`

**Note:** This is typically set during agent deployment, not in Lambda.

---

## Configuration Methods

### Method 1: .env.local File (Recommended for Development)

1. **Copy the example file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit .env.local:**
   ```bash
   # Bedrock AgentCore
   BEDROCK_AGENT_ID=ABCD1234EFGH
   BEDROCK_AGENT_ALIAS_ID=TSTALIASID
   BEDROCK_REGION=us-east-1

   # Minecraft Server
   MINECRAFT_HOST=edicraft.nigelgardiner.com
   MINECRAFT_PORT=49000
   MINECRAFT_RCON_PORT=49001
   MINECRAFT_RCON_PASSWORD=your_password

   # OSDU Platform
   EDI_USERNAME=your_username
   EDI_PASSWORD=your_password
   EDI_CLIENT_ID=your_client_id
   EDI_CLIENT_SECRET=your_client_secret
   EDI_PARTITION=opendes
   EDI_PLATFORM_URL=https://edi.aws.amazon.com
   ```

3. **Restart Amplify sandbox:**
   ```bash
   npx ampx sandbox
   ```

**Advantages:**
- Easy to edit
- Automatically loaded by Amplify
- Gitignored by default
- Good for development

**Disadvantages:**
- Not suitable for production
- Credentials in plain text
- Must restart sandbox to apply changes

---

### Method 2: Interactive Setup Script

1. **Run the setup script:**
   ```bash
   ./tests/manual/setup-edicraft-credentials.sh
   ```

2. **Follow the prompts:**
   - Enter each credential when prompted
   - Script validates format
   - Automatically updates .env.local

3. **Restart sandbox:**
   ```bash
   npx ampx sandbox
   ```

**Advantages:**
- Guided process
- Validation included
- Less error-prone
- Good for first-time setup

---

### Method 3: AWS Lambda Console (Manual)

1. **Find the Lambda function:**
   - Go to AWS Lambda console
   - Search for "edicraft"
   - Click on the function

2. **Update environment variables:**
   - Click Configuration tab
   - Click Environment variables
   - Click Edit
   - Add/update each variable
   - Click Save

3. **Test the function:**
   - Click Test tab
   - Create test event
   - Run test

**Advantages:**
- Direct control
- No sandbox restart needed
- Good for quick fixes

**Disadvantages:**
- Manual process
- Easy to make mistakes
- Not version controlled
- Overwritten on next deployment

---

### Method 4: AWS Secrets Manager (Recommended for Production)

1. **Create secrets:**
   ```bash
   aws secretsmanager create-secret \
     --name edicraft/minecraft-rcon-password \
     --secret-string "your_password"

   aws secretsmanager create-secret \
     --name edicraft/osdu-credentials \
     --secret-string '{
       "username": "your_username",
       "password": "your_password",
       "client_id": "your_client_id",
       "client_secret": "your_client_secret"
     }'
   ```

2. **Update Lambda to read from Secrets Manager:**
   ```typescript
   // In handler.ts
   import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

   const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

   async function getSecret(secretName: string) {
     const command = new GetSecretValueCommand({ SecretId: secretName });
     const response = await secretsClient.send(command);
     return JSON.parse(response.SecretString || '{}');
   }
   ```

3. **Grant Lambda permissions:**
   ```typescript
   // In backend.ts
   backend.edicraftAgentFunction.resources.lambda.addToRolePolicy(
     new iam.PolicyStatement({
       actions: ['secretsmanager:GetSecretValue'],
       resources: ['arn:aws:secretsmanager:*:*:secret:edicraft/*'],
     })
   );
   ```

**Advantages:**
- Secure credential storage
- Automatic rotation support
- Audit logging
- Best practice for production

**Disadvantages:**
- More complex setup
- Additional AWS costs
- Requires code changes

---

## Validation

### Automated Validation

Run the automated test to validate all environment variables:

```bash
node tests/manual/test-edicraft-deployment.js
```

**Expected Output:**
```
✅ Test 2: Environment Variables - PASSED
   - BEDROCK_AGENT_ID: CONFIGURED
   - BEDROCK_AGENT_ALIAS_ID: CONFIGURED
   - MINECRAFT_HOST: CONFIGURED
   - MINECRAFT_RCON_PASSWORD: CONFIGURED
   - EDI_USERNAME: CONFIGURED
   - EDI_PASSWORD: CONFIGURED
   - EDI_CLIENT_ID: CONFIGURED
   - EDI_CLIENT_SECRET: CONFIGURED
   - EDI_PARTITION: CONFIGURED
   - EDI_PLATFORM_URL: CONFIGURED
```

### Manual Validation

**Check Lambda environment variables:**
```bash
FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'edicraft')].FunctionName" --output text)
aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --query "Environment.Variables"
```

**Test Minecraft connection:**
```bash
telnet edicraft.nigelgardiner.com 49000
telnet edicraft.nigelgardiner.com 49001
```

**Test OSDU authentication:**
```bash
curl -X POST https://edi.aws.amazon.com/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "username=$EDI_USERNAME" \
  -d "password=$EDI_PASSWORD" \
  -d "client_id=$EDI_CLIENT_ID" \
  -d "client_secret=$EDI_CLIENT_SECRET"
```

---

## Security Best Practices

### Development Environment

1. **Use .env.local:**
   - Gitignored by default
   - Easy to manage
   - Separate from code

2. **Never commit credentials:**
   - Check .gitignore includes .env.local
   - Use git hooks to prevent commits
   - Review commits before pushing

3. **Rotate regularly:**
   - Change passwords every 90 days
   - Regenerate OAuth credentials periodically
   - Update RCON password regularly

### Production Environment

1. **Use AWS Secrets Manager:**
   - Encrypted at rest
   - Automatic rotation
   - Audit logging
   - Access control

2. **Use IAM roles:**
   - No hardcoded credentials
   - Temporary credentials
   - Least privilege access

3. **Enable CloudTrail:**
   - Log all API calls
   - Monitor for unauthorized access
   - Audit credential usage

4. **Set up alerts:**
   - Failed authentication attempts
   - Unusual access patterns
   - Configuration changes

### General Security

1. **Principle of least privilege:**
   - Only grant necessary permissions
   - Use separate credentials for different environments
   - Limit OSDU user permissions

2. **Network security:**
   - Use VPC for Lambda if possible
   - Restrict Minecraft server access
   - Use security groups

3. **Monitoring:**
   - Monitor CloudWatch logs
   - Set up alarms for errors
   - Track credential usage

4. **Incident response:**
   - Have a plan for credential compromise
   - Know how to rotate credentials quickly
   - Document recovery procedures

---

## Troubleshooting

### Issue: Variables Not Set

**Symptom:** "Missing environment variable" error

**Solution:**
1. Check .env.local exists and has all variables
2. Restart sandbox: `npx ampx sandbox`
3. Verify in Lambda console
4. Run validation test

**See:** [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md#environment-variables-not-set)

### Issue: Invalid Credentials

**Symptom:** Authentication failures

**Solution:**
1. Verify credentials are correct
2. Test manually (see validation section)
3. Check for typos or extra spaces
4. Regenerate if necessary

**See:** [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md#authentication-issues)

### Issue: Connection Failures

**Symptom:** Cannot connect to Minecraft or OSDU

**Solution:**
1. Verify hostnames/URLs are correct
2. Test network connectivity
3. Check firewall rules
4. Verify services are running

**See:** [Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md#connection-issues)

---

## Quick Reference

### All Required Variables

```bash
# Bedrock AgentCore
BEDROCK_AGENT_ID=<your-agent-id>
BEDROCK_AGENT_ALIAS_ID=TSTALIASID
BEDROCK_REGION=us-east-1

# Minecraft Server
MINECRAFT_HOST=edicraft.nigelgardiner.com
MINECRAFT_PORT=49000
MINECRAFT_RCON_PORT=49001
MINECRAFT_RCON_PASSWORD=<your-rcon-password>

# OSDU Platform
EDI_USERNAME=<your-username>
EDI_PASSWORD=<your-password>
EDI_CLIENT_ID=<your-client-id>
EDI_CLIENT_SECRET=<your-client-secret>
EDI_PARTITION=opendes
EDI_PLATFORM_URL=https://edi.aws.amazon.com
```

### Validation Commands

```bash
# Run automated validation
node tests/manual/test-edicraft-deployment.js

# Check Lambda variables
aws lambda get-function-configuration --function-name <function-name> --query "Environment.Variables"

# Test Minecraft
telnet edicraft.nigelgardiner.com 49000

# Test OSDU
curl -X POST https://edi.aws.amazon.com/auth/token -d "grant_type=password" -d "username=$EDI_USERNAME" -d "password=$EDI_PASSWORD" -d "client_id=$EDI_CLIENT_ID" -d "client_secret=$EDI_CLIENT_SECRET"
```

---

## Related Documentation

- **[Deployment Guide](../edicraft-agent/DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Credential Guide](../edicraft-agent/FIND_CREDENTIALS.md)** - How to find credentials
- **[Troubleshooting Guide](EDICRAFT_TROUBLESHOOTING_GUIDE.md)** - Solutions to common issues
- **[Validation Guide](../tests/manual/EDICRAFT_VALIDATION_GUIDE.md)** - Testing procedures

---

## Conclusion

Proper configuration of environment variables is critical for the EDIcraft agent to function. Follow this guide to ensure all variables are set correctly and securely.

**Remember:**
- ✅ Use .env.local for development
- ✅ Use AWS Secrets Manager for production
- ✅ Never commit credentials to Git
- ✅ Rotate credentials regularly
- ✅ Validate configuration before deployment
- ✅ Monitor for security issues
