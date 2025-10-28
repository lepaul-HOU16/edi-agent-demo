# Agent Landing Pages - Deployment Checklist

This checklist ensures all components of the agent landing pages feature are properly deployed and functioning correctly.

## Pre-Deployment Checklist

### 1. Environment Variables Configuration

- [ ] `.env.local` file created from `.env.example`
- [ ] All required environment variables set:
  - [ ] `MINECRAFT_HOST` configured
  - [ ] `MINECRAFT_RCON_PORT` configured (default: 49000)
  - [ ] `MINECRAFT_RCON_PASSWORD` set securely
  - [ ] `EDI_USERNAME` configured
  - [ ] `EDI_PASSWORD` set securely
  - [ ] `EDI_CLIENT_ID` configured
  - [ ] `EDI_CLIENT_SECRET` set securely
  - [ ] `EDI_PARTITION` configured
  - [ ] `EDI_PLATFORM_URL` configured
  - [ ] `MCP_SERVER_URL` configured (if using external MCP server)

### 2. MCP Server Configuration

- [ ] `.kiro/settings/mcp.json` file exists
- [ ] EDIcraft MCP server configured:
  - [ ] Command points to `EDIcraft-main/agent.py`
  - [ ] Environment variables properly referenced with `${VAR}` syntax
  - [ ] All required tools listed in `autoApprove` array
  - [ ] `disabled` set to `false`
- [ ] Python environment ready:
  - [ ] Python 3.8+ installed
  - [ ] Required Python packages installed (see `EDIcraft-main/requirements.txt`)

### 3. Code Compilation

- [ ] TypeScript compilation successful:
  ```bash
  npx tsc --noEmit
  ```
- [ ] No linting errors:
  ```bash
  npm run lint
  ```
- [ ] All tests passing:
  ```bash
  npm test
  ```

### 4. Build Verification

- [ ] Production build successful:
  ```bash
  npm run build
  ```
- [ ] No build warnings or errors
- [ ] Build output size acceptable (check `.next` directory)

## Deployment Steps

### 1. Deploy Backend (AWS Amplify)

- [ ] Amplify sandbox running or production deployment initiated:
  ```bash
  npx ampx sandbox
  # OR for production:
  npx ampx pipeline-deploy --branch main --app-id <app-id>
  ```
- [ ] Backend deployment successful (check CloudFormation stack status)
- [ ] All Lambda functions deployed:
  - [ ] EDIcraft agent handler
  - [ ] Agent router
  - [ ] Other agent handlers (auto, petrophysics, maintenance, renewable)

### 2. Verify Lambda Environment Variables

- [ ] EDIcraft agent Lambda has required environment variables:
  ```bash
  aws lambda get-function-configuration \
    --function-name <edicraft-lambda-name> \
    --query "Environment.Variables"
  ```
- [ ] Verify all credentials are set (should not be "None" or empty)

### 3. Deploy Frontend (Next.js)

- [ ] Frontend build deployed to hosting environment
- [ ] Static assets uploaded to CDN/S3
- [ ] Environment variables configured in hosting platform
- [ ] DNS/domain configuration updated (if applicable)

### 4. Verify IAM Permissions

- [ ] Lambda execution roles have required permissions:
  - [ ] Bedrock model invocation
  - [ ] S3 access (if storing artifacts)
  - [ ] CloudWatch Logs write access
  - [ ] Secrets Manager access (if using for credentials)

## Post-Deployment Verification

### 1. MCP Server Connectivity

- [ ] Start MCP servers (if not auto-started):
  ```bash
  # MCP servers should start automatically via Kiro
  # Check Kiro MCP Server view for status
  ```
- [ ] Verify EDIcraft MCP server is running:
  - [ ] Check Kiro MCP Server panel
  - [ ] Status shows "Connected" or "Running"
  - [ ] No error messages in logs

### 2. Minecraft Server Connectivity

- [ ] Test Minecraft server connection:
  ```bash
  nc -zv edicraft.nigelgardiner.com 49000
  ```
- [ ] Verify RCON access (if possible):
  ```bash
  # Using mcrcon or similar tool
  mcrcon -H edicraft.nigelgardiner.com -P 49000 -p <password> "list"
  ```
- [ ] Minecraft server is running and accessible
- [ ] Server is at correct coordinates (spawn at 0,100,0)

### 3. OSDU Platform Connectivity

- [ ] Test OSDU platform authentication:
  ```bash
  curl -X POST "${EDI_PLATFORM_URL}/api/auth/token" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${EDI_USERNAME}\",\"password\":\"${EDI_PASSWORD}\"}"
  ```
- [ ] Verify credentials are valid
- [ ] Verify partition access
- [ ] Test data retrieval (wellbores, horizons)

### 4. Frontend Verification

#### Agent Switcher Functionality

- [ ] Open chat interface in browser
- [ ] Panel agent switcher visible (20px left of SegmentedControl)
- [ ] Panel agent switcher displays all 5 agents:
  - [ ] Auto
  - [ ] Petrophysics
  - [ ] Maintenance
  - [ ] Renewable Energy
  - [ ] EDIcraft
- [ ] Input agent switcher visible in chat input area
- [ ] Both switchers show same selected agent
- [ ] Selecting agent from panel switcher updates input switcher
- [ ] Selecting agent from input switcher updates panel switcher
- [ ] Selected agent persists after page reload (sessionStorage)

#### Agent Landing Pages

- [ ] Auto Agent landing page displays correctly:
  - [ ] Title and icon visible
  - [ ] Bio/introduction text displays
  - [ ] Capabilities listed
  - [ ] Visualization renders (routing nodes)
  - [ ] Example queries expandable section works
- [ ] Petrophysics Agent landing page displays correctly:
  - [ ] Title and icon visible
  - [ ] Bio/introduction text displays
  - [ ] Capabilities listed
  - [ ] Visualization renders (well logs)
  - [ ] Example workflows section displays
- [ ] Maintenance Agent landing page displays correctly:
  - [ ] Title and icon visible
  - [ ] Bio/introduction text displays
  - [ ] Capabilities listed
  - [ ] Visualization renders (equipment health)
  - [ ] Example use cases section displays
- [ ] Renewable Energy Agent landing page displays correctly:
  - [ ] Title and icon visible
  - [ ] Bio/introduction text displays
  - [ ] Capabilities listed
  - [ ] Visualization renders (wind turbines)
  - [ ] Example workflows section displays
- [ ] EDIcraft Agent landing page displays correctly:
  - [ ] Title and icon visible
  - [ ] Bio/introduction text displays
  - [ ] Capabilities listed
  - [ ] Visualization renders (Minecraft blocks)
  - [ ] Minecraft server connection status displays
  - [ ] Example workflows section displays

#### Visualizations

- [ ] All SVG visualizations render without errors
- [ ] Visualizations are responsive (test different screen sizes)
- [ ] Visualizations have proper ARIA labels
- [ ] Visualizations scale correctly (small, medium, large sizes)
- [ ] No console errors related to visualizations

### 5. Agent Functionality Testing

#### Test All 5 Agents

##### Auto Agent
- [ ] Select Auto agent from switcher
- [ ] Send test query: "Analyze well data for WELL-001"
- [ ] Verify agent routes query to appropriate specialized agent
- [ ] Response displays correctly
- [ ] Chain of thought shows routing decision

##### Petrophysics Agent
- [ ] Select Petrophysics agent from switcher
- [ ] Send test query: "Calculate porosity for WELL-001"
- [ ] Verify agent processes query
- [ ] Response displays correctly
- [ ] Artifacts render (if applicable)
- [ ] Chain of thought displays

##### Maintenance Agent
- [ ] Select Maintenance agent from switcher
- [ ] Send test query: "Assess health of PUMP-001"
- [ ] Verify agent processes query
- [ ] Response displays correctly
- [ ] Chain of thought displays

##### Renewable Energy Agent
- [ ] Select Renewable Energy agent from switcher
- [ ] Send test query: "Analyze terrain for wind farm at 35.0675, -101.3954"
- [ ] Verify agent processes query
- [ ] Response displays correctly
- [ ] Artifacts render (terrain map, etc.)
- [ ] Chain of thought displays

##### EDIcraft Agent
- [ ] Select EDIcraft agent from switcher
- [ ] Send test query: "Search for wellbores in the area"
- [ ] Verify MCP server connection successful
- [ ] Verify OSDU platform query executes
- [ ] Response displays correctly with feedback
- [ ] Chain of thought shows reasoning process
- [ ] No "Visualization Unavailable" errors
- [ ] Minecraft commands executed (verify in Minecraft if possible)

### 6. Error Handling Verification

#### EDIcraft Connection Errors

- [ ] Test with invalid Minecraft host:
  - [ ] Error message displays
  - [ ] Error message is user-friendly
  - [ ] Troubleshooting information provided
- [ ] Test with invalid RCON password:
  - [ ] Authentication error displays
  - [ ] Error message suggests checking password
- [ ] Test with OSDU platform down:
  - [ ] Connection error displays
  - [ ] Error message is informative
  - [ ] Graceful degradation occurs

#### General Error Handling

- [ ] Test with network disconnected:
  - [ ] Appropriate error message displays
  - [ ] No application crash
- [ ] Test with invalid agent selection:
  - [ ] Defaults to Auto agent or shows error
  - [ ] No console errors
- [ ] Test with malformed queries:
  - [ ] Agent handles gracefully
  - [ ] Error message is helpful

### 7. Performance Verification

- [ ] Page load time acceptable (< 3 seconds)
- [ ] Agent switching is instant (< 100ms)
- [ ] Landing page rendering is smooth
- [ ] Visualizations render quickly (< 500ms)
- [ ] No memory leaks (check browser DevTools)
- [ ] No excessive re-renders (check React DevTools)

### 8. Accessibility Verification

- [ ] Keyboard navigation works:
  - [ ] Tab through agent switchers
  - [ ] Enter to select agent
  - [ ] Arrow keys in dropdowns
  - [ ] All interactive elements reachable
- [ ] Screen reader support:
  - [ ] ARIA labels present on switchers
  - [ ] ARIA labels present on visualizations
  - [ ] Proper heading hierarchy (h1, h2, h3)
  - [ ] Alt text on visual elements
- [ ] Color contrast:
  - [ ] All text meets WCAG AA standards (4.5:1)
  - [ ] Interactive elements have sufficient contrast
  - [ ] Visualizations distinguishable without color

### 9. Browser Compatibility

- [ ] Chrome/Edge (latest):
  - [ ] All features work
  - [ ] No console errors
  - [ ] Visualizations render correctly
- [ ] Firefox (latest):
  - [ ] All features work
  - [ ] No console errors
  - [ ] Visualizations render correctly
- [ ] Safari (latest):
  - [ ] All features work
  - [ ] No console errors
  - [ ] Visualizations render correctly
- [ ] Mobile browsers:
  - [ ] Responsive design works
  - [ ] Touch interactions work
  - [ ] Visualizations scale appropriately

### 10. CloudWatch Logs Verification

- [ ] Check Lambda logs for errors:
  ```bash
  aws logs tail /aws/lambda/<edicraft-lambda-name> --follow
  ```
- [ ] No error messages in logs
- [ ] Successful invocations logged
- [ ] Response times acceptable (< 30 seconds)
- [ ] No timeout errors

### 11. Monitoring and Alerts

- [ ] CloudWatch alarms configured (if applicable):
  - [ ] Lambda errors
  - [ ] Lambda timeouts
  - [ ] High latency
- [ ] Monitoring dashboard created (if applicable)
- [ ] Alert notifications configured

## Rollback Plan

If deployment issues occur:

### 1. Identify Issue
- [ ] Check CloudWatch logs
- [ ] Check browser console errors
- [ ] Check MCP server logs in Kiro
- [ ] Identify which component is failing

### 2. Quick Fixes
- [ ] Restart MCP servers
- [ ] Clear browser cache
- [ ] Verify environment variables
- [ ] Check network connectivity

### 3. Rollback (if needed)
- [ ] Revert to previous Git commit:
  ```bash
  git revert HEAD
  git push
  ```
- [ ] Redeploy previous version:
  ```bash
  npx ampx pipeline-deploy --branch main --app-id <app-id>
  ```
- [ ] Verify previous version works
- [ ] Document issue for investigation

## Post-Deployment Tasks

- [ ] Update deployment documentation
- [ ] Notify team of successful deployment
- [ ] Schedule user acceptance testing
- [ ] Monitor for 24 hours for issues
- [ ] Collect user feedback
- [ ] Document any issues encountered
- [ ] Plan for next iteration/improvements

## Success Criteria

Deployment is considered successful when:

- ✅ All 5 agents are accessible and functional
- ✅ Agent switchers synchronize correctly
- ✅ All landing pages display correctly
- ✅ All visualizations render without errors
- ✅ EDIcraft agent connects to Minecraft server
- ✅ EDIcraft agent connects to OSDU platform
- ✅ MCP servers are running and responsive
- ✅ No console errors in browser
- ✅ No errors in CloudWatch logs
- ✅ Performance is acceptable
- ✅ Accessibility requirements met
- ✅ All tests passing
- ✅ User workflows complete successfully

## Troubleshooting Common Issues

### Issue: Agent switchers not synchronizing
**Solution**: Check sessionStorage implementation, verify state management

### Issue: Landing pages not displaying
**Solution**: Check React lazy loading, verify component imports

### Issue: Visualizations not rendering
**Solution**: Check SVG syntax, verify CSS, check browser console

### Issue: EDIcraft agent connection fails
**Solution**: Verify environment variables, check MCP server logs, test Minecraft connectivity

### Issue: OSDU platform authentication fails
**Solution**: Verify credentials, check platform URL, verify partition access

### Issue: MCP server won't start
**Solution**: Check Python installation, verify dependencies, check file paths

## Additional Resources

- [Environment Variables Setup Guide](./AGENT_LANDING_PAGES_ENVIRONMENT_SETUP.md)
- [User Documentation](./AGENT_LANDING_PAGES_USER_GUIDE.md)
- [Troubleshooting Guide](./AGENT_LANDING_PAGES_TROUBLESHOOTING.md)
- [EDIcraft Agent Documentation](../EDIcraft-main/README.md)
- [MCP Server Documentation](./MCP_SERVER_SETUP_SUMMARY.md)

## Deployment Sign-Off

- [ ] Deployment completed by: _________________ Date: _________
- [ ] Verification completed by: _________________ Date: _________
- [ ] Approved for production by: _________________ Date: _________

---

**Note**: This checklist should be completed for every deployment to ensure consistency and quality. Keep a record of completed checklists for audit and troubleshooting purposes.
