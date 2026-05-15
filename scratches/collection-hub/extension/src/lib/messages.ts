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
