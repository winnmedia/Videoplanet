/**
 * Simple test runner for WebSocket mock server
 * Verifies basic functionality without Playwright dependencies
 */

const { MockWebSocketServer } = require('./websocket-mock-server.js');
const { WebSocketTestOrchestrator } = require('./websocket-test-utils.js');

async function runBasicTest() {
  console.log('🚀 Starting WebSocket Mock Server Test...\n');

  // Test 1: Server startup and shutdown
  console.log('Test 1: Server Startup/Shutdown');
  const server = new MockWebSocketServer(8090);
  
  try {
    await server.start();
    console.log('✅ Server started successfully');
    
    await server.stop();
    console.log('✅ Server stopped successfully');
  } catch (error) {
    console.error('❌ Server test failed:', error.message);
    return false;
  }

  // Test 2: Orchestrator functionality
  console.log('\nTest 2: Test Orchestrator');
  const orchestrator = new WebSocketTestOrchestrator({ serverPort: 8091 });
  
  try {
    await orchestrator.setup();
    console.log('✅ Orchestrator setup successful');
    
    const stats = orchestrator.getServerStats();
    console.log('✅ Server stats retrieved:', stats);
    
    await orchestrator.teardown();
    console.log('✅ Orchestrator teardown successful');
  } catch (error) {
    console.error('❌ Orchestrator test failed:', error.message);
    return false;
  }

  console.log('\n🎉 All basic tests passed!');
  return true;
}

// Run the test
if (require.main === module) {
  runBasicTest()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runBasicTest };