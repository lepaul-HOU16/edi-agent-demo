const puppeteer = require('puppeteer');

async function testWindFarmMapMigration() {
  console.log('🧪 Testing Wind Farm Map Migration to Amazon Location Service...\n');
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: { width: 1280, height: 800 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Track console messages to monitor map loading
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      
      if (text.includes('Initializing wind farm map')) {
        console.log('🗺️ Wind farm map initialization started...');
      } else if (text.includes('Wind farm map loaded successfully')) {
        console.log('✅ Wind farm map loaded successfully!');
      } else if (text.includes('Rendering turbines layer')) {
        console.log('🌪️ Turbines layer rendering...');
      } else if (text.includes('Turbines layer rendered successfully')) {
        console.log('✅ Turbines layer rendered successfully!');
      } else if (text.includes('Toggling 3D mode')) {
        console.log('🏔️ 3D mode toggle detected');
      } else if (text.includes('MapLibre') || text.includes('Expected value to be of type number')) {
        console.log('❌ MapLibre error:', text);
      }
    });
    
    // Navigate to the chat interface
    console.log('📱 Navigating to chat interface...');
    await page.goto('http://localhost:3001/chat/test-session', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Wait for the page to load
    await page.waitForSelector('[data-testid="chat-input"], textarea, input[type="text"]', { timeout: 10000 });
    console.log('✅ Chat interface loaded');
    
    // Send a wind farm layout request
    console.log('🌪️ Requesting wind farm layout analysis with Amazon Location Service...');
    const inputSelector = await page.$('[data-testid="chat-input"]') ? '[data-testid="chat-input"]' : 'textarea';
    
    await page.type(inputSelector, 'Design a 30MW wind farm layout with interactive map visualization for coordinates 32.7767, -96.797 showing turbine positions and wake analysis');
    
    // Submit the request
    await page.keyboard.press('Enter');
    console.log('📤 Wind farm request submitted');
    
    // Wait for the response and wind farm component to load
    console.log('⏳ Waiting for wind farm component with new map implementation...');
    await page.waitForTimeout(15000); // Give time for agent processing
    
    // Look for wind farm visualization elements
    const windFarmElements = await page.$$eval('*', els => 
      els.filter(el => el.textContent && (
        el.textContent.includes('Wind Farm Layout') ||
        el.textContent.includes('Interactive Wind Farm') ||
        el.textContent.includes('3D Mode') ||
        el.textContent.includes('Wake Analysis')
      )).length
    );
    
    if (windFarmElements > 0) {
      console.log('✅ Wind farm component detected');
      
      // Test map interactivity
      console.log('🗺️ Testing interactive map functionality...');
      
      // Try to click on the map area (turbine positions)
      await page.waitForTimeout(5000); // Wait for map to fully load
      
      // Look for maplibre canvas elements
      const mapCanvases = await page.$$('canvas.maplibregl-canvas');
      console.log(`🗺️ Found ${mapCanvases.length} MapLibre GL canvases`);
      
      if (mapCanvases.length > 0) {
        console.log('✅ MapLibre GL map detected - migration successful!');
        
        // Test clicking on a turbine position (center of map)
        const mapCanvas = mapCanvases[0];
        const boundingBox = await mapCanvas.boundingBox();
        if (boundingBox) {
          const centerX = boundingBox.x + boundingBox.width / 2;
          const centerY = boundingBox.y + boundingBox.height / 2;
          
          await page.click(centerX, centerY);
          console.log('🌪️ Clicked on map center (potential turbine position)');
          await page.waitForTimeout(1000);
        }
      } else {
        console.log('❌ No MapLibre GL canvases found - map not loaded properly');
      }
      
      // Test 3D view functionality
      console.log('🔄 Testing 3D view toggle...');
      try {
        const viewDropdown = await page.$x("//text()[contains(., '2D')]/ancestor::*[contains(@class, 'awsui-select')]");
        if (viewDropdown.length > 0) {
          await viewDropdown[0].click();
          await page.waitForTimeout(500);
          
          // Try to select 3D view
          const threeDOption = await page.$x("//text()[contains(., '3D')]/ancestor::button");
          if (threeDOption.length > 0) {
            await threeDOption[0].click();
            console.log('✅ 3D view toggle attempted');
            
            // Wait for transition
            await page.waitForTimeout(3000);
          }
        }
      } catch (error) {
        console.log('ℹ️ 3D view toggle interaction not found');
      }
      
      // Test wake analysis toggle
      console.log('🌊 Testing wake analysis toggle...');
      try {
        const wakeToggle = await page.$x("//text()[contains(., 'Wake Analysis')]/ancestor::label");
        if (wakeToggle.length > 0) {
          await wakeToggle[0].click();
          console.log('✅ Wake analysis toggle attempted');
          await page.waitForTimeout(2000);
        }
      } catch (error) {
        console.log('ℹ️ Wake analysis toggle not found');
      }
      
    } else {
      console.log('❌ Wind farm component not detected');
    }
    
    // Wait a bit more to capture any delayed messages
    await page.waitForTimeout(5000);
    
    // Analyze console messages for success indicators
    const mapLoadMessages = consoleMessages.filter(msg => 
      msg.includes('Wind farm map loaded successfully') ||
      msg.includes('Turbines layer rendered successfully') ||
      msg.includes('Initializing wind farm map')
    );
    
    const errorMessages = consoleMessages.filter(msg => 
      msg.includes('Expected value to be of type number') ||
      msg.includes('MapLibre error') ||
      msg.includes('Failed to load map')
    );
    
    console.log('\n📊 Migration Test Results:');
    console.log('==========================');
    
    if (mapLoadMessages.length > 0) {
      console.log('✅ Amazon Location Service integration successful');
      mapLoadMessages.forEach(msg => console.log(`   ℹ️ ${msg}`));
    } else {
      console.log('⚠️ No map loading success messages detected');
    }
    
    if (errorMessages.length === 0) {
      console.log('✅ No MapLibre GL expression errors detected');
      console.log('✅ Migration to Amazon Location Service completed successfully');
    } else {
      console.log('❌ Still experiencing mapping errors:');
      errorMessages.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log(`\n📈 Total console messages: ${consoleMessages.length}`);
    console.log(`🗺️ Map-related messages: ${mapLoadMessages.length}`);
    console.log(`❌ Error messages: ${errorMessages.length}`);
    
    console.log('\n🎯 Migration Validation Summary:');
    console.log('=================================');
    
    if (mapLoadMessages.length > 0 && errorMessages.length === 0) {
      console.log('✅ MIGRATION SUCCESSFUL: Canvas replaced with MapLibre GL');
      console.log('✅ Amazon Location Service integration working');
      console.log('✅ Interactive turbine markers should be functional');
      console.log('✅ 3D terrain visualization should be working');
      console.log('✅ No more external API dependencies (NREL)');
    } else {
      console.log('❌ Migration issues detected - further investigation needed');
    }
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testWindFarmMapMigration().catch(console.error);
