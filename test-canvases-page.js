/**
 * Test script for CanvasesPage functionality
 * Tests API calls with mock authentication
 */

const API_BASE_URL = 'https://hbt1j807qf.execute-api.us-east-1.amazonaws.com';

async function testCanvasesPage() {
  console.log('🧪 Testing CanvasesPage functionality...\n');

  // Generate mock token
  const mockToken = `mock-dev-token-${Date.now()}`;
  console.log(`🔓 Using mock token: ${mockToken}\n`);

  // Test 1: List sessions (canvases)
  console.log('📋 Test 1: List sessions...');
  try {
    const sessionsResponse = await fetch(`${API_BASE_URL}/api/chat/sessions?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!sessionsResponse.ok) {
      throw new Error(`HTTP ${sessionsResponse.status}: ${await sessionsResponse.text()}`);
    }

    const sessionsData = await sessionsResponse.json();
    console.log(`✅ Sessions loaded: ${sessionsData.data?.length || 0} canvases`);
    
    if (sessionsData.data && sessionsData.data.length > 0) {
      console.log(`   First canvas: ${sessionsData.data[0].name || 'Untitled'}`);
    }
  } catch (error) {
    console.error('❌ Failed to list sessions:', error.message);
    return false;
  }

  console.log('');

  // Test 2: List collections
  console.log('📁 Test 2: List collections...');
  try {
    const collectionsResponse = await fetch(`${API_BASE_URL}/api/collections/list`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!collectionsResponse.ok) {
      throw new Error(`HTTP ${collectionsResponse.status}: ${await collectionsResponse.text()}`);
    }

    const collectionsData = await collectionsResponse.json();
    console.log(`✅ Collections loaded: ${collectionsData.collections?.length || 0} collections`);
    
    if (collectionsData.collections && collectionsData.collections.length > 0) {
      console.log(`   First collection: ${collectionsData.collections[0].name}`);
    }
  } catch (error) {
    console.error('❌ Failed to list collections:', error.message);
    return false;
  }

  console.log('');

  // Test 3: Create a test session
  console.log('➕ Test 3: Create test session...');
  try {
    const createResponse = await fetch(`${API_BASE_URL}/api/chat/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Test Canvas - ${new Date().toLocaleString()}`,
      }),
    });

    if (!createResponse.ok) {
      throw new Error(`HTTP ${createResponse.status}: ${await createResponse.text()}`);
    }

    const createData = await createResponse.json();
    console.log(`✅ Session created: ${createData.data.id}`);
    console.log(`   Name: ${createData.data.name}`);

    // Test 4: Delete the test session
    console.log('');
    console.log('🗑️  Test 4: Delete test session...');
    const deleteResponse = await fetch(`${API_BASE_URL}/api/chat/sessions/${createData.data.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${mockToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!deleteResponse.ok) {
      throw new Error(`HTTP ${deleteResponse.status}: ${await deleteResponse.text()}`);
    }

    console.log(`✅ Session deleted successfully`);
  } catch (error) {
    console.error('❌ Failed to create/delete session:', error.message);
    return false;
  }

  console.log('');
  console.log('✅ All CanvasesPage tests passed!');
  return true;
}

// Run tests
testCanvasesPage()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
