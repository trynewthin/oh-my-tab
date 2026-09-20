export const supportedLanguages = ["zh-CN", "en"] as const

export type AppLanguage = (typeof supportedLanguages)[number]

export const defaultLanguage: AppLanguage = "zh-CN"

export type PageId = "home" | "privacy"

const englishPrefix = "/en"

/**
 * Website language is addressable: `/` and `/privacy` are zh-CN, `/en` and
 * `/en/privacy` are en. Anything else falls back to zh-CN.
 */
export function languageFromPath(pathname: string): AppLanguage {
  const normalized = normalizePath(pathname)
  return normalized === englishPrefix || normalized.startsWith(`${englishPrefix}/`)
    ? "en"
    : defaultLanguage
}

/** Resolve the page rendered by a path, tolerating the `privacy.html` alias. */
export function pageFromPath(pathname: string): PageId {
  const normalized = normalizePath(pathname)
  const withoutPrefix =
    normalized === englishPrefix
      ? "/"
      : normalized.startsWith(`${englishPrefix}/`)
        ? normalized.slice(englishPrefix.length)
        : normalized
  return withoutPrefix === "/privacy" ? "privacy" : "home"
}

export function pathFor(page: PageId, language: AppLanguage): string {
  if (language === "en") return page === "privacy" ? "/en/privacy" : "/en"
  return page === "privacy" ? "/privacy" : "/"
}

/** Normalize `.html` and `/index` forms so aliases resolve to the clean route. */
function normalizePath(pathname: string): string {
  if (!pathname) return "/"
  const withLeadingSlash = pathname.startsWith("/") ? pathname : `/${pathname}`
  const withoutExtension = withLeadingSlash
    .replace(/\.html?$/i, "")
    .replace(/\/index$/i, "/")
  const withoutTrailingSlash =
    withoutExtension.length > 1
      ? withoutExtension.replace(/\/+$/, "")
      : withoutExtension
  return withoutTrailingSlash || "/"
}
