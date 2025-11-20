# Speaker Notes - AWS re:Invent Chalk Talk

## Presentation Overview

**Title**: Building Multi-Agent AI Systems with AWS Bedrock and AgentCore
**Duration**: 45 minutes (35 min presentation + 10 min Q&A)
**Format**: Chalk talk with live demos
**Audience**: Technical (architects, developers, engineers)

---

## Slide 1: Title Slide (1 minute)

### Key Points
- Welcome attendees
- Introduce yourself and credentials
- Set expectations for interactive session

### Script
"Good morning/afternoon! Welcome to our chalk talk on building multi-agent AI systems with AWS Bedrock. I'm [Name], and I've been working on production AI agent systems for [company/time]. Today we'll dive deep into a real-world implementation - an energy data analysis platform that handles multiple specialized domains through coordinated AI agents. This is a technical session, so feel free to interrupt with questions as we go."

### Timing
- 0:00-1:00

---

## Slide 2: Agenda (1 minute)

### Key Points
- Quick overview of what we'll cover
- Emphasize hands-on nature
- Mention starter kit availability

### Script
"Here's what we'll cover today. We'll start with the problem we're solving and why traditional approaches fall short. Then we'll dive into the architecture, focusing on the AgentCore integration pattern and multi-agent orchestration. We'll look at the security model, and I'll show you a starter kit you can deploy in your own account. We'll do live demos throughout, and save time for Q&A at the end."

### Timing
- 1:00-2:00

---

## Slide 3: The Challenge (2 minutes)

### Key Points
- Production AI agents are complex
- Multiple domains require specialized handling
- Coordination is non-trivial
- Security and scale matter

### Script
"Let's start with the challenge. Building a single AI agent is relatively straightforward with tools like Bedrock. But what happens when you need multiple specialized agents? How do you route queries to the right agent? How do you coordinate complex workflows that span multiple agents? How do you handle long-running operations without hitting API timeouts? And how do you do all this securely at scale? These are the questions we'll answer today."

### Chalk Talk Points
- Draw simple agent → complex multi-agent system
- Show coordination challenges
- Highlight timeout issues

### Timing
- 2:00-4:00

---

## Slide 4: Use Case - Energy Data Analysis (2 minutes)

### Key Points
- Real-world production system
- Multiple specialized domains
- Complex requirements
- Diverse output types

### Script
"Our use case is an energy data analysis platform. It handles four main domains: petrophysics for oil and gas analysis, renewable energy for wind farm design, equipment maintenance, and 3D visualization. Each domain has its own specialized tools and workflows. Users interact through natural language, asking questions like 'Calculate porosity for this well' or 'Analyze this wind farm site.' The system needs to understand intent, route to the right agent, execute complex calculations, and return rich visualizations - all within reasonable time limits."

### Chalk Talk Points
- Draw the four domains
- Show example queries for each
- Illustrate complexity of outputs

### Timing
- 4:00-6:00

---

## Slide 5: Solution Architecture (3 minutes)

### Key Points
- Standard AWS services
- Serverless architecture
- Clear separation of concerns
- Scalable design

### Script
"Here's our solution architecture. At the top, we have a React frontend served through CloudFront. Users authenticate via Cognito, and requests flow through API Gateway with a Lambda authorizer for JWT validation. The core is our agent layer - a multi-agent router that determines intent and routes to specialized agents. For complex workflows, we have an orchestrator that coordinates multiple tool invocations. All agents use AWS Bedrock with Claude 3.5 Sonnet. Data persists in DynamoDB, artifacts in S3. Everything is serverless, so it scales automatically."

### Chalk Talk Points
- Walk through request flow
- Highlight key decision points
- Show data flow

### Timing
- 6:00-9:00

---

## Slide 6: Key Components (2 minutes)

### Key Points
- Each layer has specific responsibility
- Serverless for scalability
- AWS managed services where possible
- Custom logic only where needed

### Script
"Let's break down the key components. The frontend is standard React with Next.js - nothing special there. API Gateway handles routing and throttling. The Lambda authorizer validates JWTs against Cognito - we'll look at the IAM permissions for this later. The agent layer is where it gets interesting - this is our custom AgentCore implementation. The orchestration layer handles complex multi-step workflows. Tool Lambdas do the actual domain-specific work - calculations, data processing, visualization generation. And Bedrock provides the AI capabilities."

### Timing
- 9:00-11:00

---

## Slide 7: Authentication Flow (2 minutes)

### Key Points
- Standard JWT flow
- Lambda authorizer pattern
- Security best practices
- User context propagation

### Script
"Authentication follows a standard JWT pattern. Users sign in through Cognito, get JWT tokens, and include them in API requests. The Lambda authorizer validates these tokens by checking the signature against Cognito's public keys. If valid, it returns an IAM policy allowing the request and passes user context to downstream Lambdas. This is a common pattern, but the devil is in the details - we'll look at the exact IAM permissions needed later."

### Chalk Talk Points
- Draw token flow
- Show validation steps
- Highlight security checkpoints

### Timing
- 11:00-13:00

---

## Slide 8: AgentCore Integration Pattern (2 minutes)

### Key Points
- Custom implementation vs. Bedrock Agents
- Fine-grained control
- Multi-model support
- Transparent reasoning

### Script
"Now let's talk about AgentCore integration. We use a custom implementation rather than AWS Bedrock Agents directly. Why? Because we need fine-grained control over routing, we want to support multiple models, and we need transparent reasoning through thought steps. This gives us flexibility at the cost of some additional code. For many use cases, Bedrock Agents would be fine, but for production systems with complex requirements, custom implementation makes sense."

### Timing
- 13:00-15:00

---

## Slide 9: Agent Router Architecture (3 minutes)

### Key Points
- Priority-based pattern matching
- Simple but effective
- Easy to extend
- Testable

### Script
"Here's the core of our agent router. It's surprisingly simple - just priority-based pattern matching. We test the user's query against regex patterns for each agent type, in priority order. EDIcraft patterns first, then maintenance, renewable, petrophysics, and finally general knowledge as a fallback. When a pattern matches, we route to that agent. This approach is simple, fast, and easy to test. Adding a new agent is just adding new patterns and registering the agent."

### Chalk Talk Points
- Walk through code
- Show pattern matching logic
- Demonstrate priority ordering

### Timing
- 15:00-18:00

---

## Slide 10: Intent Detection Flow (2 minutes)

### Key Points
- Visual representation of routing
- Multiple decision points
- Context preservation
- Error handling

### Script
"This diagram shows the complete intent detection flow. A query comes in, we extract key terms, test against patterns, and route to the appropriate agent. Each agent can then invoke tools, call Bedrock, or delegate to other agents. Context is preserved throughout, so agents have access to conversation history. Error handling happens at each step - if an agent fails, we can fall back to the general knowledge agent."

### Timing
- 18:00-20:00

---

## Slide 11: Thought Steps Pattern (2 minutes)

### Key Points
- Transparency into reasoning
- User trust
- Debugging aid
- Professional appearance

### Script
"One key feature is thought steps - transparent reasoning. Each agent generates thought steps showing what it's doing: intent detection, parameter extraction, tool selection, execution, completion. Users see these in real-time, which builds trust and helps them understand what's happening. It also helps us debug issues. The thought step interface is simple - just an object with type, timestamp, title, summary, and status. Agents generate these as they work."

### Chalk Talk Points
- Show thought step structure
- Demonstrate in UI
- Explain benefits

### Timing
- 20:00-22:00

---

## Slide 12: Multi-Agent Orchestration (2 minutes)

### Key Points
- Complex workflows need coordination
- Orchestrator pattern
- Tool invocation sequence
- State management

### Script
"For complex workflows, we use an orchestrator pattern. Take wind farm analysis - it requires terrain analysis, layout optimization, wake simulation, and report generation. That's four separate tools that need to run in sequence, with outputs from one feeding into the next. The orchestrator manages this: it parses the user's intent, invokes tools in order, aggregates results, and returns a comprehensive response. It also manages state across the workflow."

### Timing
- 22:00-24:00

---

## Slide 13: Orchestrator Architecture (2 minutes)

### Key Points
- Intent router
- Tool invocation
- Result aggregation
- Error handling

### Script
"Here's the orchestrator architecture. At the top is an intent router that determines which tools to invoke. Below that are the individual tool Lambdas - terrain, layout, simulation, report. The orchestrator invokes these in sequence, passing context between them. Results are aggregated and stored in DynamoDB and S3. If any tool fails, the orchestrator handles the error gracefully and returns partial results if possible."

### Timing
- 24:00-26:00

---

## Slide 14: Async Processing Pattern (3 minutes)

### Key Points
- API Gateway timeout challenge
- Fire-and-forget solution
- Polling pattern
- User experience

### Script
"Here's a critical challenge: API Gateway has a 29-second timeout, but some analyses take 30-60 seconds. How do we handle this? With a fire-and-forget pattern. The chat Lambda tries to process synchronously, but if it hits 25 seconds, it invokes itself asynchronously and returns immediately with a 'processing' message. The frontend polls for updates every 2 seconds. When the async processing completes, it saves results to DynamoDB, and the next poll picks them up. Users see a smooth experience with a loading indicator."

### Chalk Talk Points
- Draw timeout scenario
- Show async invocation
- Illustrate polling loop

### Demo Opportunity
- Show live async processing

### Timing
- 26:00-29:00

---

## Slide 15: Async Implementation (2 minutes)

### Key Points
- Promise.race pattern
- Self-invocation
- Polling hook
- Error handling

### Script
"Here's the implementation. We use Promise.race to race the agent handler against a timeout promise. If the timeout wins, we catch the error, invoke ourselves asynchronously with InvocationType 'Event', and return a processing message. On the frontend, we have a polling hook that checks for new messages every 2 seconds. When it finds a complete message, it stops polling. This pattern works reliably and provides a good user experience."

### Timing
- 29:00-31:00

---

## Slide 16: Security & IAM Model (1 minute)

### Key Points
- Least privilege principle
- Explicit permissions
- No wildcards
- Regular audits

### Script
"Security is critical. We follow the principle of least privilege - each Lambda has only the permissions it needs, nothing more. No wildcards, no overly broad policies. Let's look at specific examples."

### Timing
- 31:00-32:00

---

## Slide 17-19: IAM Examples (3 minutes)

### Key Points
- Lambda authorizer: Cognito read-only
- Chat Lambda: DynamoDB, S3, Bedrock, Lambda invoke
- Orchestrator: Tool invocation, state management
- Tool Lambdas: S3 only

### Script
"The Lambda authorizer needs to read from Cognito to validate tokens - that's it. The chat Lambda needs more: DynamoDB for messages, S3 for artifacts, Bedrock for AI, and Lambda invoke for tools. The orchestrator needs to invoke tool Lambdas and manage state. Tool Lambdas typically just need S3 access to store results. Each role is scoped to specific resources - no account-wide permissions."

### Chalk Talk Points
- Highlight specific actions
- Show resource ARN patterns
- Explain rationale

### Timing
- 32:00-35:00

---

## Slide 20: IAM Reference Cards (1 minute)

### Key Points
- One-page references
- Available in handout
- Easy to implement
- Validated in production

### Script
"We've created one-page IAM reference cards for each Lambda role. These are in your handout and online. They show required actions, resources, and example policy JSON. You can use these as templates when implementing your own system. They're validated in production, so you know they work."

### Timing
- 35:00-36:00

---

## Slide 21: Starter Kit (1 minute)

### Key Points
- Complete implementation
- Deploy in 15 minutes
- Three example agents
- Fully documented

### Script
"Now let's talk about the starter kit. This is a complete, working implementation you can deploy to your own AWS account in about 15 minutes. It includes CDK templates for all infrastructure, three example agents, code templates for adding new agents, deployment scripts, and full documentation. Everything we've discussed today is in there."

### Timing
- 36:00-37:00

---

## Slide 22: What's Included (1 minute)

### Key Points
- Infrastructure as code
- Example implementations
- Templates and tools
- Testing utilities

### Script
"The starter kit includes complete CDK infrastructure templates - just configure your AWS credentials and deploy. Three example agents show different patterns: a simple calculator agent, a weather agent that calls external APIs, and a data analysis agent with Python tools. Code templates make it easy to add your own agents. Deployment scripts handle the whole process. Testing utilities help you validate everything works."

### Timing
- 37:00-38:00

---

## Slide 23: Quick Start (1 minute)

### Key Points
- Simple deployment process
- Standard tools
- Quick validation
- Ready to customize

### Script
"Deployment is straightforward: clone the repo, install dependencies, configure AWS credentials, and run deploy. That's it. The script handles everything - creating resources, setting permissions, deploying code. Then run the tests to validate everything works. From there, you can customize for your use case."

### Timing
- 38:00-39:00

---

## Slide 24: Adding a New Agent (1 minute)

### Key Points
- Four simple steps
- Template-based
- Type-safe
- Testable

### Script
"Adding a new agent is four steps: create an agent class extending BaseEnhancedAgent, register it with the router, add intent patterns, and deploy. The templates handle most of the boilerplate. TypeScript ensures type safety. And the testing utilities make it easy to validate your agent works correctly."

### Timing
- 39:00-40:00

---

## Slide 25: Access the Starter Kit (1 minute)

### Key Points
- QR code for easy access
- GitHub repository
- Open source
- Community support

### Script
"Here's a QR code to access the starter kit. Scan it now if you want to follow along. The repository is on GitHub, fully open source. There's also a community Slack channel where you can ask questions and share your implementations."

### Timing
- 40:00-41:00

---

## Slides 26-28: Live Demos (4 minutes)

### Demo 1: Simple Query (1 minute)
**Query**: "Calculate porosity for Well-001"

### Script
"Let's see this in action. I'll ask for a porosity calculation. Watch the thought steps - you'll see intent detection, tool selection, execution. The response comes back in about 2 seconds with a visualization."

### What to Show
- Type query
- Watch thought steps appear
- See visualization render
- Highlight speed

### Backup Plan
- If demo fails, show pre-recorded video
- Have screenshots ready
- Explain what should happen

---

### Demo 2: Complex Orchestration (2 minutes)
**Query**: "Analyze wind farm site at 35.0, -101.4"

### Script
"Now a complex query - wind farm analysis. This triggers the orchestrator, which will invoke multiple tools: terrain analysis, layout optimization, wake simulation. Watch for the async processing - it'll show 'Analysis in Progress' and poll for results. This takes about 30 seconds."

### What to Show
- Type query
- See "Analysis in Progress"
- Watch polling
- See multiple artifacts appear
- Highlight orchestration

### Backup Plan
- Pre-recorded video
- Static screenshots
- Explain orchestration flow

---

### Demo 3: Multi-Well Analysis (1 minute)
**Query**: "Correlate porosity across Well-001, Well-002, Well-003"

### Script
"Finally, multi-well correlation. This shows how agents can handle complex queries spanning multiple data sources. You'll see a crossplot visualization and professional report format."

### What to Show
- Type query
- See multi-well processing
- View crossplot
- Highlight professional format

### Timing
- 41:00-45:00

---

## Slides 29-31: Key Takeaways (2 minutes)

### Key Points
- Agent router pattern works well
- Async processing solves timeouts
- Thought steps build trust
- IAM security is critical
- Starter kit accelerates development

### Script
"Let's wrap up with key takeaways. First, the agent router pattern with priority-based matching is simple but effective. Second, async processing with polling solves the timeout problem elegantly. Third, thought steps provide transparency that builds user trust. Fourth, explicit IAM permissions are critical for security. And fifth, the starter kit gives you a head start on your own implementation."

### Timing
- 45:00-47:00

---

## Slide 32: Best Practices (1 minute)

### Key Points
- Start simple
- Test with real queries
- Monitor in production
- Iterate based on usage

### Script
"Some best practices: start with simple agents and add complexity incrementally. Test with real user queries, not just happy paths. Monitor in production to understand actual usage patterns. And iterate based on what you learn. Don't try to build everything upfront."

### Timing
- 47:00-48:00

---

## Slide 33: Common Pitfalls (1 minute)

### Key Points
- Over-engineering
- Ignoring timeouts
- Permissive IAM
- Poor error handling

### Script
"Common pitfalls to avoid: don't over-engineer intent detection - simple patterns work well. Don't ignore API Gateway timeouts - plan for async processing. Don't use overly permissive IAM policies - be explicit. And don't skip error handling - things will fail in production."

### Timing
- 48:00-49:00

---

## Slides 34-35: Resources & Next Steps (1 minute)

### Key Points
- Documentation available
- Community support
- Office hours
- Share your implementations

### Script
"All the documentation is available online - starter kit, integration guide, IAM reference cards, code templates. Join the community Slack for support. We're holding office hours next week if you want to dive deeper. And please share your implementations - we'd love to see what you build."

### Timing
- 49:00-50:00

---

## Slides 36-38: Q&A (10 minutes)

### Preparation
- Review common questions
- Have deep-dive slides ready
- Know where to find answers
- Be ready to go to whiteboard

### Common Questions

**Q: Why custom AgentCore vs. Bedrock Agents?**
A: Fine-grained control, multi-model support, transparent reasoning. For simpler use cases, Bedrock Agents is great.

**Q: How do you handle agent failures?**
A: Error handling at each layer, fallback to general agent, graceful degradation, user-friendly error messages.

**Q: What about costs?**
A: Mostly Lambda and Bedrock. Lambda is cheap (milliseconds of execution). Bedrock is per-token. Typical query costs $0.01-0.05.

**Q: How do you test agents?**
A: Unit tests for routing logic, integration tests for tool invocation, end-to-end tests with real queries, production monitoring.

**Q: Can this work with other LLMs?**
A: Yes! The pattern is model-agnostic. We use Bedrock for convenience, but you could use any LLM API.

**Q: How do you handle rate limits?**
A: API Gateway throttling, Lambda concurrency limits, exponential backoff, queue-based processing for high volume.

**Q: What about data privacy?**
A: Data stays in your AWS account, encrypted at rest and in transit, IAM controls access, audit logs in CloudWatch.

**Q: How do you version agents?**
A: Lambda versions and aliases, blue-green deployments, feature flags, gradual rollouts.

### Timing
- 50:00-60:00

---

## Closing (1 minute)

### Script
"Thank you all for attending! Remember to grab the handout on your way out, scan the QR code for the starter kit, and join the community Slack. I'll be around for a few minutes if you want to chat one-on-one. Happy building!"

### Actions
- Thank attendees
- Point to resources
- Offer to stay for questions
- Encourage community participation

---

## Backup Materials

### If Demo Fails
1. Pre-recorded videos in `demo-videos/`
2. Static screenshots in `demo-screenshots/`
3. Backup slides 50-60 with demo results

### If Questions Go Deep
1. Architecture deep dive slides 61-70
2. Code walkthrough in `code-examples/`
3. Troubleshooting guide in handout

### Technical Issues
1. Backup laptop ready
2. Mobile hotspot for internet
3. USB drive with all materials
4. Printed slides as last resort

---

## Post-Presentation Checklist

- [ ] Collect feedback forms
- [ ] Share slides online
- [ ] Post recording (if recorded)
- [ ] Answer follow-up emails
- [ ] Update starter kit based on feedback
- [ ] Write blog post summarizing key points
- [ ] Schedule office hours
- [ ] Thank organizers

---

## Timing Summary

- Introduction: 2 minutes
- Problem & Use Case: 4 minutes
- Architecture: 5 minutes
- AgentCore Integration: 7 minutes
- Multi-Agent Orchestration: 7 minutes
- Security & IAM: 5 minutes
- Starter Kit: 5 minutes
- Live Demos: 4 minutes
- Takeaways: 4 minutes
- Resources: 2 minutes
- Q&A: 10 minutes
- **Total: 55 minutes** (with 5-minute buffer)

---

## Energy Level Management

- **High Energy**: Introduction, demos, Q&A
- **Medium Energy**: Architecture, patterns
- **Interactive**: Chalk talk sections, questions
- **Breaks**: Natural pauses after major sections

---

## Audience Engagement

- Ask questions throughout
- Encourage interruptions
- Use chalk talk for complex topics
- Show enthusiasm for the technology
- Share real-world experiences
- Acknowledge good questions
- Invite participation in demos

---

## Success Metrics

- [ ] Audience engaged (questions, nodding)
- [ ] Demos work smoothly
- [ ] Key concepts understood
- [ ] Starter kit downloads
- [ ] Community sign-ups
- [ ] Positive feedback
- [ ] Follow-up questions

---

**Remember**: This is a chalk talk, not a lecture. Engage the audience, encourage questions, and make it interactive!
