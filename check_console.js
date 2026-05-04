const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));

  console.log("Navigating to localhost:3000...");
  await page.goto('http://localhost:3000');
  
  console.log("Waiting 3 seconds for physics to initialize...");
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
  console.log("Done.");
})();
