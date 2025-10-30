# EDIcraft Horizon Query Routing - Pattern Matching Documentation

## Overview

This document describes the enhanced pattern matching system for routing horizon-related queries to the EDIcraft agent. The patterns were added to fix an issue where queries like "find a horizon, tell me its name, convert it to minecraft coordinates..." were not being detected and routed correctly.

## Pattern Categories

The EDIcraft agent router uses multiple pattern categories to detect horizon-related queries. Patterns are tested in priority order, with EDIcraft patterns having the highest priority.

### 1. Core Minecraft Patterns

**Pattern:** `/minecraft/i`

**Purpose:** Catch any query explicitly mentioning Minecraft

**Example Queries:**
- "Show me this in Minecraft"
- "Minecraft visualization of wellbore"
- "Build this in Minecraft"

---

### 2. Wellbore Trajectory Patterns

**Patterns:**
- `/wellbore.*trajectory|trajectory.*wellbore/i`
- `/build.*wellbore|wellbore.*build/i`
- `/osdu.*wellbore/i`
- `/3d.*wellbore|wellbore.*path/i`

**Purpose:** Detect wellbore trajectory visualization requests

**Example Queries:**
- "Show me the wellbore trajectory"
- "Build a wellbore in Minecraft"
- "Get OSDU wellbore data"
- "Display 3D wellbore path"

---

### 3. Horizon Surface Patterns

**Patterns:**
- `/horizon.*surface|surface.*horizon/i`
- `/build.*horizon|render.*surface/i`
- `/osdu.*horizon/i`
- `/geological.*surface/i`

**Purpose:** Detect horizon surface visualization requests

**Example Queries:**
- "Show me the horizon surface"
- "Build a horizon in Minecraft"
- "Get OSDU horizon data"
- "Display geological surface"

---

### 4. Horizon Finding and Naming Patterns (NEW)

**Patterns:**
- `/find.*horizon|horizon.*find/i`
- `/get.*horizon|horizon.*name/i`
- `/list.*horizon|show.*horizon/i`

**Purpose:** Detect queries asking to find or identify horizons

**Example Queries:**
- "Find a horizon"
- "Find horizon data"
- "Get the horizon name"
- "Tell me the horizon name"
- "List available horizons"
- "Show me horizons"

**Why Added:** The original patterns required "surface" or "minecraft" keywords. Users often ask to "find a horizon" without these keywords.

---

### 5. Coordinate Conversion Patterns (NEW)

**Patterns:**
- `/convert.*coordinates|coordinates.*convert/i`
- `/convert.*to.*minecraft|minecraft.*convert/i`
- `/coordinates.*for.*minecraft|minecraft.*coordinates/i`

**Purpose:** Detect coordinate conversion requests

**Example Queries:**
- "Convert coordinates to Minecraft"
- "Convert to Minecraft coordinates"
- "What are the Minecraft coordinates?"
- "Give me coordinates for Minecraft"

**Why Added:** Users often ask for coordinate conversion without explicitly saying "horizon" or "wellbore".

---

### 6. Combined Horizon + Coordinate Patterns (NEW - HIGHEST PRIORITY)

**Patterns:**
- `/horizon.*coordinates|coordinates.*horizon/i`
- `/horizon.*minecraft|minecraft.*horizon/i`
- `/horizon.*convert|convert.*horizon/i`

**Purpose:** Detect queries that combine horizon and coordinate/minecraft concepts

**Example Queries:**
- "Find a horizon and convert to Minecraft coordinates"
- "Horizon coordinates for Minecraft"
- "Convert horizon to Minecraft"
- "Show me horizon in Minecraft"

**Why Added:** The user's actual query combined multiple concepts: finding a horizon, getting its name, and converting coordinates. These patterns catch such combined queries.

---

### 7. Natural Language Patterns (NEW)

**Patterns:**
- `/tell.*me.*horizon|horizon.*tell.*me/i`
- `/what.*horizon|which.*horizon/i`
- `/where.*horizon|horizon.*where/i`

**Purpose:** Detect natural language questions about horizons

**Example Queries:**
- "Tell me about the horizon"
- "Tell me the horizon name"
- "What horizon is this?"
- "Which horizon should I use?"
- "Where is the horizon?"

**Why Added:** Users often phrase queries in natural language rather than technical commands.

---

### 8. Coordinate Output Patterns (NEW)

**Patterns:**
- `/coordinates.*you.*use|coordinates.*to.*use/i`
- `/print.*coordinates|output.*coordinates/i`

**Purpose:** Detect requests for coordinate output

**Example Queries:**
- "Print out the coordinates"
- "Output the coordinates"
- "What coordinates would you use?"
- "Show me the coordinates to use"

**Why Added:** The user's query included "print out the coordinates you'd use to show it in minecraft" - this pattern catches such requests.

---

### 9. Coordinate and Position Patterns

**Patterns:**
- `/player.*position/i`
- `/coordinate.*tracking/i`
- `/transform.*coordinates/i`
- `/utm.*minecraft/i`

**Purpose:** Detect coordinate system and position tracking queries

**Example Queries:**
- "Track player position"
- "Transform coordinates"
- "Convert UTM to Minecraft"
- "Coordinate tracking system"

---

### 10. Visualization Patterns

**Patterns:**
- `/minecraft.*visualization/i`
- `/visualize.*minecraft/i`
- `/subsurface.*visualization/i`
- `/show.*in.*minecraft|display.*in.*minecraft|render.*in.*minecraft/i`

**Purpose:** Detect visualization requests

**Example Queries:**
- "Minecraft visualization of data"
- "Visualize this in Minecraft"
- "Subsurface visualization"
- "Show this in Minecraft"
- "Display in Minecraft"
- "Render in Minecraft"

---

### 11. Combined Well Log + Minecraft Patterns

**Patterns:**
- `/well.*log.*minecraft|log.*minecraft/i`
- `/well.*log.*and.*minecraft|minecraft.*and.*well.*log/i`

**Purpose:** Detect queries combining well log data with Minecraft visualization

**Example Queries:**
- "Show well log in Minecraft"
- "Well log and Minecraft visualization"
- "Minecraft and well log data"

**Why Important:** These patterns have priority over petrophysics patterns to ensure well log visualization requests go to EDIcraft, not the petrophysics agent.

---

## Pattern Matching Logic

### Priority Order

Patterns are tested in the following priority order:

1. **EDIcraft patterns** (HIGHEST PRIORITY)
2. Maintenance patterns
3. Weather patterns
4. Renewable energy patterns
5. General knowledge patterns
6. Catalog patterns
7. Petrophysics patterns (LOWEST PRIORITY)

### Detailed Logging

The router logs each pattern test with detailed information:

```typescript
console.log('🎮 AgentRouter: Testing EDIcraft patterns...');
for (const pattern of edicraftPatterns) {
  const matches = pattern.test(lowerMessage);
  if (matches) {
    console.log('  ✅ EDIcraft pattern MATCHED:', pattern.source);
    console.log('  📝 Query excerpt:', lowerMessage.substring(0, 100));
  }
}
```

### Example Log Output

```
🔍 AgentRouter: Testing patterns for message: find a horizon, tell me its name, convert it to minecraft coordinates...
🎮 AgentRouter: Testing EDIcraft patterns...
  ✅ EDIcraft pattern MATCHED: find.*horizon|horizon.*find
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
  ✅ EDIcraft pattern MATCHED: horizon.*coordinates|coordinates.*horizon
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
  ✅ EDIcraft pattern MATCHED: horizon.*minecraft|minecraft.*horizon
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
  ✅ EDIcraft pattern MATCHED: tell.*me.*horizon|horizon.*tell.*me
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
  ✅ EDIcraft pattern MATCHED: coordinates.*you.*use|coordinates.*to.*use
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
  ✅ EDIcraft pattern MATCHED: print.*coordinates|output.*coordinates
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
  ✅ EDIcraft pattern MATCHED: minecraft
  📝 Query excerpt: find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates
🎮 AgentRouter: EDIcraft agent selected
🎮 AgentRouter: Total patterns matched: 7
🎮 AgentRouter: Final decision: EDICRAFT
```

---

## Query Type Examples

### Horizon Finding Queries

**Patterns Matched:**
- `/find.*horizon|horizon.*find/i`
- `/get.*horizon|horizon.*name/i`
- `/list.*horizon|show.*horizon/i`

**Example Queries:**
```
✅ "Find a horizon"
✅ "Find horizon data in OSDU"
✅ "Get the horizon name"
✅ "Tell me the horizon name"
✅ "List available horizons"
✅ "Show me all horizons"
✅ "Which horizons are available?"
```

---

### Coordinate Conversion Queries

**Patterns Matched:**
- `/convert.*coordinates|coordinates.*convert/i`
- `/convert.*to.*minecraft|minecraft.*convert/i`
- `/coordinates.*for.*minecraft|minecraft.*coordinates/i`

**Example Queries:**
```
✅ "Convert coordinates to Minecraft"
✅ "Convert to Minecraft coordinates"
✅ "Transform UTM to Minecraft"
✅ "What are the Minecraft coordinates?"
✅ "Give me coordinates for Minecraft"
✅ "Minecraft coordinates for this location"
```

---

### Combined Horizon + Coordinate Queries

**Patterns Matched:**
- `/horizon.*coordinates|coordinates.*horizon/i`
- `/horizon.*minecraft|minecraft.*horizon/i`
- `/horizon.*convert|convert.*horizon/i`
- Multiple other patterns

**Example Queries:**
```
✅ "Find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft"
✅ "Get horizon coordinates for Minecraft"
✅ "Convert horizon to Minecraft coordinates"
✅ "Show me horizon in Minecraft with coordinates"
✅ "Find horizon and display in Minecraft"
```

---

### Natural Language Horizon Queries

**Patterns Matched:**
- `/tell.*me.*horizon|horizon.*tell.*me/i`
- `/what.*horizon|which.*horizon/i`
- `/where.*horizon|horizon.*where/i`

**Example Queries:**
```
✅ "Tell me about the horizon"
✅ "Tell me the horizon name"
✅ "What horizon is this?"
✅ "Which horizon should I use?"
✅ "Where is the horizon located?"
✅ "What's the name of this horizon?"
```

---

### Coordinate Output Queries

**Patterns Matched:**
- `/coordinates.*you.*use|coordinates.*to.*use/i`
- `/print.*coordinates|output.*coordinates/i`

**Example Queries:**
```
✅ "Print out the coordinates"
✅ "Output the coordinates"
✅ "What coordinates would you use?"
✅ "Show me the coordinates to use"
✅ "Print the coordinates you'd use"
✅ "Output coordinates for Minecraft"
```

---

## Troubleshooting Routing Issues

### Issue: Query Not Routing to EDIcraft

**Symptoms:**
- Query contains horizon/minecraft keywords but routes to petrophysics agent
- Response is generic petrophysics welcome message instead of horizon data

**Diagnosis Steps:**

1. **Check CloudWatch Logs**
   ```bash
   # Find the agent router Lambda
   aws lambda list-functions | grep agentRouter
   
   # Check logs
   aws logs tail /aws/lambda/<function-name> --follow
   ```

2. **Look for Pattern Matching Logs**
   ```
   🔍 AgentRouter: Testing patterns for message: [your query]
   🎮 AgentRouter: Testing EDIcraft patterns...
   ```

3. **Check Which Patterns Matched**
   - If no EDIcraft patterns matched, the query needs a new pattern
   - If patterns matched but wrong agent selected, check priority order

**Solutions:**

1. **Add Missing Pattern**
   - Identify the query structure that wasn't caught
   - Add a new regex pattern to `edicraftPatterns` array
   - Test with the specific query

2. **Adjust Pattern Priority**
   - EDIcraft patterns should be tested FIRST
   - Ensure no other agent patterns are catching the query before EDIcraft

3. **Make Pattern More Flexible**
   - Use `.*` to allow words between key terms
   - Use `|` to match multiple variations
   - Use case-insensitive flag `/i`

---

### Issue: Pattern Too Broad

**Symptoms:**
- Non-horizon queries routing to EDIcraft
- Petrophysics queries incorrectly going to EDIcraft

**Diagnosis Steps:**

1. **Check Pattern Specificity**
   - Is the pattern too general? (e.g., just `/coordinates/i`)
   - Does it match unintended queries?

2. **Test Pattern in Isolation**
   ```javascript
   const pattern = /horizon.*coordinates/i;
   const query = "calculate porosity using coordinates";
   console.log(pattern.test(query)); // Should be false
   ```

**Solutions:**

1. **Make Pattern More Specific**
   - Require multiple keywords: `/horizon.*minecraft/i` instead of `/horizon/i`
   - Add context: `/find.*horizon/i` instead of `/horizon/i`

2. **Add Exclusion Logic**
   - Check for conflicting terms before matching
   - Example: Don't match if query contains "porosity" or "saturation"

3. **Reorder Patterns**
   - More specific patterns should be tested before general ones
   - Combined patterns before single-keyword patterns

---

### Issue: Logging Not Showing Pattern Matches

**Symptoms:**
- No pattern matching logs in CloudWatch
- Can't see which patterns matched

**Diagnosis Steps:**

1. **Check Log Level**
   - Ensure console.log statements are not filtered
   - Check Lambda environment variables for log level settings

2. **Verify Deployment**
   - Ensure latest code is deployed
   - Check Lambda function version

**Solutions:**

1. **Redeploy Agent Router**
   ```bash
   npx ampx sandbox
   ```

2. **Check CloudWatch Log Groups**
   - Verify logs are going to correct log group
   - Check log retention settings

3. **Add More Logging**
   - Add logs at entry point of routing function
   - Log the complete query being tested

---

### Issue: Pattern Works Locally But Not in Deployment

**Symptoms:**
- Pattern matches in local tests
- Same query doesn't match in deployed environment

**Diagnosis Steps:**

1. **Check Deployment Status**
   ```bash
   aws lambda get-function --function-name <router-function>
   ```

2. **Verify Code Version**
   - Check LastModified timestamp
   - Ensure latest code is deployed

3. **Compare Local vs Deployed**
   - Test same query in both environments
   - Check for environment-specific differences

**Solutions:**

1. **Restart Sandbox**
   ```bash
   # Stop current sandbox (Ctrl+C)
   npx ampx sandbox
   ```

2. **Verify Environment Variables**
   ```bash
   aws lambda get-function-configuration \
     --function-name <router-function> \
     --query "Environment.Variables"
   ```

3. **Check for Caching Issues**
   - Clear any Lambda caches
   - Verify function is using latest code

---

## Testing Pattern Matching

### Unit Tests

Location: `tests/unit/test-agent-router-horizon.test.ts`

**Test Coverage:**
- Simple horizon queries: "find a horizon"
- Horizon naming queries: "tell me the horizon name"
- Coordinate conversion: "convert to minecraft coordinates"
- Complex combined queries: "find a horizon, tell me its name, convert it to minecraft coordinates..."
- Negative tests: Ensure horizon queries don't route to petrophysics

### Integration Tests

Location: `tests/integration/test-edicraft-horizon-workflow.test.ts`

**Test Coverage:**
- End-to-end horizon query processing
- Verify agentUsed is 'edicraft'
- Verify response includes horizon-related content
- Verify response includes coordinate information
- Verify thought steps are present

### Manual Testing

Location: `tests/manual/test-edicraft-horizon-query.sh`

**Test Queries:**
```bash
# Test 1: Simple horizon query
node tests/test-edicraft-routing.js "find a horizon"

# Test 2: Horizon with name
node tests/test-edicraft-routing.js "tell me the horizon name"

# Test 3: Coordinate conversion
node tests/test-edicraft-routing.js "convert to minecraft coordinates"

# Test 4: Complex query (actual user query)
node tests/test-edicraft-routing.js "find a horizon, tell me its name, convert it to minecraft coordinates and print out the coordinates you'd use to show it in minecraft"
```

---

## Pattern Maintenance

### Adding New Patterns

1. **Identify the Query Structure**
   - What keywords are present?
   - What is the user trying to accomplish?
   - What variations might users use?

2. **Create the Pattern**
   ```typescript
   // Example: Detect "show me horizon X"
   /show.*me.*horizon|horizon.*show.*me/i
   ```

3. **Add to edicraftPatterns Array**
   ```typescript
   const edicraftPatterns = [
     // ... existing patterns
     /show.*me.*horizon|horizon.*show.*me/i, // NEW
   ];
   ```

4. **Test the Pattern**
   - Add unit test for the new pattern
   - Test with actual queries
   - Verify no regressions

5. **Document the Pattern**
   - Add to this documentation
   - Include example queries
   - Explain why it was added

### Removing Patterns

**⚠️ WARNING:** Removing patterns can break existing functionality

**Before Removing:**
1. Search codebase for queries that match the pattern
2. Check if any tests rely on the pattern
3. Verify no users are using queries that match the pattern

**If Removal is Necessary:**
1. Add deprecation warning in logs
2. Monitor usage for 1-2 weeks
3. Remove pattern and update tests
4. Update documentation

### Optimizing Patterns

**Performance Considerations:**
- Regex matching is fast, but testing 35+ patterns adds overhead
- Most queries match early patterns and don't test all patterns
- Pattern order matters for performance

**Optimization Strategies:**
1. **Most Common Patterns First**
   - Put frequently matched patterns at the top
   - Less common patterns at the bottom

2. **Combine Similar Patterns**
   ```typescript
   // Instead of:
   /find.*horizon/i,
   /find.*horizons/i,
   
   // Use:
   /find.*horizons?/i,
   ```

3. **Use Specific Patterns**
   ```typescript
   // Instead of:
   /horizon/i,  // Too broad
   
   // Use:
   /horizon.*minecraft/i,  // More specific
   ```

---

## Success Metrics

### Pattern Matching Effectiveness

**Metrics to Track:**
- **EDIcraft Routing Rate**: % of horizon queries routed to EDIcraft
- **Pattern Match Rate**: Which patterns match most frequently
- **False Positive Rate**: % of non-horizon queries routed to EDIcraft
- **False Negative Rate**: % of horizon queries NOT routed to EDIcraft

**Target Metrics:**
- EDIcraft routing rate: >95% for horizon queries
- False positive rate: <5%
- False negative rate: <2%

### User Query Success

**Metrics to Track:**
- **Query Success Rate**: % of horizon queries that return valid results
- **Response Time**: Time from query to response
- **User Satisfaction**: User feedback on routing accuracy

**Target Metrics:**
- Query success rate: >90%
- Response time: <30 seconds
- User satisfaction: >4/5 stars

---

## Related Documentation

- **Requirements**: `.kiro/specs/fix-edicraft-horizon-routing/requirements.md`
- **Design**: `.kiro/specs/fix-edicraft-horizon-routing/design.md`
- **Tasks**: `.kiro/specs/fix-edicraft-horizon-routing/tasks.md`
- **EDIcraft Integration**: `docs/EDICRAFT_INTEGRATION_STATUS.md`
- **EDIcraft Quick Start**: `docs/EDICRAFT_QUICK_START.md`
- **EDIcraft Troubleshooting**: `docs/EDICRAFT_TROUBLESHOOTING_GUIDE.md`

---

## Changelog

### 2025-01-14 - Initial Pattern Enhancement
- Added horizon finding patterns: `/find.*horizon/i`, `/get.*horizon/i`, `/list.*horizon/i`
- Added coordinate conversion patterns: `/convert.*coordinates/i`, `/convert.*to.*minecraft/i`
- Added combined patterns: `/horizon.*coordinates/i`, `/horizon.*minecraft/i`
- Added natural language patterns: `/tell.*me.*horizon/i`, `/what.*horizon/i`
- Added coordinate output patterns: `/coordinates.*you.*use/i`, `/print.*coordinates/i`
- Enhanced logging to show which patterns matched
- Fixed routing for complex queries like "find a horizon, tell me its name, convert it to minecraft coordinates..."

---

## Contact

For questions or issues with pattern matching:
- Check CloudWatch logs for pattern matching details
- Review test files for examples
- Consult EDIcraft troubleshooting guide
- Contact development team for pattern additions

---

**Last Updated:** 2025-01-14  
**Version:** 1.0  
**Status:** Active
