import type { CollectionExtractionDraft, DomCollectionAdapter, QueryableDocument } from "./dom-adapter"
import { bilibiliFavlistDomAdapter } from "./bilibili-favlist-dom-adapter"
import { sampleDomAdapter } from "./sample-dom-adapter"
import { xhsBoardDomAdapter } from "./xhs-board-dom-adapter"

export const collectionDomAdapters: DomCollectionAdapter[] = [
  xhsBoardDomAdapter,
  bilibiliFavlistDomAdapter,
  sampleDomAdapter
]

export function extractWithAdapters(
  document: QueryableDocument,
  adapters: DomCollectionAdapter[] = collectionDomAdapters
): CollectionExtractionDraft {
  const adapter = adapters.find((candidate) => candidate.canHandle(document))
  if (!adapter) {
    throw new Error("当前页面未发现可导入的收藏夹 DOM")
  }
  return adapter.extract(document)
}

export function canExtractWithAdapters(
  document: QueryableDocument,
  adapters: DomCollectionAdapter[] = collectionDomAdapters
): boolean {
  return adapters.some((candidate) => candidate.canHandle(document))
}
