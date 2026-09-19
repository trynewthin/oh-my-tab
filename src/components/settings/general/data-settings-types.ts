import type { Backup } from "@/lib/backup"
import type { WebdavConnection } from "@/lib/webdav"

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
