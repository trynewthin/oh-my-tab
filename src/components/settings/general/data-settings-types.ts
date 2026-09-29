import type { Backup } from "@/application/backup"

export type Pending = {
  kind: "restore"
  backup: Backup
  revision: string | undefined
  source: string
}
