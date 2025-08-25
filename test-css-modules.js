// Test CSS modules are properly generated
const fetch = require('node-fetch');

async function testPages() {
  try {
    // Test Planning page
    console.log('=== Testing Planning Page ===');
    const planningResponse = await fetch('http://localhost:3000/planning');
    const planningHTML = await planningResponse.text();
    
    // Check for CSS module classes in the HTML
    const hasPlanningWrapper = planningHTML.includes('Planning_planningWrapper');
    const hasCalendarBox = planningHTML.includes('Planning_calendarBox');
    const hasCalendarGrid = planningHTML.includes('Planning_calendarGrid');
    
    console.log('Planning wrapper class found:', hasPlanningWrapper);
    console.log('Calendar box class found:', hasCalendarBox);
    console.log('Calendar grid class found:', hasCalendarGrid);
    
    // Extract CSS module class patterns
    const planningClasses = planningHTML.match(/Planning_[a-zA-Z0-9_]+/g);
    if (planningClasses) {
      console.log('Planning CSS module classes found:', [...new Set(planningClasses)].slice(0, 10));
    }
    
    // Test Projects page
    console.log('\n=== Testing Projects Page ===');
    const projectsResponse = await fetch('http://localhost:3000/projects');
    const projectsHTML = await projectsResponse.text();
    
    const hasProjectGrid = projectsHTML.includes('page_projectGrid');
    const hasProjectCard = projectsHTML.includes('page_projectCard');
    
    console.log('Project grid class found:', hasProjectGrid);
    console.log('Project card class found:', hasProjectCard);
    
    // Extract CSS module class patterns
    const projectClasses = projectsHTML.match(/page_[a-zA-Z0-9_]+/g);
    if (projectClasses) {
      console.log('Projects CSS module classes found:', [...new Set(projectClasses)].slice(0, 10));
    }
    
    // Check for any error messages
    if (planningHTML.includes('Error') || planningHTML.includes('error')) {
      console.log('\nPotential errors in Planning page');
    }
    if (projectsHTML.includes('Error') || projectsHTML.includes('error')) {
      console.log('\nPotential errors in Projects page');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPages();