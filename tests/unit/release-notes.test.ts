import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import currentReleaseConfig from "@/content/current-release.yaml"
import nightlyReleaseConfig from "@/content/nightly-release.yaml"
import { releaseNoteLocale, validateReleaseNotes } from "@/lib/release-notes"
import {
  releaseNotesMarkdown,
  requireUpdatedNotes,
} from "../../scripts/release/notes"

const root = new URL("../../", import.meta.url)

describe("current release notes", () => {
  it("loads both locales from YAML and matches the application version", async () => {
    const manifest = JSON.parse(
      await readFile(new URL("public/manifest.json", root), "utf8")
    )
    const packageJson = JSON.parse(
      await readFile(new URL("package.json", root), "utf8")
    )
    for (const channel of ["stable", "nightly"] as const) {
      const release = validateReleaseNotes(
        channel === "stable" ? currentReleaseConfig : nightlyReleaseConfig
      )
      expect(release.version).toBe(packageJson.version)
      expect(release.version).toBe(manifest.version)
      const markdown = releaseNotesMarkdown(release, channel)
      for (const note of [...release.notes["zh-CN"], ...release.notes.en]) {
        expect(markdown).toContain(`- ${note}\n`)
      }
    }
  })

  it("requires new notes in both languages for a new release", () => {
    const previous = validateReleaseNotes({
      version: "1.6.0",
      notes: { "zh-CN": ["旧改动"], en: ["Previous change"] },
    })
    const current = {
      ...previous,
      notes: { ...previous.notes, "zh-CN": ["新改动"] },
    }
    expect(() => requireUpdatedNotes(previous, previous)).toThrow(/zh-CN/)
    expect(() => requireUpdatedNotes(current, previous)).toThrow(/en/)
    expect(() =>
      requireUpdatedNotes(
        { ...current, notes: { ...current.notes, en: ["New change"] } },
        previous
      )
    ).not.toThrow()
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
