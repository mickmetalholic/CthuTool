import {
  submitDeleteItemsRequest,
  submitImportRequest
} from "./lib/import-client"
import { registerOptionsPageAction } from "./lib/action-routing"
import type {
  CollectionHubApiMessage,
  DeleteItemsResponse,
  SubmitImportResponse
} from "./lib/messages"

registerOptionsPageAction()

chrome.runtime.onMessage.addListener(
  (
    message: CollectionHubApiMessage,
    _sender,
    sendResponse: (response: DeleteItemsResponse | SubmitImportResponse) => void
  ) => {
    if (
      message.type !== "collection-hub:submit-import" &&
      message.type !== "collection-hub:delete-items"
    ) {
      return false
    }

    void handleApiMessage(message).then(sendResponse)
    return true
  }
)

async function handleApiMessage(
  message: CollectionHubApiMessage
): Promise<DeleteItemsResponse | SubmitImportResponse> {
  try {
    if (message.type === "collection-hub:submit-import") {
      return {
        ok: true,
        data: await submitImportRequest(message.apiBaseUrl, message.request)
      }
    }

    return {
      ok: true,
      data: await submitDeleteItemsRequest(message.apiBaseUrl, message.request)
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "本地 API 请求失败"
    }
  }
}
