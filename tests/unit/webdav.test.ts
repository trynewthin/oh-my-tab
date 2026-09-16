import { describe, expect, it, vi, beforeEach } from "vitest"
import * as webdav from "@/lib/webdav"

const connection = {
  url: "https://dav.example.com/backup",
  username: "user",
  password: "secret",
}

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe("webdav", () => {
  it("only authorizes the chosen HTTPS origin", async () => {
    expect(() =>
      webdav.normalizeWebdav({ ...connection, url: "http://example.com" })
    ).toThrow(/HTTPS/)
    expect(() =>
      webdav.normalizeWebdav({
        ...connection,
        url: "https://user:pass@example.com/",
      })
    ).toThrow(/凭据/)
    let requested: unknown
    vi.stubGlobal("chrome", {
      permissions: {
        request: async (value: unknown) => {
          requested = value
          return true
        },
      },
    })
    expect((await webdav.authorizeWebdav(connection)).url).toBe(
      "https://dav.example.com/backup/"
    )
    expect(requested).toEqual({ origins: ["https://dav.example.com/*"] })
  })

  it("protects create and overwrite with conditional requests", async () => {
    const calls: { url: string; options: RequestInit }[] = []
    vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
      calls.push({ url, options })
      return new Response(null, { status: 201 })
    })
    const blob = new Blob(["zip"])
    await webdav.uploadRemoteBackup(connection, blob, null, false)
    expect(calls[0].url).toBe("https://dav.example.com/backup/oh-my-tab.zip")
    const headers = calls[0].options.headers as Record<string, string>
    expect(headers["If-None-Match"]).toBe("*")
    expect(calls[0].options.redirect).toBe("error")
    expect(calls[0].options.credentials).toBe("omit")
    await webdav.uploadRemoteBackup(connection, blob, '"revision"', true)
    expect(
      (calls[1].options.headers as Record<string, string>)["If-Match"]
    ).toBe('"revision"')
    await expect(
      webdav.uploadRemoteBackup(connection, blob, null, true)
    ).rejects.toThrow(/ETag/)
    await expect(
      webdav.uploadRemoteBackup(connection, blob, 'W/"revision"', true)
    ).rejects.toThrow(/ETag/)
    vi.stubGlobal("fetch", async () => new Response(null, { status: 412 }))
    await expect(
      webdav.uploadRemoteBackup(connection, blob, '"old"', true)
    ).rejects.toThrow(/变化/)
  })

  it("distinguishes missing backups, authentication and downloads", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 404 }))
    expect(await webdav.fetchRemoteBackup(connection)).toBeNull()
    vi.stubGlobal("fetch", async () => new Response(null, { status: 401 }))
    await expect(webdav.fetchRemoteBackup(connection)).rejects.toThrow(/认证/)
    vi.stubGlobal(
      "fetch",
      async () => new Response("backup", { headers: { ETag: '"version"' } })
    )
    const result = await webdav.fetchRemoteBackup(connection)
    expect(result!.etag).toBe('"version"')
    expect(await result!.blob.text()).toBe("backup")
  })
})
