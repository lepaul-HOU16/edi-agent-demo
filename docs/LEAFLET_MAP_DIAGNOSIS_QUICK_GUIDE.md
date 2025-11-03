# Leaflet Map Diagnosis - Quick Reference Guide

## 🚀 Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open Browser DevTools
- Press **F12** or **Cmd+Option+I** (Mac)
- Click **Console** tab
- Type `[TerrainMap]` in the filter box

### 3. Test the Map
In the chat interface, send:
```
Analyze terrain at 35.067482, -101.395466
```

### 4. Watch the Console
Look for the initialization sequence (should take ~1-2 seconds)

---

## ✅ Success Pattern

If the map loads correctly, you'll see:

```
[TerrainMap] useEffect triggered
[TerrainMap] Starting map initialization...
[TerrainMap] Container dimensions: { width: 1200, height: 600 }
[TerrainMap] Leaflet imported successfully
[TerrainMap] Map instance created successfully
[TerrainMap] ✅ MAP INITIALIZATION COMPLETE
```

**Result:** Interactive map displays with terrain features

---

## ❌ Failure Patterns

### Pattern 1: DOM Not Ready
```
[TerrainMap] mapRef.current is null - DOM element not available
```
**Meaning:** Component rendered but ref not attached  
**Fix:** Increase setTimeout delay in component

### Pattern 2: No Dimensions
```
[TerrainMap] Container has no dimensions! Map cannot initialize.
```
**Meaning:** Parent container has width/height of 0  
**Fix:** Check parent container CSS, ensure it's visible

### Pattern 3: Import Failed
```
[TerrainMap] ❌ CRITICAL ERROR: Failed to import Leaflet
```
**Meaning:** Leaflet module not loading  
**Fix:** Run `npm install` to reinstall dependencies

### Pattern 4: Duplicate Init
```
[TerrainMap] CRITICAL ERROR creating map: Map container is already initialized
```
**Meaning:** Map already exists in container  
**Fix:** Improve cleanup logic, clear _leaflet_id

### Pattern 5: No Data
```
[TerrainMap] data.geojson is null - no map data available
```
**Meaning:** Backend didn't return GeoJSON  
**Fix:** Check backend logs, verify terrain analysis succeeded

---

## 🔍 What to Report

If the map fails to load, copy the following from console:

1. **All `[TerrainMap]` log messages** (especially errors)
2. **Any Leaflet-related errors** (red text)
3. **The last successful checkpoint** before failure
4. **Browser and version** (Chrome 120, Firefox 121, etc.)

### Example Report
```
Browser: Chrome 120
Last Checkpoint: [TerrainMap] Starting dynamic Leaflet import...
Error: [TerrainMap] ❌ CRITICAL ERROR: Failed to import Leaflet: Error: Cannot find module 'leaflet'
```

---

## 🛠️ Common Fixes

### Fix 1: Reinstall Dependencies
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Fix 2: Clear Browser Cache
- Press **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows)
- Or: DevTools → Network tab → Disable cache checkbox

### Fix 3: Check Container CSS
Look for the map container in Elements tab:
```html
<div ref={mapRef} style="width: 100%; height: 100%;">
```
Should have actual pixel dimensions, not 0x0

### Fix 4: Restart Development Server
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 📊 Diagnostic Test

Run the static analysis test:
```bash
node tests/test-terrain-map-diagnosis.js
```

Should show all ✅ checks passing.

---

## 📞 Need Help?

If you see errors you don't understand:

1. Copy all `[TerrainMap]` console logs
2. Copy any red error messages
3. Note which checkpoint was the last to succeed
4. Share with the development team

---

**Quick Tip:** The map should initialize in under 2 seconds. If you see the first few logs but then nothing, the import or map creation likely failed.
