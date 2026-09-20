export type LanguagePreference = "system" | "zh-CN" | "en"
export type AppLanguage = "zh-CN" | "en"

export const LANGUAGE_PREFERENCES = ["system", "zh-CN", "en"] as const
export const APP_LANGUAGES = ["zh-CN", "en"] as const
export const FALLBACK_LANGUAGE: AppLanguage = "zh-CN"

export function isLanguagePreference(
  value: unknown
): value is LanguagePreference {
  return (LANGUAGE_PREFERENCES as readonly unknown[]).includes(value)
}

// `navigator.languages` is ordered by user preference; `navigator.language` is
// the fallback for browsers that omit the list.
export function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return []
  const languages = navigator.languages
  if (languages?.length) return languages
  return navigator.language ? [navigator.language] : []
}

// Only simplified Chinese and English are supported. Traditional Chinese
// variants (zh-TW, zh-HK, zh-Hant) and every unknown language fall back to the
// default, zh-CN, which keeps resolution deterministic.
export function resolveAppLanguage(
  preference: LanguagePreference,
  languages: readonly string[] = browserLanguages()
): AppLanguage {
  if (preference !== "system") return preference
  for (const language of languages) {
    const subtag = language.toLowerCase().replace(/_/g, "-").split("-")[0]
    if (subtag === "en") return "en"
    if (subtag === "zh") return "zh-CN"
  }
  return FALLBACK_LANGUAGE
}
