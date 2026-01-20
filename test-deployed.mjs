import { chromium } from 'playwright';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DEPLOYED_URL = 'https://a2ajptxie4zk.space.minimax.io';

async function runTests() {
  console.log('Testing deployed AluQuote AI...\n');
  console.log(`URL: ${DEPLOYED_URL}\n`);
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to the deployed app
    await page.goto(DEPLOYED_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Test 1: Check page title
    const title = await page.title();
    console.log(`[TEST 1] Page title: "${title}"`);
    console.log(`  Result: ${title.includes('AluQuote') ? 'PASS' : 'FAIL'}\n`);
    
    // Test 2: Check header is visible
    const header = await page.locator('header').first();
    const headerVisible = await header.isVisible();
    console.log(`[TEST 2] Header visible: ${headerVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 3: Check logo text
    const logoText = await page.locator('text=AluQuote AI').first();
    const logoVisible = await logoText.isVisible();
    console.log(`[TEST 3] Logo text visible: ${logoVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 4: Check upload zone is present
    const uploadZone = await page.locator('text=Arraste ficheiros');
    const uploadVisible = await uploadZone.isVisible();
    console.log(`[TEST 4] Upload zone visible: ${uploadVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 5: Check step indicators
    const steps = await page.locator('text=Ficheiros').first();
    const stepsVisible = await steps.isVisible();
    console.log(`[TEST 5] Step indicators visible: ${stepsVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 6: Check footer
    const footer = await page.locator('text=Powered by Matrix Agent');
    const footerVisible = await footer.isVisible();
    console.log(`[TEST 6] Footer visible: ${footerVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 7: Check "Selecionar Ficheiros" button
    const selectBtn = await page.locator('text=Selecionar Ficheiros');
    const btnVisible = await selectBtn.isVisible();
    console.log(`[TEST 7] File select button: ${btnVisible ? 'PASS' : 'FAIL'}`);
    
    // Test 8: Screenshot
    await page.screenshot({ path: join(__dirname, 'deployed-screenshot.png'), fullPage: true });
    console.log(`\n[TEST 8] Screenshot saved: deployed-screenshot.png`);
    
    console.log('\n========================================');
    console.log('All tests completed!');
    console.log('========================================');
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: join(__dirname, 'error-screenshot.png'), fullPage: true });
  } finally {
    await browser.close();
  }
}

runTests();
