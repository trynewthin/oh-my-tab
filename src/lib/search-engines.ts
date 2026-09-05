export type SearchEngine = {
  id: string
  name: string
  url: string
  icon?: string
}

export function isSearchUrl(value: string) {
  if (!value.includes("{query}")) return false
  try {
    return ["http:", "https:"].includes(
      new URL(value.replaceAll("{query}", "test")).protocol
    )
  } catch {
    return false
  }
}

export const defaultSearchEngines: SearchEngine[] = [
  {
    id: "google",
    name: "Google",
    icon: "google.svg",
    url: "https://www.google.com/search?q={query}",
  },
  {
    id: "bing",
    name: "Bing",
    icon: "bing.svg",
    url: "https://www.bing.com/search?q={query}",
  },
  {
    id: "bingcn",
    name: "Bing 中国版",
    icon: "bing.svg",
    url: "https://cn.bing.com/search?q={query}",
  },
  {
    id: "duckduckgo",
    name: "DuckDuckGo",
    icon: "duckduckgo.svg",
    url: "https://duckduckgo.com/?q={query}",
  },
  {
    id: "yahoo",
    name: "Yahoo",
    icon: "yahoo.svg",
    url: "https://search.yahoo.com/search?p={query}",
  },
  {
    id: "brave",
    name: "Brave Search",
    icon: "brave.svg",
    url: "https://search.brave.com/search?q={query}",
  },
  {
    id: "ecosia",
    name: "Ecosia",
    icon: "ecosia.ico",
    url: "https://www.ecosia.org/search?q={query}",
  },
  {
    id: "startpage",
    name: "Startpage",
    icon: "startpage.ico",
    url: "https://www.startpage.com/sp/search?query={query}",
  },
  {
    id: "yandex",
    name: "Yandex",
    icon: "yandex.ico",
    url: "https://yandex.com/search/?text={query}",
  },
]

export function isPresetEngine(id: string) {
  return defaultSearchEngines.some((engine) => engine.id === id)
}

export function buildSearchUrl(template: string, query: string): string | null {
  const keywords = query.trim()
  if (!keywords || !isSearchUrl(template)) return null
  return template.replaceAll("{query}", encodeURIComponent(keywords))
}
