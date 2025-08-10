# Legal Tags Page Troubleshooting Guide

## Issue: Legal Tags Page Not Opening

### Quick Diagnostic Steps

1. **Test Basic Routing**
   ```
   Visit: http://localhost:3000/legal-tags-test
   ```
   This should show a simple test page confirming routing works.

2. **Run Component Diagnostics**
   ```
   Visit: http://localhost:3000/legal-tags-debug
   ```
   This will show detailed information about component availability and import issues.

3. **Check Development Server**
   ```bash
   npm run dev
   ```
   Ensure the server is running on port 3000.

### Common Issues and Solutions

#### 1. Authentication Redirect
**Symptom**: Page redirects to `/auth` immediately
**Cause**: `withAuth` HOC is redirecting unauthenticated users
**Solution**: 
- Ensure you're logged in first
- Check authentication status in browser console
- Verify OIDC tokens are present

#### 2. Import/Module Errors
**Symptom**: White screen or console errors about missing modules
**Cause**: Missing dependencies or incorrect import paths
**Solution**:
```bash
# Check if all dependencies are installed
npm install

# Verify all required files exist
node diagnose-legal-tags.js
```

#### 3. TypeScript Compilation Errors
**Symptom**: Build fails or runtime type errors
**Cause**: Type mismatches or missing type definitions
**Solution**:
```bash
# Check TypeScript compilation
npx tsc --noEmit

# Fix any type errors reported
```

#### 4. Material-UI Theme Issues
**Symptom**: Styling errors or component rendering issues
**Cause**: Theme provider not configured or missing
**Solution**: Verify `Providers.tsx` is properly wrapping the app

### Detailed Troubleshooting

#### Step 1: Check Browser Console
1. Open browser developer tools (F12)
2. Go to Console tab
3. Look for any JavaScript errors
4. Note any failed network requests in Network tab

#### Step 2: Verify Authentication
1. Check if user is authenticated:
   ```javascript
   // In browser console
   console.log(window.__OIDC_TOKENS__);
   ```
2. If not authenticated, go to `/auth` first

#### Step 3: Test Component Imports
Visit `/legal-tags-debug` to see detailed component availability.

#### Step 4: Check Service Configuration
1. Verify `osduApiService.js` is properly configured
2. Check if backend services are accessible
3. Verify environment variables are set

### Manual Testing Steps

1. **Start Development Server**
   ```bash
   cd frontend-uxpin
   npm run dev
   ```

2. **Test Authentication**
   - Visit `http://localhost:3000/auth`
   - Complete login process
   - Verify authentication tokens are set

3. **Test Legal Tags Page**
   - Visit `http://localhost:3000/legal-tags`
   - Should load without redirects
   - Check for any console errors

4. **Test Component Functionality**
   - Try creating a legal tag
   - Test search functionality
   - Verify error handling

### Environment-Specific Issues

#### Development Environment
- Ensure all environment variables are set
- Check `.env.local` file exists and is properly configured
- Verify backend services are running

#### Production Environment
- Check build process completes successfully
- Verify all static assets are available
- Ensure proper HTTPS configuration

### Debug Tools Available

1. **Legal Tags Test Page**: `/legal-tags-test`
   - Basic routing and component test
   - No authentication required

2. **Legal Tags Debug Page**: `/legal-tags-debug`
   - Detailed component diagnostics
   - Import error detection
   - Service availability check

3. **Diagnostic Script**: `node diagnose-legal-tags.js`
   - File system checks
   - Dependency verification
   - Configuration validation

### Error Patterns and Solutions

#### "Cannot resolve module" errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### "withAuth is not a function" errors
- Check `WithAuth.tsx` component exists
- Verify import path is correct
- Ensure authentication context is available

#### "useLegalTagOperations is not defined" errors
- Check hook file exists and exports correctly
- Verify all dependencies are installed
- Check for circular import issues

#### Material-UI component errors
```bash
# Ensure Material-UI is properly installed
npm install @mui/material @mui/icons-material
```

### Next Steps if Issue Persists

1. **Check Network Tab**
   - Look for failed API requests
   - Verify backend services are accessible
   - Check for CORS issues

2. **Verify Backend Configuration**
   - Ensure legal tagging service is deployed
   - Check GraphQL endpoint is accessible
   - Verify authentication tokens are valid

3. **Test with Minimal Component**
   - Create a simple version without complex dependencies
   - Gradually add functionality to isolate the issue

4. **Check Recent Changes**
   - Review recent commits for breaking changes
   - Test with a known working version
   - Check for dependency version conflicts

### Contact Information

If the issue persists after following this guide:
1. Provide browser console output
2. Include network tab information
3. Share results from diagnostic tools
4. Describe exact steps to reproduce the issue

### Quick Fix Commands

```bash
# Full reset and restart
rm -rf node_modules package-lock.json
npm install
npm run dev

# Check diagnostics
node diagnose-legal-tags.js

# Test basic functionality
curl http://localhost:3000/legal-tags-test
```