# Agent vs Tool Lambda Decision Tree

## Visual Decision Tree

```
┌─────────────────────────────────────────────────────────────┐
│         What are you building?                              │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│ Conversational│         │  Specialized  │
│   Interface?  │         │ Computation?  │
└───────┬───────┘         └───────┬───────┘
        │                         │
    ┌───┴───┐                 ┌───┴───┐
    │  YES  │                 │  YES  │
    └───┬───┘                 └───┬───┘
        │                         │
        ▼                         ▼
┌───────────────┐         ┌───────────────┐
│ CREATE AGENT  │         │ CREATE TOOL   │
│               │         │    LAMBDA     │
│ Examples:     │         │               │
│ - Maintenance │         │ Examples:     │
│ - EDIcraft    │         │ - Terrain     │
│ - General     │         │ - Simulation  │
└───────────────┘         └───────────────┘
```

## Detailed Decision Flow

### Question 1: Does it need natural language understanding?

```
Does your component need to:
- Understand user intent from natural language?
- Maintain conversational context?
- Generate human-readable responses?
- Provide thought steps explaining reasoning?

YES → Consider AGENT
NO  → Consider TOOL LAMBDA
```

### Question 2: Does it coordinate multiple operations?

```
Does your component need to:
- Call multiple tools in sequence?
- Make decisions based on intermediate results?
- Manage complex workflows?
- Handle project lifecycle?

YES → Consider ORCHESTRATOR
NO  → Continue to Question 3
```

### Question 3: What's the primary function?

```
A. Process user queries and generate responses
   → CREATE AGENT

B. Perform specialized computation or data processing
   → CREATE TOOL LAMBDA

C. Coordinate multiple tools for complex workflows
   → CREATE ORCHESTRATOR + TOOL LAMBDAS

D. Simple calculation or data retrieval
   → ADD TO EXISTING AGENT
```

## Decision Matrix

| Criteria | Agent | Tool Lambda | Orchestrator |
|----------|-------|-------------|--------------|
| **Natural Language Input** | ✅ Required | ❌ Not needed | ✅ Required |
| **Conversational Context** | ✅ Yes | ❌ No | ✅ Yes |
| **Intent Detection** | ✅ Yes | ❌ No | ✅ Yes |
| **Thought Steps** | ✅ Yes | ❌ No | ✅ Yes |
| **Multiple Tool Coordination** | ⚠️ Limited | ❌ No | ✅ Yes |
| **Heavy Computation** | ❌ No | ✅ Yes | ⚠️ Via Tools |
| **Long Processing Time** | ⚠️ <60s | ✅ <300s | ✅ <300s |
| **Specialized Libraries** | ⚠️ Limited | ✅ Yes | ⚠️ Via Tools |
| **Typical Memory** | 512 MB | 2048 MB | 1024 MB |
| **Typical Timeout** | 60s | 300s | 300s |
| **Response Type** | Text + Artifacts | Data + Artifacts | Text + Artifacts |
| **User Interaction** | Direct | Indirect | Direct |

## Use Case Examples

### ✅ CREATE AN AGENT

**Scenario 1: Maintenance Agent**
- **Input:** "Check status of pump P-101"
- **Needs:** Natural language understanding, conversational responses
- **Decision:** AGENT (no heavy computation needed)

**Scenario 2: General Knowledge Agent**
- **Input:** "What's the weather in Houston?"
- **Needs:** Natural language, Bedrock integration
- **Decision:** AGENT (simple query, no tools needed)

**Scenario 3: EDIcraft Agent**
- **Input:** "Build wellbore trajectory in Minecraft"
- **Needs:** Natural language, tool invocation, conversational
- **Decision:** AGENT + TOOL LAMBDA

### ✅ CREATE A TOOL LAMBDA

**Scenario 1: Terrain Analysis**
- **Input:** Coordinates, radius (structured data)
- **Needs:** OSM data fetching, GIS processing, visualization
- **Decision:** TOOL LAMBDA (heavy computation, specialized libraries)

**Scenario 2: Wake Simulation**
- **Input:** Turbine layout, wind data (structured data)
- **Needs:** Complex physics simulation, Python libraries
- **Decision:** TOOL LAMBDA (specialized computation)

**Scenario 3: Report Generation**
- **Input:** Project data (structured data)
- **Needs:** PDF generation, data aggregation
- **Decision:** TOOL LAMBDA (document processing)

### ✅ CREATE AN ORCHESTRATOR

**Scenario 1: Renewable Energy Analysis**
- **Input:** "Analyze wind farm site at coordinates X, Y"
- **Needs:** Multiple tools (terrain, layout, simulation, report)
- **Decision:** ORCHESTRATOR + TOOL LAMBDAS

**Scenario 2: Multi-Well Correlation**
- **Input:** "Correlate wells A, B, C"
- **Needs:** Multiple analysis steps, data aggregation
- **Decision:** ORCHESTRATOR + TOOL LAMBDAS

### ✅ ADD TO EXISTING AGENT

**Scenario 1: New Petrophysics Calculation**
- **Input:** "Calculate effective porosity"
- **Needs:** Simple calculation, fits existing agent
- **Decision:** ADD TO PETROPHYSICS AGENT

**Scenario 2: New Data Query**
- **Input:** "Show me wells in this area"
- **Needs:** Database query, fits existing agent
- **Decision:** ADD TO EXISTING AGENT

## Architecture Patterns

### Pattern 1: Simple Agent (No Tools)

```
User Query
    ↓
Agent (Intent Detection + Bedrock)
    ↓
Response
```

**When to use:**
- Simple queries
- No heavy computation
- Direct Bedrock responses
- < 60s processing time

**Examples:**
- General knowledge
- Weather queries
- Simple data lookups

### Pattern 2: Agent + Tool Lambda

```
User Query
    ↓
Agent (Intent Detection)
    ↓
Tool Lambda (Computation)
    ↓
Agent (Format Response)
    ↓
Response + Artifacts
```

**When to use:**
- Specialized computation needed
- Heavy processing (60-300s)
- Specialized libraries required
- Single-step workflow

**Examples:**
- Petrophysics calculations
- Single visualization generation
- Data processing

### Pattern 3: Orchestrator + Multiple Tools

```
User Query
    ↓
Proxy Agent (Route to Orchestrator)
    ↓
Orchestrator (Intent Detection + Workflow)
    ↓
Tool Lambda 1 → Tool Lambda 2 → Tool Lambda 3
    ↓
Orchestrator (Aggregate Results)
    ↓
Response + Multiple Artifacts
```

**When to use:**
- Multi-step workflows
- Multiple tools needed
- Complex decision logic
- Project lifecycle management

**Examples:**
- Renewable energy analysis
- Multi-well correlation
- Complex report generation

## Quick Decision Guide

### Start Here: What's your input?

**Natural Language Query**
- "Analyze terrain at..."
- "Check status of..."
- "Generate report for..."

→ **START WITH AGENT**

**Structured Data**
- `{ latitude: 35.0, longitude: -101.0 }`
- `{ wellName: "WELL-001", curves: [...] }`

→ **START WITH TOOL LAMBDA**

### Next: What's your output?

**Conversational Response**
- "I've analyzed the terrain..."
- "The pump status is..."

→ **AGENT**

**Data + Visualization**
- JSON results + HTML map
- Calculation results + charts

→ **TOOL LAMBDA**

**Multiple Artifacts + Narrative**
- Terrain map + Layout + Simulation + Report
- With explanatory text

→ **ORCHESTRATOR**

### Finally: How complex is the processing?

**Simple (<60s)**
- Database query
- API call
- Simple calculation

→ **AGENT**

**Moderate (60-300s)**
- Data processing
- Visualization generation
- Single analysis

→ **TOOL LAMBDA**

**Complex (Multiple steps)**
- Multi-tool coordination
- Sequential processing
- Workflow management

→ **ORCHESTRATOR**

## Common Mistakes

### ❌ Mistake 1: Using Agent for Heavy Computation

**Problem:**
```typescript
// Agent trying to do heavy computation
async processMessage(message: string) {
  // This will timeout!
  const result = await heavyComputation(); // 5 minutes
  return result;
}
```

**Solution:**
```typescript
// Agent delegates to tool Lambda
async processMessage(message: string) {
  const result = await this.invokeToolLambda(params);
  return this.formatResponse(result);
}
```

### ❌ Mistake 2: Using Tool Lambda for Conversational Interface

**Problem:**
```python
# Tool Lambda trying to understand natural language
def handler(event, context):
    message = event['message']
    # How do I parse "analyze terrain near Houston"?
    # This should be in an agent!
```

**Solution:**
```typescript
// Agent handles natural language
async processMessage(message: string) {
  const params = this.extractParameters(message);
  const result = await this.invokeToolLambda(params);
  return this.formatResponse(result);
}
```

### ❌ Mistake 3: Creating Orchestrator for Simple Task

**Problem:**
```
User: "Calculate porosity"
→ Orchestrator → Tool Lambda → Orchestrator → Response

(Unnecessary complexity!)
```

**Solution:**
```
User: "Calculate porosity"
→ Agent → Tool Lambda → Response

(Simple and direct!)
```

## Decision Checklist

Before you start coding, answer these questions:

- [ ] Does it need to understand natural language? (Agent)
- [ ] Does it need conversational context? (Agent)
- [ ] Does it need heavy computation? (Tool Lambda)
- [ ] Does it need specialized libraries? (Tool Lambda)
- [ ] Does it coordinate multiple tools? (Orchestrator)
- [ ] Is processing time > 60s? (Tool Lambda or Orchestrator)
- [ ] Is it a simple addition to existing functionality? (Add to existing)

## Still Not Sure?

### Ask yourself:

1. **"Would a user type this in natural language?"**
   - YES → Agent
   - NO → Tool Lambda

2. **"Does this need to call multiple other services?"**
   - YES → Orchestrator
   - NO → Agent or Tool Lambda

3. **"Is this similar to something we already have?"**
   - YES → Add to existing
   - NO → Create new

4. **"Will this take more than 60 seconds?"**
   - YES → Tool Lambda or Orchestrator
   - NO → Agent

### When in doubt:

1. Start with the **simplest solution** (usually Agent)
2. Add complexity only when needed
3. Refactor if performance becomes an issue
4. Test with real data before deciding

## Summary

| If you need... | Choose... |
|----------------|-----------|
| Natural language understanding | Agent |
| Heavy computation | Tool Lambda |
| Multiple tool coordination | Orchestrator |
| Simple addition | Add to existing |
| Conversational interface | Agent |
| Specialized libraries | Tool Lambda |
| Complex workflows | Orchestrator |
| Quick responses (<60s) | Agent |
| Long processing (>60s) | Tool Lambda |

---

**Remember:** The right architecture makes development easier, not harder!
