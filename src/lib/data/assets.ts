import { i18n } from "@/i18n"
import { readEntries, writeEntries } from "./storage-engine"

export async function putAsset(blob: Blob): Promise<string> {
  const id = `asset:${crypto.randomUUID()}`
  const value = blob
  await writeEntries({ [id]: { createdAt: Date.now(), value } })
  return id
}
export async function getAsset(id: string): Promise<Blob> {
  const record = (await readEntries([id]))[id]
  const value =
    record && typeof record === "object" && "value" in record
      ? record.value
      : undefined
  if (value instanceof Blob) return value
  if (typeof value === "string" && value.startsWith("data:image/"))
    return dataUrlToBlob(value)
  throw new Error(i18n.t("core.storage.missingAsset"))
}
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ""
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return `data:${blob.type};base64,${btoa(binary)}`
}
export function dataUrlToBlob(value: string): Blob {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(value)
  if (!match) throw new Error(i18n.t("core.storage.invalidImage"))
  const binary = atob(match[2])
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], {
    type: match[1],
  })
}
