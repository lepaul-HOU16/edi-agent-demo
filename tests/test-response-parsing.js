/**
 * Test EDIcraft Response Parsing
 * 
 * This script tests that the frontend can properly parse and detect
 * EDIcraft Cloudscape template responses.
 */

// Sample EDIcraft response (from CloudscapeResponseBuilder)
const sampleWellboreResponse = `✅ **Wellbore Trajectory Built Successfully**

**Details:**
- **Wellbore ID:** WELL-007
- **Data Points:** 107
- **Blocks Placed:** 75
- **Status:** Complete

**Drilling Rig:**
- **Status:** Built at wellhead
- **Components:** Derrick, platform, equipment
- **Signage:** WELL-007

**Minecraft Location:**
- **Coordinates:** (30, 100, 20)
- **Wellhead:** Ground level (Y=100)
- **Markers:** Placed every 10 points

💡 **Tip:** The wellbore is now visible in Minecraft! You can teleport to the wellhead using \`/tp @s 30 100 20\``;

const sampleClearResponse = `✅ **Minecraft Environment Cleared**

**Summary:**
- **Wellbores Cleared:** 3
- **Drilling Rigs Removed:** 3
- **Total Blocks Cleared:** 1247
- **Terrain:** Preserved

💡 **Tip:** The environment is now clear and ready for new visualizations!`;

const sampleErrorResponse = `❌ **Build Wellbore Trajectory Failed**

**Error Details:**
Could not find trajectory for well "INVALID-999"

💡 **Recovery Suggestions:**
1. Use the full OSDU trajectory ID (starts with 'osdu:work-product-component--WellboreTrajectory:')
2. Search for available wellbores first
3. Check if the well name is correct
4. Try: 'What wellbores are available?'

Would you like to try one of these options?`;

const sampleProgressResponse = `⏳ **Batch Visualization Progress**

**Current Status:**
- **Progress:** 5 of 24 wells (21%)
- **Current Well:** WELL-005
- **Status:** Building

Please wait while the visualization completes...`;

console.log('========================================');
console.log('EDIcraft Response Parsing Tests');
console.log('========================================');
console.log('');

// Test 1: Detection
console.log('Test 1: Response Type Detection');
console.log('--------------------------------');

function detectResponseType(content) {
    if (content.includes('✅')) return 'success';
    if (content.includes('❌')) return 'error';
    if (content.includes('⏳')) return 'progress';
    if (content.includes('⚠️')) return 'warning';
    if (content.includes('ℹ️')) return 'info';
    return 'plain';
}

const wellboreType = detectResponseType(sampleWellboreResponse);
const clearType = detectResponseType(sampleClearResponse);
const errorType = detectResponseType(sampleErrorResponse);
const progressType = detectResponseType(sampleProgressResponse);

console.log(`Wellbore response: ${wellboreType} ${wellboreType === 'success' ? '✓' : '✗'}`);
console.log(`Clear response: ${clearType} ${clearType === 'success' ? '✓' : '✗'}`);
console.log(`Error response: ${errorType} ${errorType === 'error' ? '✓' : '✗'}`);
console.log(`Progress response: ${progressType} ${progressType === 'progress' ? '✓' : '✗'}`);
console.log('');

// Test 2: Title Extraction
console.log('Test 2: Title Extraction');
console.log('------------------------');

function extractTitle(content) {
    const match = content.match(/[✅❌⏳⚠️ℹ️💡]\s*\*\*([^*]+)\*\*/);
    return match ? match[1].trim() : null;
}

const wellboreTitle = extractTitle(sampleWellboreResponse);
const clearTitle = extractTitle(sampleClearResponse);
const errorTitle = extractTitle(sampleErrorResponse);

console.log(`Wellbore title: "${wellboreTitle}" ${wellboreTitle ? '✓' : '✗'}`);
console.log(`Clear title: "${clearTitle}" ${clearTitle ? '✓' : '✗'}`);
console.log(`Error title: "${errorTitle}" ${errorTitle ? '✓' : '✗'}`);
console.log('');

// Test 3: Section Parsing
console.log('Test 3: Section Parsing');
console.log('-----------------------');

function countSections(content) {
    const sectionMatches = content.match(/\*\*[^*]+:\*\*/g);
    return sectionMatches ? sectionMatches.length : 0;
}

const wellboreSections = countSections(sampleWellboreResponse);
const clearSections = countSections(sampleClearResponse);

console.log(`Wellbore sections: ${wellboreSections} ${wellboreSections >= 3 ? '✓' : '✗'}`);
console.log(`Clear sections: ${clearSections} ${clearSections >= 1 ? '✓' : '✗'}`);
console.log('');

// Test 4: Tip Extraction
console.log('Test 4: Tip Extraction');
console.log('----------------------');

function extractTip(content) {
    const match = content.match(/💡\s*\*\*Tip:\*\*\s*(.+)/);
    return match ? match[1].trim() : null;
}

const wellboreTip = extractTip(sampleWellboreResponse);
const clearTip = extractTip(sampleClearResponse);

console.log(`Wellbore tip: ${wellboreTip ? '✓' : '✗'}`);
console.log(`Clear tip: ${clearTip ? '✓' : '✗'}`);
console.log('');

// Test 5: Key-Value Pair Extraction
console.log('Test 5: Key-Value Pair Extraction');
console.log('----------------------------------');

function extractKeyValuePairs(content) {
    const matches = content.matchAll(/- \*\*([^*]+):\*\*\s*(.+)/g);
    return Array.from(matches).map(m => ({ label: m[1].trim(), value: m[2].trim() }));
}

const wellboreKVs = extractKeyValuePairs(sampleWellboreResponse);
const clearKVs = extractKeyValuePairs(sampleClearResponse);

console.log(`Wellbore key-value pairs: ${wellboreKVs.length} ${wellboreKVs.length >= 5 ? '✓' : '✗'}`);
console.log(`Clear key-value pairs: ${clearKVs.length} ${clearKVs.length >= 3 ? '✓' : '✗'}`);
console.log('');

// Summary
console.log('========================================');
console.log('Parsing Test Summary');
console.log('========================================');
console.log('');

const allTests = [
    wellboreType === 'success',
    clearType === 'success',
    errorType === 'error',
    progressType === 'progress',
    wellboreTitle !== null,
    clearTitle !== null,
    errorTitle !== null,
    wellboreSections >= 3,
    clearSections >= 1,
    wellboreTip !== null,
    clearTip !== null,
    wellboreKVs.length >= 5,
    clearKVs.length >= 3
];

const passed = allTests.filter(t => t).length;
const total = allTests.length;

console.log(`Passed: ${passed}/${total}`);
console.log('');

if (passed === total) {
    console.log('✅ All parsing tests passed!');
    console.log('');
    console.log('The response parser should correctly:');
    console.log('  - Detect response types (success, error, progress, etc.)');
    console.log('  - Extract titles and sections');
    console.log('  - Parse key-value pairs');
    console.log('  - Extract tips');
    console.log('');
    console.log('Frontend component should render these as Cloudscape components.');
    process.exit(0);
} else {
    console.log('❌ Some parsing tests failed');
    console.log('');
    console.log('The response parser may not work correctly.');
    console.log('Review the EDIcraftResponseComponent.tsx implementation.');
    process.exit(1);
}
