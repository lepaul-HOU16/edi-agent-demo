#!/usr/bin/env npx tsx

import { petrophysicsSystemMessage } from '../amplify/functions/reActAgent/petrophysicsSystemMessage';

// Simulate the well data that gets added to the system message
const wellContextData = `

## AVAILABLE WELLS IN PROJECT

**CRITICAL: You have access to 2 wells with complete data. DO NOT say there are 0 wells.**

### Well #1: Eagle Ford 1H (WELL-001)
- Location: Karnes County, TX (28.7505°N, -97.3573°W)
- Formation: Eagle Ford Shale
- Total Depth: 12,850 ft
- Well Type: Horizontal
- Status: Producing
- Available Logs: GR, RHOB, NPHI, RT, CALI, DTC
- Current Production: 850 bbl/day oil, 1.9 mcf/day gas, 180 bbl/day water

### Well #2: Permian Basin 2H (WELL-002)
- Location: Midland County, TX (31.9686°N, -102.0779°W)
- Formation: Wolfcamp Shale
- Total Depth: 11,200 ft
- Well Type: Horizontal
- Status: Producing
- Available Logs: GR, RHOB, NPHI, RT, CALI, DTC, PEF
- Current Production: 1,100 bbl/day oil, 2.1 mcf/day gas, 320 bbl/day water

**IMPORTANT INSTRUCTIONS:**
- When asked about wells, reference these 2 wells by name
- You can perform analysis on Eagle Ford 1H and Permian Basin 2H
- Both wells have complete log suites and production data
- DO NOT use file search tools to look for wells - the data is provided above
- Answer questions about well count, production, or analysis using this data

`;

// Combine system message with well data (same as handler does)
const systemMessageContent = petrophysicsSystemMessage + wellContextData;

console.log('=== WELL DATA VALIDATION ===\n');

// Check if well data is present
const hasEagleFord = systemMessageContent.includes('Eagle Ford 1H');
const hasPermianBasin = systemMessageContent.includes('Permian Basin 2H');
const hasCriticalInstruction = systemMessageContent.includes('DO NOT say there are 0 wells');
const hasWellCount = systemMessageContent.includes('2 wells with complete data');

console.log('✅ Well Data Validation Results:');
console.log(`   Eagle Ford 1H present: ${hasEagleFord ? '✅ YES' : '❌ NO'}`);
console.log(`   Permian Basin 2H present: ${hasPermianBasin ? '✅ YES' : '❌ NO'}`);
console.log(`   Critical instruction present: ${hasCriticalInstruction ? '✅ YES' : '❌ NO'}`);
console.log(`   Well count instruction present: ${hasWellCount ? '✅ YES' : '❌ NO'}`);

console.log(`\n📊 System Message Stats:`);
console.log(`   Total length: ${systemMessageContent.length} characters`);
console.log(`   Well data section length: ${wellContextData.length} characters`);

// Show well data section
console.log(`\n📋 Well Data Section Preview:`);
console.log('─'.repeat(50));
console.log(wellContextData.trim());
console.log('─'.repeat(50));

// Find and show the well section in context
if (hasEagleFord) {
    const wellSectionStart = systemMessageContent.indexOf('Eagle Ford 1H');
    console.log(`\n🔍 Well Section in Full System Message:`);
    console.log('─'.repeat(50));
    console.log(systemMessageContent.substring(wellSectionStart - 100, wellSectionStart + 300));
    console.log('─'.repeat(50));
}

const allValidationsPassed = hasEagleFord && hasPermianBasin && hasCriticalInstruction && hasWellCount;

console.log(`\n${allValidationsPassed ? '✅ ALL VALIDATIONS PASSED' : '❌ SOME VALIDATIONS FAILED'}`);
console.log(`The agent ${allValidationsPassed ? 'SHOULD' : 'SHOULD NOT'} be able to see the well data.`);

if (!allValidationsPassed) {
    console.log('\n🚨 Issues found:');
    if (!hasEagleFord) console.log('   - Eagle Ford 1H not found in system message');
    if (!hasPermianBasin) console.log('   - Permian Basin 2H not found in system message');
    if (!hasCriticalInstruction) console.log('   - Critical "DO NOT say there are 0 wells" instruction missing');
    if (!hasWellCount) console.log('   - Well count instruction missing');
}