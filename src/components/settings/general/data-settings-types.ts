import type { Backup } from "@/application/backup"
import type { WebdavConnection } from "@/application/webdav"

export type Pending =
  | {
      kind: "restore"
      backup: Backup
      revision: string | undefined
      source: string
      remote?: boolean
    }
  | {
      kind: "upload"
      blob: Blob
      etag: string
      connection: WebdavConnection
      revision: string | undefined
    }
