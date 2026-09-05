import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { indexedDB } from 'fake-indexeddb'
import ts from 'typescript'

const source = await readFile(new URL('../../src/lib/favicon-cache.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext },
})
let instance = 0
const freshCache = () => import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}#${instance++}`)

test('favicon downloads persist across page instances and coalesce requests', async () => {
  const locks = new Map()
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: indexedDB })
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { protocol: 'chrome-extension:' } } })
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {
    locks: { request(key, callback) {
      const pending = (locks.get(key) ?? Promise.resolve()).then(callback)
      locks.set(key, pending.catch(() => {}))
      return pending
    } },
  } })
  // Decoding is a browser responsibility; this test exercises storage and requests.
  globalThis.Image = class {
    naturalWidth = 32
    naturalHeight = 32
    set src(value) { if (value) queueMicrotask(() => this.onload?.()) }
  }
  globalThis.DOMParser = class {
    parseFromString(html) {
      return {
        querySelector: () => null,
        querySelectorAll: () => html.startsWith('declared') ? [{ rel: 'icon', getAttribute: () => '/custom-favicon.svg' }] : [],
      }
    }
  }
  const requests = []
  globalThis.fetch = async (url, options) => {
    if (!url.includes('favicon') && !url.includes('icons.duckduckgo.com')) {
      return new Response(url.includes('declared.example') ? 'declared' + ' '.repeat(3 * 1024 * 1024) : '')
    }
    requests.push({ url, options })
    return url.includes('missing.example') || (url.includes('fallback.example') && !url.includes('icons.duckduckgo.com')) || (url.includes('second.example') && !url.includes('a.favicon.im'))
      ? new Response(null, { status: 404 })
      : new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/x-icon' } })
  }

  const first = await freshCache()
  assert.equal(first.faviconKey('https://example.com/path?q=1'), 'https://example.com/favicon.ico')
  assert.equal(await first.getCachedFavicon('javascript:alert(1)'), null)
  assert.equal(requests.length, 0)

  const [a, b] = await Promise.all([
    first.getCachedFavicon('https://example.com/one'),
    first.getCachedFavicon('https://example.com/two'),
  ])
  assert.match(a, /^blob:/)
  assert.equal(a, b)
  assert.equal(requests.length, 1)
  assert.equal(requests[0].options.credentials, 'omit')

  const nextPage = await freshCache()
  assert.match(await nextPage.getCachedFavicon('https://example.com/another'), /^blob:/)
  assert.equal(requests.length, 1, 'page reload reads IndexedDB without downloading')

  const anotherPage = await freshCache()
  await Promise.all([
    nextPage.getCachedFavicon('https://concurrent.example/a'),
    anotherPage.getCachedFavicon('https://concurrent.example/b'),
  ])
  assert.equal(requests.length, 2, 'cross-page lock avoids duplicate download')

  assert.equal(await first.getCachedFavicon('https://missing.example'), null)
  const afterFailure = await freshCache()
  assert.equal(await afterFailure.getCachedFavicon('https://missing.example'), null)
  assert.equal(requests.length, 5, 'all three sources fail once, then cooldown persists')
  const start = requests.length
  assert.match(await first.getCachedFavicon('https://fallback.example'), /^blob:/)
  assert.deepEqual(requests.slice(start).map(r => new URL(r.url).hostname), [
    'fallback.example', 'a.favicon.im', 'icons.duckduckgo.com',
  ])
  const reloaded = await freshCache()
  assert.match(await reloaded.getCachedFavicon('https://fallback.example'), /^blob:/)
  assert.equal(requests.length, start + 3, 'fallback success is persisted')
  assert.match(await first.getCachedFavicon('https://second.example'), /^blob:/)
  assert.equal(requests.length, start + 5, 'stop immediately after second source succeeds')
  assert.ok(requests.at(-1).url.includes('throw-error-on-404=true'))
  assert.match(await first.getCachedFavicon('https://declared.example/app'), /^blob:/)
  assert.equal(requests.at(-1).url, 'https://declared.example/custom-favicon.svg')
  const beforeRefresh = requests.length
  await first.getCachedFavicon('https://declared.example/app', true)
  assert.equal(requests.length, beforeRefresh + 1)
  assert.equal(requests.at(-1).options.cache, 'reload')
  const afterRefresh = await freshCache()
  await afterRefresh.getCachedFavicon('https://declared.example/app')
  assert.equal(requests.length, beforeRefresh + 1)

  globalThis.chrome = { tabs: { query: async () => [{ url: 'https://live.example/app#one', favIconUrl: 'https://live.example/runtime-favicon.png' }] } }
  await first.getCachedFavicon('https://live.example/app#two')
  assert.equal(requests.at(-1).url, 'https://live.example/runtime-favicon.png')
  delete globalThis.chrome

})
