import type { PlasmoCSConfig } from "plasmo"
import { createRoot } from "react-dom/client";
import { renderLogseq } from './douban/apps/logseq';

export const config: PlasmoCSConfig = {
  matches: ["https://book.douban.com/*"]
}

window.addEventListener("load", () => {
  const rootEle = document.createElement('div');
  rootEle.setAttribute('id', 'cthutool');
  document.body.appendChild(rootEle);
  const root = createRoot(rootEle);

  renderLogseq(root);
});
