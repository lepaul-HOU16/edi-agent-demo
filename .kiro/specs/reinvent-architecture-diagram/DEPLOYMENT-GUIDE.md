# re:Invent Demo Materials - Deployment Guide

## Overview

The re:Invent demo materials have been integrated into the platform as a hidden route accessible at `/reinvent-demo`. This provides easy access to all presentation materials during the live demo.

## Location

### Source Files
All demo materials are located in:
```
.kiro/specs/reinvent-architecture-diagram/presentation/
```

### Deployed Files
Materials are deployed to:
```
public/demo/
```

### Access URL
```
https://[your-domain]/reinvent-demo
```

## Deployment

### Automatic Deployment

Run the deployment script to copy all materials to the public directory:

```bash
./scripts/deploy-demo-materials.sh
```

This script:
1. Creates `public/demo/` directory
2. Copies all HTML files (backup-slides.html, master-deck.html)
3. Copies all Markdown files
4. Converts Markdown to HTML for web viewing
5. Creates an index page

### Manual Deployment

If you need to deploy manually:

```bash
# Create directory
mkdir -p public/demo

# Copy HTML files
cp .kiro/specs/reinvent-architecture-diagram/presentation/backup-slides.html public/demo/
cp .kiro/specs/reinvent-architecture-diagram/presentation/master-deck.html public/demo/

# Copy Markdown files
cp .kiro/specs/reinvent-architecture-diagram/presentation/*.md public/demo/
```

## Files Deployed

### HTML Files (Ready to Use)
- `backup-slides.html` - Interactive backup slides with emergency mode
- `master-deck.html` - Complete presentation deck
- `cheat-sheet.html` - Converted from Markdown for web viewing
- `demo-script.html` - Converted from Markdown for web viewing
- `troubleshooting.html` - Converted from Markdown for web viewing
- `index.html` - Landing page with links to all materials

### Markdown Files (For Download)
- `INTERACTIVE-DEMO-SCRIPT.md` - Complete demo script
- `PRESENTER-CHEAT-SHEET.md` - Quick reference (print this!)
- `DEMO-TROUBLESHOOTING-GUIDE.md` - Troubleshooting guide
- `DEMO-README.md` - Master README

## Accessing the Materials

### During Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to:
   ```
   http://localhost:3000/reinvent-demo
   ```

### In Production

1. Navigate to:
   ```
   https://[your-cloudfront-domain]/reinvent-demo
   ```

2. You must be authenticated (logged in) to access this route

## Features

### Interactive Tabs
The demo page includes tabs for:
- **Backup Slides** - Embedded iframe with full-screen option
- **Master Deck** - Complete presentation
- **Cheat Sheet** - Quick reference guide
- **Demo Script** - Step-by-step narration
- **Troubleshooting** - Issue resolution guide
- **Downloads** - Direct links to all files

### Embedded Viewing
All HTML files are embedded in iframes for easy viewing without leaving the platform.

### Full-Screen Mode
Each embedded view has a "Open in Full Screen" button to open in a new tab.

### Download Options
All Markdown files can be downloaded directly for offline access and printing.

## Security

### Protected Route
The `/reinvent-demo` route is protected by authentication:
- Users must be logged in to access
- Uses the same `ProtectedRoute` component as other pages
- Requires valid Cognito JWT token

### Hidden from Navigation
The route is not included in the main navigation menu, making it "hidden" from regular users.

### Access Control
To access the demo materials:
1. Log in to the platform
2. Manually navigate to `/reinvent-demo`
3. Or bookmark the URL for quick access

## Usage During Presentation

### Pre-Demo Setup

1. **Open in Browser Tab:**
   ```
   https://[your-domain]/reinvent-demo
   ```

2. **Navigate to Backup Slides Tab**
   - Keep this tab open during presentation
   - Ready to switch if live demo fails

3. **Open Backup Slides in Full Screen:**
   - Click "Open in Full Screen" button
   - Keep in separate browser tab
   - Press 'E' to toggle emergency mode if needed

### During Demo

**If live demo works:**
- Use the actual application
- Reference cheat sheet for queries
- Show CloudWatch logs

**If live demo fails:**
- Switch to backup slides tab
- Press 'E' to show emergency banner
- Walk through backup slides with enthusiasm
- Use troubleshooting guide if needed

### Quick Access

**Keyboard Shortcuts (in backup slides):**
- `→` or `Space` - Next slide
- `←` - Previous slide
- `Home` - First slide
- `End` - Last slide
- `E` - Toggle emergency mode

## Updating Materials

### Update Source Files

1. Edit files in:
   ```
   .kiro/specs/reinvent-architecture-diagram/presentation/
   ```

2. Run deployment script:
   ```bash
   ./scripts/deploy-demo-materials.sh
   ```

3. Refresh browser to see changes

### Update React Component

If you need to modify the demo page layout:

1. Edit:
   ```
   src/pages/ReinventDemoPage.tsx
   ```

2. Restart development server:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Issue: 404 Not Found

**Cause:** Files not deployed to public directory

**Solution:**
```bash
./scripts/deploy-demo-materials.sh
```

### Issue: Can't Access Route

**Cause:** Not authenticated

**Solution:**
1. Navigate to `/sign-in`
2. Log in with valid credentials
3. Then navigate to `/reinvent-demo`

### Issue: Iframe Not Loading

**Cause:** File path incorrect or CORS issue

**Solution:**
1. Check browser console for errors
2. Verify files exist in `public/demo/`
3. Check file paths in `ReinventDemoPage.tsx`

### Issue: Styles Not Rendering

**Cause:** CSS not loading in iframe

**Solution:**
1. Check HTML files have embedded styles
2. Verify no external CSS dependencies
3. Test files directly: `/demo/backup-slides.html`

## File Structure

```
project-root/
├── .kiro/specs/reinvent-architecture-diagram/
│   └── presentation/                    # Source files
│       ├── backup-slides.html
│       ├── master-deck.html
│       ├── INTERACTIVE-DEMO-SCRIPT.md
│       ├── PRESENTER-CHEAT-SHEET.md
│       ├── DEMO-TROUBLESHOOTING-GUIDE.md
│       └── DEMO-README.md
├── public/
│   └── demo/                            # Deployed files
│       ├── backup-slides.html
│       ├── master-deck.html
│       ├── cheat-sheet.html
│       ├── demo-script.html
│       ├── troubleshooting.html
│       ├── index.html
│       └── *.md files
├── src/
│   └── pages/
│       └── ReinventDemoPage.tsx         # React component
├── scripts/
│   └── deploy-demo-materials.sh         # Deployment script
└── App.tsx                              # Route configuration
```

## Integration Points

### Route Configuration
File: `src/App.tsx`
```typescript
<Route path="/reinvent-demo" element={<ProtectedRoute><ReinventDemoPage /></ProtectedRoute>} />
```

### Component
File: `src/pages/ReinventDemoPage.tsx`
- Uses Cloudscape Design System components
- Tabbed interface for different materials
- Embedded iframes for viewing
- Download buttons for files

### Public Assets
Directory: `public/demo/`
- Served statically by Next.js
- Accessible at `/demo/*` URLs
- No authentication required for direct file access
- But route `/reinvent-demo` requires auth

## Best Practices

### Before Presentation

1. **Deploy materials:**
   ```bash
   ./scripts/deploy-demo-materials.sh
   ```

2. **Test access:**
   - Log in to platform
   - Navigate to `/reinvent-demo`
   - Verify all tabs load
   - Test full-screen mode

3. **Bookmark URL:**
   - Save `/reinvent-demo` as bookmark
   - Quick access during presentation

4. **Print cheat sheet:**
   - Download `PRESENTER-CHEAT-SHEET.md`
   - Print and keep in pocket

### During Presentation

1. **Keep tab open:**
   - Have `/reinvent-demo` open in browser tab
   - Ready to switch if needed

2. **Use backup slides:**
   - Open in full screen in separate tab
   - Press 'E' if demo fails completely

3. **Reference materials:**
   - Use cheat sheet for queries
   - Check troubleshooting if issues occur

### After Presentation

1. **Update materials:**
   - Note any issues encountered
   - Update troubleshooting guide
   - Improve backup slides

2. **Redeploy:**
   ```bash
   ./scripts/deploy-demo-materials.sh
   ```

## Production Deployment

### Build Process

When building for production:

```bash
npm run build
```

The `public/demo/` directory is automatically included in the build output.

### CDK Deployment

The demo materials are deployed as static assets via CloudFront:

1. Files in `public/demo/` are uploaded to S3
2. CloudFront serves them at `/demo/*` URLs
3. React route `/reinvent-demo` loads the page component
4. Page component embeds iframes pointing to `/demo/*` files

### Verification

After deployment, verify:

```bash
# Check files exist
curl https://[your-domain]/demo/index.html

# Check route works (requires auth)
# Navigate in browser to:
https://[your-domain]/reinvent-demo
```

## Maintenance

### Regular Updates

Update materials as needed:

1. Edit source files in `.kiro/specs/reinvent-architecture-diagram/presentation/`
2. Run deployment script
3. Test in browser
4. Commit changes to git

### Version Control

All source files are tracked in git:
- Source: `.kiro/specs/reinvent-architecture-diagram/presentation/`
- Deployed: `public/demo/` (can be gitignored if desired)
- Script: `scripts/deploy-demo-materials.sh`

### Cleanup

To remove demo materials:

```bash
rm -rf public/demo/
```

To remove route, edit `src/App.tsx` and remove:
```typescript
<Route path="/reinvent-demo" element={<ProtectedRoute><ReinventDemoPage /></ProtectedRoute>} />
```

## Summary

✅ **Deployed:** All demo materials are in `public/demo/`
✅ **Accessible:** Via `/reinvent-demo` route (requires auth)
✅ **Hidden:** Not in navigation menu
✅ **Ready:** For live presentation use
✅ **Backed Up:** Multiple backup plans available

**Access URL:** `https://[your-domain]/reinvent-demo`

**Quick Deploy:** `./scripts/deploy-demo-materials.sh`

**Status:** Ready for re:Invent presentation! 🎉
