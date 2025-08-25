/**
 * VideoPlanet Cross-Browser Testing Global Teardown
 * 
 * Handles cleanup and reporting after all cross-browser tests complete
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Cleanup resources and generate final compatibility reports
 */
async function globalTeardown() {
  console.log('🧹 Starting cross-browser test cleanup...');

  try {
    // Ensure test results directory exists
    const resultsDir = path.join(process.cwd(), 'test-results');
    await fs.mkdir(resultsDir, { recursive: true });

    // Cleanup temporary files
    const tempDirs = [
      'test-results/cross-browser-artifacts',
      'test-results/screenshots',
      'test-results/videos',
      'test-results/traces'
    ];

    for (const dir of tempDirs) {
      const dirPath = path.join(process.cwd(), dir);
      try {
        const stats = await fs.stat(dirPath);
        if (stats.isDirectory()) {
          console.log(`📂 Cleaning up ${dir}...`);
          // Keep only recent test artifacts (last 24 hours)
          const cutoffTime = Date.now() - (24 * 60 * 60 * 1000);
          await cleanupOldFiles(dirPath, cutoffTime);
        }
      } catch (error) {
        // Directory doesn't exist, skip
      }
    }

    console.log('✅ Cross-browser test cleanup completed');
  } catch (error) {
    console.error('❌ Error during teardown:', error);
    // Don't fail the entire test suite due to cleanup issues
  }
}

/**
 * Cleanup old test artifact files
 */
async function cleanupOldFiles(dirPath: string, cutoffTime: number) {
  try {
    const files = await fs.readdir(dirPath);
    let cleanedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      
      if (stats.mtime.getTime() < cutoffTime) {
        await fs.unlink(filePath);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`  🗑️  Cleaned ${cleanedCount} old files from ${path.basename(dirPath)}`);
    }
  } catch (error) {
    console.warn(`⚠️  Could not cleanup ${dirPath}:`, error);
  }
}

export default globalTeardown;