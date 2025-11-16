# Task 13.1: Authentication Flow Testing - Manual Checklist

## Test Environment
- **Frontend URL**: https://d36sq31aqkfe46.cloudfront.net
- **API URL**: https://iqvvvqvqe5.execute-api.us-east-1.amazonaws.com
- **User Pool ID**: us-east-1_sC6yswGji
- **Test User**: test-user@example.com
- **Test Password**: TestPass123!

## Authentication Flow Tests

### Test 1: Login with Existing Credentials ✅
**Steps:**
1. Open https://d36sq31aqkfe46.cloudfront.net
2. Click "Sign In" or navigate to login page
3. Enter credentials:
   - Username: test-user@example.com
   - Password: TestPass123!
4. Click "Sign In"

**Expected Results:**
- ✅ Login successful
- ✅ Redirected to home page or dashboard
- ✅ User menu shows logged-in state
- ✅ No error messages

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 2: Token Refresh (Automatic) ✅
**Steps:**
1. After logging in, stay on the page for 5-10 minutes
2. Perform an action that requires authentication (e.g., create chat session)
3. Check browser console for token refresh activity

**Expected Results:**
- ✅ Token automatically refreshes before expiration
- ✅ No interruption to user experience
- ✅ API calls continue to work

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 3: Logout ✅
**Steps:**
1. While logged in, click user menu
2. Click "Sign Out" or "Logout"
3. Verify logout

**Expected Results:**
- ✅ User logged out successfully
- ✅ Redirected to login page or home page
- ✅ Cannot access protected pages without re-login
- ✅ Token cleared from browser

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 4: Unauthorized Access (No Token) ✅
**Steps:**
1. Open browser in incognito/private mode
2. Try to access protected page directly:
   - https://d36sq31aqkfe46.cloudfront.net/chat/some-session-id
   - https://d36sq31aqkfe46.cloudfront.net/listChats
3. Observe behavior

**Expected Results:**
- ✅ Redirected to login page
- ✅ Cannot access protected content
- ✅ After login, can access protected pages

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 5: Invalid Credentials ✅
**Steps:**
1. Go to login page
2. Enter invalid credentials:
   - Username: test-user@example.com
   - Password: WrongPassword123!
3. Click "Sign In"

**Expected Results:**
- ✅ Login fails with error message
- ✅ Error message is clear (e.g., "Incorrect username or password")
- ✅ User remains on login page
- ✅ No access to protected resources

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 6: Session Persistence ✅
**Steps:**
1. Log in successfully
2. Close browser tab
3. Open new tab and navigate to https://d36sq31aqkfe46.cloudfront.net
4. Check if still logged in

**Expected Results:**
- ✅ User still logged in (session persisted)
- ✅ Can access protected pages without re-login
- ✅ Token stored securely in browser

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 7: API Authorization Header ✅
**Steps:**
1. Log in to the application
2. Open browser DevTools (F12)
3. Go to Network tab
4. Perform an action that calls the API (e.g., list chat sessions)
5. Inspect the API request headers

**Expected Results:**
- ✅ Request includes `Authorization: Bearer <token>` header
- ✅ Token is a valid JWT (3 parts separated by dots)
- ✅ API returns 200 OK with data

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

### Test 8: Token Expiration Handling ✅
**Steps:**
1. Log in successfully
2. Wait for token to expire (typically 1 hour)
3. Try to perform an action

**Expected Results:**
- ✅ Token automatically refreshed OR
- ✅ User prompted to re-authenticate
- ✅ No data loss or errors

**Actual Results:**
- [ ] PASS / [ ] FAIL
- Notes: _______________________

---

## Automated API Tests

### Test 9: API Endpoint Authorization ✅

Run the following commands to test API authorization:

```bash
# Test 1: Unauthorized request (should fail with 401)
curl -s -w "\nHTTP Status: %{http_code}\n" \
  https://iqvvvqvqe5.execute-api.us-east-1.amazonaws.com/api/chat/sessions

# Expected: HTTP Status: 401
```

**Result:**
- [ ] PASS (401) / [ ] FAIL
- Actual HTTP Status: _______

---

## Test Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Login with credentials | [ ] PASS / [ ] FAIL | |
| 2. Token refresh | [ ] PASS / [ ] FAIL | |
| 3. Logout | [ ] PASS / [ ] FAIL | |
| 4. Unauthorized access | [ ] PASS / [ ] FAIL | |
| 5. Invalid credentials | [ ] PASS / [ ] FAIL | |
| 6. Session persistence | [ ] PASS / [ ] FAIL | |
| 7. API authorization header | [ ] PASS / [ ] FAIL | |
| 8. Token expiration | [ ] PASS / [ ] FAIL | |
| 9. API endpoint authorization | [ ] PASS / [ ] FAIL | |

---

## Task 13.1 Status

- [ ] **COMPLETE** - All tests passed
- [ ] **INCOMPLETE** - Some tests failed (see notes above)

---

## Notes and Issues

_Document any issues, unexpected behavior, or additional observations here:_

---

## Sign-off

**Tested by:** _______________________
**Date:** _______________________
**Environment:** Production / Staging / Development
