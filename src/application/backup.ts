import { rehydrateData } from "@/application/hydrate"
import { i18n } from "@/i18n"
import {
  snapshot,
  validateConfig,
  parseConfig,
  importConfig,
  type Config,
} from "@/application/config-transfer"
import {
  getAsset,
  putAsset,
  flushStorage,
  dataUrlToBlob,
  storageRevision,
} from "@/lib/storage"
import {
  encodeBackup,
  decodeBackup,
  MAX_BACKUP_BYTES,
} from "@/lib/backup-codec"
export { MAX_BACKUP_BYTES } from "@/lib/backup-codec"
export type Backup = { config: Config; image?: Blob }
export async function createBackup(): Promise<Blob> {
  await flushStorage()
  const revision = await storageRevision()
  await rehydrateData()
  const config = JSON.parse(JSON.stringify(snapshot())) as Config
  let image: Blob | undefined
  if (config.home.backgroundImage) {
    const value = config.home.backgroundImage
    image = value.startsWith("asset:")
      ? await getAsset(value)
      : dataUrlToBlob(value)
    config.home.backgroundImage = null
  }
  const result = await encodeBackup(config, image)
  if ((await storageRevision()) !== revision)
    throw new Error(i18n.t("settings.errors.backupChanged"))
  return result
}
export async function readBackup(file: Blob): Promise<Backup> {
  if (!file.size || file.size > MAX_BACKUP_BYTES)
    throw new Error(i18n.t("settings.errors.backupFileSizeLimit"))
  const signature = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
    if (file.size > 16 * 1024 * 1024)
      throw new Error(i18n.t("settings.errors.legacyBackupTooLarge"))
    return { config: await parseConfig(await file.text()) }
  }
  const decoded = await decodeBackup(file)
  const config = validateConfig(decoded.config)
  if (config.home.backgroundImage !== null)
    throw new Error(i18n.t("settings.errors.zipImageReference"))
  if (decoded.image) {
    const bitmap = await createImageBitmap(decoded.image)
    bitmap.close()
  }
  return { config, image: decoded.image }
}
export async function restoreBackup(
  backup: Backup,
  revision: string | undefined
) {
  const config = structuredClone(backup.config)
  if (backup.image) config.home.backgroundImage = await putAsset(backup.image)
  else if (config.home.backgroundImage?.startsWith("data:image/"))
    config.home.backgroundImage = await putAsset(
      dataUrlToBlob(config.home.backgroundImage)
    )
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
