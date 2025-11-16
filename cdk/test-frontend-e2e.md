# Frontend End-to-End Testing Guide

## Deployment Information

**CloudFront URL:** https://d36sq31aqkfe46.cloudfront.net
**API Gateway URL:** https://hbt1j807qf.execute-api.us-east-1.amazonaws.com
**CloudFront Distribution ID:** E3O1QDG49S3NGP
**Frontend S3 Bucket:** energyinsights-development-frontend-development

**Deployment Status:**
- ✅ Frontend built successfully
- ✅ Files uploaded to S3
- ✅ CloudFront cache invalidated
- ⏳ Cache invalidation in progress (takes 1-2 minutes)

---

## Testing Checklist

### 1. Basic Application Loading

**Test:** Open CloudFront URL in browser
- [ ] Navigate to: https://d36sq31aqkfe46.cloudfront.net
- [ ] Verify page loads without errors
- [ ] Check browser console for errors (F12 → Console)
- [ ] Verify no 404 errors in Network tab
- [ ] Confirm application renders correctly

**Expected Result:**
- Application loads successfully
- No console errors
- Homepage displays with navigation

---

### 2. Authentication Flow

**Test:** Login functionality
- [ ] Click "Sign In" or navigate to login page
- [ ] Enter test credentials (if available)
- [ ] Verify successful authentication
- [ ] Check that auth token is stored
- [ ] Verify API calls include Authorization header

**Expected Result:**
- User can authenticate successfully
- Auth token is present in requests
- Protected routes are accessible

**Note:** Currently using mock auth in development. Check that:
- Mock token is being sent: `Bearer mock-dev-token-test-user`
- Backend accepts mock tokens (ENABLE_MOCK_AUTH=true)

---

### 3. Chat Functionality

**Test:** Send chat message and view response

**Steps:**
1. [ ] Navigate to Chat page
2. [ ] Create new chat session or select existing one
3. [ ] Type a simple message: "Hello, can you help me?"
4. [ ] Click Send
5. [ ] Verify loading indicator appears
6. [ ] Wait for AI response
7. [ ] Verify response displays correctly
8. [ ] Check that message is saved to session

**Expected Result:**
- Message sends successfully
- Loading indicator shows and hides properly
- AI response appears in chat
- No console errors
- Message persists in session

**API Endpoints Used:**
- POST /api/chat/sessions (create session)
- POST /api/chat/message (send message)
- GET /api/chat/sessions/{id}/messages (retrieve messages)

**Console Verification:**
```javascript
// Check API calls in Network tab
// Should see:
// POST https://d36sq31aqkfe46.cloudfront.net/api/chat/message
// Status: 200
// Response: { message: "...", artifacts: [...] }
```

---

### 4. Renewable Energy Features

#### 4.1 Terrain Analysis

**Test:** Request terrain analysis

**Steps:**
1. [ ] Navigate to Renewable Energy section
2. [ ] Enter coordinates: Latitude 35.0, Longitude -101.0
3. [ ] Click "Analyze Terrain"
4. [ ] Verify loading state shows
5. [ ] Wait for analysis to complete
6. [ ] Verify terrain map artifact renders
7. [ ] Check that map shows features (should be 151 features)
8. [ ] Verify no "Visualization Unavailable" message

**Expected Result:**
- Terrain analysis completes successfully
- Map artifact displays with correct feature count
- No stuck loading states
- No console errors

**API Endpoint:**
- POST /api/renewable/analyze
- Body: `{ type: "terrain_analysis", latitude: 35.0, longitude: -101.0 }`

**Artifact Type:** `wind_farm_terrain_analysis`

#### 4.2 Layout Optimization

**Test:** Request layout optimization

**Steps:**
1. [ ] Navigate to Renewable Energy section
2. [ ] Enter project parameters (coordinates, turbine specs)
3. [ ] Click "Optimize Layout"
4. [ ] Verify loading state shows
5. [ ] Wait for optimization to complete
6. [ ] Verify layout map artifact renders
7. [ ] Check that turbine positions are displayed
8. [ ] Verify optimization metrics are shown

**Expected Result:**
- Layout optimization completes successfully
- Map shows turbine positions
- Metrics display correctly
- No console errors

**API Endpoint:**
- POST /api/renewable/analyze
- Body: `{ type: "layout_optimization", ... }`

**Artifact Type:** `wind_farm_layout`

#### 4.3 Wake Simulation

**Test:** Request wake simulation

**Steps:**
1. [ ] Navigate to Renewable Energy section
2. [ ] Enter simulation parameters
3. [ ] Click "Run Simulation"
4. [ ] Verify loading state shows
5. [ ] Wait for simulation to complete
6. [ ] Verify wake visualization renders
7. [ ] Check that wind rose displays
8. [ ] Verify simulation results are shown

**Expected Result:**
- Wake simulation completes successfully
- Visualizations render correctly
- Results display properly
- No console errors

**API Endpoint:**
- POST /api/renewable/analyze
- Body: `{ type: "wake_simulation", ... }`

**Artifact Types:** `wake_simulation`, `wind_rose`

---

### 5. File Upload/Download

**Test:** Upload and download files via UI

**Steps:**
1. [ ] Navigate to Files or Storage section
2. [ ] Click "Upload File"
3. [ ] Select a test file (e.g., small text file)
4. [ ] Verify upload progress shows
5. [ ] Verify file appears in file list
6. [ ] Click on file to download
7. [ ] Verify download completes
8. [ ] Verify downloaded file matches original

**Expected Result:**
- File uploads successfully
- File appears in list
- File can be downloaded
- Content matches original
- No console errors

**API Endpoints:**
- POST /api/s3-proxy (upload)
- GET /api/s3-proxy?key=... (download)

---

### 6. Session Management

**Test:** Create, list, and manage chat sessions

**Steps:**
1. [ ] Navigate to Chat Sessions page
2. [ ] Click "New Session"
3. [ ] Verify new session is created
4. [ ] Send a message in the session
5. [ ] Navigate back to sessions list
6. [ ] Verify session appears in list
7. [ ] Click on session to open it
8. [ ] Verify messages are loaded
9. [ ] Test session deletion (if available)

**Expected Result:**
- Sessions can be created
- Sessions appear in list
- Messages persist across navigation
- Session operations work correctly
- No console errors

**API Endpoints:**
- POST /api/chat/sessions (create)
- GET /api/chat/sessions (list)
- GET /api/chat/sessions/{id} (get)
- GET /api/chat/sessions/{id}/messages (messages)
- DELETE /api/chat/sessions/{id} (delete)

---

### 7. Console Error Check

**Test:** Verify no console errors throughout testing

**Steps:**
1. [ ] Open browser DevTools (F12)
2. [ ] Go to Console tab
3. [ ] Clear console
4. [ ] Perform all tests above
5. [ ] Review console for errors

**Expected Result:**
- No red error messages
- No 404 errors
- No authentication errors
- Only informational logs (if any)

**Common Issues to Check:**
- ❌ `Failed to fetch` - API connectivity issue
- ❌ `401 Unauthorized` - Authentication issue
- ❌ `404 Not Found` - Missing API endpoint
- ❌ `CORS error` - CORS configuration issue
- ❌ `Uncaught TypeError` - JavaScript error

---

### 8. Network Tab Verification

**Test:** Verify API calls are working correctly

**Steps:**
1. [ ] Open browser DevTools (F12)
2. [ ] Go to Network tab
3. [ ] Filter by "Fetch/XHR"
4. [ ] Perform a chat message send
5. [ ] Review network requests

**Expected Requests:**
```
POST /api/chat/message
  Status: 200
  Request Headers:
    Authorization: Bearer mock-dev-token-test-user
    Content-Type: application/json
  Response:
    { message: "...", artifacts: [...] }
```

**Verify:**
- [ ] All API calls go to CloudFront domain (not direct API Gateway)
- [ ] Authorization header is present
- [ ] Responses are successful (200 status)
- [ ] Response bodies contain expected data
- [ ] No CORS errors

---

### 9. Artifact Rendering

**Test:** Verify all artifact types render correctly

**Artifact Types to Test:**
- [ ] `wind_farm_terrain_analysis` - Terrain map
- [ ] `wind_farm_layout` - Layout map
- [ ] `wake_simulation` - Wake visualization
- [ ] `wind_rose` - Wind rose chart
- [ ] `project_dashboard` - Project dashboard
- [ ] `log_plot` - Log plot (if applicable)
- [ ] `crossplot` - Crossplot (if applicable)

**For Each Artifact:**
1. [ ] Verify artifact component loads
2. [ ] Verify data displays correctly
3. [ ] Verify no "Visualization Unavailable" message
4. [ ] Verify interactive features work (zoom, pan, etc.)
5. [ ] Verify no console errors

---

### 10. Responsive Design

**Test:** Verify application works on different screen sizes

**Steps:**
1. [ ] Test on desktop (1920x1080)
2. [ ] Test on tablet (768x1024)
3. [ ] Test on mobile (375x667)
4. [ ] Use browser DevTools responsive mode

**Verify:**
- [ ] Layout adapts to screen size
- [ ] Navigation is accessible
- [ ] Content is readable
- [ ] Interactive elements are usable
- [ ] No horizontal scrolling (unless intended)

---

## Troubleshooting

### Issue: Page doesn't load

**Possible Causes:**
1. CloudFront cache not invalidated yet (wait 1-2 minutes)
2. S3 bucket permissions issue
3. CloudFront distribution not deployed

**Solution:**
```bash
# Check CloudFront invalidation status
aws cloudfront get-invalidation \
  --distribution-id E3O1QDG49S3NGP \
  --id ICGVKPZT9K6FC76V8TCK2VB25Z

# If needed, create new invalidation
aws cloudfront create-invalidation \
  --distribution-id E3O1QDG49S3NGP \
  --paths "/*"
```

### Issue: API calls fail with 401

**Possible Causes:**
1. Mock auth not enabled in backend
2. Authorization header not being sent
3. Token format incorrect

**Solution:**
1. Check backend Lambda environment variable: `ENABLE_MOCK_AUTH=true`
2. Verify token in Network tab: `Bearer mock-dev-token-test-user`
3. Check authorizer Lambda logs in CloudWatch

### Issue: Artifacts don't render

**Possible Causes:**
1. Artifact data not returned from API
2. Artifact component not registered
3. S3 permissions issue for artifact storage

**Solution:**
1. Check API response in Network tab
2. Verify artifact type matches component mapping
3. Check S3 bucket permissions for artifact storage

### Issue: Console errors

**Common Errors:**
1. `Failed to fetch` - Check API Gateway URL in .env.local
2. `CORS error` - Check API Gateway CORS configuration
3. `Module not found` - Check build output for missing dependencies
4. `Uncaught TypeError` - Check for null/undefined values

---

## Success Criteria

Task 12 is complete when:

- ✅ Frontend loads successfully via CloudFront
- ✅ Chat functionality works (send message, view response)
- ✅ Renewable energy features work (terrain, layout, simulation)
- ✅ File upload/download works via UI
- ✅ No console errors
- ✅ All artifacts render correctly
- ✅ Session management works
- ✅ Authentication works (mock or real)
- ✅ API calls succeed via CloudFront
- ✅ No stuck loading states

---

## Quick Test Commands

### Check CloudFront Status
```bash
aws cloudfront get-distribution --id E3O1QDG49S3NGP \
  --query "Distribution.Status" --output text
```

### Check S3 Bucket Contents
```bash
aws s3 ls s3://energyinsights-development-frontend-development/ --recursive
```

### Test API Endpoint Directly
```bash
curl -X GET https://d36sq31aqkfe46.cloudfront.net/api/test/auth \
  -H "Authorization: Bearer mock-dev-token-test-user"
```

### Check CloudWatch Logs
```bash
# Chat Lambda logs
aws logs tail /aws/lambda/EnergyInsights-development-chat --follow

# Authorizer Lambda logs
aws logs tail /aws/lambda/EnergyInsights-development-custom-authorizer --follow
```

---

## Next Steps After Testing

Once all tests pass:
1. Document any issues found
2. Fix any critical issues
3. Proceed to Phase 6: Amplify Sandbox Shutdown
4. Update task status to complete

**DO NOT proceed to Phase 6 until ALL tests pass!**
