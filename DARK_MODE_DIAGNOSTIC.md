# Dark Mode Map Diagnostic Checklist

## Issue: "I don't see the dark mode map anymore"

### Step 1: Wait for CloudFront
- CloudFront invalidation takes 1-2 minutes
- Invalidation ID: I6BBSIDFDH7ZAIP18XJ6UN42SY
- Check status: `aws cloudfront get-invalidation --distribution-id E18FPAPGJR8ZNO --id I6BBSIDFDH7ZAIP18XJ6UN42SY`

### Step 2: Hard Refresh Browser
- Mac: Cmd + Shift + R
- Windows/Linux: Ctrl + Shift + R
- This clears browser cache

### Step 3: Check Browser Console
Open DevTools (F12) and check Console tab for:

```
[TerrainMap] OSM layer added as default
[TerrainMap] Tile URL: https://...
[TerrainMap] Dark mode: true/false
```

### Step 4: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter by "png" or "tile"
4. Toggle dark mode
5. Look for requests to:
   - Light: `tile.openstreetmap.org`
   - Dark: `basemaps.cartocdn.com/rastertiles/voyager`

### Step 5: Verify Theme Attribute
In Console, run:
```javascript
document.body.getAttribute('data-awsui-mode')
```
Should return: `"dark"` or `"light"`

### Step 6: Test Theme Change Event
In Console, run:
```javascript
window.dispatchEvent(new Event('themechange'));
```
Should see console logs about tile layer update

## Common Issues

### Issue: Map is blank
- **Cause**: Leaflet CSS not loaded
- **Fix**: Check if `leaflet.css` is imported

### Issue: Tiles don't load (gray squares)
- **Cause**: CORS or network issue
- **Fix**: Check Network tab for 404 or CORS errors

### Issue: Dark mode doesn't switch
- **Cause**: Theme change event not firing
- **Fix**: Check if `data-awsui-mode` attribute changes

### Issue: Wrong tiles in dark mode
- **Cause**: Cached old code
- **Fix**: Hard refresh (Cmd+Shift+R)

## Tile URLs

### Light Mode (OpenStreetMap)
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Dark Mode (CartoDB Voyager - Light Dark)
```
https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png
```

## Test Locally

Open `test-leaflet-dark-mode.html` in browser to test theme switching without deployment.

## Expected Behavior

1. **Light Mode**: White background, colorful OSM tiles
2. **Dark Mode**: Light gray background, muted colors (CartoDB Voyager)
3. **Switching**: Instant tile layer swap, no page reload

## Debug Commands

```bash
# Check CloudFront invalidation status
aws cloudfront get-invalidation --distribution-id E18FPAPGJR8ZNO --id I6BBSIDFDH7ZAIP18XJ6UN42SY

# Check S3 file timestamps
aws s3 ls s3://energyinsights-development-frontend-development/assets/ | grep index

# Test tile URL directly
curl -I "https://a.basemaps.cartocdn.com/rastertiles/voyager/10/163/395.png"
```
