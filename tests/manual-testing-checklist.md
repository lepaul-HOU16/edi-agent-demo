# OSDU Query Builder - Manual Testing Checklist

**Print this page for quick reference during testing**

---

## 📋 Pre-Testing Setup

- [ ] Application running (local or deployed)
- [ ] Browser dev tools open (F12)
- [ ] Execution report ready
- [ ] Test data prepared
- [ ] Screenshots folder created

---

## 🎯 Phase 1: Template Testing (15 min)

- [ ] **Wells by Operator** → "Shell" → Execute → ✓ Works
- [ ] **Wells by Location** → "Norway" → Execute → ✓ Works
- [ ] **Wells by Depth Range** → 1000, 5000 → Execute → ✓ Works
- [ ] **Logs by Type** → "Gamma Ray" → Execute → ✓ Works
- [ ] **Active Production Wells** → Execute → ✓ Works

**✓ All templates return real OSDU data**

---

## 📱 Phase 2: Responsive Design (20 min)

### Desktop
- [ ] 1920x1080 → 4-column layout → ✓ Works
- [ ] 1366x768 → All accessible → ✓ Works

### Tablet
- [ ] 768x1024 (portrait) → Stacked layout → ✓ Works
- [ ] 1024x768 (landscape) → Full width → ✓ Works

### Mobile
- [ ] 375x667 (portrait) → Advanced collapsed → ✓ Works
- [ ] 667x375 (landscape) → Adapted → ✓ Works
- [ ] Touch targets ≥ 44px → ✓ Works
- [ ] Native controls used → ✓ Works

**✓ Responsive on all screen sizes**

---

## ⚠️ Phase 3: Error Handling (25 min)

- [ ] Empty value → Error shown → ✓ Works
- [ ] Invalid number ("abc") → Error shown → ✓ Works
- [ ] Invalid date ("01/15/2024") → Error shown → ✓ Works
- [ ] IN without comma → Error shown → ✓ Works
- [ ] BETWEEN one value → Error shown → ✓ Works
- [ ] BETWEEN reversed → Error shown → ✓ Works
- [ ] Negative number → Error shown → ✓ Works
- [ ] 10 criteria limit → Warning shown → ✓ Works
- [ ] Special chars (Well "A-1") → Escaped → ✓ Works
- [ ] Wildcards (North*) → Converted → ✓ Works
- [ ] No criteria → Execute disabled → ✓ Works
- [ ] 3+ errors → Enhanced alert → ✓ Works

**✓ All validation errors caught**

---

## 🌐 Phase 4: Cross-Browser (15 min)

- [ ] **Chrome** → Key tests → ✓ Works
- [ ] **Firefox** → Key tests → ✓ Works
- [ ] **Safari** → Key tests → ✓ Works
- [ ] **Edge** → Key tests → ✓ Works

**✓ Works in all browsers**

---

## ⚡ Phase 5: Performance (10 min)

- [ ] Query generation → < 100ms → ✓ Fast
- [ ] Query execution → < 2 seconds → ✓ Fast
- [ ] Large results (100+) → No lag → ✓ Fast

**✓ Performance acceptable**

---

## ♿ Phase 6: Accessibility (15 min)

- [ ] Tab navigation → All accessible → ✓ Works
- [ ] Enter activates → Buttons work → ✓ Works
- [ ] Escape closes → Modal closes → ✓ Works
- [ ] Screen reader → Announces all → ✓ Works
- [ ] Color contrast → WCAG AA → ✓ Works

**✓ Fully accessible**

---

## 🔗 Phase 7: Integration (10 min)

- [ ] Chat → Query and results shown → ✓ Works
- [ ] Map → Wells plotted → ✓ Works
- [ ] History → Query saved → ✓ Works
- [ ] Analytics → Events logged → ✓ Works

**✓ All integrations work**

---

## 📊 Test Results Summary

**Total Tests:** 41  
**Passed:** ___  
**Failed:** ___  
**Pass Rate:** ___%

---

## 🐛 Issues Found

### Critical
1. _______________________________________________
2. _______________________________________________

### High
1. _______________________________________________
2. _______________________________________________

### Medium
1. _______________________________________________
2. _______________________________________________

### Low
1. _______________________________________________
2. _______________________________________________

---

## ✅ Final Sign-Off

- [ ] All critical tests passed
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Accessibility compliant
- [ ] Ready for production

**Tester:** _________________ **Date:** _________

**Reviewer:** _________________ **Date:** _________

---

## 📝 Quick Notes

```
[Use this space for quick notes during testing]







```

---

**End of Checklist**
