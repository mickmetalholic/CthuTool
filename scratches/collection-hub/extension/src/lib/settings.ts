export type ExtensionSettings = {
  apiBaseUrl: string
  matchPatterns: string[]
}

export const defaultExtensionSettings: ExtensionSettings = {
  apiBaseUrl: "http://localhost:3001",
  matchPatterns: ["<all_urls>"]
}

export function normalizeSettings(input: Partial<ExtensionSettings>): ExtensionSettings {
  const apiBaseUrl = input.apiBaseUrl?.trim() || defaultExtensionSettings.apiBaseUrl
  const matchPatterns =
    input.matchPatterns
      ?.map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0) ??
    defaultExtensionSettings.matchPatterns

  return {
    apiBaseUrl: apiBaseUrl.replace(/\/+$/, ""),
    matchPatterns: matchPatterns.length > 0 ? matchPatterns : defaultExtensionSettings.matchPatterns
  }
}

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  if (!globalThis.chrome?.storage?.sync) {
    return defaultExtensionSettings
  }

  const stored = await chrome.storage.sync.get(["apiBaseUrl", "matchPatterns"])
  return normalizeSettings(stored)
}

export async function saveExtensionSettings(settings: ExtensionSettings): Promise<void> {
  if (!globalThis.chrome?.storage?.sync) {
    return
  }

  await chrome.storage.sync.set(normalizeSettings(settings))
}
