# OSDU Query Builder - Manual Testing Quick Start Guide

## Purpose

This guide helps you quickly execute manual testing for the OSDU Visual Query Builder. Use this alongside the comprehensive execution report (`TASK_14_3_MANUAL_TESTING_EXECUTION.md`).

## Prerequisites

✅ **Before You Start:**
- [ ] Application running (local or deployed)
- [ ] Access to catalog page
- [ ] Real OSDU data available
- [ ] Browser developer tools open
- [ ] Test execution report ready to fill out

## Quick Test Checklist

### Phase 1: Template Testing (15 minutes)

Test all 5 templates with real OSDU data:

1. **Wells by Operator** → Enter "Shell" → Execute
2. **Wells by Location** → Enter "Norway" → Execute
3. **Wells by Depth Range** → Enter 1000, 5000 → Execute
4. **Logs by Type** → Enter "Gamma Ray" → Execute
5. **Active Production Wells** → Execute as-is

**✓ Success Criteria:**
- All templates execute without errors
- Real OSDU data returned
- Map updates with results
- Results display correctly

---

### Phase 2: Responsive Design (20 minutes)

Test on different screen sizes:

1. **Desktop (1920x1080)**
   - Open query builder
   - Verify 4-column layout
   - Check spacing and alignment

2. **Laptop (1366x768)**
   - Verify all elements accessible
   - Check no overlapping

3. **Tablet Portrait (768x1024)**
   - Verify vertical stacking
   - Check touch targets ≥ 44px

4. **Tablet Landscape (1024x768)**
   - Verify layout uses full width
   - Check element spacing

5. **Mobile Portrait (375x667)**
   - Verify advanced options collapsed
   - Check native controls used
   - Test touch interactions

6. **Mobile Landscape (667x375)**
   - Verify layout adapts
   - Check scrolling behavior

**✓ Success Criteria:**
- All layouts responsive
- No horizontal scroll
- Touch targets adequate on mobile
- Native controls on mobile

---

### Phase 3: Error Handling (25 minutes)

Test validation and edge cases:

1. **Empty Value** → Leave value empty → Verify error
2. **Invalid Number** → Enter "abc" in depth → Verify error
3. **Invalid Date** → Enter "01/15/2024" → Verify error
4. **IN Operator** → Enter single value → Verify error
5. **BETWEEN Operator** → Enter one value → Verify error
6. **Negative Number** → Enter -1000 → Verify error
7. **Max Criteria** → Add 10 criteria → Verify limit
8. **Special Characters** → Enter Well "A-1" → Verify escaping
9. **Wildcards** → Enter "North*" → Verify conversion
10. **No Criteria** → Try to execute → Verify disabled
11. **Multiple Errors** → 3+ errors → Verify enhanced alert
12. **No Results** → Query nonexistent data → Verify graceful handling

**✓ Success Criteria:**
- All validation errors caught
- Clear error messages shown
- Execute button disabled when invalid
- No JavaScript errors

---

### Phase 4: Cross-Browser (15 minutes)

Test in each browser:

1. **Chrome** → Run key tests → Check console
2. **Firefox** → Run key tests → Check console
3. **Safari** → Run key tests → Check console
4. **Edge** → Run key tests → Check console

**Key Tests:**
- Execute simple query
- Test responsive design
- Check error validation

**✓ Success Criteria:**
- Works in all browsers
- No browser-specific issues
- Consistent behavior

---

### Phase 5: Performance (10 minutes)

Measure performance:

1. **Query Generation** → Add 10 criteria → Measure update time
2. **Query Execution** → Execute simple query → Measure time
3. **Large Results** → Query 100+ results → Check performance

**✓ Success Criteria:**
- Query generation < 100ms
- Query execution < 2 seconds
- No lag with large results

---

### Phase 6: Accessibility (15 minutes)

Test accessibility:

1. **Keyboard Navigation**
   - Tab through all elements
   - Enter to activate buttons
   - Escape to close modal

2. **Screen Reader**
   - Enable screen reader
   - Navigate query builder
   - Verify announcements

3. **Color Contrast**
   - Check text contrast
   - Verify syntax colors
   - Check error colors

**✓ Success Criteria:**
- Full keyboard access
- Screen reader compatible
- WCAG AA compliant

---

### Phase 7: Integration (10 minutes)

Test integrations:

1. **Chat Integration** → Execute query → Verify chat updates
2. **Map Integration** → Execute query → Verify map updates
3. **Query History** → Execute query → Verify saved to history
4. **Analytics** → Execute query → Verify events logged

**✓ Success Criteria:**
- Chat shows query and results
- Map updates with wells
- History saves queries
- Analytics tracks events

---

## Common Issues to Watch For

### 🔴 Critical Issues
- Query execution fails
- Results not displayed
- Map doesn't update
- JavaScript errors in console

### 🟡 High Priority Issues
- Validation not working
- Templates don't apply
- Responsive design broken
- Touch targets too small

### 🟢 Medium Priority Issues
- Help text unclear
- Autocomplete missing values
- Performance slow
- Minor UI glitches

### ⚪ Low Priority Issues
- Cosmetic issues
- Minor text issues
- Enhancement suggestions

---

## Quick Debugging Tips

### If Query Doesn't Execute:
1. Check browser console for errors
2. Verify all criteria have values
3. Check validation errors
4. Verify OSDU API accessible

### If Results Don't Display:
1. Check network tab for API response
2. Verify response format
3. Check OSDUSearchResponse component
4. Verify chat message created

### If Map Doesn't Update:
1. Verify wells have coordinates
2. Check map component ref
3. Verify GeoJSON format
4. Check browser console

### If Validation Doesn't Work:
1. Check criterion.isValid flag
2. Verify validateCriterion function
3. Check error messages
4. Verify execute button disabled

---

## Test Data Suggestions

### Operators to Test:
- Shell
- BP
- Equinor
- TotalEnergies
- ConocoPhillips

### Countries to Test:
- Norway
- United States
- United Kingdom
- Brazil
- Australia

### Depth Ranges to Test:
- 1000-5000m (shallow to medium)
- 2000-4000m (medium)
- 3000-6000m (medium to deep)

### Log Types to Test:
- Gamma Ray (GR)
- Resistivity
- Density (RHOB)
- Neutron (NPHI)
- Sonic (DT)

---

## Recording Results

### For Each Test:
1. ✅ Mark PASS or ❌ FAIL in execution report
2. 📝 Record any observations
3. 📸 Take screenshots of issues
4. 🐛 Log errors from console
5. ⏱️ Record performance metrics

### For Issues Found:
1. **Severity:** Critical/High/Medium/Low
2. **Impact:** What breaks or doesn't work
3. **Steps to Reproduce:** Exact steps
4. **Expected vs Actual:** What should happen vs what does
5. **Screenshots:** Visual evidence
6. **Console Logs:** Error messages

---

## Time Estimates

| Phase | Estimated Time |
|-------|----------------|
| Template Testing | 15 minutes |
| Responsive Design | 20 minutes |
| Error Handling | 25 minutes |
| Cross-Browser | 15 minutes |
| Performance | 10 minutes |
| Accessibility | 15 minutes |
| Integration | 10 minutes |
| **Total** | **110 minutes** |

**Note:** Add 30-60 minutes for documentation and screenshots.

---

## Success Criteria Summary

### Must Pass:
- ✅ All templates work with real data
- ✅ Responsive on mobile, tablet, desktop
- ✅ All validation errors caught
- ✅ Works in all major browsers
- ✅ Performance acceptable
- ✅ Keyboard accessible
- ✅ Integrates with chat and map

### Nice to Have:
- ✅ Screen reader compatible
- ✅ WCAG AA compliant
- ✅ Analytics tracking works
- ✅ Help documentation clear

---

## Next Steps After Testing

1. **Fill out execution report** with all results
2. **Document all issues** found
3. **Take screenshots** of key features and issues
4. **Create bug tickets** for critical issues
5. **Get sign-off** from reviewer
6. **Update task status** to complete

---

## Questions or Issues?

If you encounter any problems during testing:

1. Check browser console for errors
2. Review the comprehensive testing guide
3. Check the help documentation in the query builder
4. Review the design and requirements documents
5. Ask for clarification if needed

---

**Happy Testing! 🧪**

Remember: The goal is to ensure the query builder works correctly for all users in all scenarios. Take your time and be thorough!
