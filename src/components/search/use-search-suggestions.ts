import { suggestionUrl } from "@/lib/search-suggestions"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { canSelectBrowserSearch } from "@/stores/privacy-store"
import { networkAllowed, usePrivacyStore } from "@/stores/privacy-store"
import { useEffect, useState } from "react"

export function useSearchSuggestions(query: string, enabled: boolean) {
  const consent = usePrivacyStore((state) => state.suggestions)
  const selectedId = useSearchEngineStore((state) => state.selectedId)
  const browserSearch =
    usePrivacyStore((state) => state.browserSearch) && canSelectBrowserSearch()
  const engine = browserSearch ? "" : selectedId
  const remote = suggestionUrl(engine, query)
  const allowed = enabled && consent && !!remote
  const [result, setResult] = useState<{
    query: string
    engine: string
    values: string[]
  }>({
    query: "",
    engine: "",
    values: [],
  })
  useEffect(() => {
    if (!allowed || !query || query.length > 200) return
    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 3500)
      try {
        if (!(await networkAllowed("suggestions")) || cancelled) return
        const endpoint =
          location.protocol === "chrome-extension:"
            ? remote!
            : `/__suggestions?q=${encodeURIComponent(query)}&engine=${encodeURIComponent(engine)}`
        const response = await fetch(endpoint, {
          signal: controller.signal,
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
        })
        if (!response.ok) throw new Error("Suggestions unavailable")
        const data: unknown = await response.json()
        const values =
          Array.isArray(data) && Array.isArray(data[1]) ? data[1] : []
        const suggestions = [
          ...new Set(
            values
              .filter(
                (value): value is string =>
                  typeof value === "string" &&
                  !!value.trim() &&
                  value.length <= 200
              )
              .map((value) => value.trim())
          ),
        ].slice(0, 5)
        if (!cancelled) setResult({ query, engine, values: suggestions })
      } catch {
        if (!cancelled) setResult({ query, engine, values: [] })
      } finally {
        clearTimeout(timeout)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
      clearTimeout(timeout)
      controller.abort()
    }
  }, [query, allowed, engine, remote])
  return allowed && result.query === query && result.engine === engine
    ? result.values
    : []
}
