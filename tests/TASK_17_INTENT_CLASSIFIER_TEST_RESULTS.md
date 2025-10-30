# Intent Classifier Test Results

**Test Date:** 2025-10-30T17:54:33.140Z
**Overall Result:** 33/42 tests passed (79%)

## Summary

This document contains the results of comprehensive intent classifier testing.

### WELLBORE TRAJECTORY

**Result:** 1/8 tests passed

**Description:** Wellbore Trajectory Intent - Deterministic Patterns

| Test | Status | Reason |
|------|--------|--------|
| Exact Pattern - Build wellbore trajectory | ✅ PASSED | All checks passed |
| Variation - Visualize wellbore | ❌ FAILED | Some checks failed |
| Variation - Show me wellbore | ❌ FAILED | Some checks failed |
| Variation - Create wellbore path | ❌ FAILED | Some checks failed |
| Variation - Wellbore trajectory for | ❌ FAILED | Some checks failed |
| Variation - Trajectory for well | ❌ FAILED | Some checks failed |
| Variation - Well ID first | ❌ FAILED | Some checks failed |
| Variation - Build well | ❌ FAILED | Some checks failed |

### HORIZON SURFACE

**Result:** 9/10 tests passed

**Description:** Horizon Surface Intent - Deterministic Patterns

| Test | Status | Reason |
|------|--------|--------|
| Exact Pattern - Build horizon surface | ✅ PASSED | All checks passed |
| Variation - Visualize horizon | ✅ PASSED | All checks passed |
| Variation - Show me horizon | ✅ PASSED | All checks passed |
| Variation - Create horizon | ✅ PASSED | All checks passed |
| Variation - Render horizon | ✅ PASSED | All checks passed |
| Variation - Find a horizon | ✅ PASSED | All checks passed |
| Variation - Horizon name | ✅ PASSED | All checks passed |
| Variation - Horizon coordinates | ✅ PASSED | All checks passed |
| Variation - Convert horizon | ✅ PASSED | All checks passed |
| With Named Horizon | ❌ FAILED | Some checks failed |

### LIST PLAYERS

**Result:** 6/6 tests passed

**Description:** List Players Intent - Deterministic Patterns

| Test | Status | Reason |
|------|--------|--------|
| Exact Pattern - List players | ✅ PASSED | All checks passed |
| Variation - Who is online | ✅ PASSED | All checks passed |
| Variation - Show me players | ✅ PASSED | All checks passed |
| Variation - How many players | ✅ PASSED | All checks passed |
| Variation - Players online | ✅ PASSED | All checks passed |
| Variation - Online players | ✅ PASSED | All checks passed |

### PLAYER POSITIONS

**Result:** 4/5 tests passed

**Description:** Player Positions Intent - Deterministic Patterns

| Test | Status | Reason |
|------|--------|--------|
| Exact Pattern - Where are the players | ✅ PASSED | All checks passed |
| Variation - Player positions | ✅ PASSED | All checks passed |
| Variation - Show player coordinates | ❌ FAILED | Some checks failed |
| Variation - Get player positions | ✅ PASSED | All checks passed |
| Variation - Positions of players | ✅ PASSED | All checks passed |

### SYSTEM STATUS

**Result:** 7/7 tests passed

**Description:** System Status Intent - Deterministic Patterns

| Test | Status | Reason |
|------|--------|--------|
| Greeting - Hello | ✅ PASSED | All checks passed |
| Greeting - Hi | ✅ PASSED | All checks passed |
| Greeting - Hey | ✅ PASSED | All checks passed |
| Status Check - Status | ✅ PASSED | All checks passed |
| Status Check - What is the status | ✅ PASSED | All checks passed |
| Status Check - Are you ready | ✅ PASSED | All checks passed |
| Help Request | ✅ PASSED | All checks passed |

### AMBIGUOUS CASES

**Result:** 6/6 tests passed

**Description:** Ambiguous Cases - Should Route to LLM

| Test | Status | Reason |
|------|--------|--------|
| General Question | ✅ PASSED | All checks passed |
| Complex Analysis Request | ✅ PASSED | All checks passed |
| Vague Visualization Request | ✅ PASSED | All checks passed |
| Multi-Step Request | ✅ PASSED | All checks passed |
| Question About Capabilities | ✅ PASSED | All checks passed |
| Comparison Request | ✅ PASSED | All checks passed |

## Detailed Analysis

### WELLBORE TRAJECTORY

#### Exact Pattern - Build wellbore trajectory

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Well ID extraction (WELL-011)
- ✅ Tool execution evidence

#### Variation - Visualize wellbore

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-005)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Show me wellbore

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-003)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Create wellbore path

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-007)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Wellbore trajectory for

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-009)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Trajectory for well

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-012)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Well ID first

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-015)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Build well

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Well ID extraction (WELL-020)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

### HORIZON SURFACE

#### Exact Pattern - Build horizon surface

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Visualize horizon

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Show me horizon

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Create horizon

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Render horizon

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Find a horizon

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Horizon name

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Horizon coordinates

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Convert horizon

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### With Named Horizon

**Status:** ❌ FAILED

**Checks:**

- ✅ Direct tool call routing
- ❌ Horizon name extraction (Top_Reservoir)
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

### LIST PLAYERS

#### Exact Pattern - List players

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Who is online

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Show me players

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - How many players

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Players online

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Online players

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

### PLAYER POSITIONS

#### Exact Pattern - Where are the players

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Player positions

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Show player coordinates

**Status:** ❌ FAILED

**Checks:**

- ❌ Direct tool call routing
- ✅ Tool execution evidence

**Failure Reason:** Some checks failed

#### Variation - Get player positions

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Variation - Positions of players

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

### SYSTEM STATUS

#### Greeting - Hello

**Status:** ✅ PASSED

**Checks:**

- ✅ Greeting routing
- ✅ Tool execution evidence

#### Greeting - Hi

**Status:** ✅ PASSED

**Checks:**

- ✅ Greeting routing
- ✅ Tool execution evidence

#### Greeting - Hey

**Status:** ✅ PASSED

**Checks:**

- ✅ Greeting routing
- ✅ Tool execution evidence

#### Status Check - Status

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Status Check - What is the status

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Status Check - Are you ready

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Help Request

**Status:** ✅ PASSED

**Checks:**

- ✅ Greeting routing
- ✅ Tool execution evidence

### AMBIGUOUS CASES

#### General Question

**Status:** ✅ PASSED

**Checks:**

- ✅ LLM agent routing

#### Complex Analysis Request

**Status:** ✅ PASSED

**Checks:**

- ✅ LLM agent routing

#### Vague Visualization Request

**Status:** ✅ PASSED

**Checks:**

- ✅ LLM agent routing

#### Multi-Step Request

**Status:** ✅ PASSED

**Checks:**

- ✅ Direct tool call routing
- ✅ Tool execution evidence

#### Question About Capabilities

**Status:** ✅ PASSED

**Checks:**

- ✅ LLM agent routing

#### Comparison Request

**Status:** ✅ PASSED

**Checks:**

- ✅ LLM agent routing

## Conclusion

Some tests failed. Review the detailed analysis above to identify issues.

**Failed Tests:** 9
**Success Rate:** 79%
