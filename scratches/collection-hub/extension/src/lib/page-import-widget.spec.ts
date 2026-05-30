import { describe, expect, it } from "vitest"

import {
  createPageImportThemeSource,
  createPageImportTheme,
  createPageImportViewModel
} from "./page-import-widget"

describe("page import widget view model", () => {
  it("shows destination collections for the extracted source", () => {
    const viewModel = createPageImportViewModel({
      busy: false,
      draft: {
        source: "xhs",
        collection: {
          sourceUrl:
            "https://www.xiaohongshu.com/board/66e96792000000001703f977",
          title: "XHS board"
        },
        items: [
          {
            id: "xhs:note:1",
            title: "First note",
            noteUrl: "https://www.xiaohongshu.com/explore/1"
          },
          {
            id: "xhs:note:2",
            title: "Second note",
            noteUrl: "https://www.xiaohongshu.com/explore/2"
          }
        ]
      },
      error: null,
      deleteSummary: null,
      progress: null,
      selectedStatus: "pending_download",
      summary: null
    })

    expect(viewModel.itemCountLabel).toBe("已读取 2 个项目")
    expect(viewModel.destinationOptions).toEqual([
      {
        id: "xhs:pending_download",
        label: "待下载",
        selected: true,
        source: "xhs",
        status: "pending_download",
        title: "xhs / 待下载"
      },
      {
        id: "xhs:downloaded",
        label: "已下载",
        selected: false,
        source: "xhs",
        status: "downloaded",
        title: "xhs / 已下载"
      },
      {
        id: "xhs:not_downloaded",
        label: "不下载",
        selected: false,
        source: "xhs",
        status: "not_downloaded",
        title: "xhs / 不下载"
      }
    ])
    expect(viewModel.canSubmit).toBe(true)
    expect(viewModel.canDelete).toBe(true)
    expect(viewModel.batchSubmitButtonLabel).toBe("批量导入到待下载")
    expect(viewModel.deleteButtonLabel).toBe("从待下载删除")
  })

  it("shows scanning progress while extraction is busy", () => {
    const viewModel = createPageImportViewModel({
      busy: true,
      draft: null,
      deleteSummary: null,
      error: null,
      progress: {
        itemCount: 128,
        scrolls: 32
      },
      selectedStatus: "pending_download",
      summary: null
    })

    expect(viewModel.sourceLabel).toBe("正在扫描页面")
    expect(viewModel.itemCountLabel).toBe("已发现 128 个项目，扫描第 32 段")
    expect(viewModel.statusLabel).toBe("处理中")
  })

  it("shows upload batch progress while importing", () => {
    const viewModel = createPageImportViewModel({
      busy: true,
      draft: {
        source: "xhs",
        collection: {
          sourceUrl:
            "https://www.xiaohongshu.com/board/66e96792000000001703f977",
          title: "XHS board"
        },
        items: []
      },
      deleteSummary: null,
      error: null,
      importProgress: {
        batchCount: 4,
        batchIndex: 2,
        itemCount: 50,
        summary: {
          collectionId: "xhs:pending_download",
          createdItems: 100,
          updatedItems: 0,
          authors: 8,
          updatedAt: "2026-05-12T15:30:00.000Z"
        },
        totalItems: 180
      },
      progress: null,
      selectedStatus: "pending_download",
      summary: null
    })

    expect(viewModel.sourceLabel).toBe("正在分批上传")
    expect(viewModel.itemCountLabel).toBe("正在上传第 2/4 批，本批 50 个项目")
  })

  it("shows delete completion status", () => {
    const viewModel = createPageImportViewModel({
      busy: false,
      draft: null,
      deleteSummary: {
        deletedItems: 3,
        skippedItems: 1,
        itemIds: ["note-1", "note-2", "note-3"],
        updatedAt: "2026-05-12T15:30:00.000Z"
      },
      error: null,
      progress: null,
      selectedStatus: "downloaded",
      summary: null
    })

    expect(viewModel.statusLabel).toBe("删除完成")
  })

  it("exposes frontend confirmation dialog content", () => {
    const viewModel = createPageImportViewModel({
      busy: false,
      draft: null,
      deleteSummary: null,
      error: null,
      confirmation: {
        cancelLabel: "取消",
        confirmLabel: "确认导入",
        message: "确认导入这条笔记到待下载？",
        title: "确认导入"
      },
      progress: null,
      selectedStatus: "pending_download",
      summary: null
    })

    expect(viewModel.confirmation).toEqual({
      cancelLabel: "取消",
      confirmLabel: "确认导入",
      message: "确认导入这条笔记到待下载？",
      title: "确认导入"
    })
  })

  it("uses distinguishable Bilibili-themed colors for Bilibili page imports", () => {
    const theme = createPageImportTheme("bilibili")

    expect(theme.accent).toBe("#00aeec")
    expect(theme.action).toBe("#00a1d6")
    expect(theme.action).not.toBe("#e60033")
    expect(theme.successForeground).not.toBe(theme.errorForeground)
    expect(theme.warningForeground).not.toBe(theme.errorForeground)
  })

  it("uses the Bilibili theme before extraction on rewritten favlist URLs", () => {
    const document = {
      location: {
        href: "https://space.bilibili.com/5059047?fid=47314147"
      }
    }

    expect(createPageImportThemeSource(document)).toBe("bilibili")
  })
})
