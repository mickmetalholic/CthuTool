import { describe, expect, it } from "vitest"

import { registerOptionsPageAction } from "./action-routing"

describe("extension action routing", () => {
  it("opens the options page when the toolbar icon is clicked", () => {
    let listener: (() => void) | undefined
    let opened = 0

    const chromeApi = {
      action: {
        onClicked: {
          addListener(nextListener: () => void) {
            listener = nextListener
          }
        }
      },
      runtime: {
        openOptionsPage() {
          opened += 1
        }
      }
    }

    expect(registerOptionsPageAction(chromeApi)).toBe(true)
    listener?.()

    expect(opened).toBe(1)
  })
})
