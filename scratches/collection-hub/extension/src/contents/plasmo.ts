import type { PlasmoCSConfig } from "plasmo"

import { extractWithAdapters } from "../lib/dom-adapter-registry"
import { isUrlAllowed } from "../lib/match-patterns"
import type {
  ExtractCollectionMessage,
  ExtractCollectionResponse
} from "../lib/messages"
import { mountPageImportWidget } from "../lib/page-import-widget"
import { extractCollectionFromPage } from "../lib/page-scroll-loader"
import { getExtensionSettings } from "../lib/settings"

export const config: PlasmoCSConfig = {
  exclude_matches: [
    "http://localhost/*",
    "https://localhost/*",
    "http://127.0.0.1/*",
    "https://127.0.0.1/*",
    "http://[::1]/*",
    "https://[::1]/*"
  ],
  matches: ["https://*.xiaohongshu.com/*", "https://space.bilibili.com/*"]
}

chrome.runtime.onMessage.addListener(
  (
    message: ExtractCollectionMessage,
    _sender,
    sendResponse: (response: ExtractCollectionResponse) => void
  ) => {
    if (message.type !== "xhs:extract-collection") {
      return false
    }

    void extractCurrentPage().then(sendResponse)
    return true
  }
)

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    () => void mountPageImportWidget(),
    {
      once: true
    }
  )
} else {
  void mountPageImportWidget()
}

async function extractCurrentPage(): Promise<ExtractCollectionResponse> {
  const settings = await getExtensionSettings()
  if (!isUrlAllowed(window.location.href, settings.matchPatterns)) {
    return {
      ok: false,
      error: "当前页面未匹配插件设置"
    }
  }
  try {
    return {
      ok: true,
      draft: await extractCollectionFromPage({
        extract: () => extractWithAdapters(document)
      })
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "当前页面抽取失败"
    }
  }
}
