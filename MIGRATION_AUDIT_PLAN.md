# Migration Audit & Proper Remediation Plan

## Current Situation

The migration from Next.js + Amplify to React (Vite) + REST API was done using automated scripts on **November 14, 2024**. These scripts made naive text replacements that broke:

1. Theme system (dark mode)
2. Layout system (CSS/DOM structure)
3. State management (data fetching)
4. Routing (Next.js router → React Router)

## Audit Strategy

We need to manually review EVERY file that was touched by the migration scripts and fix them properly, one at a time.

### Phase 1: Identify All Changed Files

```bash
# Find all files modified on Nov 14 (migration day)
git log --since="2024-11-14" --until="2024-11-15" --name-only --pretty=format: | sort | uniq

# Find all files that import from 'next' or '@aws-amplify'
grep -r "from 'next" src/ --include="*.tsx" --include="*.ts" -l
grep -r "from '@aws-amplify" src/ --include="*.tsx" --include="*.ts" -l

# Find all files with React.lazy (converted from dynamic())
grep -r "React.lazy" src/ --include="*.tsx" --include="*.ts" -l

# Find all files with useNavigate (converted from useRouter)
grep -r "useNavigate" src/ --include="*.tsx" --include="*.ts" -l
```

### Phase 2: Categorize Files by Impact

#### High Priority (Breaks Core Functionality)
- [ ] `src/main.tsx` - Entry point, theme provider
- [ ] `src/App.tsx` - Root component, routing
- [ ] `src/components/AppLayout.tsx` - Layout wrapper, dark mode
- [ ] `src/pages/ChatPage.tsx` - Main chat interface
- [ ] `src/pages/CatalogPage.tsx` - Data catalog
- [ ] `src/components/ChatBox.tsx` - Chat input/messages

#### Medium Priority (Breaks Features)
- [ ] All page components in `src/pages/`
- [ ] All components that use routing
- [ ] All components that fetch data
- [ ] All components with dynamic imports

#### Low Priority (Cosmetic/Minor)
- [ ] Utility functions
- [ ] Type definitions
- [ ] Test files

### Phase 3: Manual Review Process

For EACH file, we will:

1. **Read the original version** (from git history before Nov 14)
2. **Read the current version** (after migration)
3. **Identify what changed** (line by line diff)
4. **Understand WHY it changed** (was it necessary?)
5. **Determine if it's correct** (does it work the same way?)
6. **Fix if broken** (manual correction, not scripts)
7. **Test the fix** (verify it works)
8. **Document the change** (what we fixed and why)

### Phase 4: Specific Issues to Fix

#### Issue 1: Theme System
**File**: `src/main.tsx`
**Problem**: ThemeProvider hardcoded to light theme
**Status**: ✅ FIXED (created stateful ThemedApp wrapper)

#### Issue 2: Router Conversion
**Files**: All files using `useRouter()` → `useNavigate()`
**Problem**: Different APIs, different behavior
**Status**: ❌ NEEDS AUDIT

**What to check:**
```typescript
// Next.js
const router = useRouter();
router.push('/path');
router.query.id;
router.pathname;

// React Router
const navigate = useNavigate();
const { id } = useParams();
const location = useLocation();
navigate('/path');
```

#### Issue 3: Dynamic Imports
**Files**: All files using `dynamic()` → `React.lazy()`
**Problem**: Different loading behavior, no SSR option
**Status**: ❌ NEEDS AUDIT

**What to check:**
```typescript
// Next.js
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// React
const Plot = React.lazy(() => import('react-plotly.js'));
// Need to wrap in <Suspense> with fallback
```

#### Issue 4: Data Fetching
**Files**: All files that previously used `getServerSideProps` or `getStaticProps`
**Problem**: No SSR, must fetch client-side
**Status**: ❌ NEEDS AUDIT

**What to check:**
```typescript
// Next.js
export async function getServerSideProps() {
  const data = await fetchData();
  return { props: { data } };
}

// React
function Component() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetchData().then(setData);
  }, []);
}
```

#### Issue 5: CSS Modules
**Files**: All files using CSS Modules (`.module.css`)
**Problem**: May have been converted to global CSS
**Status**: ❌ NEEDS AUDIT

**What to check:**
- Are CSS Module imports still present?
- Are class names scoped or global?
- Are there naming conflicts?

#### Issue 6: Amplify Client
**Files**: All files using `generateClient()` from Amplify
**Problem**: Needs to be replaced with REST API calls
**Status**: ❌ NEEDS AUDIT

**What to check:**
```typescript
// Amplify
const client = generateClient();
const result = await client.models.ChatMessage.create({ ... });

// REST API
const result = await fetch('/api/chat-messages', {
  method: 'POST',
  body: JSON.stringify({ ... })
});
```

### Phase 5: Testing Strategy

For each fixed file:

1. **Unit test** - Does the component render?
2. **Integration test** - Does it work with other components?
3. **E2E test** - Does the user workflow work?
4. **Visual test** - Does it look correct?
5. **Dark mode test** - Does it work in both themes?

### Phase 6: Documentation

For each fix, document:
- What was broken
- Why it was broken
- How we fixed it
- How to prevent it in the future

## Execution Plan

### Step 1: Create Audit Checklist
Generate a complete list of all files that need review.

### Step 2: Review High Priority Files
Start with files that break core functionality.

### Step 3: Fix One File at a Time
- Read original
- Read current
- Identify changes
- Fix if broken
- Test
- Document
- Commit

### Step 4: Review Medium Priority Files
Continue with feature-breaking files.

### Step 5: Review Low Priority Files
Finish with cosmetic/minor files.

### Step 6: Full System Test
Test the entire application end-to-end.

### Step 7: Document Lessons Learned
Create guidelines to prevent this in the future.

## Commands to Run

### Generate File List
```bash
# All TypeScript/TSX files in src
find src -type f \( -name "*.ts" -o -name "*.tsx" \) | sort > files-to-audit.txt

# Files modified on Nov 14
git log --since="2024-11-14" --until="2024-11-15" --name-only --pretty=format: | sort | uniq > files-changed-nov14.txt

# Files with Next.js imports (should be none now)
grep -r "from 'next" src/ --include="*.tsx" --include="*.ts" -l > files-with-next.txt

# Files with React Router (converted from Next.js)
grep -r "useNavigate\|useParams\|useLocation" src/ --include="*.tsx" --include="*.ts" -l > files-with-router.txt

# Files with React.lazy (converted from dynamic)
grep -r "React.lazy" src/ --include="*.tsx" --include="*.ts" -l > files-with-lazy.txt
```

### Compare Original vs Current
```bash
# For each file, show diff from before Nov 14
git log --before="2024-11-14" --format=%H -n 1  # Get commit hash
git diff <hash> HEAD -- src/pages/ChatPage.tsx  # Show changes
```

## Next Steps

1. Run the commands above to generate file lists
2. Start with `src/main.tsx` (already fixed)
3. Move to `src/App.tsx`
4. Then `src/components/AppLayout.tsx`
5. Then all page components
6. Then all other components

**NO MORE SCRIPTS. MANUAL REVIEW ONLY.**
