import puppeteer from 'puppeteer-core';

async function testCookies() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.type('input[type="email"]', 'testowner@randevo.pro');
  await page.type('input[placeholder="••••••••"]', 'TestPass123!');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 2500));
  
  const cookies = await page.cookies();
  console.log('Cookies after login:', cookies.map(c => ({ name: c.name, size: c.value.length, domain: c.domain, path: c.path })));
  console.log('Current URL:', page.url());
  
  await page.reload({ waitUntil: 'networkidle2' });
  console.log('URL after reload:', page.url());
  
  await browser.close();
}

testCookies().catch(console.error);
