import {
  checkWebdavResponse,
  fetchRemoteBackup,
  requestWebdav,
  type WebdavConnection,
} from "@/application/webdav"
import { MAX_BACKUP_BYTES } from "@/lib/backup-codec"
import type { SyncBackend } from "@/lib/sync/backend"

export function webdavBackend(connection: WebdavConnection): SyncBackend {
  return {
    id: "webdav",
    capabilities: {
      conditionalWrites: true,
      listing: false,
      maxFileBytes: MAX_BACKUP_BYTES,
    },
    get: (path, maxBytes) => fetchRemoteBackup(connection, path, maxBytes),
    put: async (path, blob, condition) => {
      const headers: Record<string, string> = {}
      if (blob.type) headers["Content-Type"] = blob.type
      if (condition?.ifMatch) headers["If-Match"] = condition.ifMatch
      if (condition?.ifNoneMatch) headers["If-None-Match"] = "*"
      const response = await requestWebdav(connection, "PUT", {
        file: path,
        headers,
        body: blob,
      })
      checkWebdavResponse(response)
      await response.body?.cancel()
      return response.headers.get("ETag")
    },
    delete: async (path, condition) => {
      const headers: Record<string, string> = {}
      if (condition?.ifMatch) headers["If-Match"] = condition.ifMatch
      const response = await requestWebdav(connection, "DELETE", {
        file: path,
        headers,
      })
      if (response.status !== 404) checkWebdavResponse(response)
      await response.body?.cancel()
    },
  }
}
