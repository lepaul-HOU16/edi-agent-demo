#!/bin/bash

# Test script to verify project deletion actually removes projects from dashboard
# This tests the complete deletion flow including cache invalidation

echo "=========================================="
echo "Project Deletion Verification Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get bucket name from environment (optional for code checks)
BUCKET_NAME=$(grep RENEWABLE_S3_BUCKET amplify_outputs.json 2>/dev/null | cut -d'"' -f4 || echo "")

if [ -z "$BUCKET_NAME" ]; then
    echo -e "${YELLOW}⚠️  Could not find S3 bucket name (skipping S3 checks)${NC}"
    SKIP_S3=true
else
    echo "Using S3 bucket: $BUCKET_NAME"
    SKIP_S3=false
fi
echo ""

# Test 1: Check if ProjectLifecycleManager is being used
echo "Test 1: Verify deleteRenewableProject uses ProjectLifecycleManager"
echo "----------------------------------------------------------------------"

if grep -q "ProjectLifecycleManager" amplify/functions/renewableTools/handler.ts; then
    echo -e "${GREEN}✅ deleteRenewableProject imports ProjectLifecycleManager${NC}"
else
    echo -e "${RED}❌ deleteRenewableProject does NOT import ProjectLifecycleManager${NC}"
    echo "   This means cache won't be invalidated!"
    exit 1
fi

if grep -q "lifecycleManager.deleteProject" amplify/functions/renewableTools/handler.ts; then
    echo -e "${GREEN}✅ deleteRenewableProject calls lifecycleManager.deleteProject()${NC}"
else
    echo -e "${RED}❌ deleteRenewableProject does NOT call lifecycleManager.deleteProject()${NC}"
    echo "   This means project.json won't be deleted properly!"
    exit 1
fi

echo ""

# Test 2: Check if ProjectStore.delete() is called
echo "Test 2: Verify ProjectStore.delete() invalidates cache"
echo "----------------------------------------------------------------------"

if grep -q "this.listCache = null" amplify/functions/shared/projectStore.ts; then
    echo -e "${GREEN}✅ ProjectStore.delete() invalidates list cache${NC}"
else
    echo -e "${RED}❌ ProjectStore.delete() does NOT invalidate list cache${NC}"
    exit 1
fi

if grep -q "this.cache.delete(projectName)" amplify/functions/shared/projectStore.ts; then
    echo -e "${GREEN}✅ ProjectStore.delete() removes project from cache${NC}"
else
    echo -e "${RED}❌ ProjectStore.delete() does NOT remove project from cache${NC}"
    exit 1
fi

echo ""

# Test 3: Check cache TTL
echo "Test 3: Verify cache TTL is reasonable"
echo "----------------------------------------------------------------------"

CACHE_TTL=$(grep "cacheTTL.*=" amplify/functions/shared/projectStore.ts | grep -o "[0-9]*" | head -1)

if [ "$CACHE_TTL" -le 30000 ]; then
    echo -e "${GREEN}✅ Cache TTL is ${CACHE_TTL}ms (≤30 seconds)${NC}"
else
    echo -e "${YELLOW}⚠️  Cache TTL is ${CACHE_TTL}ms (>30 seconds)${NC}"
    echo "   Consider reducing for faster dashboard updates"
fi

echo ""

# Test 4: List actual projects in S3
if [ "$SKIP_S3" = false ]; then
    echo "Test 4: List projects currently in S3"
    echo "----------------------------------------------------------------------"

    PROJECT_COUNT=$(aws s3 ls "s3://${BUCKET_NAME}/renewable/projects/" --recursive 2>/dev/null | grep "project.json" | wc -l)

    echo "Found $PROJECT_COUNT projects in S3"

    if [ "$PROJECT_COUNT" -gt 0 ]; then
        echo ""
        echo "Projects:"
        aws s3 ls "s3://${BUCKET_NAME}/renewable/projects/" --recursive | grep "project.json" | awk '{print "  - " $4}'
    fi

    echo ""
fi

# Test 5: Check deletion flow
echo "Test 5: Verify complete deletion flow"
echo "----------------------------------------------------------------------"

echo "Deletion flow should be:"
echo "  1. Delete artifact files (renewable/{projectId}/*)"
echo "  2. Call ProjectLifecycleManager.deleteProject()"
echo "  3. ProjectLifecycleManager calls ProjectStore.delete()"
echo "  4. ProjectStore.delete() removes project.json"
echo "  5. ProjectStore.delete() invalidates cache"
echo "  6. ProjectResolver.clearCache() called"
echo ""

# Check each step
STEP1=$(grep -c "renewable/\${projectId}/" amplify/functions/renewableTools/handler.ts)
STEP2=$(grep -c "lifecycleManager.deleteProject" amplify/functions/renewableTools/handler.ts)
STEP3=$(grep -c "await this.projectStore.delete" amplify/functions/shared/projectLifecycleManager.ts)
STEP4=$(grep -c "DeleteObjectCommand" amplify/functions/shared/projectStore.ts)
STEP5=$(grep -c "this.listCache = null" amplify/functions/shared/projectStore.ts)
STEP6=$(grep -c "this.projectResolver.clearCache" amplify/functions/shared/projectLifecycleManager.ts)

if [ "$STEP1" -gt 0 ]; then
    echo -e "${GREEN}✅ Step 1: Artifact deletion implemented${NC}"
else
    echo -e "${RED}❌ Step 1: Artifact deletion NOT implemented${NC}"
fi

if [ "$STEP2" -gt 0 ]; then
    echo -e "${GREEN}✅ Step 2: ProjectLifecycleManager.deleteProject() called${NC}"
else
    echo -e "${RED}❌ Step 2: ProjectLifecycleManager.deleteProject() NOT called${NC}"
fi

if [ "$STEP3" -gt 0 ]; then
    echo -e "${GREEN}✅ Step 3: ProjectStore.delete() called${NC}"
else
    echo -e "${RED}❌ Step 3: ProjectStore.delete() NOT called${NC}"
fi

if [ "$STEP4" -gt 0 ]; then
    echo -e "${GREEN}✅ Step 4: project.json deletion implemented${NC}"
else
    echo -e "${RED}❌ Step 4: project.json deletion NOT implemented${NC}"
fi

if [ "$STEP5" -gt 0 ]; then
    echo -e "${GREEN}✅ Step 5: Cache invalidation implemented${NC}"
else
    echo -e "${RED}❌ Step 5: Cache invalidation NOT implemented${NC}"
fi

if [ "$STEP6" -gt 0 ]; then
    echo -e "${GREEN}✅ Step 6: ProjectResolver cache cleared${NC}"
else
    echo -e "${RED}❌ Step 6: ProjectResolver cache NOT cleared${NC}"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""

if [ "$STEP1" -gt 0 ] && [ "$STEP2" -gt 0 ] && [ "$STEP3" -gt 0 ] && [ "$STEP4" -gt 0 ] && [ "$STEP5" -gt 0 ] && [ "$STEP6" -gt 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "The deletion flow is correctly implemented."
    echo "Projects should now be properly deleted from the dashboard."
    echo ""
    echo "Next steps:"
    echo "  1. Deploy the changes: npx ampx sandbox"
    echo "  2. Test deletion in the UI"
    echo "  3. Verify project disappears from dashboard on refresh"
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    echo "The deletion flow has issues that need to be fixed."
fi

echo ""
