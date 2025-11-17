# Cognito User Management Guide

## Overview

This guide covers how to create, manage, and troubleshoot Cognito users for the AWS Energy Data Insights platform.

## Prerequisites

- AWS CLI installed and configured
- Appropriate IAM permissions for Cognito operations
- User Pool ID: `us-east-1_sC6yswGji`

## Creating New Users

### Method 1: AWS Console

1. Navigate to AWS Cognito in the AWS Console
2. Select the user pool: `us-east-1_sC6yswGji`
3. Click "Users" in the left sidebar
4. Click "Create user"
5. Fill in the user details:
   - Username
   - Email address
   - Temporary password (or auto-generate)
6. Click "Create user"

### Method 2: AWS CLI

#### Create User with Temporary Password

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --user-attributes Name=email,Value=<email@example.com> \
  --temporary-password <TempPass123!> \
  --region us-east-1
```

#### Create User with Auto-Generated Password

```bash
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --user-attributes Name=email,Value=<email@example.com> \
  --region us-east-1
```

The temporary password will be sent to the user's email.

#### Create Multiple Test Users

```bash
# Create test user 1
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username testuser1 \
  --user-attributes Name=email,Value=testuser1@example.com \
  --temporary-password TestPass123! \
  --region us-east-1

# Create test user 2
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username testuser2 \
  --user-attributes Name=email,Value=testuser2@example.com \
  --temporary-password TestPass123! \
  --region us-east-1
```

## Managing Existing Users

### List All Users

```bash
aws cognito-idp list-users \
  --user-pool-id us-east-1_sC6yswGji \
  --region us-east-1
```

### Get User Details

```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --region us-east-1
```

### Update User Attributes

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --user-attributes Name=email,Value=<newemail@example.com> \
  --region us-east-1
```

### Reset User Password

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --password <NewPassword123!> \
  --permanent \
  --region us-east-1
```

### Enable/Disable User

```bash
# Disable user
aws cognito-idp admin-disable-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --region us-east-1

# Enable user
aws cognito-idp admin-enable-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --region us-east-1
```

### Delete User

```bash
aws cognito-idp admin-delete-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --region us-east-1
```

## User Status Management

### Confirm User Email

```bash
aws cognito-idp admin-update-user-attributes \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --user-attributes Name=email_verified,Value=true \
  --region us-east-1
```

### Force Password Change

```bash
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --password <TempPassword123!> \
  --region us-east-1
```

Note: Omitting `--permanent` flag forces password change on next sign-in.

## Testing User Authentication

### Test Sign-In with AWS CLI

```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id us-east-1_sC6yswGji \
  --client-id 18m99t0u39vi9614ssd8sf8vmb \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=<username>,PASSWORD=<password> \
  --region us-east-1
```

Successful response includes:
- `IdToken`: JWT token for API authentication
- `AccessToken`: Token for Cognito operations
- `RefreshToken`: Token for refreshing session

### Test API Request with Token

```bash
# Get token from sign-in response
TOKEN="<IdToken_from_above>"

# Test API request
curl -X POST https://hbt1j807qf.execute-api.us-east-1.amazonaws.com/api/chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Session"}'
```

Expected response: `201 Created` with session details

## Troubleshooting

### User Cannot Sign In

**Check user status:**
```bash
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --region us-east-1
```

Look for:
- `UserStatus`: Should be `CONFIRMED` or `FORCE_CHANGE_PASSWORD`
- `Enabled`: Should be `true`

**Common issues:**
- User status is `UNCONFIRMED`: Confirm email address
- User is disabled: Enable user
- Password expired: Reset password

### Invalid Token Errors

**Verify token is valid:**
```bash
# Decode JWT token (requires jq)
echo "<token>" | cut -d. -f2 | base64 -d | jq
```

Check:
- `exp`: Token expiration timestamp (should be in future)
- `iss`: Should match Cognito user pool
- `aud` or `client_id`: Should match client ID

**Common issues:**
- Token expired: Sign in again to get new token
- Wrong user pool: Verify USER_POOL_ID environment variable
- Wrong client ID: Verify USER_POOL_CLIENT_ID environment variable

### User Locked Out

```bash
# Check for account lockout
aws cognito-idp admin-get-user \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --region us-east-1

# Reset password to unlock
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_sC6yswGji \
  --username <username> \
  --password <NewPassword123!> \
  --permanent \
  --region us-east-1
```

## Bulk Operations

### Create Multiple Users from CSV

```bash
#!/bin/bash
# create-users.sh

while IFS=, read -r username email
do
  aws cognito-idp admin-create-user \
    --user-pool-id us-east-1_sC6yswGji \
    --username "$username" \
    --user-attributes Name=email,Value="$email" \
    --region us-east-1
  echo "Created user: $username"
done < users.csv
```

CSV format:
```
username1,user1@example.com
username2,user2@example.com
username3,user3@example.com
```

### Export All Users

```bash
aws cognito-idp list-users \
  --user-pool-id us-east-1_sC6yswGji \
  --region us-east-1 \
  --query 'Users[*].[Username,Attributes[?Name==`email`].Value|[0],UserStatus]' \
  --output table
```

## Security Best Practices

### Password Policy

Current password requirements:
- Minimum length: 8 characters
- Require uppercase letters
- Require lowercase letters
- Require numbers
- Require special characters

### User Permissions

Users have access to:
- Chat interface
- Data catalog
- Petrophysical analysis tools
- Report generation

### Monitoring

Monitor authentication events:
```bash
# Check CloudWatch logs for authentication failures
aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer \
  --follow \
  --region us-east-1
```

## Common User Management Tasks

### Onboard New Team Member

1. Create user account
2. Send temporary password securely
3. User signs in and sets permanent password
4. Verify user can access application
5. Document user access in team records

### Offboard Team Member

1. Disable user account immediately
2. Revoke any API keys or tokens
3. Document offboarding in team records
4. Delete user account after retention period

### Reset Forgotten Password

1. Admin resets password via CLI or console
2. Send temporary password to user securely
3. User signs in and sets new permanent password
4. Verify user can access application

## Support

For user management issues:
1. Check CloudWatch logs for detailed errors
2. Verify IAM permissions for Cognito operations
3. Ensure user pool configuration is correct
4. Contact AWS support for Cognito service issues
