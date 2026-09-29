import { describe, expect, it } from "vitest"
import { validTabIcon } from "@/lib/grid/tab-icon"
import { validTabEntry } from "@/lib/grid/validation"

const webp = `data:image/webp;base64,${btoa("RIFF\0\0\0\0WEBP")}`

describe("custom tab icons", () => {
  it("accepts bounded WebP data and rejects other or malformed sources", () => {
    expect(validTabIcon(undefined)).toBe(true)
    expect(validTabIcon(webp)).toBe(true)
    expect(validTabIcon("https://example.com/icon.png")).toBe(false)
    expect(validTabIcon("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false)
    expect(validTabIcon("data:image/webp;base64,bm90LXdlYnA=")).toBe(false)
  })

  it("validates custom icons as part of persisted tab data", () => {
    const tab = {
      id: "tab",
      name: "Tab",
      url: "https://example.com/",
      icon: webp,
    }
    expect(validTabEntry(tab)).toBe(true)
    expect(validTabEntry({ ...tab, icon: "javascript:alert(1)" })).toBe(false)
  })
})
