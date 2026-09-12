import { rehydrateData } from "./hydrate"
import {
  snapshot,
  validateConfig,
  parseConfig,
  importConfig,
  type Config,
} from "./config-transfer"
import {
  getAsset,
  putAsset,
  flushStorage,
  dataUrlToBlob,
  storageRevision,
} from "./storage"
import { encodeBackup, decodeBackup, MAX_BACKUP_BYTES } from "./backup-codec"
export { MAX_BACKUP_BYTES } from "./backup-codec"
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
    throw new Error("备份期间数据发生变化，请重新导出")
  return result
}
export async function readBackup(file: Blob): Promise<Backup> {
  if (!file.size || file.size > MAX_BACKUP_BYTES)
    throw new Error("请选择不超过 64 MB 的备份")
  const signature = new Uint8Array(await file.slice(0, 2).arrayBuffer())
  if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
    if (file.size > 16 * 1024 * 1024) throw new Error("旧版备份过大")
    return { config: await parseConfig(await file.text()) }
  }
  const decoded = await decodeBackup(file)
  const config = validateConfig(decoded.config)
  if (config.home.backgroundImage !== null)
    throw new Error("ZIP 图片必须通过资源清单引用")
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
