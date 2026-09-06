import { useEffect, useState } from "react"

export function useSearchSuggestions(query: string, enabled: boolean) {
  const [result, setResult] = useState<{ query: string; values: string[] }>({
    query: "",
    values: [],
  })
  useEffect(() => {
    if (!enabled || !query || query.length > 200) return
    const controller = new AbortController()
    let timeout: ReturnType<typeof setTimeout> | undefined
    let cancelled = false
    const timer = setTimeout(async () => {
      timeout = setTimeout(() => controller.abort(), 3500)
      try {
        const endpoint =
          location.protocol === "chrome-extension:"
            ? `https://www.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`
            : `/__suggestions?q=${encodeURIComponent(query)}`
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
        if (!cancelled) setResult({ query, values: suggestions })
      } catch {
        if (!cancelled) setResult({ query, values: [] })
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
  }, [query, enabled])
  return enabled && result.query === query ? result.values : []
}
