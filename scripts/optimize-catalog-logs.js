#!/usr/bin/env node

/**
 * Script to optimize console.log statements in CatalogPage.tsx
 * Replaces console.log with conditional logger based on categorization
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/pages/CatalogPage.tsx');

// Read the file
let content = fs.readFileSync(filePath, 'utf8');

// Add logger import at the top (after other imports)
if (!content.includes("import logger from '@/utils/logger'")) {
  // Find the last import statement
  const lastImportIndex = content.lastIndexOf('import ');
  const nextLineIndex = content.indexOf('\n', lastImportIndex);
  
  content = content.slice(0, nextLineIndex + 1) + 
    "import logger from '@/utils/logger';\n" +
    content.slice(nextLineIndex + 1);
  
  console.log('✅ Added logger import');
}

// Categorize and replace console.log statements
const replacements = [
  // REMOVE: Noise logs (input changes, frequent updates)
  {
    pattern: /console\.log\('🔍 Panel switch effect triggered:',[\s\S]*?\}\);/g,
    replacement: '// Panel switch logging removed for performance',
    category: 'REMOVE'
  },
  {
    pattern: /console\.log\('🔍 Map restoration conditions not met:',[\s\S]*?\}\);/g,
    replacement: '// Map restoration condition logging removed for performance',
    category: 'REMOVE'
  },
  {
    pattern: /console\.log\('🔍 Filter intent: No OSDU context, skipping filter detection'\);/g,
    replacement: '// Filter intent logging removed for performance',
    category: 'REMOVE'
  },
  {
    pattern: /console\.log\('🔍 No filter intent detected, continuing to search intent detection'\);/g,
    replacement: '// Filter intent logging removed for performance',
    category: 'REMOVE'
  },
  
  // DEBUG: Make conditional (panel switches, map updates, detailed tracing)
  {
    pattern: /console\.log\('🔄 Map restoration attempt/g,
    replacement: "logger.debug('Map restoration attempt",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🗺️ Restoring map with:'/g,
    replacement: "logger.debug('Restoring map with:'",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🗺️ Calling updateMapData/g,
    replacement: "logger.debug('Calling updateMapData",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🗺️ Calling fitBounds/g,
    replacement: "logger.debug('Calling fitBounds",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔄 Chain of thought:/g,
    replacement: "logger.debug('Chain of thought:",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('📦 Chain of thought:/g,
    replacement: "logger.debug('Chain of thought:",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🧠 Chain of thought:/g,
    replacement: "logger.debug('Chain of thought:",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('⏸️ Chain of Thought:/g,
    replacement: "logger.debug('Chain of Thought:",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('Chain of Thought: User scrolled/g,
    replacement: "logger.debug('Chain of Thought: User scrolled",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔧 Opening query builder'\);/g,
    replacement: "logger.debug('Opening query builder');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔧 Closing query builder'\);/g,
    replacement: "logger.debug('Closing query builder');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔍 Filtering',/g,
    replacement: "logger.debug('Filtering',",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('📋 Extracted filters:'/g,
    replacement: "logger.debug('Extracted filters:'",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔍 Filter intent detected:'/g,
    replacement: "logger.debug('Filter intent detected:'",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔧 Applying filter:'/g,
    replacement: "logger.debug('Applying filter:'",
    category: 'DEBUG'
  },
  
  // Additional DEBUG patterns
  {
    pattern: /console\.log\('🔄 Chain of Thought: Attempting auto-scroll\.\.\.'\);/g,
    replacement: "logger.debug('Chain of Thought: Attempting auto-scroll...');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('✅ Chain of Thought: Using scrollTop to max height'\);/g,
    replacement: "logger.debug('Chain of Thought: Using scrollTop to max height');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\(`📏 Chain of Thought: Scrolled to \$\{container\.scrollTop\}\/\$\{container\.scrollHeight\}`\);/g,
    replacement: "logger.debug(`Chain of Thought: Scrolled to ${container.scrollTop}/${container.scrollHeight}`);",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\(`🔄 Map restoration attempt \$\{attempts\}\/\$\{maxAttempts\}`\);/g,
    replacement: "logger.debug(`Map restoration attempt ${attempts}/${maxAttempts}`);",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\(`⚠️ MapRef not available yet, retrying in \$\{200 \* attempts\}ms\.\.\. \(attempt \$\{attempts\}\/\$\{maxAttempts\}\)`\);/g,
    replacement: "logger.debug(`MapRef not available yet, retrying in ${200 * attempts}ms... (attempt ${attempts}/${maxAttempts})`);",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔧 Query Builder: Executing structured query',/g,
    replacement: "logger.debug('Query Builder: Executing structured query',",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔍 Filter intent: No filter keywords found'\);/g,
    replacement: "logger.debug('Filter intent: No filter keywords found');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('⚠️ Filter intent detected but no OSDU context available'\);/g,
    replacement: "logger.debug('Filter intent detected but no OSDU context available');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('✅ No context error message displayed'\);/g,
    replacement: "logger.debug('No context error message displayed');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔍 OSDU context exists, checking for filter intent\.\.\.'\);/g,
    replacement: "logger.debug('OSDU context exists, checking for filter intent...');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('✅ Filter parsing error message displayed'\);/g,
    replacement: "logger.debug('Filter parsing error message displayed');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('✅ Filter result message created:'/g,
    replacement: "logger.debug('Filter result message created:'",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('✅ Filter help message displayed'\);/g,
    replacement: "logger.debug('Filter help message displayed');",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('✅ Filter reset message created:'/g,
    replacement: "logger.debug('Filter reset message created:'",
    category: 'DEBUG'
  },
  {
    pattern: /console\.log\('🔍 Executing OSDU search'\);/g,
    replacement: "logger.debug('Executing OSDU search');",
    category: 'DEBUG'
  },
  
  // INFO: Keep in development (API responses, state changes, user actions)
  {
    pattern: /console\.log\('🚀 PROCESSING CATALOG SEARCH:'/g,
    replacement: "logger.info('PROCESSING CATALOG SEARCH:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ OSDU search intent detected'\);/g,
    replacement: "logger.info('OSDU search intent detected');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Catalog search intent detected'\);/g,
    replacement: "logger.info('Catalog search intent detected');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🎯 Search intent:'/g,
    replacement: "logger.info('Search intent:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Query Builder: Query executed'/g,
    replacement: "logger.info('Query Builder: Query executed'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Filter applied:'/g,
    replacement: "logger.info('Filter applied:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Filtered from'/g,
    replacement: "logger.info('Filtered from'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Filter intent detected, applying filter:'/g,
    replacement: "logger.info('Filter intent detected, applying filter:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔄 Filter reset detected/g,
    replacement: "logger.info('Filter reset detected",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('❓ Filter help requested/g,
    replacement: "logger.info('Filter help requested",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ RESET: All catalog state cleared successfully'\);/g,
    replacement: "logger.info('RESET: All catalog state cleared successfully');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔄 RESET: Clearing all catalog state\.\.\.'\);/g,
    replacement: "logger.info('RESET: Clearing all catalog state...');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🗺️ RESET: Clearing map data\.\.\.'\);/g,
    replacement: "logger.info('RESET: Clearing map data...');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Collection created successfully:'/g,
    replacement: "logger.info('Collection created successfully:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔄 Calling createCollection API\.\.\.'\);/g,
    replacement: "logger.info('Calling createCollection API...');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ API response received:'/g,
    replacement: "logger.info('API response received:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔄 Navigating to collection detail page:'/g,
    replacement: "logger.info('Navigating to collection detail page:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ MapRef available, restoring map state'\);/g,
    replacement: "logger.info('MapRef available, restoring map state');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Map state restoration complete'\);/g,
    replacement: "logger.info('Map state restoration complete');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔄 Map restoration conditions met/g,
    replacement: "logger.info('Map restoration conditions met",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🗑️ Removing selected items from collection:'/g,
    replacement: "logger.info('Removing selected items from collection:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Items removed:'/g,
    replacement: "logger.info('Items removed:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔄 Collection modal opened/g,
    replacement: "logger.info('Collection modal opened",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('📊 Creating collection with final selection:'/g,
    replacement: "logger.info('Creating collection with final selection:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🔍 Debug collection creation inputs:'/g,
    replacement: "logger.info('Debug collection creation inputs:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('✅ Minimal metadata serialization successful:'/g,
    replacement: "logger.info('Minimal metadata serialization successful:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('📦 Prepared data items for storage:'/g,
    replacement: "logger.info('Prepared data items for storage:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('🧪 Testing mutation parameters:'\);/g,
    replacement: "logger.info('Testing mutation parameters:');",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('  operation:'/g,
    replacement: "logger.info('  operation:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('  name:'/g,
    replacement: "logger.info('  name:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('  description:'/g,
    replacement: "logger.info('  description:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('  dataSourceType:'/g,
    replacement: "logger.info('  dataSourceType:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('  previewMetadata:'/g,
    replacement: "logger.info('  previewMetadata:'",
    category: 'INFO'
  },
  {
    pattern: /console\.log\('  dataItems:'/g,
    replacement: "logger.info('  dataItems:'",
    category: 'INFO'
  },
];

// Apply replacements
let replacementCount = 0;
replacements.forEach(({ pattern, replacement, category }) => {
  const matches = content.match(pattern);
  if (matches) {
    content = content.replace(pattern, replacement);
    replacementCount += matches.length;
    console.log(`✅ ${category}: Replaced ${matches.length} occurrences`);
  }
});

// Replace all remaining console.error with logger.error
const errorMatches = content.match(/console\.error\(/g);
if (errorMatches) {
  content = content.replace(/console\.error\(/g, 'logger.error(');
  replacementCount += errorMatches.length;
  console.log(`✅ ERROR: Replaced ${errorMatches.length} console.error occurrences`);
}

// Replace all remaining console.warn with logger.warn
const warnMatches = content.match(/console\.warn\(/g);
if (warnMatches) {
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  replacementCount += warnMatches.length;
  console.log(`✅ WARN: Replaced ${warnMatches.length} console.warn occurrences`);
}

// Replace remaining console.log with logger.info (catch-all for anything we missed)
const remainingLogMatches = content.match(/console\.log\(/g);
if (remainingLogMatches) {
  content = content.replace(/console\.log\(/g, 'logger.info(');
  replacementCount += remainingLogMatches.length;
  console.log(`✅ INFO (catch-all): Replaced ${remainingLogMatches.length} remaining console.log occurrences`);
}

// Write the modified content back
fs.writeFileSync(filePath, content, 'utf8');

console.log(`\n✅ Optimization complete!`);
console.log(`   Total replacements: ${replacementCount}`);
console.log(`   File: ${filePath}`);
console.log(`\n💡 To enable debug logs in browser console:`);
console.log(`   window.DEBUG_CATALOG = true`);
