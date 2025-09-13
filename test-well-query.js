// Quick test of well query detection logic
const testMessages = [
    "How many wells do I have?",
    "What wells are available?", 
    "Show me my well data",
    "Count the wells",
    "Number of wells available",
    "What data do you have?",
    "Hello there"
];

testMessages.forEach(message => {
    const messageText = message.toLowerCase();
    const isWellQuery = messageText.includes('well') || 
                       messageText.includes('how many') ||
                       messageText.includes('count') ||
                       messageText.includes('number of') ||
                       messageText.includes('available') ||
                       messageText.includes('data');
    
    console.log(`"${message}" -> Well Query: ${isWellQuery}`);
});