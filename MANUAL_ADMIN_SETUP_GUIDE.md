# Manual Admin Setup Guide

## Current Situation
The programmatic bootstrap approaches keep failing due to GraphQL schema mismatches. Let's solve this with a reliable manual approach.

## 🎯 **Manual Solution: Create Entitlements via UI**

Since you can create entitlements but not groups, let's create direct user entitlements manually through the entitlements UI.

### Step 1: Go to Entitlements Page
1. Navigate to the **Entitlements** page in your OSDU frontend
2. Look for a **"Create Entitlement"** or **"Add Entitlement"** button

### Step 2: Create Schema Admin Entitlement
Create an entitlement with these **exact** details:

**Entitlement Name:** `schema-admin-access`
**Group Email:** `cmgabri@amazon.com`
**Actions:** `READ`, `WRITE`, `DELETE`, `ADMIN`
**Conditions:**
- Attribute: `service`
- Operator: `EQUALS` 
- Value: `schema`

### Step 3: Create Storage Admin Entitlement
**Entitlement Name:** `storage-admin-access`
**Group Email:** `cmgabri@amazon.com`
**Actions:** `READ`, `WRITE`, `DELETE`, `ADMIN`
**Conditions:**
- Attribute: `service`
- Operator: `EQUALS`
- Value: `storage`

### Step 4: Create Search Admin Entitlement
**Entitlement Name:** `search-admin-access`
**Group Email:** `cmgabri@amazon.com`
**Actions:** `READ`, `WRITE`, `DELETE`, `ADMIN`
**Conditions:**
- Attribute: `service`
- Operator: `EQUALS`
- Value: `search`

### Step 5: Create Legal Admin Entitlement
**Entitlement Name:** `legal-admin-access`
**Group Email:** `cmgabri@amazon.com`
**Actions:** `READ`, `WRITE`, `DELETE`, `ADMIN`
**Conditions:**
- Attribute: `service`
- Operator: `EQUALS`
- Value: `legal`

### Step 6: Create Entitlements Admin Entitlement
**Entitlement Name:** `entitlements-admin-access`
**Group Email:** `cmgabri@amazon.com`
**Actions:** `READ`, `WRITE`, `DELETE`, `ADMIN`
**Conditions:**
- Attribute: `service`
- Operator: `EQUALS`
- Value: `entitlements`

## 🔄 **After Creating Entitlements**

### Step 7: Refresh Authentication
1. **Log out** of the OSDU frontend completely
2. **Log back in** to refresh your JWT tokens
3. Your tokens will now include the new entitlements

### Step 8: Test Services
1. Go to the **API Test** page
2. Click **"Test All Services"**
3. All services should now work without permission errors

## 🔍 **Alternative Approach: Backend Configuration**

If the UI approach doesn't work, you might need to configure admin permissions at the infrastructure level:

### Option A: Environment Variables
Check if your backend has environment variables for admin users:
- `ADMIN_USERS`
- `BOOTSTRAP_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PERMISSIONS`

### Option B: Database Direct Access
If you have direct database access, you can insert entitlements directly:
```sql
INSERT INTO entitlements (group_email, actions, conditions, data_partition)
VALUES ('cmgabri@amazon.com', '["READ","WRITE","DELETE","ADMIN"]', '[{"attribute":"service","operator":"EQUALS","value":"schema"}]', 'osdu');
```

### Option C: CDK/CloudFormation
Check your infrastructure code for pre-configured admin groups or users that might need to be updated.

## 🚨 **Troubleshooting**

### If Manual Entitlement Creation Fails:
1. **Check Field Names**: The UI might use different field names than expected
2. **Try Different Formats**: Some UIs expect JSON format for conditions
3. **Use Simpler Conditions**: Try without conditions first, then add them
4. **Check Permissions**: You might need basic entitlements admin access first

### If Services Still Show Permission Errors:
1. **Verify Entitlements**: Check that entitlements were actually created
2. **Check Token Refresh**: Make sure you logged out and back in
3. **Inspect JWT**: Use jwt.io to decode your token and verify claims
4. **Check Backend Logs**: Look for specific permission validation errors

### If Entitlements UI is Not Available:
1. **Check URL**: Try `/entitlements`, `/admin`, `/permissions`
2. **Check Navigation**: Look for admin or settings menu items
3. **Direct API**: Use the GraphQL playground to create entitlements directly
4. **Backend Access**: Configure permissions at the infrastructure level

## 🎉 **Success Indicators**

You'll know it worked when:
- ✅ Schema service lists schemas without "Not Authorized" errors
- ✅ Storage service allows full CRUD operations
- ✅ Search service returns results (after fixing field names)
- ✅ Legal service continues working
- ✅ Entitlements service allows creating new entitlements

## 📞 **Need Help?**

If you're still stuck:
1. **Share Screenshots**: Show me the entitlements UI if available
2. **Check Backend Logs**: Look for specific error messages
3. **Try One Service**: Start with just schema service entitlement
4. **Infrastructure Review**: Check your CDK/CloudFormation for admin config

The manual approach should work since you can already create entitlements - we just need to create the right ones with the right permissions! 🎯