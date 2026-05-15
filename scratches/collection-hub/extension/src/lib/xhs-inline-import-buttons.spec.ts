import { describe, expect, it } from "vitest"

import {
  renderXhsInlineImportButtons,
  XHS_INLINE_IMPORT_BUTTON_SELECTOR,
  XHS_INLINE_IMPORT_MENU_SELECTOR,
  XHS_INLINE_IMPORT_OPTION_SELECTOR
} from "./xhs-inline-import-buttons"

class FakeClassList {
  private readonly values = new Set<string>()

  add(value: string) {
    this.values.add(value)
  }

  has(value: string) {
    return this.values.has(value)
  }
}

class FakeElement {
  public className = ""
  public readonly classList = new FakeClassList()
  public readonly dataset: Record<string, string> = {}
  public disabled = false
  public id = ""
  public parentElement: FakeElement | null = null
  public textContent: string | null = null
  public type = ""

  private readonly attributes = new Map<string, string>()
  private readonly children: FakeElement[] = []
  private readonly listeners = new Map<string, (event: FakeEvent) => void>()

  constructor(private readonly tagName = "div") {}

  append(...children: FakeElement[]) {
    for (const child of children) {
      child.parentElement = this
    }
    this.children.push(...children)
  }

  addEventListener(type: string, listener: (event: FakeEvent) => void) {
    this.listeners.set(type, listener)
  }

  click() {
    const event = new FakeEvent()
    this.listeners.get("click")?.(event)
    return event
  }

  getAttribute(name: string) {
    return this.attributes.get(name) ?? null
  }

  closest(selector: string) {
    let current: FakeElement | null = this
    while (current) {
      if (selector === "a" && current.tagName.toLowerCase() === "a") {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  querySelector(selector: string) {
    if (selector === XHS_INLINE_IMPORT_BUTTON_SELECTOR) {
      return this.findByAttribute("data-xco-inline-import-button")
    }
    if (selector === XHS_INLINE_IMPORT_MENU_SELECTOR) {
      return this.findByAttribute("data-xco-inline-import-menu")
    }
    if (selector === XHS_INLINE_IMPORT_OPTION_SELECTOR) {
      return this.findByAttribute("data-xco-inline-import-option")
    }
    if (selector === 'img[src*="sns-webpic"]') {
      return this.findByTagAndAttributePart("img", "src", "sns-webpic")
    }
    return null
  }

  querySelectorAll(selector: string) {
    if (selector === XHS_INLINE_IMPORT_OPTION_SELECTOR) {
      return this.findAllByAttribute("data-xco-inline-import-option")
    }
    return []
  }

  setAttribute(name: string, value: string) {
    this.attributes.set(name, value)
  }

  private findByAttribute(name: string): FakeElement | null {
    for (const child of this.children) {
      if (child.getAttribute(name)) {
        return child
      }
      const descendant = child.findByAttribute(name)
      if (descendant) {
        return descendant
      }
    }
    return null
  }

  private findAllByAttribute(name: string): FakeElement[] {
    return this.children.flatMap((child) => [
      ...(child.getAttribute(name) ? [child] : []),
      ...child.findAllByAttribute(name)
    ])
  }

  private findByTagAndAttributePart(
    tagName: string,
    attributeName: string,
    valuePart: string
  ): FakeElement | null {
    for (const child of this.children) {
      if (
        child.tagName.toLowerCase() === tagName &&
        child.getAttribute(attributeName)?.includes(valuePart)
      ) {
        return child
      }
      const descendant = child.findByTagAndAttributePart(
        tagName,
        attributeName,
        valuePart
      )
      if (descendant) {
        return descendant
      }
    }
    return null
  }
}

class FakeEvent {
  public defaultPrevented = false
  public propagationStopped = false

  preventDefault() {
    this.defaultPrevented = true
  }

  stopPropagation() {
    this.propagationStopped = true
  }
}

class FakeDocument {
  public readonly documentElement = new FakeElement()
  public readonly head = new FakeElement()

  constructor(private readonly cards: FakeElement[]) {}

  createElement(tagName = "div") {
    return new FakeElement(tagName)
  }

  getElementById(id: string) {
    return this.head.querySelector(`#${id}`) ?? null
  }

  querySelectorAll(selector: string) {
    return selector === ".note-item" ? this.cards : []
  }
}

describe("xhs inline import buttons", () => {
  it("renders a hover menu with one option for each import status", () => {
    const cards = [new FakeElement(), new FakeElement()]
    const document = new FakeDocument(cards)
    const imports: Array<{ card: FakeElement; status: string }> = []

    const count = renderXhsInlineImportButtons({
      busy: false,
      document: document as unknown as Document,
      onImport: (card, status) =>
        imports.push({ card: card as unknown as FakeElement, status }),
      selectedStatus: "downloaded"
    })

    const firstButton = cards[0]?.querySelector(
      XHS_INLINE_IMPORT_BUTTON_SELECTOR
    )
    expect(count).toBe(2)
    expect(cards[0]?.classList.has("xco-inline-import-card")).toBe(true)
    expect(firstButton?.textContent).toBe("导入")
    expect(firstButton?.disabled).toBe(false)

    const options = cards[0]?.querySelectorAll(
      XHS_INLINE_IMPORT_OPTION_SELECTOR
    )
    expect(options?.map((option) => option.textContent)).toEqual([
      "待下载",
      "已下载",
      "不下载"
    ])

    const clickEvent = options?.[1]?.click()
    expect(clickEvent?.defaultPrevented).toBe(true)
    expect(clickEvent?.propagationStopped).toBe(true)
    expect(imports).toEqual([{ card: cards[0], status: "downloaded" }])
  })

  it("updates existing card buttons without duplicating them", () => {
    const card = new FakeElement()
    const document = new FakeDocument([card])

    renderXhsInlineImportButtons({
      busy: false,
      document: document as unknown as Document,
      onImport: () => undefined,
      selectedStatus: "pending_download"
    })
    const firstButton = card.querySelector(XHS_INLINE_IMPORT_BUTTON_SELECTOR)

    renderXhsInlineImportButtons({
      busy: true,
      document: document as unknown as Document,
      onImport: () => undefined,
      selectedStatus: "not_downloaded"
    })

    const secondButton = card.querySelector(XHS_INLINE_IMPORT_BUTTON_SELECTOR)
    expect(secondButton).toBe(firstButton)
    expect(secondButton?.textContent).toBe("导入")
    expect(secondButton?.disabled).toBe(true)
    expect(
      card
        .querySelectorAll(XHS_INLINE_IMPORT_OPTION_SELECTOR)
        .map((option) => option.disabled)
    ).toEqual([true, true, true])
  })

  it("anchors the hover menu to the cover image link when present", () => {
    const card = new FakeElement()
    const coverLink = new FakeElement("a")
    const coverImage = new FakeElement("img")
    coverImage.setAttribute("src", "https://ci.xiaohongshu.com/sns-webpic")
    coverLink.append(coverImage)
    card.append(coverLink)
    const document = new FakeDocument([card])

    renderXhsInlineImportButtons({
      busy: false,
      document: document as unknown as Document,
      onImport: () => undefined,
      selectedStatus: "pending_download"
    })

    expect(coverLink.querySelector(XHS_INLINE_IMPORT_MENU_SELECTOR)).not.toBe(
      null
    )
  })
})
