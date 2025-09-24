// COPY AND PASTE THIS ENTIRE BLOCK INTO BROWSER CONSOLE
// Then test the well data discovery prompt

console.log('🔍 === UI DEBUGGING ENABLED ===');

// Monitor for artifact processing
const originalLog = console.log;
console.log = function(...args) {
    const message = args.join(' ');
    
    // Always show the original log
    originalLog.apply(console, args);
    
    // Highlight artifact-related logs
    if (message.includes('artifacts') || 
        message.includes('EnhancedArtifactProcessor') ||
        message.includes('ChatMessage') ||
        message.includes('comprehensive_well_data_discovery')) {
        originalLog('🎯 ARTIFACT DEBUG:', message);
    }
};

// Monitor React component renders
const originalError = console.error;
console.error = function(...args) {
    const message = args.join(' ');
    originalError.apply(console, args);
    
    if (message.includes('ComprehensiveWellDataDiscoveryComponent') ||
        message.includes('artifact')) {
        originalError('🚨 ARTIFACT ERROR:', message);
    }
};

console.log('✅ Debug monitoring active - now test the comprehensive prompt');
console.log('📝 Test this prompt:');
console.log('"Analyze the complete dataset of 24 production wells from WELL-001 through WELL-024. Generate a comprehensive summary showing available log curves (GR, RHOB, NPHI, DTC, CALI, resistivity), spatial distribution, depth ranges, and data quality assessment. Create interactive visualizations showing field overview and well statistics."');
console.log('');
console.log('🔍 Watch for these key logs:');
console.log('1. "🎯 ChatMessage: Found artifacts in AI message!"');
console.log('2. "🎉 EnhancedArtifactProcessor: Rendering ComprehensiveWellDataDiscoveryComponent"');
console.log('3. Any error messages about components or artifacts');
console.log('');
console.log('If you don\'t see these logs, the backend isn\'t generating artifacts correctly.');

// Restore console after 60 seconds  
setTimeout(() => {
    console.log = originalLog;
    console.error = originalError;
    console.log('🔍 Debug monitoring disabled');
}, 60000);
