import { extensionApi } from "@/stores/privacy-store"
import { MAX_BACKUP_BYTES } from "./backup"

export type WebdavSettings = { url: string; username: string }
export type WebdavConnection = WebdavSettings & { password: string }
export type RemoteBackup = { blob: Blob; etag: string | null }
export function normalizeWebdav(settings: WebdavSettings): WebdavSettings {
  let url: URL
  try {
    url = new URL(settings.url.trim())
  } catch {
    throw new Error("请输入完整的 HTTPS WebDAV 目录地址")
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("WebDAV 地址须使用 HTTPS，且不能包含凭据、查询参数或片段")
  if (settings.username.includes(":")) throw new Error("用户名不能包含冒号")
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
    throw new Error("未获得服务器访问权限")
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
    throw new Error(
      "无法连接 WebDAV，请检查地址、证书和网络；网页版还需服务器允许跨域请求，且地址不能重定向"
    )
  }
}
function checkResponse(response: Response) {
  if (response.status === 401 || response.status === 403)
    throw new Error("WebDAV 认证失败或没有访问权限")
  if (response.status === 412)
    throw new Error("云端数据已变化，请重新获取后再操作")
  if (!response.ok) throw new Error(`WebDAV 请求失败（${response.status}）`)
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
  if (!response.body) throw new Error("云端备份为空")
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
        throw new Error("云端备份超过 64 MB")
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
    throw new Error(
      "服务器未提供强 ETag，无法安全覆盖；请启用 ETag，网页版还需暴露 ETag 响应头"
    )
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
