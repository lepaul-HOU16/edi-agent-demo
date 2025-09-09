# HTML File Rendering Issues - Diagnosis and Solutions

## Problem Analysis

Based on the code review, several potential issues could prevent HTML files from rendering properly:

### 1. Complex iframe Rendering Logic
The `FileViewer.tsx` component uses a complex iframe implementation with:
- `srcDoc` instead of direct URL loading
- Injected JavaScript for auto-resizing
- `postMessage` communication for height adjustments
- Inline styles and scripts that may be blocked by CSP

### 2. Content Security Policy Issues
- No explicit CSP configuration in `next.config.js`
- Browser default CSP may block inline scripts in iframes
- The injected JavaScript for iframe resizing could be blocked

### 3. Iframe Security Restrictions
- Modern browsers restrict iframe content execution
- Cross-origin restrictions may prevent proper communication
- `srcDoc` approach may have security limitations

## Identified Issues in Current Implementation

### FileViewer Component Problems:
1. **Complex srcDoc Implementation**: Lines 181-300+ use overly complex iframe logic
2. **Inline Script Injection**: Potential CSP violations with injected resize scripts
3. **Multiple Fallback Mechanisms**: Confusing logic that may conflict

### File Route Handler:
1. **Cache Headers**: Aggressive no-cache headers might interfere with rendering
2. **Content-Type**: While set correctly, may conflict with iframe expectations

## Recommended Solutions

### Solution 1: Simplified Direct Iframe Loading
Replace the complex `srcDoc` logic with direct URL loading:

```tsx
// For HTML files, use direct URL instead of srcDoc
if (isHtmlFile) {
  return (
    <div className="w-full relative">
      <iframe
        src={`/file/${s3KeyDecoded}`}
        className="w-full"
        style={{
          border: 'none',
          width: '100%',
          minHeight: '600px',
          height: '100vh'
        }}
        title="HTML File Viewer"
        sandbox="allow-same-origin allow-scripts allow-forms"
      />
    </div>
  );
}
```

### Solution 2: Add CSP Configuration
Update `next.config.js` to allow iframe content:

```javascript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/file/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;"
          }
        ]
      }
    ]
  }
}
```

### Solution 3: Enhanced File Route Headers
Modify `/src/app/file/[...s3Key]/route.ts` headers for HTML files:

```typescript
// For HTML files, use different cache strategy
if (s3KeyDecoded.endsWith('.html')) {
  headers['Cache-Control'] = 'public, max-age=300';
  headers['X-Frame-Options'] = 'SAMEORIGIN';
  headers['Content-Security-Policy'] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;";
}
```

## Testing Steps

1. **Test Direct URL Access**: Visit `/file/chatSessionArtifacts/sessionId=add55b8a-c520-4533-81e4-12e8d1173fa2/reports/shale_volume_report.html` directly
2. **Check Browser Console**: Look for CSP violations or script errors
3. **Test in Different Browsers**: Chrome, Firefox, Safari may handle differently
4. **Inspect Network Tab**: Check if all resources load correctly

## Quick Fix Implementation

The simplest fix is to replace the complex iframe logic with direct URL loading, which should resolve most rendering issues while maintaining security.
