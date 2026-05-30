import {
  itemStatuses,
  itemStatusLabels,
  type ItemStatus
} from "@collection-hub/libs"

import { XHS_CARD_SELECTOR } from "./xhs-board-dom-adapter"

export const XHS_INLINE_IMPORT_BUTTON_SELECTOR =
  "[data-xco-inline-import-button]"
export const XHS_INLINE_IMPORT_MENU_SELECTOR = "[data-xco-inline-import-menu]"
export const XHS_INLINE_IMPORT_OPTION_SELECTOR =
  "[data-xco-inline-import-option]"

const XHS_INLINE_IMPORT_STYLE_ID = "xco-inline-import-button-style"

type RenderXhsInlineImportButtonsOptions = {
  busy: boolean
  document: Document
  onImport: (card: Element, status: ItemStatus) => void
  selectedStatus: ItemStatus
}

export function renderXhsInlineImportButtons({
  busy,
  document,
  onImport,
  selectedStatus
}: RenderXhsInlineImportButtonsOptions): number {
  ensureInlineImportStyle(document)
  const cards = Array.from(document.querySelectorAll(XHS_CARD_SELECTOR))

  for (const card of cards) {
    card.classList.add("xco-inline-import-card")
    const importAnchor = findInlineImportAnchor(card)
    importAnchor.classList.add("xco-inline-import-anchor")
    ensureAnchorPositioning(importAnchor, document)

    const menu =
      card.querySelector<HTMLElement>(XHS_INLINE_IMPORT_MENU_SELECTOR) ??
      createInlineImportMenu(document, card, onImport)
    if (menu.parentElement !== importAnchor) {
      importAnchor.append(menu)
    }
    const trigger = menu.querySelector<HTMLButtonElement>(
      XHS_INLINE_IMPORT_BUTTON_SELECTOR
    )
    if (trigger) {
      trigger.disabled = busy
    }

    const optionButtons = Array.from(
      menu.querySelectorAll<HTMLButtonElement>(
        XHS_INLINE_IMPORT_OPTION_SELECTOR
      )
    )
    for (const optionButton of optionButtons) {
      optionButton.disabled = busy
      optionButton.dataset.selected = String(
        optionButton.dataset.status === selectedStatus
      )
    }
  }

  return cards.length
}

function createInlineImportMenu(
  document: Document,
  card: Element,
  onImport: (card: Element, status: ItemStatus) => void
): HTMLElement {
  const menu = document.createElement("div")
  menu.className = "xco-inline-import-menu"
  menu.setAttribute("data-xco-inline-import-menu", "true")

  const options = document.createElement("div")
  options.className = "xco-inline-import-options"

  for (const status of itemStatuses) {
    const option = document.createElement("button")
    option.className = "xco-inline-import-option"
    option.textContent = itemStatusLabels[status]
    option.type = "button"
    option.dataset.status = status
    option.setAttribute("data-xco-inline-import-option", status)
    option.addEventListener("click", (event) => {
      event.preventDefault()
      event.stopPropagation()
      onImport(card, status)
    })
    options.append(option)
  }

  const trigger = document.createElement("button")
  trigger.className = "xco-inline-import-button"
  trigger.textContent = "导入"
  trigger.type = "button"
  trigger.setAttribute("aria-haspopup", "menu")
  trigger.setAttribute("data-xco-inline-import-button", "true")

  menu.append(options, trigger)
  card.append(menu)
  return menu
}

function findInlineImportAnchor(card: Element): Element {
  const coverImage = card.querySelector('img[src*="sns-webpic"]')
  return coverImage?.closest("a") ?? coverImage?.parentElement ?? card
}

function ensureAnchorPositioning(anchor: Element, document: Document): void {
  if (typeof HTMLElement === "undefined" || !(anchor instanceof HTMLElement)) {
    return
  }

  const position = document.defaultView?.getComputedStyle(anchor).position
  if (!position || position === "static") {
    anchor.style.position = "relative"
  }
}

function ensureInlineImportStyle(document: Document): void {
  if (document.getElementById(XHS_INLINE_IMPORT_STYLE_ID)) {
    return
  }

  const style = document.createElement("style")
  style.id = XHS_INLINE_IMPORT_STYLE_ID
  style.textContent = `
    .xco-inline-import-menu {
      align-items: flex-end;
      bottom: 6px;
      display: grid;
      gap: 4px;
      justify-items: flex-end;
      position: absolute;
      right: 6px;
      z-index: 30;
    }

    .xco-inline-import-options {
      display: grid;
      gap: 4px;
      opacity: 0;
      pointer-events: none;
      transform: translateY(5px) scale(0.98);
      transform-origin: right bottom;
      transition: opacity 180ms ease, transform 180ms ease;
    }

    .xco-inline-import-menu:hover .xco-inline-import-options,
    .xco-inline-import-menu:focus-within .xco-inline-import-options {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0) scale(1);
    }

    .xco-inline-import-button,
    .xco-inline-import-option {
      align-items: center;
      background: #e60033;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      box-shadow: 0 10px 24px rgba(255, 36, 66, 0.24), 0 2px 10px rgba(31, 31, 31, 0.12);
      box-sizing: border-box;
      color: #ffffff;
      cursor: pointer;
      display: inline-flex;
      font: 700 11px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      justify-content: center;
      min-height: 28px;
      min-width: 54px;
      padding: 5px 9px;
      transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, color 160ms ease, opacity 160ms ease, transform 160ms ease;
      white-space: nowrap;
    }

    .xco-inline-import-option {
      min-width: 62px;
    }

    .xco-inline-import-option {
      background: rgba(255, 255, 255, 0.98);
      border-color: rgba(255, 194, 203, 0.95);
      box-shadow: 0 8px 18px rgba(255, 36, 66, 0.12), 0 2px 8px rgba(31, 31, 31, 0.08);
      color: #1f1f1f;
    }

    .xco-inline-import-button:hover,
    .xco-inline-import-option:hover {
      background: #c8102e;
      border-color: #c8102e;
      box-shadow: 0 12px 26px rgba(255, 36, 66, 0.28), 0 4px 12px rgba(31, 31, 31, 0.12);
      color: #ffffff;
      transform: translateY(-1px);
    }

    .xco-inline-import-button:active,
    .xco-inline-import-option:active {
      transform: translateY(0);
    }

    .xco-inline-import-button:focus-visible,
    .xco-inline-import-option:focus-visible {
      outline: 3px solid rgba(255, 36, 66, 0.28);
      outline-offset: 2px;
    }

    .xco-inline-import-button:disabled,
    .xco-inline-import-option:disabled {
      cursor: wait;
      opacity: 0.54;
      transform: none;
    }

    @media (prefers-reduced-motion: reduce) {
      .xco-inline-import-options,
      .xco-inline-import-button,
      .xco-inline-import-option {
        transition: none;
      }

      .xco-inline-import-button:hover,
      .xco-inline-import-option:hover {
        transform: none;
      }
    }
  `
  ;(document.head ?? document.documentElement).append(style)
}
