import { describe, expect, it, vi } from "vitest"

describe("content script config", () => {
  it("excludes local development pages from content-script injection", async () => {
    vi.resetModules()
    vi.stubGlobal("chrome", {
      runtime: {
        onMessage: {
          addListener: vi.fn()
        }
      }
    })
    vi.stubGlobal("document", {
      addEventListener: vi.fn(),
      readyState: "loading"
    })

    const { config } = await import("./plasmo")

    expect(config.matches).toEqual([
      "https://*.xiaohongshu.com/*",
      "https://space.bilibili.com/*"
    ])
    expect(config.exclude_matches).toEqual(
      expect.arrayContaining([
        "http://localhost/*",
        "http://127.0.0.1/*",
        "http://[::1]/*"
      ])
    )

    vi.unstubAllGlobals()
  })
})
