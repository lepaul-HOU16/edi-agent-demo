# Adaptive Response Templating System - Design Document

## Overview

The Adaptive Response Templating System is a flexible rendering engine that transforms agent response data into consistent UI components without requiring rigid schemas. The system analyzes data structure patterns and automatically selects appropriate rendering strategies, enabling agents to return diverse data formats while maintaining a cohesive user experience.

**Core Philosophy**: Data structure drives rendering decisions. The system detects patterns (key-value pairs, arrays, nested objects, artifacts) and applies corresponding UI templates.

## Architecture

### High-Level Architecture

```
Agent Response Data
        ↓
Data Structure Analyzer
        ↓
Component Detector (pattern matching)
        ↓
Component Registry (lookup rendering strategy)
        ↓
Renderer (compose UI components)
        ↓
Rendered UI Output
```

### Component Flow

1. **Input**: Agent returns JSON response with arbitrary structure
2. **Analysis**: System analyzes data shape, depth, field types
3. **Detection**: Pattern matchers identify component types
4. **Selection**: Registry returns appropriate renderer for each component
5. **Composition**: Renderers compose into final UI layout
6. **Output**: React components rendered to DOM



## Components and Interfaces

### Core Component Types

#### 1. Container
The outer wrapper that holds all response content.

```typescript
interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}
```

**Rendering Rules**:
- Always wraps all other components
- Provides consistent padding and spacing
- Handles responsive layout

#### 2. Header
Title and description at the top of responses.

```typescript
interface HeaderData {
  title: string;
  description?: string;
  subtitle?: string;
}
```

**Detection Pattern**:
```typescript
function isHeader(data: any): data is HeaderData {
  return typeof data === 'object' 
    && 'title' in data 
    && typeof data.title === 'string';
}
```

#### 3. Key-Value Pairs
Label-value display with optional status indicators.

```typescript
interface KeyValueData {
  label: string;
  value: string | number;
  status?: 'good' | 'warning' | 'error' | 'neutral';
  unit?: string;
  description?: string;
}
```

**Detection Pattern**:
```typescript
function isKeyValuePair(data: any): data is KeyValueData {
  return typeof data === 'object'
    && 'label' in data
    && 'value' in data;
}
```



#### 4. Table
Structured data in rows and columns.

```typescript
interface TableData {
  headers: string[];
  rows: Array<Record<string, any>>;
  caption?: string;
}
```

**Detection Pattern**:
```typescript
function isTable(data: any): boolean {
  if (!Array.isArray(data) || data.length === 0) return false;
  
  // Check if all items have same keys (uniform structure)
  const firstKeys = Object.keys(data[0]).sort();
  return data.every(item => {
    const keys = Object.keys(item).sort();
    return keys.length === firstKeys.length 
      && keys.every((k, i) => k === firstKeys[i]);
  });
}
```

#### 5. List
Non-uniform array data or bullet points.

```typescript
interface ListData {
  items: Array<string | { text: string; icon?: string; status?: string }>;
  ordered?: boolean;
}
```

**Detection Pattern**:
```typescript
function isList(data: any): boolean {
  return Array.isArray(data) && !isTable(data);
}
```

#### 6. Tabs
Multiple related views of data.

```typescript
interface TabsData {
  tabs: Array<{
    id: string;
    label: string;
    content: any; // Recursively rendered
  }>;
  defaultTab?: string;
}
```

**Detection Pattern**:
```typescript
function isTabs(data: any): boolean {
  return typeof data === 'object'
    && Object.keys(data).length > 1
    && Object.keys(data).every(key => 
      typeof data[key] === 'object' && data[key] !== null
    );
}
```



#### 7. Artifact
Rich visualizations, charts, or embedded content.

```typescript
interface ArtifactData {
  type: 'chart' | 'map' | 'image' | 'visualization' | 'custom';
  data: any;
  config?: Record<string, any>;
  caption?: string;
}
```

**Detection Pattern**:
```typescript
function isArtifact(data: any): data is ArtifactData {
  return typeof data === 'object'
    && 'type' in data
    && ['chart', 'map', 'image', 'visualization', 'custom'].includes(data.type);
}
```

## Data Models

### Response Data Structure

```typescript
interface AgentResponse {
  // Optional header
  header?: HeaderData;
  
  // Main content (can be any structure)
  content: any;
  
  // Optional metadata
  metadata?: {
    timestamp?: string;
    agentId?: string;
    confidence?: number;
  };
}
```

### Component Registry

```typescript
interface ComponentRenderer {
  name: string;
  priority: number; // Higher = checked first
  detect: (data: any) => boolean;
  render: (data: any, context: RenderContext) => React.ReactNode;
}

interface RenderContext {
  depth: number; // Current nesting level
  maxDepth: number; // Maximum allowed depth
  parentType?: string; // Parent component type
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Detection Determinism
*For any* agent response data, running the detection logic multiple times should always produce the same component type selection.
**Validates: Requirements 2.1**

### Property 2: Graceful Degradation
*For any* malformed or unexpected data structure, the system should render without throwing errors, falling back to safe default rendering.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 3: Component Composition Consistency
*For any* nested data structure, the rendered output should maintain consistent spacing, alignment, and visual hierarchy regardless of nesting depth.
**Validates: Requirements 1.3**

### Property 4: Type Safety Preservation
*For any* component renderer, the input data type should match the expected interface, or the renderer should not be selected.
**Validates: Requirements 3.4**

### Property 5: Extensibility Without Breaking Changes
*For any* new component type added to the registry, existing component renderers should continue to function without modification.
**Validates: Requirements 7.2, 7.3**



## Error Handling

### Detection Failures
- **Ambiguous Structure**: If multiple detectors match, use highest priority
- **No Match**: Fall back to default text renderer
- **Circular References**: Detect and break cycles, render as text

### Rendering Failures
- **Missing Required Fields**: Render available fields, skip missing
- **Type Mismatches**: Coerce to string, display with warning indicator
- **Depth Limit Exceeded**: Truncate at max depth, show "..." indicator

### Edge Cases
- **Empty Data**: Render empty state message
- **Null/Undefined**: Skip rendering, don't break layout
- **Very Large Arrays**: Paginate or virtualize, don't render all at once
- **Mixed Types in Arrays**: Treat as list, not table

## Testing Strategy

### Unit Testing
- Test each detector function with valid and invalid inputs
- Test each renderer with expected data structures
- Test edge cases (null, undefined, empty, malformed)
- Test type coercion and fallback logic

### Property-Based Testing
Property-based tests will use **fast-check** library for TypeScript/JavaScript.

Each property test should run minimum 100 iterations.

Property tests must be tagged with format: **Feature: adaptive-response-templating, Property {number}: {property_text}**



## Implementation Examples

### Example 1: Detection Logic

```typescript
// Core detection engine
class ComponentDetector {
  private renderers: ComponentRenderer[] = [];
  
  register(renderer: ComponentRenderer): void {
    this.renderers.push(renderer);
    this.renderers.sort((a, b) => b.priority - a.priority);
  }
  
  detect(data: any, context: RenderContext): ComponentRenderer | null {
    for (const renderer of this.renderers) {
      if (renderer.detect(data)) {
        return renderer;
      }
    }
    return null; // Will use default renderer
  }
}

// Example: Key-Value Pair Detector
const keyValueRenderer: ComponentRenderer = {
  name: 'key-value',
  priority: 50,
  detect: (data: any) => {
    return typeof data === 'object'
      && data !== null
      && 'label' in data
      && 'value' in data;
  },
  render: (data: KeyValueData, context: RenderContext) => {
    return (
      <div className="key-value-pair">
        <span className="label">{data.label}:</span>
        <span className={`value status-${data.status || 'neutral'}`}>
          {data.value} {data.unit || ''}
        </span>
      </div>
    );
  }
};
```

### Example 2: Adaptive Rendering

```typescript
// Main rendering function
function renderAdaptive(data: any, context: RenderContext = { depth: 0, maxDepth: 5 }): React.ReactNode {
  // Depth limit check
  if (context.depth >= context.maxDepth) {
    return <span className="truncated">...</span>;
  }
  
  // Null/undefined check
  if (data == null) {
    return null;
  }
  
  // Detect component type
  const detector = new ComponentDetector();
  const renderer = detector.detect(data, context);
  
  // Use detected renderer or fall back to default
  if (renderer) {
    return renderer.render(data, { ...context, depth: context.depth + 1 });
  }
  
  // Default: render as string
  return <span className="default-text">{String(data)}</span>;
}
```



### Example 3: Real Response Data Mapping

#### Case 1: Block Details (from mockup)

**Input Data**:
```json
{
  "header": {
    "title": "Block PM447 details",
    "description": "High level insights covering geology, reservoir, and economics."
  },
  "tabs": {
    "Overview": {
      "metrics": [
        { "label": "Seismic continuity", "value": "Good (78%)", "status": "good" },
        { "label": "Prospectivity signal", "value": "Above average (0.71)", "status": "good" },
        { "label": "Estimated in place volume", "value": "Mid-sized (GIP 3.1 - 4.6 Tcf)", "status": "warning" },
        { "label": "Reservoir depth range", "value": "Shallow (2,800-3,400m TVD)", "status": "good" },
        { "label": "Indicative breakeven price", "value": "Low ($3/bbl)", "status": "good" },
        { "label": "CAPEX intensity", "value": "Low ($6/boe)", "status": "good" }
      ],
      "snapshot": {
        "title": "Block snapshot",
        "items": [
          { "text": "Strong hydrocarbon indicators, with proven hydrocarbon system in adjacent blocks", "icon": "check" },
          { "text": "High-quality 3D seismic coverage", "icon": "check" },
          { "text": "Limited 3D seismic coverage in northern section", "icon": "warning" },
          { "text": "Low reservoir depth reduces technical complexity", "icon": "check" },
          { "text": "Roughly 620-820 MBOE at recovery estimate of 60-70% (industry typical)", "icon": "check" },
          { "text": "Proximity to existing infrastructure reduces CAPEX", "icon": "check" },
          { "text": "Favorable fiscal terms under Malaysia PSC framework", "icon": "check" }
        ]
      },
      "mbr2026": {
        "title": "MBR 2026 information",
        "fields": [
          { "label": "Submission deadline", "value": "14 May 2026" },
          { "label": "Fiscal term", "value": "Enhanced profitability terms" },
          { "label": "Work commitment", "value": "2 wells minimum" }
        ]
      }
    },
    "Geology": { /* ... */ },
    "Reservoir": { /* ... */ },
    "Economics": { /* ... */ }
  }
}
```



**Detection Flow**:
1. Top level has `header` → Render Header component
2. Top level has `tabs` with multiple keys → Render Tabs component
3. Inside "Overview" tab:
   - `metrics` is array of objects with `label`, `value`, `status` → Render as grid of Key-Value Pairs
   - `snapshot` has `title` and `items` array → Render as titled List
   - `mbr2026` has `title` and `fields` array → Render as titled Key-Value Pairs

**Rendered Output**:
```tsx
<Container>
  <Header title="Block PM447 details" description="High level insights..." />
  <Tabs defaultTab="Overview">
    <Tab id="Overview" label="Overview">
      <KeyValueGrid>
        <KeyValuePair label="Seismic continuity" value="Good (78%)" status="good" />
        <KeyValuePair label="Prospectivity signal" value="Above average (0.71)" status="good" />
        {/* ... more metrics */}
      </KeyValueGrid>
      
      <Section title="Block snapshot">
        <List>
          <ListItem icon="check">Strong hydrocarbon indicators...</ListItem>
          <ListItem icon="check">High-quality 3D seismic coverage</ListItem>
          <ListItem icon="warning">Limited 3D seismic coverage...</ListItem>
          {/* ... more items */}
        </List>
      </Section>
      
      <Section title="MBR 2026 information">
        <KeyValueList>
          <KeyValuePair label="Submission deadline" value="14 May 2026" />
          <KeyValuePair label="Fiscal term" value="Enhanced profitability terms" />
          <KeyValuePair label="Work commitment" value="2 wells minimum" />
        </KeyValueList>
      </Section>
    </Tab>
    <Tab id="Geology" label="Geology">{/* ... */}</Tab>
    <Tab id="Reservoir" label="Reservoir">{/* ... */}</Tab>
    <Tab id="Economics" label="Economics">{/* ... */}</Tab>
  </Tabs>
</Container>
```



#### Case 2: Simple Key-Value Response

**Input Data**:
```json
{
  "temperature": { "label": "Temperature", "value": 72, "unit": "°F" },
  "humidity": { "label": "Humidity", "value": 45, "unit": "%" },
  "pressure": { "label": "Pressure", "value": 1013, "unit": "hPa" }
}
```

**Detection**: Object with multiple key-value pairs → Render as Key-Value Grid

**Rendered Output**:
```tsx
<Container>
  <KeyValueGrid>
    <KeyValuePair label="Temperature" value="72" unit="°F" />
    <KeyValuePair label="Humidity" value="45" unit="%" />
    <KeyValuePair label="Pressure" value="1013" unit="hPa" />
  </KeyValueGrid>
</Container>
```

#### Case 3: Table Data

**Input Data**:
```json
{
  "wells": [
    { "name": "WELL-001", "depth": 3200, "status": "active" },
    { "name": "WELL-002", "depth": 2800, "status": "active" },
    { "name": "WELL-003", "depth": 3500, "status": "inactive" }
  ]
}
```

**Detection**: Array with uniform object structure → Render as Table

**Rendered Output**:
```tsx
<Container>
  <Table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Depth</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>WELL-001</td><td>3200</td><td>active</td></tr>
      <tr><td>WELL-002</td><td>2800</td><td>active</td></tr>
      <tr><td>WELL-003</td><td>3500</td><td>inactive</td></tr>
    </tbody>
  </Table>
</Container>
```



#### Case 4: Artifact with Context

**Input Data**:
```json
{
  "header": {
    "title": "Porosity Analysis Results",
    "description": "Density-based porosity calculation for WELL-001"
  },
  "artifact": {
    "type": "chart",
    "data": {
      "chartType": "line",
      "series": [
        { "name": "Porosity", "data": [[2800, 0.15], [2850, 0.18], [2900, 0.16]] }
      ],
      "xAxis": { "title": "Depth (m)" },
      "yAxis": { "title": "Porosity (fraction)" }
    }
  },
  "summary": {
    "avgPorosity": { "label": "Average Porosity", "value": 0.163, "unit": "fraction" },
    "maxPorosity": { "label": "Maximum Porosity", "value": 0.18, "unit": "fraction" },
    "minPorosity": { "label": "Minimum Porosity", "value": 0.15, "unit": "fraction" }
  }
}
```

**Detection**:
1. Top level has `header` → Render Header
2. Has `artifact` with `type` and `data` → Render Artifact
3. Has `summary` with key-value pairs → Render Key-Value Grid

**Rendered Output**:
```tsx
<Container>
  <Header title="Porosity Analysis Results" description="Density-based porosity..." />
  <Artifact type="chart" data={chartData} />
  <KeyValueGrid>
    <KeyValuePair label="Average Porosity" value="0.163" unit="fraction" />
    <KeyValuePair label="Maximum Porosity" value="0.18" unit="fraction" />
    <KeyValuePair label="Minimum Porosity" value="0.15" unit="fraction" />
  </KeyValueGrid>
</Container>
```



#### Case 5: Edge Case - Mixed/Malformed Data

**Input Data**:
```json
{
  "title": "Analysis Results",
  "data": [
    "First item is a string",
    { "name": "Second item is object", "value": 123 },
    null,
    42,
    { "different": "structure", "keys": "here" }
  ],
  "missingField": null,
  "": "empty key"
}
```

**Detection**:
1. Has `title` string → Extract as header
2. `data` is array with mixed types → Render as List (not table)
3. `missingField` is null → Skip
4. Empty key → Skip or render with placeholder label

**Rendered Output**:
```tsx
<Container>
  <Header title="Analysis Results" />
  <List>
    <ListItem>First item is a string</ListItem>
    <ListItem>Second item is object: {"name": "Second item is object", "value": 123}</ListItem>
    <ListItem>42</ListItem>
    <ListItem>{"different": "structure", "keys": "here"}</ListItem>
  </List>
</Container>
```

## Styling Guidelines

### Layout Patterns

**Container**:
- Max width: 1200px
- Padding: 24px
- Background: white (light mode) / dark gray (dark mode)
- Border radius: 8px
- Box shadow: subtle elevation

**Grid Layout** (for Key-Value Pairs):
- Display: CSS Grid
- Columns: auto-fit, minmax(250px, 1fr)
- Gap: 16px
- Responsive: stacks on mobile

**Flex Layout** (for inline elements):
- Display: flex
- Align items: center
- Gap: 8px



### Color System

**Status Indicators**:
- Good/Success: Green (#10b981 / emerald-500)
- Warning/Caution: Yellow (#f59e0b / amber-500)
- Error/Critical: Red (#ef4444 / red-500)
- Neutral/Info: Blue (#3b82f6 / blue-500)
- Default: Gray (#6b7280 / gray-500)

**Status Indicator Rendering**:
```tsx
// Colored dot before value
<span className="flex items-center gap-2">
  <span className={`w-2 h-2 rounded-full bg-${statusColor}`} />
  <span>{value}</span>
</span>
```

### Typography Hierarchy

**Headers**:
- H1 (Page title): 2rem (32px), font-weight: 700
- H2 (Section title): 1.5rem (24px), font-weight: 600
- H3 (Subsection): 1.25rem (20px), font-weight: 600
- Description text: 0.875rem (14px), color: gray-600

**Body Text**:
- Label: 0.875rem (14px), font-weight: 500, color: gray-700
- Value: 1rem (16px), font-weight: 400, color: gray-900
- Unit: 0.875rem (14px), color: gray-500

**Code/Monospace**:
- Font family: 'Monaco', 'Courier New', monospace
- Font size: 0.875rem (14px)
- Background: gray-100
- Padding: 2px 4px
- Border radius: 4px

### Spacing System

- xs: 4px
- sm: 8px
- md: 16px
- lg: 24px
- xl: 32px
- 2xl: 48px

**Component Spacing**:
- Between sections: lg (24px)
- Between items in list: sm (8px)
- Between label and value: xs (4px)
- Container padding: lg (24px)



### Responsive Behavior

**Breakpoints**:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

**Responsive Rules**:
- Key-Value Grid: 1 column on mobile, 2 on tablet, 3 on desktop
- Tables: Horizontal scroll on mobile, full width on desktop
- Tabs: Scrollable horizontal tabs on mobile, full tab bar on desktop
- Container padding: 16px on mobile, 24px on desktop

## Vendor Implementation Guide

### Step 1: Define Core Interfaces

Create TypeScript interfaces for all component types (see Components and Interfaces section).

### Step 2: Implement Component Registry

```typescript
class ComponentRegistry {
  private renderers: Map<string, ComponentRenderer> = new Map();
  
  register(renderer: ComponentRenderer): void {
    this.renderers.set(renderer.name, renderer);
  }
  
  getAll(): ComponentRenderer[] {
    return Array.from(this.renderers.values())
      .sort((a, b) => b.priority - a.priority);
  }
}
```

### Step 3: Implement Detection Engine

```typescript
function detectComponentType(data: any, registry: ComponentRegistry): ComponentRenderer | null {
  for (const renderer of registry.getAll()) {
    if (renderer.detect(data)) {
      return renderer;
    }
  }
  return null;
}
```

### Step 4: Implement Renderers

Create a renderer for each component type. Each renderer should:
1. Have a detection function
2. Have a render function
3. Handle edge cases gracefully
4. Support recursive rendering for nested content



### Step 5: Create Main Rendering Function

```typescript
export function renderResponse(
  data: any,
  registry: ComponentRegistry,
  context: RenderContext = { depth: 0, maxDepth: 5 }
): React.ReactNode {
  // Safety checks
  if (data == null) return null;
  if (context.depth >= context.maxDepth) {
    return <span className="truncated">...</span>;
  }
  
  // Detect component type
  const renderer = detectComponentType(data, registry);
  
  // Render with detected renderer or fall back
  if (renderer) {
    try {
      return renderer.render(data, {
        ...context,
        depth: context.depth + 1,
        renderChild: (childData: any) => 
          renderResponse(childData, registry, { ...context, depth: context.depth + 1 })
      });
    } catch (error) {
      console.error('Renderer error:', error);
      return <span className="error">Error rendering component</span>;
    }
  }
  
  // Default fallback
  return <span className="default-text">{String(data)}</span>;
}
```

### Step 6: Register Built-in Renderers

```typescript
const registry = new ComponentRegistry();

// Register in priority order (highest first)
registry.register(artifactRenderer);     // Priority: 100
registry.register(tabsRenderer);         // Priority: 90
registry.register(tableRenderer);        // Priority: 80
registry.register(keyValueRenderer);     // Priority: 70
registry.register(listRenderer);         // Priority: 60
registry.register(headerRenderer);       // Priority: 50
```

### Step 7: Usage in Application

```typescript
// In your chat component
function ChatMessage({ message }: { message: AgentMessage }) {
  const registry = useComponentRegistry(); // Get singleton registry
  
  return (
    <div className="chat-message">
      {renderResponse(message.content, registry)}
    </div>
  );
}
```



## Agent Response Guidelines

### Recommended Patterns

**For Key-Value Data**:
```json
{
  "fieldName": {
    "label": "Human Readable Label",
    "value": "actual value",
    "status": "good|warning|error|neutral",
    "unit": "optional unit"
  }
}
```

**For Tabbed Content**:
```json
{
  "tabs": {
    "TabName1": { /* content */ },
    "TabName2": { /* content */ }
  }
}
```

**For Lists**:
```json
{
  "items": [
    { "text": "Item text", "icon": "check|warning|error", "status": "good|warning|error" },
    "Simple string items also work"
  ]
}
```

**For Tables**:
```json
{
  "data": [
    { "col1": "value1", "col2": "value2" },
    { "col1": "value3", "col2": "value4" }
  ]
}
```

**For Artifacts**:
```json
{
  "artifact": {
    "type": "chart|map|image|visualization",
    "data": { /* artifact-specific data */ },
    "config": { /* optional configuration */ }
  }
}
```

### Anti-Patterns to Avoid

❌ **Inconsistent Key Names**:
```json
// BAD: Mixing naming conventions
{ "some_field": "value", "otherField": "value", "Yet-Another": "value" }
```

✅ **Use Consistent camelCase**:
```json
{ "someField": "value", "otherField": "value", "yetAnother": "value" }
```

❌ **Deeply Nested Structures**:
```json
// BAD: Too deep
{ "level1": { "level2": { "level3": { "level4": { "level5": "value" } } } } }
```

✅ **Flatten When Possible**:
```json
{ "level1_level2_level3": "value" }
```

❌ **Mixed Array Types**:
```json
// BAD: Inconsistent structure makes table detection fail
[
  { "name": "Item 1", "value": 100 },
  { "name": "Item 2", "price": 200 },  // Different keys
  "String item"  // Different type
]
```

✅ **Uniform Structure**:
```json
[
  { "name": "Item 1", "value": 100, "price": null },
  { "name": "Item 2", "value": null, "price": 200 }
]
```



## Extension Points

### Adding New Component Types

To add a new component type:

1. **Define the interface**:
```typescript
interface MyCustomData {
  customField: string;
  // ... other fields
}
```

2. **Create detection function**:
```typescript
function isMyCustom(data: any): data is MyCustomData {
  return typeof data === 'object'
    && 'customField' in data
    && typeof data.customField === 'string';
}
```

3. **Create renderer**:
```typescript
const myCustomRenderer: ComponentRenderer = {
  name: 'my-custom',
  priority: 75, // Choose appropriate priority
  detect: isMyCustom,
  render: (data: MyCustomData, context: RenderContext) => {
    return <MyCustomComponent data={data} />;
  }
};
```

4. **Register with registry**:
```typescript
registry.register(myCustomRenderer);
```

### Customizing Existing Renderers

To override default rendering behavior:

```typescript
// Create custom renderer with higher priority
const customKeyValueRenderer: ComponentRenderer = {
  name: 'custom-key-value',
  priority: 71, // Higher than default (70)
  detect: (data: any) => {
    // Same detection as default, or more specific
    return isKeyValuePair(data) && data.customFlag === true;
  },
  render: (data: KeyValueData, context: RenderContext) => {
    // Custom rendering logic
    return <CustomKeyValueComponent data={data} />;
  }
};

registry.register(customKeyValueRenderer);
```

The higher priority ensures your custom renderer is checked before the default.



## Performance Considerations

### Optimization Strategies

1. **Memoization**: Cache detection results for identical data structures
2. **Lazy Loading**: Load artifact renderers only when needed
3. **Virtualization**: For large lists/tables, render only visible items
4. **Depth Limiting**: Prevent infinite recursion with max depth check

### Example: Memoized Detection

```typescript
import { useMemo } from 'react';

function ChatMessage({ message }: { message: AgentMessage }) {
  const registry = useComponentRegistry();
  
  // Memoize rendering based on message content
  const rendered = useMemo(() => {
    return renderResponse(message.content, registry);
  }, [message.content, registry]);
  
  return <div className="chat-message">{rendered}</div>;
}
```

## Summary for Partner Vendor

**What to Implement**:

1. **Core Interfaces** - TypeScript types for all component data structures
2. **Component Registry** - System to register and retrieve renderers
3. **Detection Engine** - Logic to analyze data and select appropriate renderer
4. **Built-in Renderers** - 7 core component types (Container, Header, Key-Value, Table, List, Tabs, Artifact)
5. **Main Render Function** - Recursive rendering with depth limiting and error handling
6. **Styling** - CSS/Tailwind classes matching design system
7. **Extension API** - Allow custom component types to be registered

**Key Principles**:

- Data structure drives rendering decisions
- Graceful degradation for unexpected data
- Type-safe with TypeScript
- Extensible via registry pattern
- Performance-optimized with memoization
- Responsive and accessible UI

**Deliverables**:

- TypeScript source code for all components
- CSS/styling implementation
- Documentation for adding custom components
- Example agent responses and expected output
- Unit tests for detection and rendering logic
