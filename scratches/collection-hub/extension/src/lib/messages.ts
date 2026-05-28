import type {
  DeleteItemsRequest,
  DeleteItemsSummary,
  ImportCollectionRequest,
  ImportSummary
} from "@collection-hub/libs"

import type { CollectionExtractionDraft } from "./dom-adapter"

export type ExtractCollectionMessage = {
  type: "xhs:extract-collection"
}

export type ExtractCollectionResponse =
  | {
      ok: true
      draft: CollectionExtractionDraft
    }
  | {
      ok: false
      error: string
    }

export type SubmitImportMessage = {
  type: "collection-hub:submit-import"
  apiBaseUrl: string
  request: ImportCollectionRequest
}

export type DeleteItemsMessage = {
  type: "collection-hub:delete-items"
  apiBaseUrl: string
  request: DeleteItemsRequest
}

export type CollectionHubApiMessage = SubmitImportMessage | DeleteItemsMessage

export type CollectionHubApiResponse<T> =
  | {
      ok: true
      data: T
    }
  | {
      ok: false
      error: string
    }

export type SubmitImportResponse = CollectionHubApiResponse<ImportSummary>
export type DeleteItemsResponse = CollectionHubApiResponse<DeleteItemsSummary>
