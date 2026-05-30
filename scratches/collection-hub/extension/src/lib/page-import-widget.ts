import {
  createDestinationCollections,
  itemStatusLabels,
  type DeleteItemsSummary,
  type ImportCollectionRequest,
  type ImportSummary,
  type ItemStatus
} from "@collection-hub/libs"

import type { CollectionExtractionDraft } from "./dom-adapter"
import {
  canExtractWithAdapters,
  extractWithAdapters
} from "./dom-adapter-registry"
import {
  buildDeleteItemsRequest,
  buildImportRequest,
  submitDeleteItemsRequestViaExtension,
  submitImportRequestInBatchesViaExtension,
  type ImportBatchProgress
} from "./import-client"
import { isUrlAllowed } from "./match-patterns"
import {
  extractCollectionFromPage,
  type CollectionScrollProgress
} from "./page-scroll-loader"
import { getExtensionSettings, type ExtensionSettings } from "./settings"
import { extractXhsBoardCardDraft } from "./xhs-board-dom-adapter"
import { renderXhsInlineImportButtons } from "./xhs-inline-import-buttons"

export const PAGE_IMPORT_WIDGET_ID = "collection-hub-page-widget"

export type PageImportTheme = {
  accent: string
  action: string
  actionHover: string
  errorForeground: string
  focus: string
  line: string
  lineStrong: string
  shadow: string
  shadowSoft: string
  soft: string
  softer: string
  source: "bilibili" | "xhs"
  successForeground: string
  warningForeground: string
}

type PageImportViewModelInput = {
  busy: boolean
  confirmation?: PageImportConfirmation | null
  deleteSummary: DeleteItemsSummary | null
  draft: CollectionExtractionDraft | null
  error: string | null
  importProgress?: ImportBatchProgress | null
  progress: CollectionScrollProgress | null
  selectedStatus: ItemStatus
  summary: ImportSummary | null
}

type PageImportConfirmation = {
  cancelLabel: string
  confirmLabel: string
  message: string
  title: string
}

export function createPageImportViewModel(input: PageImportViewModelInput) {
  const selectedStatusLabel = itemStatusLabels[input.selectedStatus]
  const destinationOptions = input.draft
    ? createDestinationCollections(input.draft.source).map((destination) => ({
        ...destination,
        label: itemStatusLabels[destination.status],
        selected: input.selectedStatus === destination.status
      }))
    : []

  return {
    batchSubmitButtonLabel: `批量导入到${selectedStatusLabel}`,
    canDelete: Boolean(
      input.draft &&
        input.draft.items.some((item) => Boolean(item.id)) &&
        !input.busy
    ),
    canSubmit: Boolean(
      input.draft && input.draft.items.length > 0 && !input.busy
    ),
    deleteButtonLabel: `从${itemStatusLabels[input.selectedStatus]}删除`,
    destinationOptions,
    confirmation: input.confirmation ?? null,
    itemCountLabel: input.progress
      ? input.progress.scrolls > 0
        ? `已发现 ${input.progress.itemCount} 个项目，扫描第 ${input.progress.scrolls} 段`
        : `已发现 ${input.progress.itemCount} 个项目`
      : input.importProgress
        ? `正在上传第 ${input.importProgress.batchIndex}/${input.importProgress.batchCount} 批，本批 ${input.importProgress.itemCount} 个项目`
        : input.draft
          ? `已读取 ${input.draft.items.length} 个项目`
          : "尚未读取项目",
    sourceLabel: input.progress
      ? "正在扫描页面"
      : input.importProgress
        ? "正在分批上传"
        : input.draft
          ? `来源 ${input.draft.source}`
          : "等待抽取",
    statusLabel: input.busy
      ? "处理中"
      : input.error
        ? "需要处理"
        : input.deleteSummary
          ? "删除完成"
          : input.summary
            ? "导入完成"
            : "准备就绪"
  }
}

export function createPageImportTheme(source: string | undefined): PageImportTheme {
  if (source === "bilibili") {
    return {
      accent: "#00aeec",
      action: "#00a1d6",
      actionHover: "#008ac5",
      errorForeground: "#d91635",
      focus: "rgba(0, 174, 236, 0.24)",
      line: "#bdeffc",
      lineStrong: "#84ddf7",
      shadow:
        "0 18px 48px rgba(0, 174, 236, 0.16), 0 8px 24px rgba(31, 31, 31, 0.08)",
      shadowSoft:
        "0 8px 20px rgba(0, 174, 236, 0.14), 0 2px 10px rgba(31, 31, 31, 0.06)",
      soft: "#eafaff",
      softer: "#f5fcff",
      source: "bilibili",
      successForeground: "#137c43",
      warningForeground: "#946200"
    }
  }

  return {
    accent: "#ff2442",
    action: "#e60033",
    actionHover: "#c8102e",
    errorForeground: "#d91635",
    focus: "rgba(255, 36, 66, 0.24)",
    line: "#f2d9de",
    lineStrong: "#ffc2cb",
    shadow:
      "0 18px 48px rgba(255, 36, 66, 0.16), 0 8px 24px rgba(31, 31, 31, 0.08)",
    shadowSoft:
      "0 8px 20px rgba(255, 36, 66, 0.12), 0 2px 10px rgba(31, 31, 31, 0.06)",
    soft: "#fff1f3",
    softer: "#fff7f8",
    source: "xhs",
    successForeground: "#137c43",
    warningForeground: "#946200"
  }
}

export function createPageImportThemeSource(document: {
  location?: { href?: string }
}): PageImportTheme["source"] {
  const href = document.location?.href
  if (!href) {
    return "xhs"
  }

  try {
    const url = new URL(href, "https://space.bilibili.com")
    if (
      url.hostname === "space.bilibili.com" &&
      /^\/\d+(?:\/favlist)?\/?$/.test(url.pathname) &&
      (url.pathname.includes("/favlist") || url.searchParams.has("fid"))
    ) {
      return "bilibili"
    }
  } catch {
    return "xhs"
  }

  return "xhs"
}

type PageImportWidgetDependencies = {
  canExtract?: (document: Document) => boolean
  deleteItems?: typeof submitDeleteItemsRequestViaExtension
  document?: Document
  extract?: (document: Document) => CollectionExtractionDraft
  extractPage?: (
    onProgress: (progress: CollectionScrollProgress) => void
  ) => Promise<CollectionExtractionDraft>
  getSettings?: () => Promise<ExtensionSettings>
  submit?: typeof submitImportRequestInBatchesViaExtension
  urlAllowed?: typeof isUrlAllowed
  window?: Window
}

export type PageImportWidgetMountResult =
  | "already_mounted"
  | "mounted"
  | "not_allowed"
  | "unsupported"

export async function mountPageImportWidget(
  dependencies: PageImportWidgetDependencies = {}
): Promise<PageImportWidgetMountResult> {
  const rootDocument = dependencies.document ?? document
  const currentWindow = dependencies.window ?? window

  if (rootDocument.getElementById(PAGE_IMPORT_WIDGET_ID)) {
    return "already_mounted"
  }

  const settings = await (dependencies.getSettings ?? getExtensionSettings)()
  const urlAllowed = dependencies.urlAllowed ?? isUrlAllowed
  if (!urlAllowed(currentWindow.location.href, settings.matchPatterns)) {
    return "not_allowed"
  }

  const canExtract = dependencies.canExtract ?? canExtractWithAdapters
  if (!canExtract(rootDocument)) {
    return "unsupported"
  }

  const host = rootDocument.createElement("div")
  host.id = PAGE_IMPORT_WIDGET_ID
  rootDocument.documentElement.append(host)

  const shadowRoot = host.attachShadow({ mode: "open" })
  const extract = dependencies.extract ?? extractWithAdapters
  const deleteItems =
    dependencies.deleteItems ?? submitDeleteItemsRequestViaExtension
  const extractPage =
    dependencies.extractPage ??
    ((onProgress) =>
      extractCollectionFromPage({
        document: rootDocument,
        extract: () => extract(rootDocument),
        onProgress,
        window: currentWindow
      }))
  const submitImport =
    dependencies.submit ?? submitImportRequestInBatchesViaExtension

  let busy = false
  let deleteSummary: DeleteItemsSummary | null = null
  let draft: CollectionExtractionDraft | null = null
  let error: string | null = null
  let importProgress: ImportBatchProgress | null = null
  let expanded = false
  let confirmation: PageImportConfirmation | null = null
  let resolveConfirmation: ((confirmed: boolean) => void) | null = null
  let progress: CollectionScrollProgress | null = null
  let selectedStatus: ItemStatus = "pending_download"
  let summary: ImportSummary | null = null
  const pageThemeSource = createPageImportThemeSource(rootDocument)
  let inlineImportRenderTimer: number | null = null
  const inlineImportObserver =
    typeof MutationObserver === "function"
      ? new MutationObserver(() => scheduleInlineImportButtons())
      : null
  const inlineImportObserverTarget =
    rootDocument.body ?? rootDocument.documentElement
  inlineImportObserver?.observe(inlineImportObserverTarget, {
    childList: true,
    subtree: true
  })

  function render() {
    const viewModel = createPageImportViewModel({
      busy,
      confirmation,
      deleteSummary,
      draft,
      error,
      importProgress,
      progress,
      selectedStatus,
      summary
    })
    const style = rootDocument.createElement("style")
    style.textContent = widgetCss
    const theme = createPageImportTheme(draft?.source ?? pageThemeSource)
    const container = rootDocument.createElement("section")
    container.className = `${expanded ? "xco-panel" : "xco-launcher"} xco-source-${theme.source}`
    container.setAttribute("data-source", theme.source)
    applyTheme(container, theme)

    if (!expanded) {
      const openButton = createButton(rootDocument, "收藏导入", "primary")
      openButton.addEventListener("click", () => {
        expanded = true
        render()
      })
      container.append(openButton)
      shadowRoot.replaceChildren(style, container)
      scheduleInlineImportButtons()
      return
    }

    const header = rootDocument.createElement("div")
    header.className = "xco-header"
    const title = rootDocument.createElement("div")
    title.className = "xco-title"
    title.textContent = "收藏导入"
    const status = rootDocument.createElement("span")
    status.className = "xco-status"
    status.textContent = viewModel.statusLabel
    const closeButton = createButton(rootDocument, "收起", "ghost")
    closeButton.addEventListener("click", () => {
      expanded = false
      render()
    })
    header.append(title, status, closeButton)

    const meta = rootDocument.createElement("div")
    meta.className = "xco-meta"
    meta.textContent = `${viewModel.sourceLabel} · ${viewModel.itemCountLabel}`

    const extractButton = createButton(
      rootDocument,
      busy ? "读取中" : draft ? "重新读取页面" : "读取当前页面",
      "primary"
    )
    extractButton.disabled = busy
    extractButton.addEventListener("click", () => void runExtract())

    const destinationGroup = rootDocument.createElement("div")
    destinationGroup.className = "xco-destinations"
    for (const option of viewModel.destinationOptions) {
      const optionButton = createButton(rootDocument, option.label, "choice")
      optionButton.dataset.selected = String(option.selected)
      optionButton.title = option.title
      optionButton.addEventListener("click", () => {
        selectedStatus = option.status
        render()
      })
      destinationGroup.append(optionButton)
    }

    const submitButton = createButton(
      rootDocument,
      viewModel.batchSubmitButtonLabel,
      "primary"
    )
    submitButton.disabled = !viewModel.canSubmit
    submitButton.addEventListener("click", () => void runSubmitBatch())

    const deleteButton = createButton(
      rootDocument,
      viewModel.deleteButtonLabel,
      "danger"
    )
    deleteButton.disabled = !viewModel.canDelete
    deleteButton.addEventListener("click", () => void runDelete())

    const actionGroup = rootDocument.createElement("div")
    actionGroup.className = "xco-actions"
    actionGroup.append(submitButton, deleteButton)

    container.append(header, meta, extractButton)
    if (viewModel.destinationOptions.length > 0) {
      container.append(destinationGroup)
    }

    if (viewModel.destinationOptions.length > 0) {
      container.append(actionGroup)
    }

    if (summary) {
      const success = rootDocument.createElement("div")
      success.className = "xco-success"
      success.textContent = `已导入 ${summary.createdItems} 个新项目，更新 ${summary.updatedItems} 个项目`
      container.append(success)
    }

    if (deleteSummary) {
      const success = rootDocument.createElement("div")
      success.className = "xco-success"
      success.textContent = `已删除 ${deleteSummary.deletedItems} 个项目，跳过 ${deleteSummary.skippedItems} 个项目`
      container.append(success)
    }

    if (error) {
      const errorBox = rootDocument.createElement("div")
      errorBox.className = "xco-error"
      errorBox.textContent = error
      container.append(errorBox)
    }

    if (viewModel.confirmation) {
      container.append(createConfirmationDialog(viewModel.confirmation))
    }

    shadowRoot.replaceChildren(style, container)
    scheduleInlineImportButtons()
  }

  function createConfirmationDialog(
    currentConfirmation: PageImportConfirmation
  ): HTMLElement {
    const overlay = rootDocument.createElement("div")
    overlay.className = "xco-confirm-overlay"
    overlay.addEventListener("click", () => settleConfirmation(false))

    const dialog = rootDocument.createElement("div")
    dialog.className = "xco-confirm-dialog"
    dialog.setAttribute("aria-modal", "true")
    dialog.setAttribute("role", "alertdialog")
    dialog.addEventListener("click", (event) => event.stopPropagation())

    const title = rootDocument.createElement("div")
    title.className = "xco-confirm-title"
    title.textContent = currentConfirmation.title

    const message = rootDocument.createElement("div")
    message.className = "xco-confirm-message"
    message.textContent = currentConfirmation.message

    const actions = rootDocument.createElement("div")
    actions.className = "xco-confirm-actions"

    const cancelButton = createButton(
      rootDocument,
      currentConfirmation.cancelLabel,
      "secondary"
    )
    cancelButton.addEventListener("click", () => settleConfirmation(false))

    const confirmButton = createButton(
      rootDocument,
      currentConfirmation.confirmLabel,
      "primary"
    )
    confirmButton.addEventListener("click", () => settleConfirmation(true))

    actions.append(cancelButton, confirmButton)
    dialog.append(title, message, actions)
    overlay.append(dialog)
    return overlay
  }

  function requestConfirmation(
    nextConfirmation: PageImportConfirmation
  ): Promise<boolean> {
    resolveConfirmation?.(false)
    expanded = true
    confirmation = nextConfirmation
    render()
    return new Promise((resolve) => {
      resolveConfirmation = resolve
    })
  }

  function settleConfirmation(confirmed: boolean) {
    const resolver = resolveConfirmation
    confirmation = null
    resolveConfirmation = null
    render()
    resolver?.(confirmed)
  }

  function scheduleInlineImportButtons() {
    if (inlineImportRenderTimer !== null) {
      currentWindow.clearTimeout(inlineImportRenderTimer)
    }
    inlineImportRenderTimer = currentWindow.setTimeout(() => {
      inlineImportRenderTimer = null
      renderInlineImportButtons()
    }, 250)
  }

  function renderInlineImportButtons() {
    renderXhsInlineImportButtons({
      busy,
      document: rootDocument,
      onImport: (card, status) => void runSubmitXhsCard(card, status),
      selectedStatus
    })
  }

  async function runExtract() {
    busy = true
    deleteSummary = null
    error = null
    importProgress = null
    progress = null
    summary = null
    render()
    try {
      draft = await extractPage((nextProgress) => {
        progress = nextProgress
        render()
      })
    } catch (reason) {
      draft = null
      error = reason instanceof Error ? reason.message : "当前页面抽取失败"
    } finally {
      busy = false
      progress = null
      render()
    }
  }

  async function runSubmit(requestOverride?: ImportCollectionRequest | null) {
    busy = true
    deleteSummary = null
    error = null
    importProgress = null
    summary = null
    render()
    try {
      const request =
        requestOverride ??
        buildImportRequest(requireDraft(draft), selectedStatus)
      summary = await submitImport(settings.apiBaseUrl, request, {
        onProgress: (nextProgress) => {
          importProgress = nextProgress
          render()
        }
      })
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "导入失败"
    } finally {
      busy = false
      importProgress = null
      render()
    }
  }

  async function runSubmitBatch() {
    const currentDraft = requireDraft(draft)
    const statusLabel = itemStatusLabels[selectedStatus]
    const confirmed = await requestConfirmation({
      cancelLabel: "取消",
      confirmLabel: "确认导入",
      message: `确认批量导入当前读取到的 ${currentDraft.items.length} 个项目到${statusLabel}？`,
      title: "确认导入"
    })
    if (!confirmed) {
      return
    }

    await runSubmit(buildImportRequest(currentDraft, selectedStatus))
  }

  async function runSubmitXhsCard(card: Element, status: ItemStatus) {
    const cardDraft = extractXhsBoardCardDraft(rootDocument, card)
    if (!cardDraft) {
      expanded = true
      error = "当前小红书卡片无法识别"
      render()
      return
    }

    const itemTitle = cardDraft.items[0]?.title ?? "这条笔记"
    const statusLabel = itemStatusLabels[status]
    const confirmed = await requestConfirmation({
      cancelLabel: "取消",
      confirmLabel: "确认导入",
      message: `确认导入「${itemTitle}」到${statusLabel}？`,
      title: "确认导入"
    })
    if (!confirmed) {
      return
    }

    await runSubmit(buildImportRequest(cardDraft, status))
  }

  async function runDelete() {
    const request = buildDeleteItemsRequest(requireDraft(draft), selectedStatus)
    if (request.itemIds.length === 0) {
      error = "当前页面没有可删除的项目 ID"
      render()
      return
    }

    const statusLabel = itemStatusLabels[selectedStatus]
    const confirmed = await requestConfirmation({
      cancelLabel: "取消",
      confirmLabel: "确认删除",
      message: `确认从${statusLabel}删除当前读取到的 ${request.itemIds.length} 个项目？状态不匹配或未导入的项目会跳过。`,
      title: "确认删除"
    })
    if (!confirmed) {
      return
    }

    busy = true
    deleteSummary = null
    error = null
    importProgress = null
    summary = null
    render()
    try {
      deleteSummary = await deleteItems(settings.apiBaseUrl, request)
    } catch (reason) {
      error = reason instanceof Error ? reason.message : "删除失败"
    } finally {
      busy = false
      render()
    }
  }

  render()
  return "mounted"
}

function requireDraft(
  draft: CollectionExtractionDraft | null
): CollectionExtractionDraft {
  if (!draft) {
    throw new Error("请先读取当前页面")
  }
  return draft
}

function createButton(
  document: Document,
  label: string,
  tone: "choice" | "danger" | "ghost" | "primary" | "secondary"
): HTMLButtonElement {
  const button = document.createElement("button")
  button.className = `xco-button xco-button-${tone}`
  button.textContent = label
  button.type = "button"
  return button
}

function applyTheme(element: HTMLElement, theme: PageImportTheme) {
  element.style.setProperty("--xco-red", theme.accent)
  element.style.setProperty("--xco-red-action", theme.action)
  element.style.setProperty("--xco-red-dark", theme.action)
  element.style.setProperty("--xco-red-deeper", theme.actionHover)
  element.style.setProperty("--xco-red-soft", theme.soft)
  element.style.setProperty("--xco-red-softer", theme.softer)
  element.style.setProperty("--xco-line", theme.line)
  element.style.setProperty("--xco-line-strong", theme.lineStrong)
  element.style.setProperty("--xco-success-fg", theme.successForeground)
  element.style.setProperty("--xco-danger-fg", theme.errorForeground)
  element.style.setProperty("--xco-shadow", theme.shadow)
  element.style.setProperty("--xco-shadow-soft", theme.shadowSoft)
  element.style.setProperty("--xco-focus", theme.focus)
}

const widgetCss = `
  :host {
    all: initial;
    color-scheme: light;
    --xco-red: #ff2442;
    --xco-red-action: #e60033;
    --xco-red-dark: #d91635;
    --xco-red-deeper: #c8102e;
    --xco-red-soft: #fff1f3;
    --xco-red-softer: #fff7f8;
    --xco-ink: #1f1f1f;
    --xco-muted: #666666;
    --xco-subtle: #8c8c8c;
    --xco-line: #f2d9de;
    --xco-line-strong: #ffc2cb;
    --xco-surface: #ffffff;
    --xco-success-bg: #f0fbf5;
    --xco-success-fg: #137c43;
    --xco-danger-bg: #fff3f4;
    --xco-danger-fg: #d91635;
    --xco-shadow: 0 18px 48px rgba(255, 36, 66, 0.16), 0 8px 24px rgba(31, 31, 31, 0.08);
    --xco-shadow-soft: 0 8px 20px rgba(255, 36, 66, 0.12), 0 2px 10px rgba(31, 31, 31, 0.06);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .xco-launcher,
  .xco-panel {
    bottom: 24px;
    position: fixed;
    right: 24px;
    z-index: 2147483647;
  }

  .xco-panel {
    background: linear-gradient(180deg, var(--xco-red-softer) 0%, var(--xco-surface) 38%);
    border: 1px solid var(--xco-line);
    border-radius: 8px;
    box-shadow: var(--xco-shadow);
    box-sizing: border-box;
    color: var(--xco-ink);
    display: grid;
    gap: 12px;
    max-height: min(760px, calc(100vh - 48px));
    overflow: hidden;
    padding: 14px;
    width: min(384px, calc(100vw - 32px));
  }

  .xco-header {
    align-items: center;
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr auto auto;
  }

  .xco-title {
    align-items: center;
    display: inline-flex;
    font-size: 16px;
    font-weight: 800;
    gap: 8px;
    letter-spacing: 0;
  }

  .xco-title::before {
    background: var(--xco-red);
    border-radius: 999px;
    box-shadow: 0 0 0 4px rgba(255, 36, 66, 0.12);
    content: "";
    height: 9px;
    width: 9px;
  }

  .xco-status {
    background: rgba(255, 36, 66, 0.1);
    border: 1px solid rgba(255, 36, 66, 0.14);
    border-radius: 999px;
    color: var(--xco-red-dark);
    font-size: 12px;
    font-weight: 700;
    line-height: 1;
    padding: 7px 9px;
  }

  .xco-meta {
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(255, 194, 203, 0.7);
    border-radius: 8px;
    color: var(--xco-muted);
    font-size: 12px;
    line-height: 1.5;
    padding: 8px 10px;
  }

  .xco-destinations {
    background: rgba(255, 255, 255, 0.78);
    border: 1px solid rgba(255, 194, 203, 0.72);
    border-radius: 8px;
    display: grid;
    gap: 6px;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    padding: 4px;
  }

  .xco-actions {
    display: grid;
    gap: 8px;
    grid-template-columns: 1fr;
    padding-top: 2px;
  }

  .xco-actions .xco-button {
    min-height: 44px;
    width: 100%;
  }

  .xco-actions .xco-button-primary {
    box-shadow: var(--xco-shadow-soft);
  }

  .xco-actions .xco-button-danger {
    background: var(--xco-danger-bg);
    border: 1px solid var(--xco-line-strong);
    color: var(--xco-danger-fg);
  }

  .xco-confirm-overlay {
    align-items: end;
    background: rgba(31, 31, 31, 0.2);
    backdrop-filter: blur(8px);
    display: grid;
    inset: 0;
    padding: 12px;
    position: absolute;
    z-index: 2;
  }

  .xco-confirm-dialog {
    background: var(--xco-surface);
    border: 1px solid var(--xco-line);
    border-radius: 8px;
    box-shadow: var(--xco-shadow);
    box-sizing: border-box;
    display: grid;
    gap: 10px;
    padding: 14px;
    width: 100%;
  }

  .xco-confirm-title {
    color: var(--xco-ink);
    font-size: 15px;
    font-weight: 800;
  }

  .xco-confirm-message {
    color: var(--xco-muted);
    font-size: 12px;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }

  .xco-confirm-actions {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .xco-confirm-actions .xco-button {
    width: 100%;
  }

  .xco-button {
    border: 1px solid transparent;
    border-radius: 999px;
    box-sizing: border-box;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 750;
    min-height: 40px;
    padding: 9px 12px;
    transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, color 160ms ease, opacity 160ms ease, transform 160ms ease;
    white-space: nowrap;
  }

  .xco-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .xco-button:active:not(:disabled) {
    transform: translateY(0);
  }

  .xco-button:focus-visible {
    outline: 3px solid var(--xco-focus);
    outline-offset: 2px;
  }

  .xco-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .xco-button-primary {
    background: var(--xco-red-action);
    color: #ffffff;
  }

  .xco-button-primary:hover:not(:disabled) {
    background: var(--xco-red-deeper);
    box-shadow: var(--xco-shadow-soft);
  }

  .xco-button-danger {
    background: var(--xco-red-deeper);
    color: #ffffff;
  }

  .xco-button-secondary,
  .xco-button-choice {
    background: #ffffff;
    border-color: var(--xco-line);
    color: var(--xco-ink);
  }

  .xco-button-secondary:hover:not(:disabled),
  .xco-button-choice:hover:not(:disabled) {
    background: var(--xco-red-soft);
    border-color: var(--xco-line-strong);
    color: var(--xco-red-dark);
  }

  .xco-button-choice[data-selected="true"] {
    background: var(--xco-red-action);
    border-color: var(--xco-red-action);
    color: #ffffff;
    box-shadow: 0 6px 14px rgba(255, 36, 66, 0.18);
  }

  .xco-button-ghost {
    background: transparent;
    color: var(--xco-subtle);
    min-height: 36px;
    padding: 6px 8px;
  }

  .xco-button-ghost:hover:not(:disabled) {
    background: rgba(255, 36, 66, 0.08);
    color: var(--xco-red-dark);
    transform: none;
  }

  .xco-success,
  .xco-error {
    border-radius: 8px;
    font-size: 12px;
    font-weight: 650;
    line-height: 1.5;
    padding: 9px 10px;
  }

  .xco-success {
    background: var(--xco-success-bg);
    border: 1px solid #c9f2d8;
    color: var(--xco-success-fg);
  }

  .xco-error {
    background: var(--xco-danger-bg);
    border: 1px solid var(--xco-line-strong);
    color: var(--xco-danger-fg);
  }

  @media (prefers-reduced-motion: reduce) {
    .xco-button {
      transition: none;
    }

    .xco-button:hover:not(:disabled) {
      transform: none;
    }
  }
`
