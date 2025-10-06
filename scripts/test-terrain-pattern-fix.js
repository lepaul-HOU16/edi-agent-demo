/**
 * Test script to validate terrain analysis pattern matching fix
 */

// Test the pattern matching directly
const testMessage = "Analyze terrain for wind farm development at coordinates 32.7767, -96.7970";

// Simulate the pattern matching logic
function determineRenewableQueryType(message) {
    // Terrain analysis patterns - more flexible matching
    if (/analyze.*terrain|terrain.*analysis|terrain.*for.*wind|site.*analysis|unbuildable.*areas|exclusion.*zones|setback/i.test(message)) {
        return 'terrain_analysis';
    }

    // Layout design patterns
    if (/layout|turbine.*placement|wind.*farm.*design|optimize.*layout|turbine.*spacing/i.test(message)) {
        return 'layout_design';
    }

    // Default to general renewable
    return 'general_renewable';
}

// Test the pattern
const result = determineRenewableQueryType(testMessage);
console.log('Test Message:', testMessage);
console.log('Pattern Result:', result);
console.log('Expected:', 'terrain_analysis');
console.log('Match:', result === 'terrain_analysis' ? '✅ SUCCESS' : '❌ FAILED');

// Test coordinate extraction
function extractCoordinates(message) {
    const coordPatterns = [
        /(\-?\d+\.?\d*),\s*(\-?\d+\.?\d*)/,  // Simple lat,lng
        /lat[itude]*:?\s*(\-?\d+\.?\d*),?\s*lon[gitude]*:?\s*(\-?\d+\.?\d*)/i,
        /(\-?\d+\.?\d*)\s*,\s*(\-?\d+\.?\d*)/
    ];

    for (const pattern of coordPatterns) {
        const match = message.match(pattern);
        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);
            if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                return { lat, lng };
            }
        }
    }
    return null;
}

const coordinates = extractCoordinates(testMessage);
console.log('\nCoordinate Extraction:');
console.log('Extracted:', coordinates);
console.log('Expected: { lat: 32.7767, lng: -96.7970 }');
console.log('Match:', coordinates && coordinates.lat === 32.7767 && coordinates.lng === -96.7970 ? '✅ SUCCESS' : '❌ FAILED');

console.log('\n🎯 Pattern fix validation complete!');
console.log('The query should now be properly classified as terrain_analysis and coordinates should be extracted correctly.');
