import { zipSync, unzipSync, strToU8, strFromU8 } from "fflate"

export const MAX_BACKUP_BYTES = 64 * 1024 * 1024
const MAX_JSON_BYTES = 8 * 1024 * 1024
export type DecodedBackup = { config: unknown; image?: Blob }
export async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes))
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("")
}
export async function encodeBackup(
  config: unknown,
  blob?: Blob
): Promise<Blob> {
  const files: Record<string, Uint8Array> = {}
  let image: { path: string; type: string; sha256: string } | undefined
  if (blob) {
    if (
      blob.size > 50 * 1024 * 1024 ||
      !["image/png", "image/jpeg", "image/webp"].includes(blob.type)
    )
      throw new Error("图片类型无效或超过 50 MB")
    const bytes = new Uint8Array(await blob.arrayBuffer())
    image = {
      path: "assets/background",
      type: blob.type,
      sha256: await sha256(bytes),
    }
    files[image.path] = bytes
  }
  files["manifest.json"] = strToU8(
    JSON.stringify({
      format: "oh-my-tab",
      version: 2,
      config,
      configSha256: await sha256(strToU8(JSON.stringify(config))),
      image,
    })
  )
  if (
    files["manifest.json"].length > MAX_JSON_BYTES ||
    Object.values(files).reduce((sum, bytes) => sum + bytes.length, 0) >
      MAX_BACKUP_BYTES - 4096
  )
    throw new Error("备份超过大小限制（64 MB）")
  // Store entries verbatim: the original image bytes are never re-encoded.
  return new Blob([new Uint8Array(zipSync(files, { level: 0 }))], {
    type: "application/zip",
  })
}
export async function decodeBackup(file: Blob): Promise<DecodedBackup> {
  if (!file.size || file.size > MAX_BACKUP_BYTES)
    throw new Error("请选择不超过 64 MB 的备份")
  const bytes = new Uint8Array(await file.arrayBuffer())
  let total = 0
  let count = 0
  const names = new Set<string>()
  const files = unzipSync(bytes, {
    filter: (entry) => {
      total += entry.originalSize
      count++
      if (
        count > 2 ||
        names.has(entry.name) ||
        total > MAX_BACKUP_BYTES ||
        !["manifest.json", "assets/background"].includes(entry.name) ||
        (entry.name === "manifest.json" && entry.originalSize > MAX_JSON_BYTES)
      )
        throw new Error("备份文件结构无效或超过大小限制")
      names.add(entry.name)
      return true
    },
  })
  if (!files["manifest.json"]) throw new Error("备份缺少数据清单")
  const manifest = JSON.parse(strFromU8(files["manifest.json"]))
  if (manifest?.format !== "oh-my-tab" || manifest.version !== 2)
    throw new Error("不支持的备份格式或版本")
  const config = manifest.config
  if (
    config === undefined ||
    (await sha256(strToU8(JSON.stringify(config)))) !== manifest.configSha256
  )
    throw new Error("备份数据校验失败，文件可能已损坏")
  if (!manifest.image) {
    if (files["assets/background"]) throw new Error("备份包含未引用的图片")
    return { config }
  }
  const image = manifest.image
  if (
    image.path !== "assets/background" ||
    !["image/png", "image/jpeg", "image/webp"].includes(image.type)
  )
    throw new Error("图片类型无效")
  const data = files[image.path]
  if (
    !data ||
    data.length > 50 * 1024 * 1024 ||
    (await sha256(data)) !== image.sha256
  )
    throw new Error("图片缺失、损坏或超过 50 MB")
  const blob = new Blob([new Uint8Array(data)], { type: image.type })
  return { config, image: blob }
}
