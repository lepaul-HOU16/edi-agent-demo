# Next.js Removal Plan - Migrate to Vite + React

## Goal
Remove Next.js completely and replace with Vite + React + React Router for a pure static SPA.

## Why Remove Next.js?
- We don't use SSR (all pages are 'use client')
- We don't use Next.js API routes (migrated to Lambda)
- Static export has limitations with dynamic routes
- Vite is simpler, faster, and more straightforward for SPAs

## Migration Steps

### 1. Install Vite and Dependencies
```bash
npm install -D vite @vitejs/plugin-react
npm install react-router-dom
npm uninstall next
```

### 2. Project Structure Changes
```
FROM (Next.js):
src/app/
  page.tsx
  layout.tsx
  chat/[chatSessionId]/page.tsx
  collections/[collectionId]/page.tsx
  
TO (Vite + React Router):
src/
  main.tsx (entry point)
  App.tsx (router setup)
  pages/
    HomePage.tsx
    ChatPage.tsx
    CollectionsPage.tsx
  components/ (keep as-is)
  lib/ (keep as-is)
```

### 3. Create Vite Configuration
- Create `vite.config.ts`
- Configure React plugin
- Configure build output to `dist/`
- Configure environment variables

### 4. Convert Next.js Pages to React Components
- Remove Next.js specific imports (useRouter → react-router-dom)
- Remove Next.js Image component → regular img tags
- Remove Next.js Link → React Router Link
- Convert dynamic routes to React Router params

### 5. Create Router Configuration
- Set up React Router with all routes
- Configure dynamic routes with params
- Set up 404 fallback

### 6. Update index.html
- Create public/index.html as entry point
- Move public assets

### 7. Update Build Scripts
- Change build command to use Vite
- Update deployment scripts for S3

### 8. Test Build
- Run `npm run build`
- Verify dist/ output
- Test locally with `npm run preview`

## Benefits
- ✅ Simpler build process
- ✅ Faster development server
- ✅ No SSR complexity
- ✅ True static SPA
- ✅ Better dynamic routing support
- ✅ Smaller bundle size
- ✅ Clearer separation of concerns

## Timeline
- Phase 1: Setup Vite (30 min)
- Phase 2: Convert pages (2 hours)
- Phase 3: Test and fix (1 hour)
- Total: ~3.5 hours
