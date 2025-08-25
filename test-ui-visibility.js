// UI Visibility Test Script
// Test both Planning and Projects pages for UI visibility issues

const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');
    
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // Mock login
    await page.evaluate(() => {
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        name: 'Test User',
        email: 'test@example.com'
      }));
    });

    // Test Planning page
    console.log('\n=== Testing Planning Page ===');
    await page.goto('http://localhost:3000/planning');
    await page.waitForLoadState('networkidle');
    
    // Check calendar visibility
    const calendarBox = await page.$('.calendarBox');
    const calendarGrid = await page.$('.calendarGrid');
    const planningWrapper = await page.$('.planningWrapper');
    
    if (calendarBox) {
      const calendarBoxVisible = await calendarBox.isVisible();
      const calendarBoxBounds = await calendarBox.boundingBox();
      console.log('Calendar Box visible:', calendarBoxVisible);
      console.log('Calendar Box bounds:', calendarBoxBounds);
      
      // Check computed styles
      const calendarStyles = await page.evaluate(() => {
        const cal = document.querySelector('.calendarBox');
        if (cal) {
          const styles = window.getComputedStyle(cal);
          return {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            width: styles.width,
            height: styles.height,
            position: styles.position,
            zIndex: styles.zIndex
          };
        }
        return null;
      });
      console.log('Calendar computed styles:', calendarStyles);
    } else {
      console.log('Calendar Box not found!');
    }
    
    // Check if planning wrapper exists
    if (planningWrapper) {
      const wrapperStyles = await page.evaluate(() => {
        const wrapper = document.querySelector('[class*="planningWrapper"]');
        if (wrapper) {
          const styles = window.getComputedStyle(wrapper);
          return {
            display: styles.display,
            visibility: styles.visibility,
            className: wrapper.className,
            childrenCount: wrapper.children.length
          };
        }
        return null;
      });
      console.log('Planning wrapper styles:', wrapperStyles);
    }
    
    // Check for CSS Module classes
    const moduleClasses = await page.evaluate(() => {
      const allElements = document.querySelectorAll('[class*="Planning_"]');
      return Array.from(allElements).map(el => ({
        tagName: el.tagName,
        className: el.className,
        visible: el.offsetWidth > 0 && el.offsetHeight > 0
      }));
    });
    console.log('CSS Module classes found:', moduleClasses.length);
    if (moduleClasses.length > 0) {
      console.log('Sample classes:', moduleClasses.slice(0, 5));
    }

    // Test Projects page
    console.log('\n=== Testing Projects Page ===');
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');
    
    // Check projects grid visibility
    const projectGrid = await page.$('[class*="projectGrid"]');
    const projectCards = await page.$$('[class*="projectCard"]');
    
    if (projectGrid) {
      const gridVisible = await projectGrid.isVisible();
      const gridBounds = await projectGrid.boundingBox();
      console.log('Project Grid visible:', gridVisible);
      console.log('Project Grid bounds:', gridBounds);
      console.log('Project Cards count:', projectCards.length);
      
      // Check grid styles
      const gridStyles = await page.evaluate(() => {
        const grid = document.querySelector('[class*="projectGrid"]');
        if (grid) {
          const styles = window.getComputedStyle(grid);
          return {
            display: styles.display,
            gridTemplateColumns: styles.gridTemplateColumns,
            visibility: styles.visibility,
            opacity: styles.opacity
          };
        }
        return null;
      });
      console.log('Grid computed styles:', gridStyles);
    } else {
      console.log('Project Grid not found!');
    }
    
    // Check for any error elements
    const errors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.error, [class*="error"]');
      return Array.from(errorElements).map(el => ({
        className: el.className,
        text: el.textContent
      }));
    });
    if (errors.length > 0) {
      console.log('\nErrors found:', errors);
    }
    
    // Take screenshots for visual inspection
    await page.screenshot({ path: 'planning-page.png', fullPage: true });
    await page.goto('http://localhost:3000/projects');
    await page.screenshot({ path: 'projects-page.png', fullPage: true });
    
    console.log('\nScreenshots saved: planning-page.png, projects-page.png');

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();