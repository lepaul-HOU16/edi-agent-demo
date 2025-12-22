# How to Find the 🔗 Knowledge Graph Explorer Button

## Location

The **🔗 Knowledge Graph Explorer** button is on the **Collection Detail Page**.

## Steps to Find It

### 1. Start the Application
```bash
npm run dev
```

### 2. Navigate to Collections
- Open http://localhost:3000
- Click on **"Data Collections & Workspaces"** in the top navigation
- OR go directly to http://localhost:3000/collections

### 3. Open a Collection
- Click on any collection card to open its detail page
- You'll be taken to `/collections/:collectionId`

### 4. Find the Button
The button is located in the **Collection Overview** section, in a row of action buttons:

```
[View Collection Data in Catalog] [🔗 Knowledge Graph Explorer] [Create New Canvas from Collection]
```

## Button Behavior

### ✅ Enabled (Blue/Normal)
- When the collection has data items
- Clicking navigates to `/collections/:collectionId/knowledge-graph`

### ⚠️ Disabled (Grayed Out)
- When the collection has NO data items
- Button is visible but not clickable
- Tooltip may show why it's disabled

## Visual Reference

The button looks like this:
```
┌─────────────────────────────────────┐
│  🔗 Knowledge Graph Explorer  📤   │
└─────────────────────────────────────┘
```

- **Icon**: 🔗 (link emoji) + share icon
- **Style**: Normal/secondary button (not primary orange)
- **Position**: Middle button in a row of 3 action buttons

## If You Don't See It

### Check 1: Are you on the Collection Detail Page?
- URL should be `/collections/some-id`
- Page title should show "🗂️ [Collection Name]"
- You should see collection metadata (wells, data points, etc.)

### Check 2: Is the collection loaded?
- Wait for the page to finish loading
- Check for any error messages
- Verify the collection has data

### Check 3: Browser Console
Open browser console (F12) and check for:
- Any JavaScript errors
- Network errors loading the page
- React rendering issues

## Test the Button

Once you find it:

1. **Click the button** (if enabled)
2. **Verify navigation** to Knowledge Graph Explorer page
3. **Check URL** changes to `/collections/:id/knowledge-graph`
4. **See the page** render with graph and map visualizations

## Current Status

✅ **Button Added**: Task 1 complete
✅ **Route Configured**: `/collections/:collectionId/knowledge-graph`
✅ **Page Created**: `KnowledgeGraphExplorerPage.tsx`
✅ **All Components Built**: Graph, Map, Details Panel, Filters
✅ **Test File Created**: `test-knowledge-graph-real-data.html`

The entire Knowledge Graph Explorer feature is implemented and ready to use!

## Quick Test

```bash
# 1. Start the app
npm run dev

# 2. Open in browser
open http://localhost:3000/collections

# 3. Click any collection
# 4. Look for the 🔗 button
# 5. Click it!
```

That's it! The button is there, waiting for you to explore your data visually. 🚀
