import { describe, expect, it } from "vitest"
import {
  createTextTabIcon,
  isSingleIconCharacter,
  squareTabIconCrop,
  validTabIcon,
} from "@/lib/grid/tab-icon"
import { validTabEntry } from "@/lib/grid/validation"

const webp = `data:image/webp;base64,${btoa("RIFF\0\0\0\0WEBP")}`

describe("custom tab icons", () => {
  it.each(["文", "A", "7", "𠮷", "e\u0301", "👩🏽‍💻"])(
    "accepts one visible grapheme: %s",
    (text) => {
      expect(isSingleIconCharacter(text)).toBe(true)
    }
  )

  it.each([
    "",
    " ",
    "\n",
    "\u200b",
    "\u0301",
    "文字",
    "AB",
    "文 ",
    "A\n",
    "\ud800",
  ])("rejects blank, multiple, or malformed characters: %j", async (text) => {
    expect(isSingleIconCharacter(text)).toBe(false)
    await expect(
      createTextTabIcon(text, { backgroundColor: "#334155", radius: 20 })
    ).rejects.toThrow("tabIconCharacterInvalid")
  })

  it.each([
    { backgroundColor: "red", radius: 20 },
    { backgroundColor: "#12345g", radius: 20 },
    { backgroundColor: "#334155", radius: -1 },
    { backgroundColor: "#334155", radius: 51 },
    { backgroundColor: "#334155", radius: NaN },
  ])("rejects invalid text icon appearance: %j", async (appearance) => {
    await expect(createTextTabIcon("文", appearance)).rejects.toThrow(
      "tabIconAppearanceInvalid"
    )
  })
  it("calculates a bounded square crop for dragging and zooming", () => {
    expect(
      squareTabIconCrop({ width: 400, height: 200 }, 1, { x: 200, y: 100 })
    ).toEqual({ x: 100, y: 0, size: 200 })
    expect(
      squareTabIconCrop({ width: 400, height: 200 }, 2, { x: 20, y: 190 })
    ).toEqual({ x: 0, y: 100, size: 100 })
  })

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
