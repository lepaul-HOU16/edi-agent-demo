# Collection Data Inheritance - User Guide

## What is Collection Data Inheritance?

Collection Data Inheritance allows you to organize data from the catalog into reusable collections, then create canvas workspaces that automatically inherit all collection data. This eliminates repetitive data selection and ensures consistent data access across multiple analysis sessions.

---

## Key Concepts

### Collections
A **collection** is a curated set of wells, trajectories, or other data items saved from catalog searches. Think of it as a folder that organizes related data.

**Example**: "North Field Wells" collection containing 24 wells from a specific geographic area.

### Canvases
A **canvas** is a chat workspace where you interact with AI agents to analyze data. Each canvas can be linked to a collection.

**Example**: "Porosity Analysis" canvas linked to "North Field Wells" collection.

### Data Inheritance
When you create a canvas from a collection, the canvas automatically inherits:
- All well files and data
- Geographic context
- Data source information
- Metadata about the collection

---

## Getting Started

### Step 1: Create a Collection

1. **Navigate to Catalog Page**
   - Go to the main catalog page
   - Search for wells or data you want to analyze

2. **Select Data Items**
   - Click checkboxes next to wells you want to include
   - You can select multiple wells at once

3. **Create Collection**
   - Click "Create Collection" button
   - Enter a descriptive name (e.g., "North Field Wells")
   - Add an optional description
   - Click "Create"

**Result**: Your collection is saved and appears in the Collections list.

---

### Step 2: Create a Canvas from Collection

1. **Open Collection Detail Page**
   - Click on your collection from the Collections list
   - View collection details and data items

2. **Create Canvas**
   - Click "Create Canvas" button
   - Canvas is automatically created with collection link

3. **Canvas Opens**
   - You're redirected to the new canvas
   - Collection context loads automatically
   - All collection data is now accessible

**Result**: Canvas is ready for analysis with all collection data inherited.

---

### Step 3: Use Collection Data in Canvas

#### View Collection Context

At the top of your canvas, you'll see a blue alert showing:
- Collection name
- Number of wells
- Data source type (S3 or OSDU)
- Link to view collection

**Example**:
```
📊 Collection: North Field Wells
24 wells from S3 data source
📁 All 24 well files accessible in Session Files panel
[View Collection]
```

#### Access Well Files

1. **Open FileDrawer**
   - Click "Session Files" panel on the right
   - All collection well files appear automatically

2. **Select Files**
   - Click on any file to view contents
   - Files are organized by well name
   - All LAS files and data available

3. **Use in Analysis**
   - Selected files are passed to AI agents
   - Agents can analyze file contents
   - No need to manually upload files

#### Ask AI About Collection Data

The AI agents automatically know about your collection:

**You can ask**:
- "Analyze all my wells" (refers to collection wells)
- "What's the average porosity?" (across collection)
- "Show me wells with high GR values" (from collection)
- "Compare WELL-001 and WELL-002" (both from collection)

**AI knows**:
- Which wells are in your collection
- Where the data files are located
- Geographic context if available
- Data source information

---

## Working with Multiple Canvases

### Create Multiple Canvases from Same Collection

You can create multiple canvases from the same collection for different analyses:

1. **Open Collection Detail Page**
2. **Click "Create Canvas"** multiple times
3. **Each canvas gets**:
   - Independent chat history
   - Same collection data access
   - Separate analysis results

**Use Cases**:
- Canvas 1: Porosity analysis
- Canvas 2: Shale volume calculation
- Canvas 3: Multi-well correlation
- All using the same North Field Wells collection

### View Linked Canvases

On the Collection Detail Page:
- See "X Linked Canvases" badge in header
- View all canvas cards below collection info
- Click any canvas card to open it

---

## Collection Context Display

### Breadcrumb Navigation

At the top of your canvas:
```
North Field Wells › Porosity Analysis
```

- **Collection name** (clickable) - Returns to collection page
- **Canvas name** - Current canvas

### Collection Alert

Blue info alert showing:
- Collection name
- Well count and data source
- File access information
- "View Collection" button

---

## Managing Collections and Canvases

### Update Collection

1. **Open Collection Detail Page**
2. **Click "Edit Collection"**
3. **Modify**:
   - Collection name
   - Description
   - Add/remove data items
4. **Save Changes**

**Result**: All linked canvases automatically see updated data.

### Delete Collection

1. **Open Collection Detail Page**
2. **Click "Delete Collection"**
3. **Confirm deletion**

**What happens to linked canvases?**
- Canvases remain functional
- Collection link marked as broken
- Warning displayed in canvas
- Canvas can still be used for chat

### Delete Canvas

1. **Open Canvas**
2. **Click "Delete Canvas"** (or from collection page)
3. **Confirm deletion**

**Result**: Canvas removed from collection's linked canvas list.

---

## Broken Collection Links

### What is a Broken Link?

A broken link occurs when:
- Collection is deleted
- Collection access is revoked
- Collection data becomes unavailable

### How to Identify

In your canvas, you'll see:
```
⚠️ Collection Unavailable
The collection linked to this canvas is no longer available.
The canvas will continue to function, but collection data is not accessible.
[Remove Link]
```

### What You Can Do

1. **Continue Using Canvas**
   - Canvas chat still works
   - Previous messages preserved
   - Can upload files manually

2. **Remove Broken Link**
   - Click "Remove Link" button
   - Canvas becomes standalone
   - No collection context displayed

3. **Link to Different Collection**
   - Not currently supported
   - Create new canvas from different collection

---

## Best Practices

### Organizing Collections

1. **Use Descriptive Names**
   - ✅ "North Field Wells - Q4 2024"
   - ❌ "Collection 1"

2. **Group Related Data**
   - Wells from same field
   - Same time period
   - Same analysis type

3. **Add Descriptions**
   - Explain what data is included
   - Note any special characteristics
   - Document data source

### Creating Canvases

1. **Name Canvases by Purpose**
   - ✅ "Porosity Analysis - North Field"
   - ❌ "Canvas 2024-01-15"

2. **Create Multiple Canvases**
   - One canvas per analysis type
   - Keeps chat history organized
   - Easy to find specific analysis

3. **Link to Collections**
   - Always create from collection when possible
   - Ensures data consistency
   - Easier to manage

### Working with AI

1. **Reference Collection Data**
   - "Analyze all wells in this collection"
   - "Compare wells in my collection"
   - AI knows which wells you mean

2. **Use File Access**
   - Open FileDrawer to see available files
   - Select specific files for detailed analysis
   - AI can read file contents

3. **Ask Contextual Questions**
   - "What's the average depth?" (AI knows collection wells)
   - "Show me high porosity zones" (across collection)
   - "Which wells have NPHI curves?" (from collection)

---

## Common Workflows

### Workflow 1: Regional Analysis

1. **Search catalog** for wells in specific region
2. **Create collection** "West Texas Wells"
3. **Create canvas** "Regional Porosity Study"
4. **Ask AI**: "Calculate average porosity across all wells"
5. **Create second canvas** "Regional Shale Volume"
6. **Ask AI**: "Identify shale zones in all wells"

**Result**: Two different analyses on same dataset.

### Workflow 2: Comparative Analysis

1. **Create collection** "Field A Wells"
2. **Create collection** "Field B Wells"
3. **Create canvas from Field A** "Field A Analysis"
4. **Create canvas from Field B** "Field B Analysis"
5. **Compare results** between canvases

**Result**: Consistent analysis methodology across fields.

### Workflow 3: Iterative Analysis

1. **Create collection** "Initial Wells"
2. **Create canvas** "First Pass Analysis"
3. **Identify interesting wells** from analysis
4. **Update collection** to add more wells
5. **Create new canvas** "Expanded Analysis"
6. **Compare** initial vs expanded results

**Result**: Iterative refinement of analysis scope.

---

## Troubleshooting

### Collection Context Not Loading

**Symptoms**:
- Canvas opens but no collection alert
- FileDrawer empty
- AI doesn't know about collection

**Solutions**:
1. Refresh the page
2. Check if collection still exists
3. Verify you have access to collection
4. Check browser console for errors

### Files Not Appearing in FileDrawer

**Symptoms**:
- Collection context shows
- FileDrawer is empty
- Can't access well files

**Solutions**:
1. Verify collection has S3 data items
2. Check S3 bucket permissions
3. Refresh FileDrawer
4. Check CloudWatch logs for errors

### AI Not Recognizing Collection Data

**Symptoms**:
- AI asks "which wells?"
- AI doesn't use collection context
- AI can't find data

**Solutions**:
1. Verify collection context loaded (check alert)
2. Be explicit: "wells in this collection"
3. Check if collection link is broken
4. Try creating new canvas from collection

### Canvas Performance Issues

**Symptoms**:
- Slow to load
- Collection context takes long time
- FileDrawer slow to open

**Solutions**:
1. Check collection size (large collections slower)
2. Clear browser cache
3. Check network connection
4. Wait for cache to populate (30 min TTL)

---

## Tips and Tricks

### Keyboard Shortcuts

- `Ctrl/Cmd + K` - Open FileDrawer
- `Ctrl/Cmd + /` - Focus chat input
- `Esc` - Close modals

### Quick Actions

- **Double-click collection** - Opens detail page
- **Click breadcrumb** - Navigate to collection
- **Click canvas card** - Opens canvas

### Power User Features

1. **Bulk Canvas Creation**
   - Create multiple canvases quickly
   - Each for different analysis type
   - All share same collection data

2. **Collection Templates**
   - Save common collection configurations
   - Reuse for similar projects
   - Consistent data organization

3. **Context Caching**
   - First load may be slow
   - Subsequent loads use cache (30 min)
   - Automatic cache invalidation on updates

---

## FAQ

### Q: Can I link a canvas to multiple collections?
**A**: No, each canvas can only link to one collection. Create separate canvases for different collections.

### Q: What happens if I update a collection?
**A**: All linked canvases automatically see the updated data. Cache is invalidated and fresh data loaded.

### Q: Can I unlink a canvas from a collection?
**A**: Currently only when collection is deleted (broken link). You can then remove the broken link.

### Q: How long does collection context persist?
**A**: Forever, stored in DynamoDB. Context is cached for 30 minutes for performance.

### Q: Can I share collections with other users?
**A**: Not yet, but planned for future release.

### Q: What's the maximum collection size?
**A**: No hard limit, but performance may degrade with 100+ wells. Recommended: 50 wells or fewer per collection.

### Q: Can I export collection data?
**A**: Not directly, but you can access all files through FileDrawer and download individually.

### Q: What happens to canvases when I delete a collection?
**A**: Canvases remain functional but show broken link warning. Collection data no longer accessible.

---

## Getting Help

### Resources

- **API Documentation** - Technical API reference
- **Troubleshooting Guide** - Common issues and solutions
- **Architecture Diagrams** - System design overview

### Support

- Check CloudWatch logs for errors
- Review browser console for client-side issues
- Contact support team for assistance

---

## What's Next?

### Upcoming Features

- Collection sharing with other users
- Collection versioning
- Collection templates
- Bulk canvas creation
- Collection analytics
- Advanced filtering and search

### Feedback

We'd love to hear from you:
- What features would you like?
- What workflows are challenging?
- How can we improve the experience?

---

## Summary

**Collections** organize your data.
**Canvases** inherit collection data automatically.
**AI agents** know about your collection context.
**Multiple canvases** can share the same collection.
**Broken links** are handled gracefully.

**Start using Collection Data Inheritance today to streamline your analysis workflows!** 🚀
