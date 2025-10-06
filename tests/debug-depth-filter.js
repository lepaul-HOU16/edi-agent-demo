/**
 * Debug Script for Depth Filtering Issue
 * 
 * User reported: "wells with depth greater than 3500m" did not properly filter
 * This script debugs the specific depth filtering logic
 */

console.log('🐛 Debugging Depth Filter Issue');
console.log('================================');

// Test the exact user query
const userQuery = "wells with depth greater than 3500m";
console.log(`\n🔍 Testing User Query: "${userQuery}"`);

// Copy the analyzeQuery function from the frontend
function analyzeQuery(query) {
  const lowerQuery = query.toLowerCase().trim();
  console.log(`   Lowercase query: "${lowerQuery}"`);
  
  // Contextual filter patterns (from frontend code)
  const filterPatterns = [
    // Depth filters
    /(?:depth|deep|deeper)\s*(?:greater|more|above|over|\>)\s*(?:than\s*)?(\d+)/i,
    /(?:depth|deep)\s*(?:less|under|below|\<)\s*(?:than\s*)?(\d+)/i,
    /(?:show|filter|find).*(?:depth|deep).*(\d+)/i,
    
    // Other patterns...
    /(?:operated by|operator|by)\s*([A-Za-z\s]+)/i,
    /(?:show|filter|find).*(?:shell|petronas|cnooc|pertamina|pvep|vietsovpetro|petrovietnam)/i,
    /(?:show|filter|find).*(?:production|exploration).*wells/i,
    /(?:only|just).*(?:production|exploration)/i,
    /(?:in|from|at)\s*(vietnam|malaysia|brunei|philippines|china)/i,
    /(?:from these|of those|in current|these wells|current wells|existing wells)/i,
    /(?:filter|show only|narrow down|refine)/i,
    /(?:wells?|data|points?)\s*(?:in|within|inside)\s*(?:the\s*)?(?:polygon|area|selection|boundary)/i,
    /(?:filter|show)\s*(?:by|using)\s*(?:polygon|area|selection)/i,
    /(?:polygon|area)\s*(?:filter|selection)/i
  ];

  // Test each pattern individually
  console.log(`\n   Testing filter patterns:`);
  filterPatterns.forEach((pattern, index) => {
    const matches = pattern.test(lowerQuery);
    if (matches) {
      console.log(`   ✅ Pattern ${index + 1} matched:`, pattern);
      const matchResult = lowerQuery.match(pattern);
      if (matchResult) {
        console.log(`      Match groups:`, matchResult);
      }
    } else {
      console.log(`   ❌ Pattern ${index + 1} no match:`, pattern);
    }
  });

  const hasContext = true; // Simulate having context
  const isFilterPattern = filterPatterns.some(pattern => pattern.test(lowerQuery));
  console.log(`   Has context: ${hasContext}`);
  console.log(`   Is filter pattern: ${isFilterPattern}`);

  if (hasContext && isFilterPattern) {
    // Determine filter type and value
    let filterType = 'depth';
    let filterValue = null;

    // Test depth filters specifically
    console.log(`\n   Testing depth filter extraction:`);
    
    const depthGreaterMatch = lowerQuery.match(/(?:depth|deep|deeper)\s*(?:greater|more|above|over|\>)\s*(?:than\s*)?(\d+)/i);
    const depthLessMatch = lowerQuery.match(/(?:depth|deep)\s*(?:less|under|below|\<)\s*(?:than\s*)?(\d+)/i);
    
    console.log(`   Depth greater match:`, depthGreaterMatch);
    console.log(`   Depth less match:`, depthLessMatch);
    
    if (depthGreaterMatch) {
      filterType = 'depth';
      filterValue = { operator: '>', value: parseInt(depthGreaterMatch[1]) };
      console.log(`   ✅ Extracted depth filter:`, filterValue);
    } else if (depthLessMatch) {
      filterType = 'depth';
      filterValue = { operator: '<', value: parseInt(depthLessMatch[1]) };
      console.log(`   ✅ Extracted depth filter:`, filterValue);
    } else {
      console.log(`   ❌ No depth filter extracted`);
    }

    return {
      isContextual: true,
      operation: 'filter',
      filterType,
      filterValue,
      originalQuery: query
    };
  }
  
  return {
    isContextual: false,
    operation: 'new',
    originalQuery: query
  };
}

// Test the query analysis
const result = analyzeQuery(userQuery);
console.log(`\n📊 Analysis Result:`, result);

// Test sample data with various depth formats
const testWells = [
  { name: "Well A", depth: "3600m", type: "Production" },
  { name: "Well B", depth: "3400 m", type: "Production" },
  { name: "Well C", depth: "3500m", type: "Exploration" },
  { name: "Well D", depth: "3700m (est.)", type: "Production" },
  { name: "Well E", depth: "2800m", type: "Production" },
  { name: "Well F", depth: "4200m", type: "Exploration" },
];

console.log(`\n🧪 Testing Depth Parsing with Sample Data:`);
testWells.forEach(well => {
  const depthStr = well.depth || '0';
  const depth = parseInt(depthStr.replace(/[^\d]/g, ''));
  const passes3500Filter = depth > 3500;
  
  console.log(`   ${well.name}: "${well.depth}" → ${depth}m → ${passes3500Filter ? '✅' : '❌'} (>3500m)`);
});

// Apply the filter
function applyDepthFilter(wells, filterValue) {
  return wells.filter(well => {
    const depthStr = well.depth || '0';
    const depth = parseInt(depthStr.replace(/[^\d]/g, ''));
    
    if (filterValue.operator === '>') {
      return depth > filterValue.value;
    } else if (filterValue.operator === '<') {
      return depth < filterValue.value;
    }
    return true;
  });
}

if (result.isContextual && result.filterValue) {
  console.log(`\n🔧 Applying Filter: depth ${result.filterValue.operator} ${result.filterValue.value}m`);
  const filtered = applyDepthFilter(testWells, result.filterValue);
  console.log(`   Original: ${testWells.length} wells`);
  console.log(`   Filtered: ${filtered.length} wells`);
  console.log(`   Results:`, filtered.map(w => `${w.name} (${w.depth})`));
} else {
  console.log(`\n❌ Filter not applied - query not recognized as contextual`);
}

// Test possible variations that might not work
console.log(`\n🔍 Testing Query Variations:`);
const variations = [
  "wells with depth greater than 3500m",
  "show wells with depth greater than 3500m", 
  "depth greater than 3500m",
  "wells depth > 3500m",
  "wells with depth > 3500m",
  "show me wells with depth greater than 3500 meters",
  "wells deeper than 3500m"
];

variations.forEach(variation => {
  const analysis = analyzeQuery(variation);
  console.log(`   "${variation}" → ${analysis.isContextual ? '✅ Contextual' : '❌ New search'}`);
  if (analysis.isContextual && analysis.filterValue) {
    console.log(`      Filter: ${analysis.filterValue.operator} ${analysis.filterValue.value}`);
  }
});

console.log(`\n🚨 Potential Issues to Check:`);
console.log(`   1. Does the frontend have currentContext with data?`);
console.log(`   2. Are there any console errors in the browser?`);
console.log(`   3. Is the depth parsing handling all depth formats correctly?`);
console.log(`   4. Is the map component receiving the filtered data?`);
console.log(`   5. Check browser console for: "Processing contextual filter on current data (frontend-only)"`);
