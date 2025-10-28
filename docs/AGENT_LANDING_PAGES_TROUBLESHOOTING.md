# Agent Landing Pages - Troubleshooting Guide

This guide provides detailed troubleshooting steps for common issues with the agent landing pages feature.

## Table of Contents

1. [Agent Switcher Issues](#agent-switcher-issues)
2. [Landing Page Display Issues](#landing-page-display-issues)
3. [Visualization Rendering Issues](#visualization-rendering-issues)
4. [EDIcraft Connection Issues](#edicraft-connection-issues)
5. [MCP Server Issues](#mcp-server-issues)
6. [Agent Response Issues](#agent-response-issues)
7. [Performance Issues](#performance-issues)
8. [Browser Compatibility Issues](#browser-compatibility-issues)

---

## Agent Switcher Issues

### Issue: Agent switchers not synchronizing

**Symptoms**:
- Panel switcher shows different agent than input switcher
- Selecting agent from one switcher doesn't update the other
- Agent selection doesn't persist after page refresh

**Diagnosis**:
1. Open browser DevTools (F12)
2. Check Console for JavaScript errors
3. Check Application > Local Storage > sessionStorage
4. Look for `selectedAgent` key

**Solutions**:

**Solution 1: Clear sessionStorage**
```javascript
// In browser console:
sessionStorage.clear();
location.reload();
```

**Solution 2: Check for JavaScript errors**
1. Open DevTools Console
2. Look for errors related to `AgentSwitcher` or `handleAgentChange`
3. If errors present, refresh page
4. If errors persist, clear cache and reload

**Solution 3: Verify state management**
```javascript
// In browser console, check current state:
console.log(sessionStorage.getItem('selectedAgent'));
// Should return: 'auto', 'petrophysics', 'maintenance', 'renewable', or 'edicraft'
```

**Solution 4: Force agent selection**
```javascript
// In browser console:
sessionStorage.setItem('selectedAgent', 'auto');
location.reload();
```

### Issue: Agent dropdown doesn't open

**Symptoms**:
- Clicking agent switcher does nothing
- Dropdown menu doesn't appear
- No visual feedback on click

**Diagnosis**:
1. Check if element is clickable (not covered by another element)
2. Check for CSS z-index issues
3. Check for JavaScript event listener errors

**Solutions**:

**Solution 1: Check z-index**
```javascript
// In browser console:
const switcher = document.querySelector('.agent-switcher-container');
console.log(window.getComputedStyle(switcher).zIndex);
// Should be a positive number
```

**Solution 2: Verify event listeners**
1. Right-click on agent switcher
2. Select "Inspect Element"
3. Check Event Listeners tab in DevTools
4. Verify click handler is attached

**Solution 3: Clear browser cache**
1. Open browser settings
2. Clear cache and cookies
3. Reload page

### Issue: Selected agent not highlighted

**Symptoms**:
- No checkmark next to selected agent
- All agents appear unselected
- Can't tell which agent is active

**Diagnosis**:
1. Check if `selectedAgent` state is set correctly
2. Verify icon rendering logic
3. Check CSS for checkmark visibility

**Solutions**:

**Solution 1: Verify selected agent state**
```javascript
// In browser console:
console.log(sessionStorage.getItem('selectedAgent'));
```

**Solution 2: Check icon rendering**
1. Inspect dropdown menu in DevTools
2. Look for `iconName="check"` attribute on selected item
3. Verify Cloudscape icon library is loaded

**Solution 3: Force re-render**
```javascript
// Select a different agent and back to force re-render
```

---

## Landing Page Display Issues

### Issue: Landing page shows blank or empty

**Symptoms**:
- Left panel is empty when "AI Workflows" tab selected
- No agent information displays
- White or blank space where landing page should be

**Diagnosis**:
1. Check if correct tab is selected ("AI Workflows" not "Chain of Thought")
2. Check browser console for component loading errors
3. Verify agent selection is valid

**Solutions**:

**Solution 1: Verify tab selection**
1. Click "AI Workflows" tab in left panel
2. Ensure tab is highlighted/active
3. Try clicking away and back

**Solution 2: Check for lazy loading errors**
```javascript
// In browser console:
// Look for errors like "Failed to load component" or "Suspense"
```

**Solution 3: Force component reload**
1. Select a different agent
2. Wait for landing page to load
3. Select original agent again

**Solution 4: Clear React cache**
1. Open DevTools
2. Application > Clear storage
3. Check "Cache storage"
4. Click "Clear site data"
5. Reload page

### Issue: Landing page content incomplete

**Symptoms**:
- Some sections missing (bio, capabilities, examples)
- Visualization missing
- Partial content displays

**Diagnosis**:
1. Check browser console for errors
2. Verify component props are passed correctly
3. Check network tab for failed requests

**Solutions**:

**Solution 1: Check console errors**
1. Open DevTools Console
2. Look for errors related to landing page components
3. Note specific component names in errors

**Solution 2: Verify network requests**
1. Open DevTools Network tab
2. Reload page
3. Check for failed requests (red status codes)
4. Verify all JavaScript bundles loaded

**Solution 3: Check component structure**
```javascript
// In browser console:
// Verify landing page component is mounted
document.querySelector('.agent-landing-content');
// Should return an element, not null
```

### Issue: Landing page doesn't update when switching agents

**Symptoms**:
- Landing page shows wrong agent information
- Content doesn't change when selecting different agent
- Stale content displays

**Diagnosis**:
1. Check if agent selection state is updating
2. Verify landing page component receives new props
3. Check for React re-render issues

**Solutions**:

**Solution 1: Force re-render**
1. Click "Chain of Thought" tab
2. Click "AI Workflows" tab
3. Landing page should update

**Solution 2: Check React DevTools**
1. Install React DevTools extension
2. Open DevTools > React tab
3. Find `AgentLandingPage` component
4. Check `selectedAgent` prop value
5. Verify it matches selected agent

**Solution 3: Clear component cache**
```javascript
// In browser console:
sessionStorage.clear();
location.reload();
```

---

## Visualization Rendering Issues

### Issue: SVG visualizations not displaying

**Symptoms**:
- Empty space where visualization should be
- Broken image icon
- No visual representation of agent

**Diagnosis**:
1. Check browser console for SVG errors
2. Verify SVG syntax is valid
3. Check CSS for visibility issues

**Solutions**:

**Solution 1: Check SVG element**
```javascript
// In browser console:
const svg = document.querySelector('.agent-visualization svg');
console.log(svg);
// Should return SVG element, not null
```

**Solution 2: Verify SVG viewBox**
1. Inspect SVG element in DevTools
2. Check `viewBox` attribute is set
3. Verify width and height are set

**Solution 3: Check CSS**
```javascript
// In browser console:
const viz = document.querySelector('.agent-visualization');
console.log(window.getComputedStyle(viz).display);
// Should be 'flex' or 'block', not 'none'
```

**Solution 4: Test with different browser**
- Try Chrome, Firefox, or Safari
- Some browsers have better SVG support

### Issue: Visualizations appear distorted or incorrectly sized

**Symptoms**:
- SVG too large or too small
- Aspect ratio incorrect
- Visualization cut off

**Diagnosis**:
1. Check SVG viewBox and dimensions
2. Verify CSS container sizing
3. Check responsive design breakpoints

**Solutions**:

**Solution 1: Check container size**
```javascript
// In browser console:
const container = document.querySelector('.agent-visualization');
console.log(container.offsetWidth, container.offsetHeight);
```

**Solution 2: Verify SVG preserveAspectRatio**
1. Inspect SVG element
2. Check `preserveAspectRatio` attribute
3. Should be "xMidYMid meet" for proper scaling

**Solution 3: Test at different screen sizes**
1. Open DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes
4. Check if visualization scales properly

### Issue: Visualization colors incorrect or missing

**Symptoms**:
- All elements same color
- Colors don't match design
- Invisible elements

**Diagnosis**:
1. Check SVG fill and stroke attributes
2. Verify CSS color variables
3. Check for color contrast issues

**Solutions**:

**Solution 1: Inspect SVG colors**
```javascript
// In browser console:
const paths = document.querySelectorAll('.agent-visualization path');
paths.forEach(p => console.log(p.getAttribute('fill'), p.getAttribute('stroke')));
```

**Solution 2: Check CSS variables**
```javascript
// In browser console:
const root = document.documentElement;
console.log(getComputedStyle(root).getPropertyValue('--color-primary'));
```

**Solution 3: Verify Cloudscape theme**
1. Check if Cloudscape Design System is loaded
2. Verify theme is applied correctly
3. Check for CSS conflicts

---

## EDIcraft Connection Issues

### Issue: "Unable to connect to Minecraft server"

**Symptoms**:
- Error message when sending EDIcraft queries
- Connection status shows "Disconnected"
- Timeout errors

**Diagnosis**:
1. Check Minecraft server status
2. Verify network connectivity
3. Check firewall rules

**Solutions**:

**Solution 1: Verify server is running**
```bash
# From terminal:
nc -zv edicraft.nigelgardiner.com 49000
# Should show "succeeded" or "open"
```

**Solution 2: Check environment variables**
```javascript
// Verify MINECRAFT_HOST is set correctly
// Check .env.local file
```

**Solution 3: Test RCON connection**
```bash
# Using mcrcon tool:
mcrcon -H edicraft.nigelgardiner.com -P 49000 -p <password> "list"
```

**Solution 4: Check firewall**
1. Verify port 49000 is open
2. Check corporate firewall rules
3. Test from different network if possible

**Solution 5: Contact server administrator**
- Verify server is running
- Check server logs for connection attempts
- Verify RCON is enabled

### Issue: "Authentication failed" with Minecraft RCON

**Symptoms**:
- RCON password error
- Authentication failure message
- Connection refused after password attempt

**Diagnosis**:
1. Verify RCON password is correct
2. Check environment variable configuration
3. Verify password hasn't changed

**Solutions**:

**Solution 1: Verify RCON password**
1. Check `.env.local` file
2. Verify `MINECRAFT_RCON_PASSWORD` is set
3. Confirm password with server administrator

**Solution 2: Update password**
```bash
# In .env.local:
MINECRAFT_RCON_PASSWORD=correct_password_here
```

**Solution 3: Restart MCP server**
1. Open Kiro MCP Server panel
2. Restart EDIcraft MCP server
3. New password will be loaded

**Solution 4: Check MCP configuration**
1. Open `.kiro/settings/mcp.json`
2. Verify `MINECRAFT_RCON_PASSWORD` references environment variable
3. Should be: `"${MINECRAFT_RCON_PASSWORD}"`

### Issue: "OSDU platform authentication failed"

**Symptoms**:
- Cannot access OSDU data
- Authentication error messages
- 401 Unauthorized responses

**Diagnosis**:
1. Verify OSDU credentials are correct
2. Check if credentials have expired
3. Verify platform URL is correct

**Solutions**:

**Solution 1: Verify credentials**
```bash
# Check .env.local file:
EDI_USERNAME=your_username
EDI_PASSWORD=your_password
EDI_CLIENT_ID=your_client_id
EDI_CLIENT_SECRET=your_client_secret
```

**Solution 2: Test OSDU authentication**
```bash
curl -X POST "${EDI_PLATFORM_URL}/api/auth/token" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"${EDI_USERNAME}\",\"password\":\"${EDI_PASSWORD}\"}"
```

**Solution 3: Update credentials**
1. Obtain new credentials from OSDU administrator
2. Update `.env.local` file
3. Restart MCP server

**Solution 4: Verify platform URL**
```bash
# Check EDI_PLATFORM_URL in .env.local
# Should be full URL: https://your-osdu-platform.com
```

**Solution 5: Check partition access**
1. Verify `EDI_PARTITION` is correct
2. Confirm you have access to the partition
3. Contact OSDU administrator if needed

### Issue: EDIcraft queries return no results

**Symptoms**:
- "No wellbores found" messages
- Empty search results
- No data available errors

**Diagnosis**:
1. Verify search parameters are valid
2. Check OSDU platform has data in the area
3. Verify data permissions

**Solutions**:

**Solution 1: Verify search coordinates**
- Ensure coordinates are in valid range
- Check coordinate format (latitude, longitude)
- Try broader search radius

**Solution 2: Check data availability**
1. Log into OSDU platform directly
2. Verify data exists in search area
3. Check data permissions

**Solution 3: Try different query**
```
# Instead of specific coordinates, try:
"Search for all wellbores"
"List available horizons"
```

**Solution 4: Check MCP server logs**
1. Open Kiro MCP Server panel
2. View EDIcraft server logs
3. Look for OSDU API errors

---

## MCP Server Issues

### Issue: MCP server won't start

**Symptoms**:
- EDIcraft agent unavailable
- "MCP server not running" error
- Connection refused errors

**Diagnosis**:
1. Check Python installation
2. Verify MCP server configuration
3. Check for port conflicts

**Solutions**:

**Solution 1: Verify Python installation**
```bash
python --version
# Should show Python 3.8 or higher
```

**Solution 2: Check MCP configuration**
1. Open `.kiro/settings/mcp.json`
2. Verify `edicraft` server is configured
3. Check `disabled` is `false`

**Solution 3: Check file paths**
```bash
# Verify agent.py exists:
ls -la EDIcraft-main/agent.py
```

**Solution 4: Install dependencies**
```bash
cd EDIcraft-main
pip install -r requirements.txt
```

**Solution 5: Check Kiro MCP panel**
1. Open Kiro
2. Navigate to MCP Server view
3. Check EDIcraft server status
4. Click "Restart" if needed

### Issue: MCP server crashes or disconnects

**Symptoms**:
- Server starts but then stops
- Intermittent connection errors
- Server status shows "Unknown"

**Diagnosis**:
1. Check MCP server logs
2. Look for Python errors
3. Check resource usage

**Solutions**:

**Solution 1: Check logs**
1. Open Kiro MCP Server panel
2. View EDIcraft server logs
3. Look for error messages or stack traces

**Solution 2: Check Python errors**
```bash
# Run agent.py directly to see errors:
cd EDIcraft-main
python agent.py
```

**Solution 3: Verify dependencies**
```bash
cd EDIcraft-main
pip list
# Verify all required packages are installed
```

**Solution 4: Check memory usage**
```bash
# Monitor Python process:
top -p $(pgrep -f agent.py)
```

**Solution 5: Restart MCP server**
1. Open Kiro MCP Server panel
2. Stop EDIcraft server
3. Wait 5 seconds
4. Start EDIcraft server

### Issue: MCP tools not available

**Symptoms**:
- "Tool not found" errors
- Limited functionality
- Missing capabilities

**Diagnosis**:
1. Check MCP server configuration
2. Verify tools are registered
3. Check autoApprove list

**Solutions**:

**Solution 1: Verify tool registration**
1. Open `.kiro/settings/mcp.json`
2. Check `autoApprove` array
3. Verify required tools are listed

**Solution 2: Check MCP server logs**
1. Look for tool registration messages
2. Verify tools loaded successfully
3. Check for initialization errors

**Solution 3: Update MCP configuration**
```json
// In .kiro/settings/mcp.json, ensure all tools are listed:
"autoApprove": [
  "show_config",
  "search_wellbores",
  "build_wellbore",
  // ... etc
]
```

**Solution 4: Restart MCP server**
- Configuration changes require restart
- Stop and start server in Kiro

---

## Agent Response Issues

### Issue: Agent doesn't respond to queries

**Symptoms**:
- No response after sending query
- Loading indicator never stops
- Timeout errors

**Diagnosis**:
1. Check network connectivity
2. Verify Lambda function is running
3. Check CloudWatch logs

**Solutions**:

**Solution 1: Check network**
1. Open DevTools Network tab
2. Send query
3. Look for failed requests
4. Check response status codes

**Solution 2: Verify Lambda deployment**
```bash
aws lambda list-functions | grep edicraft
# Should show EDIcraft Lambda function
```

**Solution 3: Check CloudWatch logs**
```bash
aws logs tail /aws/lambda/<edicraft-lambda-name> --follow
```

**Solution 4: Try different agent**
- Select Auto agent
- Send same query
- See if routing works

### Issue: Agent returns error messages

**Symptoms**:
- Error text in response
- "Something went wrong" messages
- Stack traces visible

**Diagnosis**:
1. Read error message carefully
2. Check CloudWatch logs for details
3. Verify input parameters

**Solutions**:

**Solution 1: Check error message**
- Error messages usually indicate the problem
- Follow suggested troubleshooting steps
- Check environment variables if mentioned

**Solution 2: Verify query format**
- Ensure query is valid for selected agent
- Check example queries for format
- Try simpler query first

**Solution 3: Check CloudWatch logs**
```bash
aws logs tail /aws/lambda/<lambda-name> --follow
# Look for detailed error information
```

**Solution 4: Contact administrator**
- Provide error message
- Include query that caused error
- Share CloudWatch log excerpts

### Issue: Agent response incomplete or truncated

**Symptoms**:
- Response cuts off mid-sentence
- Missing artifacts
- Partial data

**Diagnosis**:
1. Check Lambda timeout settings
2. Verify response size limits
3. Check for processing errors

**Solutions**:

**Solution 1: Check Lambda timeout**
```bash
aws lambda get-function-configuration \
  --function-name <lambda-name> \
  --query "Timeout"
# Should be 300 seconds or appropriate value
```

**Solution 2: Check response size**
- Lambda responses limited to 6MB
- Large artifacts may be truncated
- Check if S3 storage is used

**Solution 3: Simplify query**
- Request less data
- Break into multiple queries
- Use filters to reduce result size

---

## Performance Issues

### Issue: Slow page load times

**Symptoms**:
- Page takes > 5 seconds to load
- Visualizations load slowly
- Laggy interface

**Diagnosis**:
1. Check network speed
2. Verify bundle sizes
3. Check for memory leaks

**Solutions**:

**Solution 1: Check network**
1. Open DevTools Network tab
2. Reload page
3. Check total transfer size
4. Look for large files

**Solution 2: Clear cache**
1. Clear browser cache
2. Clear service worker cache
3. Reload page

**Solution 3: Check bundle size**
```bash
# After build:
ls -lh .next/static/chunks/
# Look for unusually large files
```

**Solution 4: Disable extensions**
- Browser extensions can slow page load
- Try incognito/private mode
- Disable extensions one by one

### Issue: Agent switching is slow

**Symptoms**:
- Delay when selecting agent
- Landing page takes time to update
- Laggy dropdown

**Diagnosis**:
1. Check component lazy loading
2. Verify React performance
3. Check for unnecessary re-renders

**Solutions**:

**Solution 1: Check React DevTools**
1. Install React DevTools
2. Open Profiler tab
3. Record agent switch
4. Look for slow components

**Solution 2: Clear React cache**
```javascript
// In browser console:
sessionStorage.clear();
localStorage.clear();
location.reload();
```

**Solution 3: Check memory usage**
1. Open DevTools Performance tab
2. Record agent switch
3. Check memory allocation
4. Look for memory leaks

### Issue: High memory usage

**Symptoms**:
- Browser becomes slow over time
- Tab crashes
- "Out of memory" errors

**Diagnosis**:
1. Check for memory leaks
2. Verify component cleanup
3. Check for large data structures

**Solutions**:

**Solution 1: Monitor memory**
1. Open DevTools Memory tab
2. Take heap snapshot
3. Switch agents multiple times
4. Take another snapshot
5. Compare for leaks

**Solution 2: Reload page**
- Simple solution for immediate relief
- Clears accumulated memory

**Solution 3: Close other tabs**
- Free up browser memory
- Close unused applications

**Solution 4: Report issue**
- Memory leaks need developer fix
- Provide steps to reproduce
- Include memory snapshots

---

## Browser Compatibility Issues

### Issue: Features not working in specific browser

**Symptoms**:
- Works in Chrome but not Firefox
- Safari shows different behavior
- Mobile browser issues

**Diagnosis**:
1. Check browser version
2. Verify feature support
3. Check console for errors

**Solutions**:

**Solution 1: Update browser**
```
Chrome: Help > About Google Chrome
Firefox: Help > About Firefox
Safari: App Store > Updates
```

**Solution 2: Check browser support**
- Verify browser supports ES6+
- Check SVG support
- Verify CSS Grid support

**Solution 3: Try different browser**
- Test in Chrome (recommended)
- Test in Firefox
- Test in Safari
- Report browser-specific issues

**Solution 4: Clear browser data**
1. Clear cache and cookies
2. Clear site data
3. Reload page

### Issue: Mobile display issues

**Symptoms**:
- Layout broken on mobile
- Visualizations too large/small
- Touch interactions not working

**Diagnosis**:
1. Check responsive design
2. Verify viewport settings
3. Test touch events

**Solutions**:

**Solution 1: Check viewport**
```html
<!-- Should be in HTML head: -->
<meta name="viewport" content="width=device-width, initial-scale=1">
```

**Solution 2: Test responsive design**
1. Open DevTools
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test various screen sizes
4. Check for layout issues

**Solution 3: Use desktop site**
- Request desktop site in mobile browser
- Better experience on larger screens
- Temporary workaround

---

## Getting Additional Help

If issues persist after trying these solutions:

### 1. Gather Information

Collect the following before contacting support:

- **Browser**: Name and version
- **Operating System**: Windows, macOS, Linux
- **Error Messages**: Exact text of errors
- **Steps to Reproduce**: What you did before error occurred
- **Screenshots**: Visual evidence of issue
- **Console Logs**: JavaScript errors from DevTools
- **Network Logs**: Failed requests from DevTools

### 2. Check CloudWatch Logs (Administrators)

```bash
# View recent logs:
aws logs tail /aws/lambda/<lambda-name> --follow

# Search for errors:
aws logs filter-log-events \
  --log-group-name /aws/lambda/<lambda-name> \
  --filter-pattern "ERROR"
```

### 3. Contact Support

Provide:
- Issue description
- Information gathered above
- What you've already tried
- Impact on your work

### 4. Temporary Workarounds

While waiting for fixes:
- Use Auto agent instead of specific agent
- Try different browser
- Use desktop instead of mobile
- Reload page frequently
- Clear cache regularly

---

## Preventive Measures

To avoid issues:

1. **Keep browser updated**
2. **Clear cache weekly**
3. **Monitor CloudWatch logs**
4. **Test after deployments**
5. **Verify environment variables**
6. **Maintain MCP server health**
7. **Check Minecraft server status**
8. **Rotate OSDU credentials regularly**

---

## Additional Resources

- [User Guide](./AGENT_LANDING_PAGES_USER_GUIDE.md)
- [Environment Setup](./AGENT_LANDING_PAGES_ENVIRONMENT_SETUP.md)
- [Deployment Checklist](./AGENT_LANDING_PAGES_DEPLOYMENT_CHECKLIST.md)
- [EDIcraft Documentation](../EDIcraft-main/README.md)
- [MCP Server Documentation](./MCP_SERVER_SETUP_SUMMARY.md)

---

**Last Updated**: 2025  
**Version**: 1.0
