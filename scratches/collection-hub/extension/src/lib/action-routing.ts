export type ChromeActionRoutingApi = {
  action?: {
    onClicked?: {
      addListener(listener: () => void): void
    }
  }
  runtime?: {
    openOptionsPage(): void
  }
}

export function registerOptionsPageAction(
  chromeApi: ChromeActionRoutingApi | undefined = globalThis.chrome
): boolean {
  if (!chromeApi?.action?.onClicked || !chromeApi.runtime?.openOptionsPage) {
    return false
  }

  chromeApi.action.onClicked.addListener(() => {
    chromeApi.runtime?.openOptionsPage()
  })
  return true
}
