import { dataUrlToBlob } from "@/lib/storage"
import { i18n } from "@/i18n"
import { decodeBackup, MAX_BACKUP_BYTES } from "@/lib/backup-codec"
import { decodeConfig } from "./legacy-config"

export async function readBackupSource(file: Blob) {
  if (!file.size || file.size > MAX_BACKUP_BYTES)
    throw new Error(i18n.t("settings.errors.backupFileSizeLimit"))
  const signature = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  if (signature[0] === 0x50 && signature[1] === 0x4b)
    return { ...(await decodeBackup(file)), format: "zip" as const }
  if (file.size > 16 * 1024 * 1024)
    throw new Error(i18n.t("settings.errors.legacyBackupTooLarge"))
  return {
    config: await decodeConfig(await file.text()),
    image: undefined,
    format: "text" as const,
  }
}

export function extractBackupImage(
  config: { home: { backgroundImage: string | null } },
  source: { format: "zip" | "text"; image?: Blob }
) {
  const reference = config.home.backgroundImage
  if (source.format === "zip" && reference !== null)
    throw new Error(i18n.t("settings.errors.zipImageReference"))
  if (source.format === "text" && reference) {
    const image = dataUrlToBlob(reference)
    config.home.backgroundImage = null
    return image
  }
  return source.image
}
