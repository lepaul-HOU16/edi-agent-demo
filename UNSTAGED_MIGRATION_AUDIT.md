# Unstaged Migration Changes Audit

## Overview

The migration from Next.js to React (Vite) happened in **unstaged changes** (not committed yet).

**Total unstaged changes**: 265 files
- **Deleted**: 54 files (mostly `src/app/` Next.js App Router files)
- **Modified**: 211 files

## What Was Deleted

### Next.js App Router Structure (src/app/)
All Next.js App Router files were deleted:
- `src/app/` directory (entire Next.js App Router structure)
- `src/app/api/` (Next.js API routes)
- `src/app/*/page.tsx` (Next.js pages)
- `src/app/layout.tsx` (Next.js root layout)

### Replaced With
- `src/pages/` directory (React Router pages)
- `src/main.tsx` (Vite entry point)
- `src/App.tsx` (React Router setup)

## Critical Files to Audit

### 1. Entry Point & Configuration
```bash
git diff HEAD -- package.json
git diff HEAD -- next.config.js
git diff HEAD -- vite.config.ts
git diff HEAD -- src/main.tsx
git diff HEAD -- src/App.tsx
```

### 2. Modified Components (30+ files)
All these need manual review:
- `src/components/AgentSwitcher.tsx`
- `src/components/ChatBox.tsx`
- `src/components/ChatMessage.tsx`
- `src/components/WithAuth.tsx`
- `src/components/AppLayout.tsx`
- ... (see full list below)

### 3. New Page Components
```bash
git status --short | grep "src/pages/"
```

## Audit Strategy

### Step 1: Understand What Changed
For each modified file, run:
```bash
git diff HEAD -- src/path/to/file.tsx | less
```

Look for:
- ❌ Removed: `import { useRouter } from 'next/router'`
- ✅ Added: `import { useNavigate } from 'react-router-dom'`
- ❌ Removed: `const router = useRouter()`
- ✅ Added: `const navigate = useNavigate()`
- ❌ Removed: `dynamic(() => import(...))`
- ✅ Added: `React.lazy(() => import(...))`

### Step 2: Verify Each Change
For each change, ask:
1. **Is it necessary?** (Does it need to change for React Router?)
2. **Is it correct?** (Does it work the same way?)
3. **Is it complete?** (Are all related changes made?)
4. **Is it tested?** (Does it actually work?)

### Step 3: Fix What's Broken
Don't trust the automated changes. Fix manually.

## Detailed Audit Plan

### Phase 1: Core Files (DO FIRST)

#### 1.1 package.json
```bash
git diff HEAD -- package.json
```
**Check for:**
- [ ] `next` removed
- [ ] `react-router-dom` added
- [ ] `vite` added
- [ ] `@vitejs/plugin-react` added
- [ ] Scripts updated (`dev`, `build`, etc.)
- [ ] All dependencies still needed

#### 1.2 Configuration Files
```bash
git diff HEAD -- next.config.js
git diff HEAD -- vite.config.ts
```
**Check for:**
- [ ] `next.config.js` - should be removed or ignored
- [ ] `vite.config.ts` - should exist and be configured correctly
- [ ] Build settings correct
- [ ] Path aliases correct
- [ ] Environment variables handled

#### 1.3 Entry Point
```bash
git diff HEAD -- src/main.tsx
```
**Check for:**
- [ ] Theme provider setup (✅ already fixed)
- [ ] Router setup
- [ ] Global styles imported
- [ ] Cloudscape styles applied

#### 1.4 App Component
```bash
git diff HEAD -- src/App.tsx
```
**Check for:**
- [ ] Routes defined correctly
- [ ] Layout wrapper applied
- [ ] Auth wrapper applied
- [ ] Error boundaries in place

### Phase 2: Layout Components

#### 2.1 AppLayout
```bash
git diff HEAD -- src/components/AppLayout.tsx
```
**Check for:**
- [ ] `useRouter()` → `useNavigate()` conversion correct
- [ ] Navigation working
- [ ] Dark mode toggle working (✅ already fixed in main.tsx)
- [ ] Top nav working

#### 2.2 WithAuth
```bash
git diff HEAD -- src/components/WithAuth.tsx
```
**Check for:**
- [ ] Router conversion correct
- [ ] Redirect logic working
- [ ] Auth state management correct

### Phase 3: Page Components

For each page in `src/pages/`, verify:
```bash
git diff HEAD -- src/pages/ChatPage.tsx
git diff HEAD -- src/pages/CatalogPage.tsx
git diff HEAD -- src/pages/HomePage.tsx
# ... etc
```

**Check for:**
- [ ] Router hooks converted correctly
- [ ] Data fetching moved to `useEffect`
- [ ] Loading states implemented
- [ ] Error handling implemented
- [ ] Layout correct
- [ ] Styles correct

### Phase 4: Components with Dynamic Imports

For each component using `React.lazy()`:
```bash
git diff HEAD -- src/components/ChatMessage.tsx
git diff HEAD -- src/components/PlotDataToolComponent.tsx
# ... etc
```

**Check for:**
- [ ] `dynamic()` → `React.lazy()` conversion correct
- [ ] Wrapped in `<Suspense>` with fallback
- [ ] Loading state handled
- [ ] Error boundary in place

### Phase 5: All Other Modified Components

For each of the 30+ modified components:
```bash
git diff HEAD -- src/components/AgentSwitcher.tsx
git diff HEAD -- src/components/CatalogChatBox.tsx
# ... etc
```

**Check for:**
- [ ] No Next.js imports remaining
- [ ] Router hooks converted correctly
- [ ] Functionality preserved
- [ ] Styles preserved

## Commands to Run

### See all unstaged changes
```bash
git status --short
```

### See specific file diff
```bash
git diff HEAD -- src/path/to/file.tsx
```

### See all deleted files
```bash
git status --short | grep "^.D"
```

### See all modified files
```bash
git status --short | grep "^ M"
```

### Restore a file to original (if needed)
```bash
git checkout HEAD -- src/path/to/file.tsx
```

### Stage a file after review
```bash
git add src/path/to/file.tsx
```

## Audit Checklist

### Core Files
- [ ] `package.json` - Review dependencies
- [ ] `vite.config.ts` - Review configuration
- [ ] `src/main.tsx` - ✅ Theme fixed, review rest
- [ ] `src/App.tsx` - Review routing setup
- [ ] `src/index.css` - Review global styles
- [ ] `src/globals.css` - ⚠️ Partially fixed, review rest

### Layout Components
- [ ] `src/components/AppLayout.tsx` - Review navigation
- [ ] `src/components/WithAuth.tsx` - Review auth logic
- [ ] `src/components/TopNavBar.tsx` - Review navigation

### Page Components (9 files)
- [ ] `src/pages/HomePage.tsx`
- [ ] `src/pages/ChatPage.tsx` - ⚠️ Partially fixed
- [ ] `src/pages/CatalogPage.tsx`
- [ ] `src/pages/CreateNewChatPage.tsx`
- [ ] `src/pages/CollectionDetailPage.tsx`
- [ ] `src/pages/PreviewPage.tsx`
- [ ] `src/pages/ListChatsPage.tsx`
- [ ] `src/pages/CollectionsPage.tsx`
- [ ] `src/pages/CanvasesPage.tsx`
- [ ] `src/pages/ProjectsPage.tsx`

### Components with React.lazy (16 files)
- [ ] `src/components/ChatMessage.tsx`
- [ ] `src/components/PlotDataToolComponent.tsx`
- [ ] `src/components/messageComponents/LogPlotViewerComponent.tsx`
- [ ] `src/components/messageComponents/ComprehensivePorosityAnalysisComponent.tsx`
- [ ] `src/components/messageComponents/ComprehensiveShaleAnalysisComponent.tsx`
- [ ] `src/components/messageComponents/ComprehensiveWellDataDiscoveryComponent.tsx`
- [ ] `src/components/renewable/PerformanceAnalysisDashboard.tsx`
- [ ] `src/components/renewable/PlotlyWindRose.tsx`
- [ ] `src/components/renewable/WindResourceDashboard.tsx`
- [ ] `src/components/renewable/InteractiveWindRose.tsx`
- [ ] `src/components/renewable/WakeAnalysisArtifact.tsx`
- [ ] `src/components/renewable/WakeAnalysisDashboard.tsx`
- [ ] `src/components/cloudscape/CloudscapePorosityDisplay.tsx`
- [ ] `src/components/cloudscape/CloudscapeShaleVolumeDisplay.tsx`
- [ ] `src/components/cloudscape/CloudscapeSaturationDisplay.tsx`
- [ ] `src/components/mockups/PetrophysicsCloudscapeMockup.tsx`

### Other Modified Components (30+ files)
- [ ] `src/components/AgentSwitcher.tsx`
- [ ] `src/components/CatalogChatBox.tsx`
- [ ] `src/components/CatalogChatBoxCloudscape.tsx`
- [ ] `src/components/ChainOfThoughtDisplay.tsx`
- [ ] `src/components/ChatBox.tsx`
- [ ] `src/components/CollectionContextBadge.tsx`
- [ ] `src/components/CollectionCreationModal.tsx`
- [ ] `src/components/DataDashboard.tsx`
- [ ] `src/components/ErrorBoundary.tsx`
- [ ] `src/components/FileDrawer.tsx`
- [ ] `src/components/FileExplorer.tsx`
- [ ] `src/components/FileViewer.tsx`
- [ ] ... (and more)

## Next Steps

1. **Start with package.json** - Understand what dependencies changed
2. **Review vite.config.ts** - Ensure build is configured correctly
3. **Review src/main.tsx** - ✅ Theme already fixed, check rest
4. **Review src/App.tsx** - Ensure routing is set up correctly
5. **Review each page component** - One at a time, manually
6. **Review each modified component** - One at a time, manually
7. **Test everything** - Don't trust the automated changes

## Important Notes

- **DO NOT commit these changes yet** - They need thorough review
- **DO NOT run more scripts** - Manual review only
- **DO NOT trust the automated changes** - Verify everything
- **DO test each fix** - Make sure it actually works

## Recovery Plan

If we need to start over:
```bash
# Discard all unstaged changes
git checkout HEAD -- .

# Start fresh with manual migration
# (One file at a time, properly)
```
