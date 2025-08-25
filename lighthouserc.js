module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3005',
        'http://localhost:3005/login',
        'http://localhost:3005/dashboard',
        'http://localhost:3005/projects',
        'http://localhost:3005/feedback',
        'http://localhost:3005/file-upload-demo'
      ],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
      }
    },
    assert: {
      assertions: {
        // Core Web Vitals Thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], 
        'first-input-delay': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'time-to-interactive': ['error', { maxNumericValue: 3800 }],
        
        // Performance Budget
        'performance-budget': ['warn', { maxNumericValue: 3000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        
        // Best Practices
        'errors-in-console': 'off', // Allow console warnings in development
        'unused-javascript': ['warn', { maxNumericValue: 200000 }],
        'modern-image-formats': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        
        // Accessibility
        'color-contrast': 'error',
        'aria-allowed-attr': 'error',
        'aria-required-attr': 'error',
        'heading-order': 'warn',
        
        // SEO
        'meta-description': 'warn',
        'document-title': 'error',
        'link-text': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage',
      outputDir: './performance-reports'
    },
    server: {
      command: 'npm run build && npm run start',
      port: 3005
    }
  }
};