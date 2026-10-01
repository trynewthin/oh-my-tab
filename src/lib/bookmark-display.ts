/** Secondary copy, never a navigation target; omit credentials and URL queries. */
export function bookmarkHost(url: string) {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return ""
    return parsed.host.replace(/^www\./, "")
  } catch {
    return ""
  }
}
