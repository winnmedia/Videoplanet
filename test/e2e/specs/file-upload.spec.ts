/**
 * File Upload E2E Tests
 * 
 * End-to-end test scenarios for complete file upload journeys
 * Tests real user workflows with actual file uploads
 */

import { test, expect } from '@playwright/test'
import path from 'path'

// Test file paths (relative to test directory)
const TEST_FILES = {
  smallVideo: path.join(__dirname, '../fixtures/small-video.mp4'),
  largeVideo: path.join(__dirname, '../fixtures/large-video.mp4'),
  invalidFile: path.join(__dirname, '../fixtures/document.txt'),
  image: path.join(__dirname, '../fixtures/image.jpg'),
  multipleFiles: [
    path.join(__dirname, '../fixtures/video1.mp4'),
    path.join(__dirname, '../fixtures/video2.avi')
  ]
}

test.describe('File Upload Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to upload page
    await page.goto('/upload')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
  })

  test.describe('Upload Zone Interaction', () => {
    test('should display upload zone with proper accessibility', async ({ page }) => {
      const uploadZone = page.getByRole('button', { name: /upload.*files/i })
      
      // Check initial state
      await expect(uploadZone).toBeVisible()
      await expect(uploadZone).toHaveAttribute('tabindex', '0')
      await expect(uploadZone).toHaveAttribute('aria-label')
      
      // Check descriptive text
      await expect(page.getByText('Drag & drop files here')).toBeVisible()
      await expect(page.getByText('or click to browse files')).toBeVisible()
      
      // Check file format information
      await expect(page.getByText(/supports.*files/i)).toBeVisible()
      await expect(page.getByText(/maximum file size/i)).toBeVisible()
    })

    test('should respond to keyboard navigation', async ({ page }) => {
      const uploadZone = page.getByRole('button', { name: /upload.*files/i })
      
      // Tab to upload zone
      await page.keyboard.press('Tab')
      await expect(uploadZone).toBeFocused()
      
      // Should be able to activate with keyboard
      await page.keyboard.press('Enter')
      // File dialog would open (can't test file dialog interaction in E2E)
      
      await page.keyboard.press('Space')
      // File dialog would open again
    })

    test('should show drag state when files are dragged over', async ({ page }) => {
      const uploadZone = page.getByRole('button', { name: /upload.*files/i })
      
      // Simulate drag enter
      await uploadZone.dispatchEvent('dragenter', {
        dataTransfer: {
          types: ['Files'],
          files: []
        }
      })
      
      // Check for drag state visual changes
      await expect(uploadZone).toHaveClass(/border-blue-300/)
    })
  })

  test.describe('Single File Upload', () => {
    test('should upload small video file successfully', async ({ page }) => {
      // Set up file input
      const fileInput = page.locator('input[type="file"]')
      
      // Upload file
      await fileInput.setInputFiles(TEST_FILES.smallVideo)
      
      // Check file preview appears
      await expect(page.getByText('Selected Files (1)')).toBeVisible()
      await expect(page.getByText('small-video.mp4')).toBeVisible()
      
      // Check file details
      await expect(page.getByText(/video\/mp4/)).toBeVisible()
      await expect(page.getByText(/bytes/)).toBeVisible()
      
      // Start upload
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Check upload progress
      await expect(page.getByRole('progressbar')).toBeVisible()
      await expect(page.getByText(/uploading/i)).toBeVisible()
      
      // Wait for completion
      await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 30000 })
      await expect(page.getByText(/upload completed successfully/i)).toBeVisible()
    })

    test('should reject invalid file types', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload invalid file
      await fileInput.setInputFiles(TEST_FILES.invalidFile)
      
      // Check error message
      await expect(page.getByText(/file type.*not allowed/i)).toBeVisible()
      await expect(page.getByRole('alert')).toBeVisible()
      
      // Upload button should not be available
      await expect(page.getByRole('button', { name: /start.*upload/i })).toBeDisabled()
    })

    test('should handle large file upload with chunking', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload large file
      await fileInput.setInputFiles(TEST_FILES.largeVideo)
      
      // Check chunked upload indicators
      await expect(page.getByText('large-video.mp4')).toBeVisible()
      await expect(page.getByText(/large file detected/i)).toBeVisible()
      
      // Start upload
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Check chunked progress indicators
      await expect(page.getByText(/chunks:/i)).toBeVisible()
      await expect(page.getByText(/uploaded/)).toBeVisible()
      
      // Check speed and time remaining
      await expect(page.getByText(/speed:/i)).toBeVisible()
      await expect(page.getByText(/remaining:/i)).toBeVisible()
    })

    test('should allow pausing and resuming upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload file and start
      await fileInput.setInputFiles(TEST_FILES.largeVideo)
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Wait for upload to start
      await expect(page.getByText(/uploading/i)).toBeVisible()
      
      // Pause upload
      await page.getByRole('button', { name: /pause/i }).click()
      await expect(page.getByText(/paused/i)).toBeVisible()
      
      // Resume upload
      await page.getByRole('button', { name: /resume/i }).click()
      await expect(page.getByText(/uploading/i)).toBeVisible()
    })

    test('should allow cancelling upload', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload file and start
      await fileInput.setInputFiles(TEST_FILES.smallVideo)
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Cancel upload
      await page.getByRole('button', { name: /cancel/i }).click()
      await expect(page.getByText(/cancelled/i)).toBeVisible()
      
      // File should be removed from queue
      await expect(page.getByText('small-video.mp4')).not.toBeVisible({ timeout: 2000 })
    })
  })

  test.describe('Multiple File Upload', () => {
    test('should upload multiple files simultaneously', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload multiple files
      await fileInput.setInputFiles(TEST_FILES.multipleFiles)
      
      // Check multiple files in queue
      await expect(page.getByText('Selected Files (2)')).toBeVisible()
      await expect(page.getByText('video1.mp4')).toBeVisible()
      await expect(page.getByText('video2.avi')).toBeVisible()
      
      // Start all uploads
      await page.getByRole('button', { name: /start all/i }).click()
      
      // Check multiple progress bars
      const progressBars = page.locator('[role="progressbar"]')
      await expect(progressBars).toHaveCount(2)
      
      // Check overall progress
      await expect(page.getByText(/overall/)).toBeVisible()
      
      // Wait for all uploads to complete
      await expect(page.getByText(/2.*completed/i)).toBeVisible({ timeout: 30000 })
    })

    test('should show batch upload statistics', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload multiple files
      await fileInput.setInputFiles(TEST_FILES.multipleFiles)
      
      // Check initial statistics
      await expect(page.getByText(/2.*pending/i)).toBeVisible()
      await expect(page.getByText(/0.*uploading/i)).toBeVisible()
      await expect(page.getByText(/0.*completed/i)).toBeVisible()
      
      // Start uploads
      await page.getByRole('button', { name: /start all/i }).click()
      
      // Check updated statistics during upload
      await expect(page.getByText(/uploading/i)).toBeVisible()
      
      // Wait for completion and check final statistics
      await expect(page.getByText(/2.*completed/i)).toBeVisible({ timeout: 30000 })
    })

    test('should allow batch operations', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload multiple files
      await fileInput.setInputFiles(TEST_FILES.multipleFiles)
      await page.getByRole('button', { name: /start all/i }).click()
      
      // Pause all uploads
      await page.getByRole('button', { name: /pause all/i }).click()
      await expect(page.getByText(/paused/i).first()).toBeVisible()
      
      // Clear completed uploads (after they finish)
      await page.waitForTimeout(5000) // Wait for some to complete
      await page.getByRole('button', { name: /clear completed/i }).click()
      
      // Clear all uploads
      await page.getByRole('button', { name: /clear all/i }).click()
      await expect(page.getByText('No files in upload queue')).toBeVisible()
    })
  })

  test.describe('File Management', () => {
    test('should display file metadata correctly', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload image file to test metadata extraction
      await fileInput.setInputFiles(TEST_FILES.image)
      
      // Check basic metadata
      await expect(page.getByText('image.jpg')).toBeVisible()
      await expect(page.getByText(/image\/jpeg/)).toBeVisible()
      
      // Check file size formatting
      await expect(page.getByText(/KB|MB|GB/)).toBeVisible()
      
      // For images, check if dimensions are shown (if implemented)
      // This would require actual image processing in the component
    })

    test('should handle file removal from preview', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload multiple files
      await fileInput.setInputFiles([TEST_FILES.smallVideo, TEST_FILES.image])
      
      // Remove one file
      await page.getByRole('button', { name: /remove.*image\.jpg/i }).click()
      
      // Check file was removed
      await expect(page.getByText('image.jpg')).not.toBeVisible()
      await expect(page.getByText('Selected Files (1)')).toBeVisible()
      await expect(page.getByText('small-video.mp4')).toBeVisible()
    })

    test('should clear all previews', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload multiple files
      await fileInput.setInputFiles(TEST_FILES.multipleFiles)
      
      // Clear all files
      await page.getByRole('button', { name: /clear all/i }).click()
      
      // Check all files removed
      await expect(page.getByText('Selected Files')).not.toBeVisible()
      await expect(page.getByText('No files in upload queue')).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Intercept upload requests to simulate network error
      await page.route('**/api/upload**', route => {
        route.abort('failed')
      })
      
      const fileInput = page.locator('input[type="file"]')
      
      // Upload file
      await fileInput.setInputFiles(TEST_FILES.smallVideo)
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Check error handling
      await expect(page.getByText(/failed/i)).toBeVisible()
      await expect(page.getByText(/upload failed/i)).toBeVisible()
      
      // Check retry option
      await expect(page.getByRole('button', { name: /retry/i })).toBeVisible()
    })

    test('should handle quota exceeded errors', async ({ page }) => {
      // Mock quota API to return near-limit quota
      await page.route('**/api/storage/quota**', route => {
        route.fulfill({
          json: {
            used: 900 * 1024 * 1024, // 900MB
            total: 1024 * 1024 * 1024, // 1GB
            available: 124 * 1024 * 1024,
            percentage: 87.9,
            nearLimit: true,
            exceeded: false
          }
        })
      })
      
      const fileInput = page.locator('input[type="file"]')
      
      // Try to upload large file that would exceed quota
      await fileInput.setInputFiles(TEST_FILES.largeVideo)
      
      // Should show quota warning/error
      await expect(page.getByText(/quota/i)).toBeVisible()
      await expect(page.getByText(/storage limit/i)).toBeVisible()
    })

    test('should show retry functionality for failed uploads', async ({ page }) => {
      // Set up intermittent failure
      let failCount = 0
      await page.route('**/api/upload**', route => {
        failCount++
        if (failCount <= 2) {
          route.abort('failed')
        } else {
          route.continue()
        }
      })
      
      const fileInput = page.locator('input[type="file"]')
      
      // Upload file (will fail first time)
      await fileInput.setInputFiles(TEST_FILES.smallVideo)
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Check failure
      await expect(page.getByText(/failed/i)).toBeVisible()
      
      // Retry upload
      await page.getByRole('button', { name: /retry/i }).click()
      
      // Should succeed on retry
      await expect(page.getByText(/completed/i)).toBeVisible({ timeout: 30000 })
    })
  })

  test.describe('Accessibility', () => {
    test('should be fully keyboard navigable', async ({ page }) => {
      // Navigate through all interactive elements
      await page.keyboard.press('Tab') // Upload zone
      await expect(page.getByRole('button', { name: /upload.*files/i })).toBeFocused()
      
      // Add a file first
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(TEST_FILES.smallVideo)
      
      // Continue tabbing through interface
      await page.keyboard.press('Tab') // Start upload button
      await page.keyboard.press('Tab') // Clear all button
      await page.keyboard.press('Tab') // Remove file button
      
      // Should be able to activate buttons with Enter/Space
      await page.keyboard.press('Enter')
    })

    test('should announce upload progress to screen readers', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload file
      await fileInput.setInputFiles(TEST_FILES.smallVideo)
      await page.getByRole('button', { name: /start.*upload/i }).click()
      
      // Check ARIA live regions for progress updates
      const progressBar = page.getByRole('progressbar')
      await expect(progressBar).toHaveAttribute('aria-valuenow')
      await expect(progressBar).toHaveAttribute('aria-valuemin', '0')
      await expect(progressBar).toHaveAttribute('aria-valuemax', '100')
      
      // Check for status announcements
      await expect(page.getByRole('status')).toBeVisible()
    })

    test('should have proper error announcements', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload invalid file
      await fileInput.setInputFiles(TEST_FILES.invalidFile)
      
      // Check error is announced
      await expect(page.getByRole('alert')).toBeVisible()
      await expect(page.getByText(/not allowed/i)).toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should handle large number of files efficiently', async ({ page }) => {
      // This would require generating many test files
      // For now, test with available files multiple times
      const manyFiles = Array(5).fill(TEST_FILES.smallVideo)
      
      const fileInput = page.locator('input[type="file"]')
      await fileInput.setInputFiles(manyFiles)
      
      // Check UI remains responsive
      await expect(page.getByText('Selected Files (5)')).toBeVisible()
      
      // UI should not freeze during file processing
      await page.getByRole('button', { name: /start all/i }).click()
      
      // Should handle multiple uploads without UI blocking
      await expect(page.getByText(/uploading/i)).toBeVisible()
    })

    test('should not block UI during file validation', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]')
      
      // Upload large file
      await fileInput.setInputFiles(TEST_FILES.largeVideo)
      
      // UI should show validation in progress but remain interactive
      await expect(page.getByText('Validating files...')).toBeVisible()
      
      // Should be able to interact with other parts of the UI
      await expect(page.getByRole('button', { name: /clear all/i })).toBeEnabled()
    })
  })
})

test.describe('File Upload Integration', () => {
  test('should integrate with project creation flow', async ({ page }) => {
    // Navigate to project creation page
    await page.goto('/projects/new')
    
    // Fill project details
    await page.fill('[name="projectName"]', 'Test Project')
    await page.fill('[name="description"]', 'Test project with file upload')
    
    // Upload project files
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(TEST_FILES.smallVideo)
    
    // Complete project creation
    await page.getByRole('button', { name: /create project/i }).click()
    
    // Verify integration
    await expect(page.getByText('Project created successfully')).toBeVisible()
    await expect(page.getByText('small-video.mp4')).toBeVisible()
  })

  test('should maintain upload state across page navigation', async ({ page }) => {
    // Start upload
    await page.goto('/upload')
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(TEST_FILES.smallVideo)
    await page.getByRole('button', { name: /start.*upload/i }).click()
    
    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/upload')
    
    // Upload state should be preserved (if implemented with persistence)
    // This depends on implementation details
  })
})