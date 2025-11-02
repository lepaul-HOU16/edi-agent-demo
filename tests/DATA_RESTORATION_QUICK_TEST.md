# Data Restoration - Quick Test Guide

## 🚀 Quick Test (2 minutes)

### Test 1: Basic Restoration
```
1. Open http://localhost:3000/catalog
2. Type: /getdata
3. Wait for results (table shows wells, map shows markers)
4. Press F5 (or Cmd+R) to reload
5. ✅ VERIFY: Messages restored, table shows data, map shows wells
```

### Test 2: Chain of Thought Restoration
```
1. After Test 1, click the gear icon (Chain of Thought panel)
2. ✅ VERIFY: Chain of thought steps visible
3. Press F5 to reload
4. Click gear icon again
5. ✅ VERIFY: Chain of thought steps still visible
```

### Test 3: Error Handling
```
1. Open DevTools > Console
2. Press F5 to reload
3. ✅ VERIFY: No errors in console
4. ✅ VERIFY: Data restored successfully
```

## 🔍 What to Look For

### ✅ Success Indicators
- Console shows: "📦 Restored messages from localStorage: X messages"
- Console shows: "📥 DATA RESTORATION: Fetching metadata from S3"
- Console shows: "✅ DATA RESTORATION: Loaded metadata from S3: X wells"
- Console shows: "✅ DATA RESTORATION: Restored analysisData with X wells"
- Console shows: "✅ DATA RESTORATION: Loaded GeoJSON from S3: X features"
- Console shows: "✅ DATA RESTORATION: Restored map state with X features"
- Console shows: "✅ DATA RESTORATION: Restored X chain of thought steps"
- Console shows: "✅ DATA RESTORATION: Complete"
- Table displays well data
- Map shows well markers
- Chain of thought panel shows steps

### ❌ Failure Indicators (Should NOT See)
- Console errors (red text)
- Blank table after reload
- Empty map after reload
- Missing chain of thought steps
- Page crash or freeze

## 🐛 If Something Goes Wrong

### Issue: No data restored after reload
**Check:**
1. Console for error messages
2. Network tab for failed S3 requests
3. localStorage for `catalog_messages_{sessionId}` key

**Solution:**
- If S3 URLs expired (403/404): Run new search
- If localStorage empty: Run new search
- If network error: Check internet connection

### Issue: Warning message shown
**This is expected if:**
- S3 signed URLs expired (after 1 hour)
- Network connectivity issues
- Corrupted localStorage data

**Action:**
- Click "New Chat" or run new search
- Functionality should work normally

## 📊 Expected Console Output

```
📦 Restored sessionId from localStorage: abc-123-def
💾 Persisted sessionId to localStorage: abc-123-def
📦 Restored messages from localStorage: 2 messages
🔄 DATA RESTORATION: Checking for data to restore...
📥 DATA RESTORATION: Found message with files: { hasMetadata: true, hasGeojson: true }
📥 DATA RESTORATION: Fetching metadata from S3: https://...
✅ DATA RESTORATION: Loaded metadata from S3: 151 wells
✅ DATA RESTORATION: Restored analysisData with 151 wells
📥 DATA RESTORATION: Fetching GeoJSON from S3: https://...
✅ DATA RESTORATION: Loaded GeoJSON from S3: 151 features
✅ DATA RESTORATION: Restored map state with 151 features
🧠 DATA RESTORATION: Restoring chain of thought steps...
✅ DATA RESTORATION: Restored 5 chain of thought steps
✅ DATA RESTORATION: Complete
```

## ✅ Test Complete

If you see:
- ✅ Messages restored
- ✅ Table shows data
- ✅ Map shows wells
- ✅ Chain of thought steps visible
- ✅ No console errors

**Then data restoration is working correctly!**

---

**Time Required:** 2-5 minutes
**Prerequisites:** Catalog page with previous search results
**Status:** Ready for testing
