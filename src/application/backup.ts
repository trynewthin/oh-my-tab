import { readBackupSource, extractBackupImage } from "@/lib/migrations/backup"
import { rehydrateData } from "@/application/hydrate"
import { i18n } from "@/i18n"
import {
  snapshot,
  validateConfig,
  importConfig,
  type Config,
} from "@/application/config-transfer"
import {
  getAsset,
  putAsset,
  flushStorage,
  storageRevision,
} from "@/lib/storage"
import { encodeBackup } from "@/lib/backup-codec"
export { MAX_BACKUP_BYTES } from "@/lib/backup-codec"
export type Backup = { config: Config; image?: Blob }
export type BackupContents = { backup: Backup; sourceConfig: unknown }
export async function createBackup(): Promise<Blob> {
  await flushStorage()
  await rehydrateData()
  const revision = await storageRevision()
  const config = JSON.parse(JSON.stringify(snapshot())) as Config
  let image: Blob | undefined
  if (config.home.backgroundImage) {
    image = await getAsset(config.home.backgroundImage)
    config.home.backgroundImage = null
  }
  const result = await encodeBackup(config, image)
  if ((await storageRevision()) !== revision)
    throw new Error(i18n.t("settings.errors.backupChanged"))
  return result
}
export async function readBackupContents(file: Blob): Promise<BackupContents> {
  const decoded = await readBackupSource(file)
  // Verify remote checksums against the unmodified source, before migration.
  const sourceConfig = decoded.config
  const config = validateConfig(sourceConfig)
  const image = extractBackupImage(config, decoded)
  if (image) {
    const bitmap = await createImageBitmap(image)
    bitmap.close()
  }
  return {
    backup: { config, image },
    sourceConfig,
  }
}
export async function readBackup(file: Blob): Promise<Backup> {
  return (await readBackupContents(file)).backup
}
export async function restoreBackup(
  backup: Backup,
  revision: string | undefined
) {
  const config = structuredClone(backup.config)
  if (backup.image) config.home.backgroundImage = await putAsset(backup.image)
  await importConfig(config, revision)
}
export function downloadBackup(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `oh-my-tab-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
