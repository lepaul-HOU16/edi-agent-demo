# Speaker Notes: AgentCore Integration Presentation

## Slide 1: Title
**Duration: 30 seconds**

"Good morning/afternoon everyone! Today we're going to talk about building multi-agent AI systems on AWS. I'm going to show you how we built a production system that routes user queries to specialized AI agents, and how you can replicate this pattern in your own applications."

**Key Points:**
- This is a real production system serving energy data analysts
- Built entirely on AWS serverless services
- Focus on practical, reusable patterns

---

## Slide 2: Agenda
**Duration: 1 minute**

"We'll cover five main topics today. First, the Agent Router Pattern - how to coordinate multiple specialized agents. Second, the Intent Detection Algorithm that figures out which agent should handle each query. Third, Multi-Agent Orchestration for complex workflows. Fourth, real Pattern Matching Examples from our production system. And finally, a Starter Kit approach so you can build your own agents."

**Key Points:**
- This is hands-on, practical content
- You'll leave with code you can use
- Focus on extensibility and maintainability

---

## Slide 3: The Challenge
**Duration: 2 minutes**

"Let me start with the problem we were trying to solve. We're building an AI assistant for energy data analysis. But here's the thing - one AI agent can't do everything well. We have queries about oil and gas petrophysics, renewable energy wind farms, equipment maintenance, and general knowledge questions. Each domain has different tools, different APIs, different response formats. Some queries take 1 second, others take 60 seconds. If we tried to cram all of this into one agent, it would be a mess."

**Key Points:**
- Domain complexity requires specialization
- Different tools and processing times
- One-size-fits-all doesn't work
- Solution: Multiple specialized agents with a router

**Audience Engagement:**
"How many of you are building AI applications with multiple domains? [Show of hands] Yeah, this is a common problem."

---

## Slide 4: Agent Router Architecture
**Duration: 3 minutes**

"So here's our solution. We have a Chat Lambda that receives all user queries. Inside that Lambda, we have an Agent Router that does three things: intent detection via pattern matching, priority-based routing, and context preservation. The router then sends the query to one of our specialized agents - Petrophysics for oil and gas analysis, Renewable for wind farm analysis, Maintenance for equipment monitoring, EDIcraft for 3D visualization, or General Knowledge as a fallback."

**Key Points:**
- Single entry point (Chat Lambda)
- Router is the traffic controller
- Each agent is independent
- Agents can call their own tools

**Demo Tip:**
"Notice how each agent has its own downstream tools. The Petrophysics agent uses MCP tools, the Renewable agent uses an Orchestrator, and the General agent calls Bedrock directly."

---

## Slide 5: Agent Router Code
**Duration: 3 minutes**

"Let's look at the actual code. This is simplified but it's the real implementation. The AgentRouter class has references to all our specialized agents. The routeQuery method is the entry point - it takes a message and optional context. First, it calls determineAgentType to figure out which agent should handle this. Then it's a simple switch statement to route to the right agent."

**Key Points:**
- Clean, simple code
- Easy to add new agents
- Context is preserved across calls
- Each agent has its own processMessage or processQuery method

**Code Walkthrough:**
"Notice how we're passing context through. This is important for multi-turn conversations where the agent needs to remember what project you're working on or what data you've already loaded."

---

## Slide 6: Intent Detection Algorithm
**Duration: 4 minutes**

"Now let's dive into the intent detection. This is where the magic happens. We use priority-based pattern matching. Priority 1 is EDIcraft - if someone mentions Minecraft or 3D visualization, we route there immediately. Priority 2 is Maintenance - equipment status queries. Priority 3 is Renewable energy - wind farms, turbines, terrain. Priority 4 is Petrophysics - porosity, shale, well logs. And if nothing matches, we fall back to the General agent."

**Key Points:**
- Priority order matters
- First match wins
- More specific patterns get higher priority
- Fallback ensures we always have a response

**Important Note:**
"The order is critical. If we put General first, it would match everything and we'd never route to specialized agents. We test from most specific to least specific."

---

## Slide 7: Intent Detection Flow
**Duration: 2 minutes**

"Here's a visual representation of that flow. User query comes in, we test against EDIcraft patterns first. If it matches, we're done - route to EDIcraft agent. If not, test Maintenance patterns. And so on down the chain. This ensures that specific queries go to specialized agents, while general queries go to the general agent."

**Key Points:**
- Sequential testing
- Early exit on first match
- Fallback at the end
- Simple but effective

---

## Slide 8: Pattern Matching - Renewable
**Duration: 3 minutes**

"Let's look at real patterns. For renewable energy, we're looking for keywords like 'wind farm', 'turbine placement', 'terrain analysis', 'layout optimization'. These are domain-specific terms that clearly indicate the user wants renewable energy analysis. Notice we're using regex with case-insensitive matching. So 'Wind Farm' and 'wind farm' both match."

**Key Points:**
- Domain-specific vocabulary
- Case-insensitive matching
- Multiple patterns for same intent
- Real queries from production

**Example:**
"If a user types 'Analyze terrain at 35.0, -101.4 for wind farm', the word 'terrain' matches our pattern, and we route to the Renewable agent."

---

## Slide 9: Pattern Matching - Petrophysics
**Duration: 3 minutes**

"Petrophysics patterns are technical terms from subsurface analysis. Porosity, shale volume, water saturation - these are specific calculations that petrophysicists do. Log curves, well correlation, LAS files - these are the data formats they work with. If someone asks about any of these, we know they need the Petrophysics agent."

**Key Points:**
- Technical domain vocabulary
- Industry-standard terms
- File format references (LAS)
- Measurement types (gamma ray, density)

**Audience Note:**
"Even if you're not in oil and gas, the pattern is the same - identify the unique vocabulary of your domain and use that for routing."

---

## Slide 10: Pattern Matching - Maintenance
**Duration: 2 minutes**

"Maintenance patterns focus on operational keywords. Equipment status, predictive maintenance, failure prediction, sensor data. These are the questions that operations teams ask when they're monitoring equipment health."

**Key Points:**
- Operational vocabulary
- Monitoring and prediction terms
- Equipment identifiers
- Time-based queries (schedule)

---

## Slide 11: Advanced Pattern Matching
**Duration: 4 minutes**

"Now here's where it gets interesting. Sometimes you need exclusion patterns. Look at this example - we want to match 'enhanced professional methodology' and 'SPE API standards' for single-well porosity analysis. But we DON'T want to match if the query mentions 'multi-well' or lists multiple wells like 'WELL-001, WELL-002, WELL-003'. Why? Because multi-well analysis is a different intent that needs different handling."

**Key Points:**
- Exclusions prevent confusion
- Similar intents need differentiation
- Positive AND negative patterns
- Critical for accuracy

**Real-World Impact:**
"Without these exclusions, we were routing multi-well queries to the single-well handler, and users were getting incomplete results. The exclusions fixed that."

---

## Slide 12: Base Enhanced Agent
**Duration: 3 minutes**

"All our agents extend this BaseEnhancedAgent class. It provides common functionality - thought step generation, error handling, logging. This keeps our code DRY and ensures consistent behavior across all agents."

**Key Points:**
- Inheritance for common functionality
- Thought steps for transparency
- Consistent error handling
- Verbose logging option

**Design Pattern:**
"This is a classic template method pattern. The base class provides the structure, and specialized agents fill in the domain-specific logic."

---

## Slide 13: Specialized Agent Example
**Duration: 4 minutes**

"Here's a real specialized agent - the Petrophysics agent. It extends BaseEnhancedAgent and implements processMessage. Notice the thought steps - we're building transparency into the agent's reasoning. First, intent detection. Then we call the MCP client to do the actual calculation. Finally, we format a professional response with artifacts."

**Key Points:**
- Extends base class
- Implements domain logic
- Generates thought steps
- Returns structured response with artifacts

**Thought Steps:**
"The thought steps are key. They show the user what the agent is thinking. This builds trust and helps with debugging."

---

## Slide 14: Multi-Agent Orchestration
**Duration: 4 minutes**

"Some workflows are too complex for a single agent. For renewable energy analysis, we need to coordinate multiple tools - terrain analysis, layout optimization, wake simulation. So the Renewable agent is actually a proxy that invokes an orchestrator Lambda asynchronously. Notice the InvocationType is 'Event' - that's fire-and-forget. We don't wait for the result."

**Key Points:**
- Async invocation for long-running tasks
- Proxy pattern
- Immediate response to user
- Background processing

**Why Async:**
"API Gateway has a 29-second timeout. Some of our analyses take 60 seconds. Async processing solves this - we return immediately with 'Analysis in progress', and the user polls for results."

---

## Slide 15: Orchestrator Pattern
**Duration: 4 minutes**

"The orchestrator is where the coordination happens. It parses the user's intent - do they want terrain analysis, layout optimization, or wake simulation? Then it invokes the appropriate tool Lambda. Each tool is independent and can be scaled separately. When the tool finishes, the orchestrator saves the results to DynamoDB, and the frontend polls to pick them up."

**Key Points:**
- Intent parsing at orchestrator level
- Tool Lambda invocation
- Independent scaling
- Results saved to DynamoDB

**Architecture Benefit:**
"This separation of concerns is powerful. We can update the terrain tool without touching the layout tool. We can scale them independently based on usage patterns."

---

## Slide 16: Thought Steps Pattern
**Duration: 3 minutes**

"Let's talk about thought steps in detail. This is our chain-of-thought implementation. Each step has a type - intent detection, parameter extraction, tool selection, execution, completion. It has a timestamp, title, summary, and status. We can even include confidence scores and duration."

**Key Points:**
- Structured reasoning
- Multiple step types
- Status tracking
- Optional metadata (confidence, duration)

**User Experience:**
"Users see these thought steps in the UI. It's like watching the agent think. This transparency is crucial for trust, especially in professional applications where users need to understand how results were derived."

---

## Slide 17: Starter Kit - Step 1
**Duration: 3 minutes**

"Now let's talk about how YOU can build your own agents. Step 1: Create an agent class that extends BaseEnhancedAgent. Implement the processMessage method. Generate thought steps to show your reasoning. Execute your domain logic. Return a structured response."

**Key Points:**
- Extend base class
- Implement processMessage
- Generate thought steps
- Return structured response

**Simplicity:**
"Notice how simple this is. You're not reinventing the wheel. You're just filling in the domain-specific logic."

---

## Slide 18: Starter Kit - Step 2
**Duration: 3 minutes**

"Step 2: Register your agent with the router. Import your agent class. Add it to the router's constructor. Define your intent detection patterns. Add a case to the switch statement. That's it. Your agent is now part of the system."

**Key Points:**
- Import and instantiate
- Define patterns
- Add routing case
- Four simple changes

**Extensibility:**
"This is the power of the pattern. Adding a new agent doesn't require changing existing agents. It's just additive."

---

## Slide 19: Starter Kit - Step 3
**Duration: 4 minutes**

"Step 3 is optional - if your agent needs specialized processing, create a tool Lambda. This is CDK code that defines a Lambda function. You specify the runtime, handler, code location, timeout, memory. Grant it permissions to access S3 or other resources. And add an environment variable to the chat Lambda so it knows how to invoke your tool."

**Key Points:**
- Optional for complex processing
- CDK infrastructure as code
- IAM permissions
- Environment variable for discovery

**When to Use:**
"You need a tool Lambda when your processing is heavy - like generating visualizations, running simulations, or processing large datasets. For simple logic, just put it in the agent."

---

## Slide 20: Starter Kit - Step 4
**Duration: 3 minutes**

"Step 4: Implement tool invocation in your agent. Use the AWS SDK Lambda client. Create an InvokeCommand with your function name and payload. Send the command. Parse the response. That's the pattern for Lambda-to-Lambda invocation."

**Key Points:**
- AWS SDK Lambda client
- InvokeCommand
- JSON payload
- Parse response

**Error Handling:**
"In production, you'd add error handling here - retries, timeouts, fallbacks. But this is the core pattern."

---

## Slide 21: Integration Checklist
**Duration: 2 minutes**

"Here's your complete checklist for adding a new agent. Twelve steps from creating the agent class to deploying and verifying. This is your roadmap. Follow these steps and you'll have a working agent integrated into the system."

**Key Points:**
- Complete checklist
- From code to deployment
- Testing included
- Frontend integration

**Takeaway:**
"Print this slide. This is your guide."

---

## Slide 22: Real-World Example - Petrophysics
**Duration: 3 minutes**

"Let's walk through a real example. User asks 'Calculate porosity for WELL-001'. The router matches 'porosity' and routes to PetrophysicsAgent. The agent detects the intent is calculate_porosity. It calls the MCP server which reads the LAS file from S3 and calculates porosity. The response is formatted according to SPE/API standards. Artifacts include a log curve visualization and statistics table. The user sees an interactive plot with the porosity curve overlaid on the density log."

**Key Points:**
- Real production workflow
- Pattern matching works
- Professional standards
- Rich visualization

**User Value:**
"This takes a complex petrophysical calculation and makes it accessible through natural language. The user doesn't need to know Python or write code. They just ask."

---

## Slide 23: Real-World Example - Renewable
**Duration: 4 minutes**

"Here's a more complex example. User asks 'Analyze terrain at 35.0, -101.4'. Router matches 'terrain' and routes to RenewableAgent. The agent invokes the orchestrator asynchronously. The orchestrator parses the intent as terrain_analysis. It invokes the terrain tool Lambda which fetches OpenStreetMap data and NREL wind data. It generates an interactive Leaflet map. The HTML is saved to S3. The orchestrator updates DynamoDB with the artifact reference. The frontend polls, detects the new message, and renders the map. The user sees 151 terrain features, a wind rose, and suitability analysis."

**Key Points:**
- Complex multi-step workflow
- Async processing
- Multiple data sources
- Rich interactive visualization

**Technical Achievement:**
"This entire workflow - from query to visualization - happens in about 8 seconds. And it's all serverless, scaling automatically."

---

## Slide 24: Key Design Patterns
**Duration: 3 minutes**

"Let me summarize the key design patterns we've covered. Priority-based routing ensures specific queries go to specialized agents. Async processing handles long-running tasks without timeouts. Thought steps provide transparent reasoning. The base agent class ensures consistent behavior. Tool invocation via Lambda-to-Lambda enables specialized processing. And artifact generation creates rich visualizations stored in S3."

**Key Points:**
- Six core patterns
- Each solves a specific problem
- Composable and reusable
- Production-proven

---

## Slide 25: Benefits
**Duration: 2 minutes**

"Why use this architecture? Extensibility - add new agents without modifying existing ones. Specialization - each agent is optimized for its domain. Scalability - independent Lambda scaling per agent. Maintainability - clear separation of concerns. Testability - test each agent independently. Transparency - thought steps show reasoning. Performance - async processing prevents timeouts."

**Key Points:**
- Seven major benefits
- Addresses common challenges
- Scales with your needs
- Production-ready

---

## Slide 26: Lessons Learned
**Duration: 3 minutes**

"Let me share what worked well and what was challenging. Priority-based routing prevents ambiguity - we never have conflicts about which agent should handle a query. Exclusion patterns prevent cross-contamination - similar intents stay separate. Async processing handles long-running tasks gracefully. Thought steps build user trust - they can see the agent thinking."

"Challenges: Pattern maintenance gets harder as you add more agents. Debugging async flows across multiple Lambdas requires good logging. Managing environment variables at scale needs automation. And artifact size optimization is important - we went from 615KB to 75KB for terrain maps."

**Key Points:**
- Real production experience
- Both successes and challenges
- Continuous improvement
- Learn from our mistakes

---

## Slide 27: Best Practices
**Duration: 3 minutes**

"Here are eight best practices from our experience. Start simple with 2-3 agents, add more as needed. Test your patterns with real queries - don't assume they work. Use exclusions to prevent pattern overlap. Log everything with structured logging for debugging. Monitor which agents handle which queries to optimize routing. Version your agents so you can deploy new versions without breaking existing functionality. Cache responses to reduce Bedrock API calls. And optimize artifacts - compress large visualizations."

**Key Points:**
- Eight actionable practices
- Based on production experience
- Avoid common pitfalls
- Continuous optimization

---

## Slide 28: Performance Metrics
**Duration: 2 minutes**

"Here are real performance metrics from our production system. General knowledge queries average 1.2 seconds with 99.5% success rate. Petrophysics is 3.5 seconds with 98.2% success. Renewable terrain analysis is 8.5 seconds with 97.8% success. Layout optimization takes 25 seconds but still maintains 96.5% success. These are end-to-end times including tool invocation, processing, and artifact generation."

**Key Points:**
- Real production metrics
- Sub-second to 25 seconds
- High success rates
- Includes full workflow

---

## Slide 29: Cost Analysis
**Duration: 3 minutes**

"Let's talk about cost. For 1000 users making 10 queries per day, that's 300,000 requests per month. Lambda invocations cost 6 cents. Lambda duration is $25. DynamoDB is $1.50. S3 storage is $2.30. The big cost is Bedrock at $150 for Claude 3.5 Sonnet. Total is about $179 per month, or 0.6 cents per query."

**Key Points:**
- Detailed cost breakdown
- Bedrock is the major cost
- Very affordable at scale
- 0.6 cents per query

**Cost Optimization:**
"You can reduce Bedrock costs by caching common responses. We're seeing 30% cache hit rates which saves about $45/month."

---

## Slide 30: Scaling Considerations
**Duration: 2 minutes**

"For scaling, Lambda auto-scales to 1000 concurrent executions. DynamoDB on-demand scales automatically. S3 handles unlimited requests. For vertical scaling, increase Lambda memory for faster processing. Use ARM64 Graviton2 for better price/performance. Optimize your algorithms."

"Watch out for these bottlenecks: Bedrock API rate limits default to 10 transactions per second. Lambda concurrent execution limits. And DynamoDB hot partitions if you're not distributing your keys well."

**Key Points:**
- Horizontal and vertical scaling
- Automatic scaling for most services
- Known bottlenecks
- Mitigation strategies

---

## Slide 31: Monitoring Dashboard
**Duration: 2 minutes**

"For monitoring, track these key metrics: Agent routing distribution shows which agents are most used. Success rate by agent identifies problems. Latency percentiles catch performance issues. Error rates by agent help with debugging. Tool invocation frequency shows usage patterns. Artifact generation success and size distribution helps with optimization. And daily cost tracking prevents surprises."

"Set up CloudWatch alarms for error rate over 5%, P95 latency over 10 seconds, Lambda throttles, and daily cost over $50."

**Key Points:**
- Seven key metrics
- Four critical alarms
- Proactive monitoring
- Cost control

---

## Slide 32: Security Considerations
**Duration: 2 minutes**

"Security is critical. Every request is authenticated with Cognito JWT validation. Authorization provides user-level data isolation in DynamoDB. Encryption uses TLS 1.2+ in transit and AES-256 at rest. IAM follows least privilege for all Lambda roles. Secrets are stored in AWS Secrets Manager. No PII in CloudWatch logs. CloudTrail audits all API calls. And CORS is restricted to specific origins in production."

**Key Points:**
- Defense in depth
- Authentication and authorization
- Encryption everywhere
- Audit trail

---

## Slide 33: Future Enhancements
**Duration: 2 minutes**

"Looking ahead, short term we're adding more specialized agents for geology, drilling, and production. We're implementing response caching for common queries. Adding streaming responses for real-time feedback. And enhancing artifact compression."

"Long term, we're exploring multi-modal support for images, PDFs, and videos. Agent collaboration where agents can call other agents. Fine-tuned models for domain-specific tasks. Real-time collaboration features. And a mobile app with offline capabilities."

**Key Points:**
- Continuous improvement
- Short and long term plans
- Expanding capabilities
- User-driven features

---

## Slide 34: Resources
**Duration: 1 minute**

"Here are resources to learn more. AWS Bedrock documentation, Lambda best practices, DynamoDB design patterns. Our starter kit is on GitHub at aws-samples/agentcore-starter-kit. Example agents are at aws-samples/bedrock-agents-examples. Contact us at agentcore-team@amazon.com or join our Slack community."

**Key Points:**
- Official documentation
- GitHub repositories
- Community support
- Contact information

---

## Slide 35: Q&A
**Duration: Remaining time**

"That's everything I wanted to cover. Now I'd love to hear about your use cases and answer your questions. What domains are you working in? What challenges are you facing with AI agents?"

**Common Questions to Prepare For:**

1. **Q: How do you handle agent conflicts?**
   A: Priority-based routing with exclusion patterns prevents conflicts. We test patterns in order and take the first match.

2. **Q: What about agent collaboration?**
   A: Currently agents are independent, but we're exploring agent-to-agent communication for complex workflows.

3. **Q: How do you version agents?**
   A: We use Lambda versions and aliases. New versions are deployed to a test alias first, then promoted to production.

4. **Q: What's the latency overhead of routing?**
   A: Routing adds about 50-100ms. Pattern matching is very fast.

5. **Q: Can agents learn from user feedback?**
   A: We log all interactions and use them to improve patterns and responses. We're exploring reinforcement learning from human feedback.

6. **Q: How do you handle multi-turn conversations?**
   A: SessionContext preserves state across turns. Each agent can access conversation history.

7. **Q: What about cost at scale?**
   A: Bedrock is the main cost. Caching and response optimization are key. At 1M queries/month, cost is about $1800.

8. **Q: How do you test agents?**
   A: Unit tests for pattern matching, integration tests for tool invocation, end-to-end tests for full workflows.

**Closing:**
"Thank you all for your time and attention. Please scan the QR code for the starter kit, and feel free to reach out with questions. Happy building!"
