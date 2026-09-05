import type { IncomingMessage, ServerResponse } from "node:http"
import type { Plugin } from "vite"

const MAX_BYTES = 2 * 1024 * 1024

async function faviconResponse(
  request: IncomingMessage,
  response: ServerResponse
) {
  if (request.method !== "GET") {
    response.writeHead(405).end()
    return
  }
  try {
    const params = new URL(request.url ?? "", "http://localhost").searchParams
    const maxBytes = params.get("kind") === "page" ? 8 * 1024 * 1024 : MAX_BYTES
    const direct = params.get("url")
    const origin = params.get("origin")
    const source = params.get("source") ?? "origin"
    const site = new URL(direct ?? origin ?? "")
    if (
      !["origin", "favicon-im", "duckduckgo"].includes(source) ||
      !["http:", "https:"].includes(site.protocol) ||
      site.username ||
      site.password ||
      (!direct && (site.pathname !== "/" || site.search || site.hash))
    ) {
      response.writeHead(400).end()
      return
    }
    const domain = encodeURIComponent(site.hostname)
    const endpoint = direct
      ? site
      : source === "favicon-im"
        ? `https://a.favicon.im/${domain}?larger=true&throw-error-on-404=true`
        : source === "duckduckgo"
          ? `https://icons.duckduckgo.com/ip3/${domain}.ico`
          : new URL("/favicon.ico", site.origin)
    const upstream = await fetch(endpoint, {
      signal: AbortSignal.timeout(8000),
      headers: {
        Accept: params.get("kind") === "page" ? "text/html" : "image/*",
      },
    })
    if (!upstream.ok || !upstream.body) {
      response.writeHead(404, { "Cache-Control": "no-store" }).end()
      return
    }
    const reader = upstream.body.getReader()
    const chunks: Buffer[] = []
    let size = 0
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        size += value.byteLength
        if (size > maxBytes) {
          await reader.cancel()
          response.writeHead(413).end()
          return
        }
        chunks.push(Buffer.from(value))
      }
    } finally {
      reader.releaseLock()
    }
    response.writeHead(200, {
      "Content-Type": upstream.headers.get("content-type") || "image/x-icon",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Favicon-Page-Url": upstream.url,
    })
    response.end(Buffer.concat(chunks))
  } catch {
    response.writeHead(502, { "Cache-Control": "no-store" }).end()
  }
}

export function faviconProxy(): Plugin {
  return {
    name: "favicon-download-proxy",
    configureServer(server) {
      server.middlewares.use("/__favicon", (request, response) => {
        void faviconResponse(request, response)
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use("/__favicon", (request, response) => {
        void faviconResponse(request, response)
      })
    },
  }
}
