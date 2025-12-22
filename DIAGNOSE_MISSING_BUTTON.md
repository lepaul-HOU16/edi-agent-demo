# Diagnose Missing Knowledge Graph Button

## The button IS in the code (line 401-408 of CollectionDetailPage.tsx)

```tsx
<Button 
  variant="normal" 
  iconName="share"
  disabled={!collection.dataItems || collection.dataItems.length === 0}
  onClick={() => navigate(`/collections/${collectionId}/knowledge-graph`)}
>
  🔗 Knowledge Graph Explorer
</Button>
```

## Why you might not see it:

### 1. App Not Rebuilt
The code changed but the app hasn't recompiled.

**Fix:**
```bash
# Stop the dev server (Ctrl+C)
npm run dev
```

### 2. Wrong Page
You're not on the Collection Detail Page.

**Check:**
- URL should be `/collections/[some-id]` (not just `/collections`)
- Page should show ONE collection's details
- Should see "🗂️ [Collection Name]" as the header

**Fix:**
```bash
# Go to collections list
open http://localhost:3000/collections

# Click on ANY collection card
# This takes you to /collections/:id where the button lives
```

### 3. Browser Cache
Old version of the page is cached.

**Fix:**
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Or open DevTools (F12) → Network tab → Check "Disable cache"

### 4. Collection Has No Data
Button is there but DISABLED (grayed out).

**Check:**
- Does the collection have data items?
- Look for "📊 Data Summary" showing "0 Wells"
- If 0 wells, button will be disabled

**Fix:**
- Click a different collection that has data
- Or add data to the current collection

### 5. React Error
Component failed to render.

**Check:**
```bash
# Open browser console (F12)
# Look for red errors
# Check for:
# - "Cannot read property..."
# - "undefined is not a function"
# - Any React errors
```

## Quick Test

Run this exact sequence:

```bash
# 1. Make sure dev server is running
npm run dev

# 2. Open browser
open http://localhost:3000/collections

# 3. You should see a LIST of collections
# 4. Click on ANY collection card
# 5. You're now on /collections/:id
# 6. Scroll down to "Collection Overview" section
# 7. Look for 3 buttons in a row
# 8. Middle button should be "🔗 Knowledge Graph Explorer"
```

## Screenshot What You See

Take a screenshot of:
1. The URL bar (to confirm you're on `/collections/:id`)
2. The page content (to see what's actually rendering)
3. Browser console (F12 → Console tab)

This will help diagnose the issue!

## Nuclear Option

If nothing works:

```bash
# 1. Stop dev server
# 2. Clear build cache
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart
npm run dev

# 4. Hard refresh browser
Cmd+Shift+R
```
