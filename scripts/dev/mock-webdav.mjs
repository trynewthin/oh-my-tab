// Minimal WebDAV server for development and the nightly preview app.
// Files persist under .mock-webdav/ (gitignored). Strong content-hash ETags
// and conditional writes let the sync engine exercise its conflict paths.
// CORS is permissive so a browser page can call it directly.
//
//   npm run dev:webdav            # serves .mock-webdav/ on :8080
//   node scripts/dev/mock-webdav.mjs <root> <port>

import { createHash } from "node:crypto"
import { createServer } from "node:http"
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises"
import { join, normalize } from "node:path"

const root = process.argv[2] ?? ".mock-webdav"
const port = Number(process.argv[3] ?? 8080)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, PUT, DELETE, OPTIONS, PROPFIND",
  "Access-Control-Allow-Headers":
    "Authorization, Content-Type, If-Match, If-None-Match, Depth, Overwrite, Destination",
  "Access-Control-Expose-Headers": "ETag, Last-Modified, DAV",
  DAV: "1",
}

const etag = (body) => `"${createHash("sha1").update(body).digest("hex")}"`

function filePath(url) {
  const path = decodeURIComponent(new URL(url, "http://x").pathname)
  const resolved = normalize(join(root, path))
  if (
    !resolved.startsWith(normalize(root) + "/") &&
    resolved !== normalize(root)
  )
    return null
  return resolved
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

createServer(async (req, res) => {
  const send = (status, headers = {}, body) => {
    res.writeHead(status, { ...CORS, ...headers })
    res.end(body)
  }
  try {
    if (req.method === "OPTIONS") return send(204)
    const file = filePath(req.url ?? "/")
    if (!file) return send(403)
    if (req.method === "PROPFIND")
      return send(
        207,
        { "Content-Type": "application/xml" },
        '<?xml version="1.0"?><D:multistatus xmlns:D="DAV:"/>'
      )
    if (req.method === "GET" || req.method === "HEAD") {
      try {
        const body = await readFile(file)
        const info = await stat(file)
        return send(
          200,
          {
            "Content-Type": "application/octet-stream",
            ETag: etag(body),
            "Last-Modified": info.mtime.toUTCString(),
          },
          req.method === "HEAD" ? undefined : body
        )
      } catch {
        return send(404)
      }
    }
    if (req.method === "PUT") {
      const body = await readBody(req)
      const existing = await readFile(file).catch(() => null)
      const ifNoneMatch = req.headers["if-none-match"]
      const ifMatch = req.headers["if-match"]
      if (ifNoneMatch === "*" && existing) return send(412)
      if (ifMatch && (!existing || etag(existing) !== ifMatch)) return send(412)
      await mkdir(join(file, ".."), { recursive: true })
      await writeFile(file, body)
      return send(existing ? 204 : 201, { ETag: etag(body) })
    }
    if (req.method === "DELETE") {
      const existing = await readFile(file).catch(() => null)
      if (!existing) return send(404)
      const ifMatch = req.headers["if-match"]
      if (ifMatch && etag(existing) !== ifMatch) return send(412)
      await unlink(file)
      return send(204)
    }
    send(405)
  } catch (error) {
    console.error(error)
    send(500)
  }
}).listen(port, () => {
  console.log(`mock WebDAV → http://localhost:${port}/ (root: ${root})`)
})
