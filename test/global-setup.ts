import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting VideoPlanet Journey Tests...');
  console.log('📋 Test Coverage:');
  console.log('   ✓ Core Features: Project Management, Feedback, Planning');
  console.log('   ✓ Authentication: Login, Signup, Password Reset');
  console.log('   ✓ UX Friction Detection');
  console.log('   ✓ State Persistence Verification');
  console.log('   ✓ Guest/Anonymous User Flows');
  
  const { baseURL } = config.projects[0].use;
  console.log(`🌐 Testing against: ${baseURL}`);
  
  // Skip browser warmup in CI/limited environments
  console.log('✅ Setup complete, ready for testing');
}

export default globalSetup;