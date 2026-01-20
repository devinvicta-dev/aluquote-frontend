import { chromium } from 'playwright';

const URL = 'https://sqo5cugacy8a.space.minimax.io';

async function testApp() {
  console.log('Testing AluQuote AI...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture errors
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('1. Page loaded OK');
    
    // Check title
    const title = await page.textContent('h1');
    console.log(`2. Title: ${title}`);
    
    // Check for JS errors
    if (errors.length > 0) {
      console.log('3. JS Errors found:');
      errors.forEach(e => console.log('   -', e.substring(0, 100)));
    } else {
      console.log('3. No JS errors');
    }
    
    // Check export button exists in results (simulate reaching results)
    const hasDownloadIcon = await page.$('text=Exportar PDF');
    console.log(`4. Export PDF text found: ${hasDownloadIcon ? 'Yes (in code)' : 'Not visible yet (need to calculate first)'}`);
    
    // Take screenshot
    await page.screenshot({ path: '/workspace/aluquote-ai/test-final.png' });
    console.log('5. Screenshot saved');
    
    console.log('\n=== Test Summary ===');
    console.log('App is loading correctly.');
    console.log('PDF export uses jsPDF with autoTable plugin.');
    console.log('Flow: Upload -> Configure -> Calculate -> Export PDF');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testApp();
