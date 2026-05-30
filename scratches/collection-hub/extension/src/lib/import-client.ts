import type {
  ApiError,
  DeleteItemsRequest,
  DeleteItemsSummary,
  ImportCollectionRequest,
  ImportSummary,
  ItemStatus
} from "@collection-hub/libs"

import type { CollectionExtractionDraft } from "./dom-adapter"
import type {
  CollectionHubApiResponse,
  DeleteItemsResponse,
  SubmitImportResponse
} from "./messages"

type SubmitOptions = {
  fetcher?: typeof fetch
}

type RuntimeMessageSender = {
  lastError?: chrome.runtime.LastError
  sendMessage: (
    message: unknown,
    callback: (response: unknown) => void
  ) => void
}

type RuntimeMessageOptions = {
  runtime?: RuntimeMessageSender
}

type ImportBatchOptions = {
  maxBatchBytes?: number
  maxItemsPerBatch?: number
}

export type ImportBatchProgress = {
  batchCount: number
  batchIndex: number
  itemCount: number
  summary: ImportSummary
  totalItems: number
}

export type SubmitImportBatchesOptions = ImportBatchOptions &
  SubmitOptions & {
    onProgress?: (progress: ImportBatchProgress) => void
  }

export type SubmitImportBatchesViaExtensionOptions = ImportBatchOptions &
  RuntimeMessageOptions & {
    onProgress?: (progress: ImportBatchProgress) => void
  }

const defaultMaxBatchBytes = 512 * 1024
const defaultMaxItemsPerBatch = 50

export function buildImportRequest(
  draft: CollectionExtractionDraft,
  status: ItemStatus,
  capturedAt = new Date().toISOString()
): ImportCollectionRequest {
  return buildImportRequestWithItems(draft, draft.items, status, capturedAt)
}

export function buildSingleItemImportRequest(
  draft: CollectionExtractionDraft,
  item: CollectionExtractionDraft["items"][number],
  status: ItemStatus,
  capturedAt = new Date().toISOString()
): ImportCollectionRequest {
  return buildImportRequestWithItems(draft, [item], status, capturedAt)
}

function buildImportRequestWithItems(
  draft: CollectionExtractionDraft,
  items: CollectionExtractionDraft["items"],
  status: ItemStatus,
  capturedAt: string
): ImportCollectionRequest {
  return {
    source: draft.source,
    status,
    capturedAt,
    collection: draft.collection,
    items
  }
}

export function buildImportRequestBatches(
  request: ImportCollectionRequest,
  options: ImportBatchOptions = {}
): ImportCollectionRequest[] {
  if (request.items.length === 0) {
    return [request]
  }

  const maxBatchBytes = Math.max(
    1,
    options.maxBatchBytes ?? defaultMaxBatchBytes
  )
  const maxItemsPerBatch = Math.max(
    1,
    options.maxItemsPerBatch ?? defaultMaxItemsPerBatch
  )
  const batches: ImportCollectionRequest[] = []
  let currentItems: ImportCollectionRequest["items"] = []

  for (const item of request.items) {
    const nextItems = [...currentItems, item]
    const nextRequest = buildImportRequestFromRequest(request, nextItems)
    const shouldFlushCurrent =
      currentItems.length > 0 &&
      (nextItems.length > maxItemsPerBatch ||
        jsonByteLength(nextRequest) > maxBatchBytes)

    if (shouldFlushCurrent) {
      batches.push(buildImportRequestFromRequest(request, currentItems))
      currentItems = [item]
    } else {
      currentItems = nextItems
    }

    if (currentItems.length >= maxItemsPerBatch) {
      batches.push(buildImportRequestFromRequest(request, currentItems))
      currentItems = []
    }
  }

  if (currentItems.length > 0) {
    batches.push(buildImportRequestFromRequest(request, currentItems))
  }

  return batches
}

export function buildDeleteItemsRequest(
  draft: CollectionExtractionDraft,
  status: ItemStatus
): DeleteItemsRequest {
  return {
    source: draft.source,
    status,
    itemIds: Array.from(
      new Set(
        draft.items
          .map((item) => item.id)
          .filter((itemId): itemId is string => Boolean(itemId))
      )
    )
  }
}

export async function submitImportRequest(
  apiBaseUrl: string,
  request: ImportCollectionRequest,
  options: SubmitOptions = {}
): Promise<ImportSummary> {
  const fetcher = options.fetcher ?? fetch
  const response = await fetcher(
    `${apiBaseUrl.replace(/\/+$/, "")}/api/imports/collections`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  )

  const body = await readJson(response)
  if (!response.ok) {
    const apiError = body as Partial<ApiError>
    throw new Error(
      apiError.message ?? `Import failed with status ${response.status}`
    )
  }

  return body as ImportSummary
}

export async function submitImportRequestViaExtension(
  apiBaseUrl: string,
  request: ImportCollectionRequest,
  options: RuntimeMessageOptions = {}
): Promise<ImportSummary> {
  return sendRuntimeMessage<ImportSummary, SubmitImportResponse>(
    {
      type: "collection-hub:submit-import",
      apiBaseUrl,
      request
    },
    options.runtime
  )
}

export async function submitImportRequestInBatches(
  apiBaseUrl: string,
  request: ImportCollectionRequest,
  options: SubmitImportBatchesOptions = {}
): Promise<ImportSummary> {
  const batches = buildImportRequestBatches(request, options)
  let mergedSummary: ImportSummary | null = null

  for (const [batchOffset, batch] of batches.entries()) {
    const batchSummary = await submitImportRequest(apiBaseUrl, batch, {
      fetcher: options.fetcher
    })
    mergedSummary = mergeImportSummaries(request, mergedSummary, batchSummary)
    options.onProgress?.({
      batchCount: batches.length,
      batchIndex: batchOffset + 1,
      itemCount: batch.items.length,
      summary: mergedSummary,
      totalItems: request.items.length
    })
  }

  if (!mergedSummary) {
    throw new Error("Import request did not produce a summary")
  }

  return mergedSummary
}

export async function submitImportRequestInBatchesViaExtension(
  apiBaseUrl: string,
  request: ImportCollectionRequest,
  options: SubmitImportBatchesViaExtensionOptions = {}
): Promise<ImportSummary> {
  const batches = buildImportRequestBatches(request, options)
  let mergedSummary: ImportSummary | null = null

  for (const [batchOffset, batch] of batches.entries()) {
    const batchSummary = await submitImportRequestViaExtension(
      apiBaseUrl,
      batch,
      {
        runtime: options.runtime
      }
    )
    mergedSummary = mergeImportSummaries(request, mergedSummary, batchSummary)
    options.onProgress?.({
      batchCount: batches.length,
      batchIndex: batchOffset + 1,
      itemCount: batch.items.length,
      summary: mergedSummary,
      totalItems: request.items.length
    })
  }

  if (!mergedSummary) {
    throw new Error("Import request did not produce a summary")
  }

  return mergedSummary
}

export async function submitDeleteItemsRequest(
  apiBaseUrl: string,
  request: DeleteItemsRequest,
  options: SubmitOptions = {}
): Promise<DeleteItemsSummary> {
  const fetcher = options.fetcher ?? fetch
  const response = await fetcher(
    `${apiBaseUrl.replace(/\/+$/, "")}/api/dashboard/items/bulk-delete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    }
  )

  const body = await readJson(response)
  if (!response.ok) {
    const apiError = body as Partial<ApiError>
    throw new Error(
      apiError.message ?? `Delete failed with status ${response.status}`
    )
  }

  return body as DeleteItemsSummary
}

export async function submitDeleteItemsRequestViaExtension(
  apiBaseUrl: string,
  request: DeleteItemsRequest,
  options: RuntimeMessageOptions = {}
): Promise<DeleteItemsSummary> {
  return sendRuntimeMessage<DeleteItemsSummary, DeleteItemsResponse>(
    {
      type: "collection-hub:delete-items",
      apiBaseUrl,
      request
    },
    options.runtime
  )
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return undefined
  }
}

function buildImportRequestFromRequest(
  request: ImportCollectionRequest,
  items: ImportCollectionRequest["items"]
): ImportCollectionRequest {
  return {
    ...request,
    items
  }
}

function mergeImportSummaries(
  request: ImportCollectionRequest,
  previous: ImportSummary | null,
  next: ImportSummary
): ImportSummary {
  return {
    collectionId: next.collectionId,
    createdItems: (previous?.createdItems ?? 0) + next.createdItems,
    updatedItems: (previous?.updatedItems ?? 0) + next.updatedItems,
    authors: countDistinctAuthors(request),
    updatedAt: next.updatedAt
  }
}

function countDistinctAuthors(request: ImportCollectionRequest): number {
  const authorKeys = new Set<string>()

  for (const item of request.items) {
    if (!item.author) {
      continue
    }
    authorKeys.add(
      item.author.id ??
        item.author.profileUrl ??
        `${request.source}:${item.author.name}`
    )
  }

  return authorKeys.size
}

function jsonByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length
}

function getRuntime(
  runtime?: RuntimeMessageOptions["runtime"]
): RuntimeMessageOptions["runtime"] | undefined {
  if (runtime) {
    return runtime
  }
  if (typeof chrome === "undefined") {
    return undefined
  }
  return chrome.runtime as RuntimeMessageSender
}

function sendRuntimeMessage<
  TData,
  TResponse extends CollectionHubApiResponse<TData>
>(
  message: unknown,
  runtime?: RuntimeMessageOptions["runtime"]
): Promise<TData> {
  const targetRuntime = getRuntime(runtime)
  if (!targetRuntime?.sendMessage) {
    return Promise.reject(new Error("扩展后台不可用，无法连接本地 API"))
  }

  return new Promise((resolve, reject) => {
    targetRuntime.sendMessage(message, (response) => {
      const apiResponse = response as TResponse | undefined
      const runtimeError = targetRuntime.lastError
      if (runtimeError) {
        reject(new Error(runtimeError.message ?? "扩展后台请求失败"))
        return
      }
      if (!apiResponse) {
        reject(new Error("扩展后台没有返回本地 API 响应"))
        return
      }
      if (!apiResponse.ok) {
        reject(
          new Error("error" in apiResponse ? apiResponse.error : "本地 API 请求失败")
        )
        return
      }
      resolve(apiResponse.data)
    })
  })
}
