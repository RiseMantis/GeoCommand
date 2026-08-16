const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating...');
  await page.goto('http://localhost:3000');
  
  // wait for react to render
  await page.waitForSelector('button[title="Platform Settings & Ingestion Diagnostics"]');
  
  console.log('Clicking settings button...');
  await page.click('button[title="Platform Settings & Ingestion Diagnostics"]');
  
  console.log('Waiting for modal to appear...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('Done.');
  await browser.close();
})();
