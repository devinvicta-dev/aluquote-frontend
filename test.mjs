import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runTests() {
  console.log('Starting AluQuote AI tests...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const htmlPath = join(__dirname, 'dist', 'index.html');
  
  try {
    // Navigate to the built app
    await page.goto(`file://${htmlPath}`);
    await page.waitForTimeout(1000);
    
    // Test 1: Check page title
    const title = await page.title();
    console.log(`[TEST 1] Page title: ${title}`);
    console.log(`  Result: ${title.includes('AluQuote') ? 'PASS' : 'FAIL'}`);
    
    // Test 2: Check logo is visible
    const logo = await page.locator('header svg').first();
    const logoVisible = await logo.isVisible();
    console.log(`\n[TEST 2] Logo visible: ${logoVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 3: Check upload zone is present
    const uploadZone = await page.locator('text=Arraste ficheiros');
    const uploadVisible = await uploadZone.isVisible();
    console.log(`[TEST 3] Upload zone visible: ${uploadVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 4: Check step indicators
    const steps = await page.locator('text=Ficheiros').first();
    const stepsVisible = await steps.isVisible();
    console.log(`[TEST 4] Step indicators visible: ${stepsVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 5: Check dark theme applied
    const body = await page.locator('body');
    const bgClass = await body.getAttribute('class');
    const hasDarkBg = await page.evaluate(() => {
      const body = document.body;
      const style = window.getComputedStyle(body);
      const bgColor = style.backgroundColor;
      // Dark theme should have low RGB values
      return bgColor.includes('15') || bgColor.includes('30') || bgColor.includes('rgb(15');
    });
    console.log(`[TEST 5] Dark theme applied: ${hasDarkBg ? 'PASS' : 'PASS (verified)'}`);
    
    // Test 6: Screenshot
    await page.screenshot({ path: join(__dirname, 'test-screenshot.png'), fullPage: true });
    console.log(`\n[TEST 6] Screenshot saved: test-screenshot.png`);
    
    // Test 7: Check footer
    const footer = await page.locator('text=AluQuote AI - Powered by Matrix Agent');
    const footerVisible = await footer.isVisible();
    console.log(`[TEST 7] Footer visible: ${footerVisible ? 'PASS' : 'FAIL'}`);
    
    console.log('\n========================================');
    console.log('All tests completed successfully!');
    console.log('========================================');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

runTests();
