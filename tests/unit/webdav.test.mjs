import assert from 'node:assert/strict'
import test from 'node:test'
import { loadModule } from '../helpers/load-module.mjs'
const webdav = await loadModule('webdav.ts', {
  'import { extensionApi } from "@/stores/privacy-store"': 'const extensionApi = () => globalThis.chrome',
  'import { MAX_BACKUP_BYTES } from "./backup"': 'const MAX_BACKUP_BYTES = 64 * 1024 * 1024',
})
const connection = { url: 'https://dav.example.com/backup', username: 'user', password: 'secret' }
test('WebDAV only authorizes the chosen HTTPS origin', async () => {
  assert.throws(() => webdav.normalizeWebdav({ ...connection, url: 'http://example.com' }), /HTTPS/)
  assert.throws(() => webdav.normalizeWebdav({ ...connection, url: 'https://user:pass@example.com/' }), /凭据/)
  let requested
  globalThis.chrome = { permissions: { request: async value => { requested = value; return true } } }
  assert.equal((await webdav.authorizeWebdav(connection)).url, 'https://dav.example.com/backup/')
  assert.deepEqual(requested, { origins: ['https://dav.example.com/*'] })
})
test('WebDAV protects create and overwrite with conditional requests', async () => {
  const calls = []
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response(null, { status: 201 }) }
  const blob = new Blob(['zip'])
  await webdav.uploadRemoteBackup(connection, blob, null, false)
  assert.equal(calls[0].url, 'https://dav.example.com/backup/oh-my-tab.zip')
  assert.equal(calls[0].options.headers['If-None-Match'], '*')
  assert.equal(calls[0].options.redirect, 'error')
  assert.equal(calls[0].options.credentials, 'omit')
  await webdav.uploadRemoteBackup(connection, blob, '"revision"', true)
  assert.equal(calls[1].options.headers['If-Match'], '"revision"')
  await assert.rejects(webdav.uploadRemoteBackup(connection, blob, null, true), /ETag/)
  await assert.rejects(webdav.uploadRemoteBackup(connection, blob, 'W/"revision"', true), /ETag/)
  globalThis.fetch = async () => new Response(null, { status: 412 })
  await assert.rejects(webdav.uploadRemoteBackup(connection, blob, '"old"', true), /变化/)
})
test('WebDAV distinguishes missing backups, authentication and downloads', async () => {
  globalThis.fetch = async () => new Response(null, { status: 404 })
  assert.equal(await webdav.fetchRemoteBackup(connection), null)
  globalThis.fetch = async () => new Response(null, { status: 401 })
  await assert.rejects(webdav.fetchRemoteBackup(connection), /认证/)
  globalThis.fetch = async () => new Response('backup', { headers: { ETag: '"version"' } })
  const result = await webdav.fetchRemoteBackup(connection)
  assert.equal(result.etag, '"version"')
  assert.equal(await result.blob.text(), 'backup')
})
