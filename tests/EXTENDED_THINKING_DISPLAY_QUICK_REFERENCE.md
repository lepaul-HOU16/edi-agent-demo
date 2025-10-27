# Extended Thinking Display - Quick Reference

## Component Overview
The `ExtendedThinkingDisplay` component renders Claude's internal reasoning process in an expandable, visually appealing format.

## Import
```typescript
import { ExtendedThinkingDisplay, ThinkingBlock } from '@/components/renewable';
```

## Basic Usage
```typescript
const thinkingBlocks: ThinkingBlock[] = [
  {
    type: 'thinking',
    content: 'Analyzing terrain data for optimal turbine placement...',
    timestamp: Date.now()
  },
  {
    type: 'thinking',
    content: 'Considering wind patterns and topography constraints...',
    timestamp: Date.now() + 1000
  }
];

<ExtendedThinkingDisplay 
  thinking={thinkingBlocks} 
  defaultExpanded={false} 
/>
```

## Props

### `thinking: ThinkingBlock[]` (required)
Array of thinking blocks to display.

**ThinkingBlock Interface:**
```typescript
interface ThinkingBlock {
  type: 'thinking';
  content: string;
  timestamp: number;  // Unix timestamp in milliseconds
}
```

### `defaultExpanded?: boolean` (optional)
Whether the component should be expanded by default.
- Default: `false`
- Set to `true` to show thinking blocks immediately

## Features

### 1. Expand/Collapse
- Click header to toggle visibility
- Shows step count in header
- Smooth animation

### 2. Thinking Blocks
- Each block shows:
  - Timestamp (formatted as HH:MM:SS)
  - Step number
  - Content (preserves whitespace and formatting)

### 3. Visual Design
- Purple theme for thinking blocks
- Clear visual hierarchy
- Professional styling

## Examples

### Single Thinking Block
```typescript
<ExtendedThinkingDisplay 
  thinking={[
    {
      type: 'thinking',
      content: 'Analyzing request parameters...',
      timestamp: Date.now()
    }
  ]} 
/>
```

### Multiple Steps
```typescript
<ExtendedThinkingDisplay 
  thinking={[
    {
      type: 'thinking',
      content: 'Step 1: Analyzing terrain data\nExamining topography and land use patterns.',
      timestamp: Date.now()
    },
    {
      type: 'thinking',
      content: 'Step 2: Identifying constraints\nFinding exclusion zones and setbacks.',
      timestamp: Date.now() + 1000
    },
    {
      type: 'thinking',
      content: 'Step 3: Optimizing placement\nCalculating optimal turbine positions.',
      timestamp: Date.now() + 2000
    }
  ]} 
  defaultExpanded={true}
/>
```

### Empty Array (No Display)
```typescript
<ExtendedThinkingDisplay thinking={[]} />
// Returns null, nothing rendered
```

## Integration with AiMessageComponent

```typescript
// In AiMessageComponent.tsx
import { ExtendedThinkingDisplay, ThinkingBlock } from '@/components/renewable';

// In render:
{(message as any).thinking && (message as any).thinking.length > 0 && (
  <ExtendedThinkingDisplay 
    thinking={(message as any).thinking} 
    defaultExpanded={false}
  />
)}
```

## Styling

### Colors
- **Primary**: Purple (`#9c27b0`)
- **Background**: Light purple tint
- **Border**: Purple with transparency
- **Hover**: Darker purple tint

### Typography
- **Header**: Bold, 600 weight
- **Content**: System font, line-height 1.6
- **Timestamp**: Monospace font

## Best Practices

### 1. Timestamp Format
Always use milliseconds for timestamps:
```typescript
timestamp: Date.now()  // ✅ Correct
timestamp: Date.now() / 1000  // ❌ Wrong (seconds)
```

### 2. Content Formatting
Preserve newlines and indentation:
```typescript
content: `Line 1
  Indented line 2
    More indented line 3`
```

### 3. Empty Handling
Component gracefully handles empty arrays:
```typescript
<ExtendedThinkingDisplay thinking={thinking || []} />
```

### 4. Default Expansion
For important reasoning, expand by default:
```typescript
<ExtendedThinkingDisplay 
  thinking={criticalThinking} 
  defaultExpanded={true}  // Show immediately
/>
```

## Testing

### Validation Script
```bash
node tests/validate-extended-thinking-display.js
```

### Expected Output
```
✅ Component exists
✅ Interfaces defined
✅ Expand/collapse functionality implemented
✅ Thinking blocks rendering implemented
✅ Timestamp formatting implemented
✅ Visual styling implemented
✅ Core features implemented
✅ Component exported and integration ready
```

## Troubleshooting

### Component Not Rendering
**Problem**: Component doesn't appear  
**Solution**: Check if `thinking` array is empty or undefined

### Timestamps Not Formatted
**Problem**: Timestamps show as numbers  
**Solution**: Ensure timestamps are in milliseconds (not seconds)

### Content Not Preserving Whitespace
**Problem**: Newlines and indentation lost  
**Solution**: Component uses `whiteSpace: 'pre-wrap'` - check content string

### Expand/Collapse Not Working
**Problem**: Click doesn't toggle  
**Solution**: Component uses internal state - ensure React is rendering properly

## Related Components

- **AgentProgressIndicator**: Shows real-time progress during agent execution
- **AiMessageComponent**: Main message component that can integrate thinking display
- **ArtifactRenderer**: Renders various artifact types including thinking

## Files

- **Component**: `src/components/renewable/ExtendedThinkingDisplay.tsx`
- **Export**: `src/components/renewable/index.ts`
- **Validation**: `tests/validate-extended-thinking-display.js`
- **Documentation**: `tests/TASK_7_EXTENDED_THINKING_DISPLAY_COMPLETE.md`

## Status
✅ **Component Complete and Validated**  
⚠️  **Backend Integration Pending** (capturing thinking from Claude responses)
