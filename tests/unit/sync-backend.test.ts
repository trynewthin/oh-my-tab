import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { webdavBackend } from "@/application/backends/webdav"

const connection = {
  url: "https://dav.example.com/test/",
  username: "user",
  password: "secret",
}
const backend = webdavBackend(connection)

const requests: { url: string; method: string; headers: HeadersInit }[] = []
let responder: (call: (typeof requests)[0]) => Response

beforeEach(() => {
  requests.length = 0
  responder = () => new Response(null, { status: 404 })
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      const call = {
        url,
        method: options.method ?? "GET",
        headers: options.headers ?? {},
      }
      requests.push(call)
      return responder(call)
    })
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe("webdavBackend", () => {
  it("declares conditional writes and no listing", () => {
    expect(backend.capabilities.conditionalWrites).toBe(true)
    expect(backend.capabilities.listing).toBe(false)
  })

  it("get returns null for missing files", async () => {
    expect(await backend.get("oh-my-tab-sync.json")).toBeNull()
    expect(requests[0].method).toBe("GET")
  })

  it("get returns blob and etag", async () => {
    responder = () =>
      new Response(new Blob(["data"]), {
        status: 200,
        headers: {
          ETag: '"abc"',
          "Last-Modified": "Wed, 01 Jan 2025 00:00:00 GMT",
        },
      })
    const file = await backend.get("x.zip")
    expect(file?.etag).toBe('"abc"')
    expect(file?.lastModified).toBe(new Date("2025-01-01").getTime())
    expect(await file!.blob.text()).toBe("data")
  })

  it("put sends If-None-Match for create-only writes", async () => {
    responder = () =>
      new Response(null, { status: 201, headers: { ETag: '"new"' } })
    const etag = await backend.put("x.zip", new Blob(["zip"]), {
      ifNoneMatch: true,
    })
    expect(etag).toBe('"new"')
    const headers = requests[0].headers as Record<string, string>
    expect(headers["If-None-Match"]).toBe("*")
  })

  it("put sends If-Match for conditional overwrites", async () => {
    responder = () => new Response(null, { status: 204 })
    await backend.put("x.zip", new Blob(["zip"]), { ifMatch: '"old"' })
    const headers = requests[0].headers as Record<string, string>
    expect(headers["If-Match"]).toBe('"old"')
  })

  it("put surfaces 412 as a conflict error", async () => {
    responder = () => new Response(null, { status: 412 })
    await expect(
      backend.put("x.zip", new Blob(["zip"]), { ifMatch: '"old"' })
    ).rejects.toThrow()
  })

  it("delete tolerates missing files but fails on denial", async () => {
    await expect(backend.delete("gone.zip")).resolves.toBeUndefined()
    responder = () => new Response(null, { status: 403 })
    await expect(backend.delete("denied.zip")).rejects.toThrow()
  })

  it("authenticates requests with Basic auth", async () => {
    await backend.get("x.zip")
    const headers = requests[0].headers as Record<string, string>
    expect(headers.Authorization).toBe(`Basic ${btoa("user:secret")}`)
  })
})
