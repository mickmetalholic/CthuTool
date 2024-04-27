import puppeteer, { Browser } from 'puppeteer';

let browser: Browser;

export async function getBrowser() {
  browser = browser || await puppeteer.launch({
    headless: process.env['DEBUG'] ? false : true,
  });
  return browser;
}
