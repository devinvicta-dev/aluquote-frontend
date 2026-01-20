import { chromium } from 'playwright';

const URL = 'https://tvfg1yz90jqd.space.minimax.io';

async function testPdfGeneration() {
  console.log('Testing PDF generation in browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('Page loaded');
    
    // Check if jsPDF is available
    const jsPdfCheck = await page.evaluate(() => {
      return typeof window.jspdf !== 'undefined' || typeof jsPDF !== 'undefined';
    });
    console.log('jsPDF available globally:', jsPdfCheck);
    
    // Check for errors in the app
    const errors = await page.evaluate(() => {
      return window.__errors || [];
    });
    console.log('App errors:', errors);
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testPdfGeneration();
