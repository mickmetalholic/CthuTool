import { getBrowser } from './getBrowser';

export async function cleanUp() {
  const browser = await getBrowser();
  browser.close();
}
