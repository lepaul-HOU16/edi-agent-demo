# Presenter Quick Reference Card
## AWS re:Invent Chalk Talk - Building Multi-Agent AI Systems

**Print this page and keep it with you during the presentation!**

---

## ⏰ Timing Overview (55 minutes total)

| Section | Time | Slides |
|---------|------|--------|
| Introduction | 2 min | 1-2 |
| Problem & Use Case | 4 min | 3-4 |
| Architecture | 5 min | 5-7 |
| AgentCore Integration | 7 min | 8-11 |
| Multi-Agent Orchestration | 7 min | 12-15 |
| Security & IAM | 5 min | 16-20 |
| Starter Kit | 5 min | 21-25 |
| Live Demos | 4 min | 26-28 |
| Takeaways | 4 min | 29-31 |
| Resources | 2 min | 32-33 |
| Q&A | 10 min | 34 |

---

## 🎬 Demo Quick Reference

### Demo 1: Simple Query (2-3 sec)
**Query**: `Calculate porosity for Well-001`
**Expected**: Intent detection → Tool invocation → Visualization
**Highlight**: Fast, transparent, professional

### Demo 2: Complex Orchestration (30-40 sec)
**Query**: `Analyze wind farm site at coordinates 35.0, -101.4`
**Expected**: Async processing → Multiple tools → Multiple artifacts
**Highlight**: Async pattern, orchestration, polling

### Demo 3: Multi-Well (5-7 sec)
**Query**: `Correlate porosity across Well-001, Well-002, and Well-003`
**Expected**: Parallel processing → Crossplot → Statistics
**Highlight**: Multi-well capability, professional format

---

## 🔑 Key Messages

1. **Agent Router Pattern**: Simple priority-based matching works well
2. **Async Processing**: Fire-and-forget with polling solves timeouts
3. **Thought Steps**: Transparency builds trust
4. **Least Privilege IAM**: Security by design
5. **Starter Kit**: Reusable patterns for quick start

---

## 💡 Key Code Snippets

### Agent Router (Slide 9)
```typescript
private determineAgentType(message: string): AgentType {
  if (this.matchesPatterns(message, edicraftPatterns)) {
    return 'edicraft';
  }
  // ... priority-based matching
}
```

### Async Processing (Slide 15)
```typescript
response = await Promise.race([
  agentHandler(event),
  timeoutPromise
]);
```

### Thought Steps (Slide 11)
```typescript
interface ThoughtStep {
  type: 'intent_detection' | 'execution' | 'completion';
  status: 'in_progress' | 'complete' | 'error';
}
```

---

## 🎯 Audience Engagement

### Questions to Ask
- "Who here has built AI agents before?"
- "How many have hit API Gateway timeouts?"
- "Anyone using Bedrock in production?"

### Invite Participation
- "Want to suggest a query?"
- "Any specific use case you'd like to see?"
- "Questions about what you're seeing?"

---

## 🆘 Emergency Backup Plans

### If Demo Fails
1. Stay calm: "This is why we test in production!"
2. Show pre-recorded video (slides 50-60)
3. Walk through expected behavior
4. Offer to debug after session

### If Internet Fails
1. Use mobile hotspot
2. Show offline materials
3. Focus on architecture discussion
4. Offer to demo later

### If Slides Fail
1. Switch to backup laptop
2. Use printed slides
3. Draw on whiteboard
4. Improvise (you know the content!)

---

## 📞 Emergency Contacts

- **Technical Support**: [phone]
- **Event Coordinator**: [phone]
- **Backup Presenter**: [phone]

---

## ✅ Pre-Presentation Checklist

**30 Minutes Before**:
- [ ] Test internet connection
- [ ] Sign in to application
- [ ] Test one demo query
- [ ] Open CloudWatch logs
- [ ] Set up backup laptop
- [ ] Arrange handouts

**5 Minutes Before**:
- [ ] Browser zoom at 125%
- [ ] Developer console ready
- [ ] Backup slides ready
- [ ] Water nearby
- [ ] Deep breath!

---

## 🎤 Opening Lines

"Good morning/afternoon! Welcome to our chalk talk on building multi-agent AI systems with AWS Bedrock. I'm [Name], and today we'll dive deep into a real-world implementation that handles multiple specialized domains through coordinated AI agents. This is a technical session, so feel free to interrupt with questions as we go."

---

## 🎯 Closing Lines

"Thank you all for attending! Remember to grab the handout on your way out, scan the QR code for the starter kit, and join the community Slack. I'll be around for a few minutes if you want to chat one-on-one. Happy building!"

---

## 📊 Success Metrics

- [ ] At least 2 of 3 demos work
- [ ] Key concepts demonstrated
- [ ] Audience engaged (questions, nodding)
- [ ] Starter kit promoted
- [ ] QR codes shown
- [ ] Handouts distributed
- [ ] Community mentioned

---

## 🎨 Chalk Talk Tips

- Draw agent routing flow
- Sketch async processing pattern
- Illustrate timeout problem
- Show coordination challenges
- Diagram data flow

---

## 💬 Common Q&A

**Q: Why custom AgentCore vs. Bedrock Agents?**
A: Fine-grained control, multi-model support, transparent reasoning.

**Q: How do you handle agent failures?**
A: Error handling at each layer, fallback to general agent, graceful degradation.

**Q: What about costs?**
A: Mostly Lambda and Bedrock. Typical query costs $0.01-0.05.

**Q: How do you test agents?**
A: Unit tests for routing, integration tests for tools, end-to-end with real queries.

**Q: Can this work with other LLMs?**
A: Yes! The pattern is model-agnostic.

---

## 🔗 Quick Links

- **Starter Kit**: https://github.com/[repo]/aws-agentcore-starter-kit
- **Slack**: [slack-invite-url]
- **Email**: support@example.com
- **Feedback**: [feedback-form-url]

---

## 🎉 Remember

- **Breathe**: You've got this!
- **Smile**: Enthusiasm is contagious
- **Engage**: Make it interactive
- **Have Fun**: Enjoy the presentation!

---

**"The best demos are the ones that work, but the most memorable ones are the ones where you handle failures gracefully!"**

---

**Good luck! 🚀**
