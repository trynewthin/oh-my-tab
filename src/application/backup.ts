import { readBackupSource, extractBackupImage } from "@/lib/migrations/backup"
import { validateConfig, type Config } from "@/application/config-transfer"
import { workspace, dataError } from "@/application/workspace"
import { encodeBackup } from "@/lib/backup-codec"
import { flushStorage } from "@/lib/storage"
import { DataError } from "@/lib/data/errors"
export { MAX_BACKUP_BYTES } from "@/lib/backup-codec"
export type Backup = { config: Config; image?: Blob }
export type BackupContents = { backup: Backup; sourceConfig: unknown }
export async function captureBackup() {
  try {
    await flushStorage()
    const { config, image, revision } = await workspace.capture()
    if (image) {
      const bitmap = await createImageBitmap(image)
      bitmap.close()
    }
    return {
      backup: { config, image },
      blob: await encodeBackup(config, image),
      revision,
    }
  } catch (error) {
    throw dataError(error)
  }
}
export async function createBackup(): Promise<Blob> {
  return (await captureBackup()).blob
}
export async function readBackupContents(file: Blob): Promise<BackupContents> {
  const decoded = await readBackupSource(file)
  // Checksums are verified against the unmodified source, before migration.
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
  try {
    const preview = await workspace.previewRestore(backup)
    if (preview.revision !== revision) throw new DataError("CONFLICT")
    await workspace.applyRestore(preview, {
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
    })
  } catch (error) {
    throw dataError(error)
  }
}
export function downloadBackup(blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `oh-my-tab-${new Date().toISOString().replace(/[:.]/g, "-")}.zip`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
