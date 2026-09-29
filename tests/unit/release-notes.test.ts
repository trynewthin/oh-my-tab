import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import currentReleaseConfig from "@/content/current-release.yaml"
import { releaseNoteLocale, validateReleaseNotes } from "@/lib/release-notes"

const root = new URL("../../", import.meta.url)

describe("current release notes", () => {
  it("loads both locales from YAML and matches the application version", async () => {
    const release = validateReleaseNotes(currentReleaseConfig)
    const manifest = JSON.parse(
      await readFile(new URL("public/manifest.json", root), "utf8")
    )
    const packageJson = JSON.parse(
      await readFile(new URL("package.json", root), "utf8")
    )
    expect(release.version).toBe(packageJson.version)
    expect(release.version).toBe(manifest.version)
    expect(release.notes["zh-CN"].length).toBeGreaterThan(0)
    expect(release.notes.en.length).toBeGreaterThan(0)
  })

  it("selects Chinese variants and falls back to English", () => {
    expect(releaseNoteLocale("zh-CN")).toBe("zh-CN")
    expect(releaseNoteLocale("zh-Hans")).toBe("zh-CN")
    expect(releaseNoteLocale("en-US")).toBe("en")
    expect(releaseNoteLocale("fr")).toBe("en")
  })

  it("rejects missing, empty, and oversized configuration values", () => {
    expect(() => validateReleaseNotes({})).toThrow(/semantic version/)
    expect(() =>
      validateReleaseNotes({ version: "1.0.0", notes: { "zh-CN": [], en: [] } })
    ).toThrow(/zh-CN/)
    expect(() =>
      validateReleaseNotes({
        version: "1.0.0",
        notes: { "zh-CN": ["x".repeat(301)], en: ["Valid"] },
      })
    ).toThrow(/zh-CN/)
  })
})
