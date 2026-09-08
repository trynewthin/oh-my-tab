export const suggestionEndpoints: Record<string, string> = {
  google: "https://suggestqueries.google.com/complete/search?client=firefox&q=",
  bing: "https://www.bing.com/osjson.aspx?query=",
  bingcn: "https://cn.bing.com/osjson.aspx?query=",
  duckduckgo: "https://duckduckgo.com/ac/?type=list&q=",
  yahoo:
    "https://search.yahoo.com/sugg/gossip/gossip-us-ura/?output=fxjson&command=",
  brave: "https://search.brave.com/api/suggest?q=",
  ecosia: "https://ac.ecosia.org/autocomplete?type=list&q=",
  yandex: "https://suggest.yandex.com/suggest-ff.cgi?part=",
}
export const suggestionOrigins = Object.values(suggestionEndpoints).map(
  (url) => `${new URL(url).origin}/*`
)
export function suggestionUrl(engine: string, query: string) {
  const endpoint = Object.hasOwn(suggestionEndpoints, engine)
    ? suggestionEndpoints[engine]
    : undefined
  return endpoint ? endpoint + encodeURIComponent(query) : null
}
