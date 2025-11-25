# Workflow Consistency Test - Quick Start Guide

## 🚀 Quick Test Options

### Option 1: Interactive HTML Test (Recommended for Visual Verification)

```bash
# Open in browser
open tests/test-workflow-consistency.html
```

**Steps:**
1. Open the HTML file in your browser
2. Complete the renewable energy workflow in your application:
   - "analyze terrain at 35.067482, -101.395466"
   - "show wind rose analysis"
   - "optimize turbine layout"
   - "run wake simulation"
   - "generate executive report"
3. Check off verification items in the HTML page as you complete each step
4. Review the automated summary
5. Export results if needed

**Time:** ~10 minutes

---

### Option 2: Manual Test (Comprehensive Verification)

```bash
# Open guide
open tests/manual-test-workflow-consistency.md
```

**Steps:**
1. Follow the step-by-step procedure in the markdown guide
2. Complete all checklists for each workflow step
3. Verify requirements 4.1-4.5
4. Document any issues found

**Time:** ~15 minutes

---

### Option 3: Automated Test (Technical Validation)

```bash
# Set environment (if not already set)
export AWS_REGION=us-east-1

# Run test
node tests/test-workflow-consistency.js
```

**Requirements:**
- AWS credentials configured
- Chat Lambda deployed
- Network access to AWS

**Time:** ~5 minutes

---

## 📋 What to Verify

For each workflow step, verify:

### ✅ Clean UI
- [ ] No verbose status text before Cloudscape Container
- [ ] No text like "Analysis completed successfully"
- [ ] No text like "Project Status: ✓ ..."

### ✅ Cloudscape Container
- [ ] Container appears immediately
- [ ] Header with appropriate title
- [ ] All data visualizations render

### ✅ WorkflowCTAButtons
- [ ] Buttons show correct workflow state
- [ ] "Next Step" button works
- [ ] State updates correctly

### ✅ Consistency
- [ ] Same styling as previous steps
- [ ] No visual inconsistencies
- [ ] No layout shifts

---

## 🎯 Success Criteria

**Test PASSES if:**
- All 5 workflow steps complete
- No verbose text before any artifact
- All artifacts use Cloudscape styling
- WorkflowCTAButtons update correctly
- No visual inconsistencies
- Requirements 4.1-4.5 verified

**Test FAILS if:**
- Any verbose status text appears
- Any artifact missing or broken
- Visual inconsistencies found
- WorkflowCTAButtons not updating
- Any requirement not met

---

## 📊 Test Files

| File | Purpose |
|------|---------|
| `test-workflow-consistency.html` | Interactive visual test |
| `manual-test-workflow-consistency.md` | Detailed test guide |
| `test-workflow-consistency.js` | Automated technical test |
| `TASK-8-WORKFLOW-CONSISTENCY-TEST-SUMMARY.md` | Complete documentation |

---

## 🔍 Quick Verification

Run this quick check in your browser console after completing the workflow:

```javascript
// Check for verbose text in chat messages
const messages = document.querySelectorAll('[data-testid="chat-message"]');
const hasVerboseText = Array.from(messages).some(msg => {
  const text = msg.textContent;
  return text.includes('completed successfully') ||
         text.includes('Project Status:') ||
         text.includes('Next:');
});

console.log('Has verbose text:', hasVerboseText); // Should be false
console.log('Total messages:', messages.length);
```

---

## 💡 Tips

1. **Use Interactive HTML Test First**
   - Easiest to use
   - Visual progress tracking
   - No setup required

2. **Clear Browser Cache**
   - If artifacts don't load
   - If seeing old behavior

3. **Check Console for Errors**
   - Open DevTools (F12)
   - Look for red error messages
   - Verify no 404 or 500 errors

4. **Test in Clean Session**
   - Use incognito/private window
   - Ensures fresh state
   - Avoids cached issues

---

## 📞 Need Help?

If tests fail:
1. Check the detailed summary in `TASK-8-WORKFLOW-CONSISTENCY-TEST-SUMMARY.md`
2. Review previous task test results (Tasks 3-7)
3. Verify orchestrator deployment is current
4. Check CloudWatch logs for errors

---

**Quick Start:** Open `test-workflow-consistency.html` and follow the interactive checklist!
