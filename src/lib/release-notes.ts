export const releaseNoteLocales = ["zh-CN", "en"] as const
export type ReleaseNoteLocale = (typeof releaseNoteLocales)[number]
export type ReleaseNotes = {
  version: string
  notes: Record<ReleaseNoteLocale, string[]>
}

const versionPattern =
  /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/

export function validateReleaseNotes(value: unknown): ReleaseNotes {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Release notes must be a YAML object")
  const candidate = value as Record<string, unknown>
  if (
    typeof candidate.version !== "string" ||
    !versionPattern.test(candidate.version)
  )
    throw new Error("Release notes require a semantic version")
  if (
    !candidate.notes ||
    typeof candidate.notes !== "object" ||
    Array.isArray(candidate.notes)
  )
    throw new Error("Release notes require localized note lists")
  const localized = candidate.notes as Record<string, unknown>
  const notes = Object.fromEntries(
    releaseNoteLocales.map((locale) => {
      const items = localized[locale]
      if (
        !Array.isArray(items) ||
        items.length < 1 ||
        items.length > 20 ||
        !items.every(
          (item) =>
            typeof item === "string" &&
            item.trim().length > 0 &&
            item.length <= 300
        )
      )
        throw new Error(`Release notes require 1–20 valid ${locale} entries`)
      return [locale, items.map((item) => item.trim())]
    })
  ) as Record<ReleaseNoteLocale, string[]>
  return { version: candidate.version, notes }
}

export function releaseNoteLocale(language: string): ReleaseNoteLocale {
  return language.toLowerCase().startsWith("zh") ? "zh-CN" : "en"
}
