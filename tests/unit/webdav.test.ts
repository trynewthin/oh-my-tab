import { describe, expect, it, vi, beforeEach } from "vitest"
import * as webdav from "@/application/webdav"

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

  it("passes conditional headers and isolates network credentials", async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 201 }))
    vi.stubGlobal("fetch", fetch)
    await webdav.requestWebdav(connection, "PUT", {
      file: "snapshot.zip",
      body: new Blob(["zip"]),
      headers: { "If-None-Match": "*" },
    })
    expect(fetch).toHaveBeenCalledWith(
      "https://dav.example.com/backup/snapshot.zip",
      expect.objectContaining({
        redirect: "error",
        credentials: "omit",
        headers: expect.objectContaining({ "If-None-Match": "*" }),
      })
    )
    expect(() =>
      webdav.checkWebdavResponse(new Response(null, { status: 412 }))
    ).toThrow(/变化/)
  })

  it("distinguishes missing backups, authentication and downloads", async () => {
    vi.stubGlobal("fetch", async () => new Response(null, { status: 404 }))
    expect(
      await webdav.fetchRemoteBackup(connection, "snapshot.zip")
    ).toBeNull()
    vi.stubGlobal("fetch", async () => new Response(null, { status: 401 }))
    await expect(
      webdav.fetchRemoteBackup(connection, "snapshot.zip")
    ).rejects.toThrow(/认证/)
    vi.stubGlobal(
      "fetch",
      async () => new Response("backup", { headers: { ETag: '"version"' } })
    )
    const result = await webdav.fetchRemoteBackup(connection, "snapshot.zip")
    expect(result!.etag).toBe('"version"')
    expect(await result!.blob.text()).toBe("backup")
  })
  it.each([
    ["Tue, 29 Sep 2026 12:00:00 GMT", Date.UTC(2026, 8, 29, 12)],
    ["invalid", null],
    [null, null],
  ])(
    "reads Last-Modified %s without inventing missing or invalid times",
    async (header, expected) => {
      vi.stubGlobal(
        "fetch",
        async () =>
          new Response("backup", {
            headers: header ? { "Last-Modified": header } : {},
          })
      )
      expect(
        (await webdav.fetchRemoteBackup(connection, "snapshot.zip"))
          ?.lastModified
      ).toBe(expected)
    }
  )
})
