#!/bin/bash

# EDIcraft Demo Deployment Validation Script
# This script validates what features are actually deployed and working

echo "=========================================="
echo "EDIcraft Demo Deployment Validation"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track results
PASSED=0
FAILED=0
WARNINGS=0

# Function to print test result
print_result() {
    local test_name="$1"
    local status="$2"
    local message="$3"
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        [ -n "$message" ] && echo "  └─ $message"
        ((PASSED++))
    elif [ "$status" = "FAIL" ]; then
        echo -e "${RED}✗${NC} $test_name"
        [ -n "$message" ] && echo "  └─ $message"
        ((FAILED++))
    elif [ "$status" = "WARN" ]; then
        echo -e "${YELLOW}⚠${NC} $test_name"
        [ -n "$message" ] && echo "  └─ $message"
        ((WARNINGS++))
    fi
}

echo "1. Checking Python Tools Existence"
echo "-----------------------------------"

# Check if response templates exist
if python3 -c "import sys; sys.path.insert(0, 'edicraft-agent'); from tools.response_templates import CloudscapeResponseBuilder" 2>/dev/null; then
    print_result "Response Templates (CloudscapeResponseBuilder)" "PASS" "Class exists and imports successfully"
else
    print_result "Response Templates (CloudscapeResponseBuilder)" "FAIL" "Cannot import CloudscapeResponseBuilder"
fi

# Check if workflow tools exist
if python3 -c "import sys; sys.path.insert(0, 'edicraft-agent'); from tools.workflow_tools import clear_minecraft_environment, lock_world_time, build_drilling_rig" 2>/dev/null; then
    print_result "Workflow Tools (clear, lock_time, build_rig)" "PASS" "All tools import successfully"
else
    print_result "Workflow Tools (clear, lock_time, build_rig)" "FAIL" "Cannot import workflow tools"
fi

# Check if name utils exist
if python3 -c "import sys; sys.path.insert(0, 'edicraft-agent'); from tools.name_utils import simplify_well_name" 2>/dev/null; then
    print_result "Name Simplification (simplify_well_name)" "PASS" "Function exists"
else
    print_result "Name Simplification (simplify_well_name)" "FAIL" "Cannot import name utils"
fi

# Check if trajectory tools have enhanced functions
if python3 -c "import sys; sys.path.insert(0, 'edicraft-agent'); from tools.trajectory_tools import build_wellbore_in_minecraft_enhanced" 2>/dev/null; then
    print_result "Enhanced Trajectory Builder" "PASS" "build_wellbore_in_minecraft_enhanced exists"
else
    print_result "Enhanced Trajectory Builder" "FAIL" "Enhanced trajectory builder not found"
fi

echo ""
echo "2. Checking Frontend Components"
echo "--------------------------------"

# Check if clear button exists in landing page
if grep -q "Clear Minecraft Environment" src/components/agent-landing-pages/EDIcraftAgentLanding.tsx; then
    print_result "Clear Button in Landing Page" "PASS" "Button text found in component"
else
    print_result "Clear Button in Landing Page" "FAIL" "Clear button not found"
fi

# Check if clear button is wired up
if grep -q "onWorkflowSelect.*Clear the Minecraft environment" src/components/agent-landing-pages/EDIcraftAgentLanding.tsx; then
    print_result "Clear Button Wiring" "PASS" "Button calls onWorkflowSelect with clear command"
else
    print_result "Clear Button Wiring" "FAIL" "Button not properly wired"
fi

# Check if ChatMessage component exists
if [ -f "src/components/ChatMessage.tsx" ]; then
    print_result "ChatMessage Component" "PASS" "Component file exists"
else
    print_result "ChatMessage Component" "FAIL" "Component file not found"
fi

echo ""
echo "3. Checking Response Template Implementation"
echo "---------------------------------------------"

# Test if response templates generate proper output
TEMPLATE_TEST=$(python3 << 'EOF'
import sys
sys.path.insert(0, 'edicraft-agent')
try:
    from tools.response_templates import CloudscapeResponseBuilder
    
    # Test wellbore success template
    response = CloudscapeResponseBuilder.wellbore_success(
        well_name="WELL-007",
        data_points=107,
        blocks_placed=75,
        coordinates={'x': 30, 'y': 100, 'z': 20},
        has_rig=True
    )
    
    # Check if response contains expected elements
    checks = [
        ("✅" in response, "Success icon"),
        ("WELL-007" in response, "Well name"),
        ("107" in response, "Data points"),
        ("Drilling Rig" in response, "Rig section"),
        ("💡" in response, "Tip icon")
    ]
    
    for check, name in checks:
        if not check:
            print(f"MISSING: {name}")
            sys.exit(1)
    
    print("ALL_CHECKS_PASSED")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
EOF
)

if echo "$TEMPLATE_TEST" | grep -q "ALL_CHECKS_PASSED"; then
    print_result "Response Template Generation" "PASS" "Templates generate properly formatted responses"
elif echo "$TEMPLATE_TEST" | grep -q "MISSING"; then
    print_result "Response Template Generation" "FAIL" "Template missing elements: $TEMPLATE_TEST"
else
    print_result "Response Template Generation" "FAIL" "Template generation error: $TEMPLATE_TEST"
fi

echo ""
echo "4. Checking Tool Registration in Agent"
echo "---------------------------------------"

# Check if tools are registered in agent.py
if [ -f "edicraft-agent/agent.py" ]; then
    if grep -q "clear_minecraft_environment" edicraft-agent/agent.py; then
        print_result "Clear Tool Registration" "PASS" "clear_minecraft_environment found in agent.py"
    else
        print_result "Clear Tool Registration" "WARN" "clear_minecraft_environment not found in agent.py"
    fi
    
    if grep -q "lock_world_time" edicraft-agent/agent.py; then
        print_result "Time Lock Tool Registration" "PASS" "lock_world_time found in agent.py"
    else
        print_result "Time Lock Tool Registration" "WARN" "lock_world_time not found in agent.py"
    fi
    
    if grep -q "build_drilling_rig" edicraft-agent/agent.py; then
        print_result "Drilling Rig Tool Registration" "PASS" "build_drilling_rig found in agent.py"
    else
        print_result "Drilling Rig Tool Registration" "WARN" "build_drilling_rig not found in agent.py"
    fi
else
    print_result "Agent File" "FAIL" "edicraft-agent/agent.py not found"
fi

echo ""
echo "5. Checking Trajectory Interpolation"
echo "-------------------------------------"

# Test trajectory interpolation
INTERP_TEST=$(python3 << 'EOF'
import sys
sys.path.insert(0, 'edicraft-agent')
try:
    from tools.trajectory_tools import build_wellbore_in_minecraft_enhanced
    
    # Check if function exists and has expected parameters
    import inspect
    sig = inspect.signature(build_wellbore_in_minecraft_enhanced)
    params = list(sig.parameters.keys())
    
    expected_params = ['minecraft_coordinates_json', 'well_name', 'color_scheme']
    missing = [p for p in expected_params if p not in params]
    
    if missing:
        print(f"MISSING_PARAMS: {', '.join(missing)}")
        sys.exit(1)
    
    print("FUNCTION_EXISTS")
    sys.exit(0)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
EOF
)

if echo "$INTERP_TEST" | grep -q "FUNCTION_EXISTS"; then
    print_result "Enhanced Trajectory Function" "PASS" "Function exists with correct parameters"
else
    print_result "Enhanced Trajectory Function" "FAIL" "Function issue: $INTERP_TEST"
fi

# Check if interpolation logic exists in trajectory_tools.py
if grep -q "num_points = max(2, int(segment_length \* 2))" edicraft-agent/tools/trajectory_tools.py; then
    print_result "Trajectory Interpolation Logic" "PASS" "Interpolation code found (0.5 block intervals)"
else
    print_result "Trajectory Interpolation Logic" "WARN" "Interpolation logic may not be implemented"
fi

echo ""
echo "6. Checking RCON Integration"
echo "-----------------------------"

# Check if RCON tool exists
if [ -f "edicraft-agent/tools/rcon_tool.py" ]; then
    print_result "RCON Tool File" "PASS" "rcon_tool.py exists"
    
    if grep -q "execute_rcon_command" edicraft-agent/tools/rcon_tool.py; then
        print_result "RCON Execute Function" "PASS" "execute_rcon_command function exists"
    else
        print_result "RCON Execute Function" "FAIL" "execute_rcon_command not found"
    fi
else
    print_result "RCON Tool File" "FAIL" "rcon_tool.py not found"
fi

echo ""
echo "7. Checking Clear Environment Implementation"
echo "---------------------------------------------"

# Check clear environment implementation details
CLEAR_CHECK=$(python3 << 'EOF'
import sys
sys.path.insert(0, 'edicraft-agent')
try:
    import inspect
    from tools.workflow_tools import clear_minecraft_environment
    
    # Get function source
    source = inspect.getsource(clear_minecraft_environment)
    
    checks = [
        ("wellbore_blocks" in source, "Wellbore blocks list"),
        ("rig_blocks" in source, "Rig blocks list"),
        ("terrain_blocks" in source, "Terrain blocks list"),
        ("fill" in source, "RCON fill command"),
        ("CloudscapeResponseBuilder" in source, "Response template usage")
    ]
    
    for check, name in checks:
        if not check:
            print(f"MISSING: {name}")
    
    if all(check for check, _ in checks):
        print("ALL_IMPLEMENTED")
    
    sys.exit(0)
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
EOF
)

if echo "$CLEAR_CHECK" | grep -q "ALL_IMPLEMENTED"; then
    print_result "Clear Environment Implementation" "PASS" "All required logic implemented"
elif echo "$CLEAR_CHECK" | grep -q "MISSING"; then
    print_result "Clear Environment Implementation" "WARN" "Some logic may be missing: $CLEAR_CHECK"
else
    print_result "Clear Environment Implementation" "FAIL" "Implementation check failed: $CLEAR_CHECK"
fi

echo ""
echo "8. Checking Deployment Files"
echo "-----------------------------"

# Check if deployment completion file exists
if [ -f "EDICRAFT_DEMO_DEPLOYMENT_COMPLETE.md" ]; then
    print_result "Deployment Completion Doc" "PASS" "EDICRAFT_DEMO_DEPLOYMENT_COMPLETE.md exists"
else
    print_result "Deployment Completion Doc" "WARN" "Deployment completion doc not found"
fi

# Check if tasks are marked complete
if [ -f ".kiro/specs/edicraft-demo-enhancements/tasks.md" ]; then
    TOTAL_TASKS=$(grep -c "^\- \[" .kiro/specs/edicraft-demo-enhancements/tasks.md)
    COMPLETE_TASKS=$(grep -c "^\- \[x\]" .kiro/specs/edicraft-demo-enhancements/tasks.md)
    
    if [ "$TOTAL_TASKS" -eq "$COMPLETE_TASKS" ]; then
        print_result "Task Completion Status" "WARN" "All $TOTAL_TASKS tasks marked complete (but features not working?)"
    else
        print_result "Task Completion Status" "PASS" "$COMPLETE_TASKS of $TOTAL_TASKS tasks marked complete"
    fi
else
    print_result "Task File" "FAIL" "tasks.md not found"
fi

echo ""
echo "=========================================="
echo "Validation Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

# Determine overall status
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}DEPLOYMENT STATUS: ISSUES FOUND${NC}"
    echo ""
    echo "Critical Issues:"
    echo "- Some components or tools are missing or not properly implemented"
    echo "- Review failed checks above for details"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}DEPLOYMENT STATUS: WARNINGS${NC}"
    echo ""
    echo "Potential Issues:"
    echo "- All code exists but may not be properly integrated"
    echo "- Tools may not be registered with the agent"
    echo "- Frontend may not be rendering responses correctly"
    echo ""
    echo "Next Steps:"
    echo "1. Test the clear button in the UI - does it send a message?"
    echo "2. Check if the agent receives the clear command"
    echo "3. Verify RCON connection to Minecraft server"
    echo "4. Test trajectory building - are there gaps?"
    echo "5. Check response format - plain text or Cloudscape components?"
    exit 0
else
    echo -e "${GREEN}DEPLOYMENT STATUS: ALL CHECKS PASSED${NC}"
    echo ""
    echo "All components exist and appear properly implemented."
    echo "If features still don't work, the issue is likely:"
    echo "1. Agent not calling the tools (check agent.py tool registration)"
    echo "2. RCON connection issues (check Minecraft server connectivity)"
    echo "3. Frontend not rendering responses (check ChatMessage component)"
    exit 0
fi
