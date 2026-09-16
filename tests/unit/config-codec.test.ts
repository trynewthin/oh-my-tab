import { describe, expect, it } from "vitest"
import { encodeConfig, decodeConfig } from "@/lib/config-codec"

describe("config-codec", () => {
  it("preserves Unicode and layout data", async () => {
    const data = {
      version: 1,
      items: Array.from({ length: 100 }, (_, i) => ({
        id: String(i),
        name: "工作台",
        url: "https://example.com",
        x: 4,
        y: i,
      })),
    }
    const encoded = await encodeConfig(data)
    expect(await decodeConfig(encoded)).toEqual(data)
    expect(await decodeConfig(`\n ${encoded}\n`)).toEqual(data)
    expect(encoded.length).toBeLessThan(JSON.stringify(data).length / 3)
  })

  it("rejects invalid version, malformed data and truncated payloads", async () => {
    await expect(decodeConfig("OMT2:abc")).rejects.toThrow()
    await expect(decodeConfig("OMT1:invalid!")).rejects.toThrow()
    const text = await encodeConfig({ a: "test" })
    await expect(decodeConfig(text.slice(0, -8))).rejects.toThrow()
  })
})
