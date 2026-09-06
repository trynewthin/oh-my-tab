import type { Plugin, Connect } from "vite"

const handle: Connect.NextHandleFunction = async (request, response) => {
  response.setHeader("Cache-Control", "no-store")
  if (request.method !== "GET") {
    response.writeHead(405).end()
    return
  }
  const query = new URL(request.url ?? "", "http://localhost").searchParams
    .get("q")
    ?.trim()
  if (!query || query.length > 200) {
    response.writeHead(400).end()
    return
  }
  try {
    const upstream = await fetch(
      `https://www.bing.com/osjson.aspx?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!upstream.ok) throw new Error("Suggestions unavailable")
    const data: unknown = await upstream.json()
    response.writeHead(200, {
      "Content-Type": "application/json",
      "X-Content-Type-Options": "nosniff",
    })
    response.end(JSON.stringify(data))
  } catch {
    response.writeHead(502).end()
  }
}

export function searchSuggestionsProxy(): Plugin {
  return {
    name: "search-suggestions-proxy",
    configureServer(server) {
      server.middlewares.use("/__suggestions", handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use("/__suggestions", handle)
    },
  }
}
