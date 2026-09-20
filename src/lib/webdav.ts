import { extensionApi } from "@/stores/privacy-store"
import { i18n } from "@/i18n"
import { MAX_BACKUP_BYTES } from "./backup"

export type WebdavSettings = { url: string; username: string }
export type WebdavConnection = WebdavSettings & { password: string }
export type RemoteBackup = { blob: Blob; etag: string | null }
export function normalizeWebdav(settings: WebdavSettings): WebdavSettings {
  let url: URL
  try {
    url = new URL(settings.url.trim())
  } catch {
    throw new Error(i18n.t("settings.webdav.addressInvalid"))
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(i18n.t("settings.webdav.addressInsecure"))
  if (settings.username.includes(":"))
    throw new Error(i18n.t("settings.webdav.usernameColon"))
  url.pathname = url.pathname.replace(/\/*$/, "/")
  return { url: url.href, username: settings.username.trim() }
}
export async function authorizeWebdav(settings: WebdavSettings) {
  const normalized = normalizeWebdav(settings)
  const permissions = extensionApi()?.permissions
  if (
    permissions &&
    !(await permissions.request({
      origins: [new URL(normalized.url).origin + "/*"],
    }))
  )
    throw new Error(i18n.t("settings.webdav.permissionDenied"))
  return normalized
}
function authorization(connection: WebdavConnection) {
  const bytes = new TextEncoder().encode(
    `${connection.username}:${connection.password}`
  )
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return `Basic ${btoa(binary)}`
}
async function request(
  connection: WebdavConnection,
  method: string,
  options: {
    directory?: boolean
    headers?: Record<string, string>
    body?: Blob
  } = {}
) {
  const settings = normalizeWebdav(connection)
  const target = options.directory
    ? settings.url
    : new URL("oh-my-tab.zip", settings.url).href
  try {
    return await fetch(target, {
      method,
      headers: {
        Authorization: authorization({ ...connection, ...settings }),
        ...options.headers,
      },
      body: options.body,
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    })
  } catch {
    throw new Error(i18n.t("settings.webdav.networkFailed"))
  }
}
function checkResponse(response: Response) {
  if (response.status === 401 || response.status === 403)
    throw new Error(i18n.t("settings.webdav.authFailed"))
  if (response.status === 412)
    throw new Error(i18n.t("settings.webdav.conflict"))
  if (!response.ok)
    throw new Error(
      i18n.t("settings.webdav.requestFailed", { status: response.status })
    )
}
export async function testWebdav(connection: WebdavConnection) {
  const response = await request(connection, "PROPFIND", {
    directory: true,
    headers: { Depth: "0" },
  })
  checkResponse(response)
  await response.body?.cancel()
}
export async function fetchRemoteBackup(
  connection: WebdavConnection
): Promise<RemoteBackup | null> {
  const response = await request(connection, "GET")
  if (response.status === 404) {
    await response.body?.cancel()
    return null
  }
  checkResponse(response)
  if (!response.body) throw new Error(i18n.t("settings.webdav.emptyRemote"))
  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_BACKUP_BYTES) {
        await reader.cancel()
        throw new Error(i18n.t("settings.webdav.remoteTooLarge"))
      }
      chunks.push(new Uint8Array(value))
    }
  } finally {
    reader.releaseLock()
  }
  return {
    blob: new Blob(chunks, { type: "application/zip" }),
    etag: response.headers.get("ETag"),
  }
}
export async function uploadRemoteBackup(
  connection: WebdavConnection,
  blob: Blob,
  etag: string | null,
  exists: boolean
) {
  if (exists && (!etag || etag.startsWith("W/")))
    throw new Error(i18n.t("settings.webdav.weakEtagServer"))
  const response = await request(connection, "PUT", {
    headers: {
      "Content-Type": "application/zip",
      ...(exists ? { "If-Match": etag! } : { "If-None-Match": "*" }),
    },
    body: blob,
  })
  checkResponse(response)
  await response.body?.cancel()
}
