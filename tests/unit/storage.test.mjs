import assert from 'node:assert/strict'
import test from 'node:test'
import { indexedDB } from 'fake-indexeddb'
import { loadModule } from '../helpers/load-module.mjs'

const locks = new Map()
Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { locks: { request(key, fn) { const promise = (locks.get(key) ?? Promise.resolve()).then(fn); locks.set(key, promise.catch(() => {})); return promise } } } })
globalThis.indexedDB = indexedDB
globalThis.location = { protocol: 'http:' }
globalThis.window = new EventTarget()
const legacy = new Map()
globalThis.localStorage = { getItem: key => legacy.get(key) ?? null }
globalThis.BroadcastChannel = class { postMessage() {} close() {} }

test('IndexedDB migration, original assets, atomic restore and stale-write protection', async () => {
  const storage = await loadModule('storage.ts')
  const home = JSON.stringify({ state: { backgroundImage: null }, version: 0 })
  legacy.set('omt.home-settings', home)
  await storage.initializeStorage()
  assert.equal((await storage.readEntries(['omt.home-settings']))['omt.home-settings'], home)
  const blob = new Blob([new Uint8Array([0, 128, 255, 18])], { type: 'image/png' })
  const id = await storage.putAsset(blob)
  assert.deepEqual(await (await storage.getAsset(id)).arrayBuffer(), await blob.arrayBuffer())
  const revision = await storage.storageRevision()
  await storage.replaceData({ 'omt.home-settings': 'new', 'omt.theme-mode': 'dark' }, revision)
  await assert.rejects(storage.replaceData({ 'omt.home-settings': 'stale', 'omt.theme-mode': 'light' }, revision), /更新/)
  assert.deepEqual(await storage.readEntries(['omt.home-settings', 'omt.theme-mode']), { 'omt.home-settings': 'new', 'omt.theme-mode': 'dark' })
  await storage.flushStorage().catch(() => {})
  await storage.initializeStorage()
  assert.equal((await storage.readEntries(['omt.home-settings']))['omt.home-settings'], 'new', 'migration never overwrites current data')
  await storage.editStoredEntries(() => ({ updates: { 'omt.theme-mode': 'reset' }, remove: [id] }))
  assert.equal((await storage.readEntries(['omt.theme-mode']))['omt.theme-mode'], 'reset')
  assert.equal((await storage.readEntries(['omt.home-settings']))['omt.home-settings'], 'new')
  await assert.rejects(storage.getAsset(id), /缺失/)

})
test('Chrome storage keeps binary assets lossless and restricts access', async () => {
  globalThis.location.protocol = 'chrome-extension:'
  const values = {}
  let access
  globalThis.chrome = { storage: { local: {
    get: async keys => Object.fromEntries((keys ?? Object.keys(values)).map(key => [key, values[key]])),
    set: async data => { Object.assign(values, JSON.parse(JSON.stringify(data))) },
    remove: async keys => keys.forEach(key => delete values[key]),
    setAccessLevel: async options => { access = options.accessLevel },
  } } }
  const storage = await loadModule('storage.ts')
  await storage.initializeStorage()
  assert.equal(access, 'TRUSTED_CONTEXTS')
  const blob = new Blob([new Uint8Array([255, 0, 52, 191])], { type: 'image/webp' })
  const id = await storage.putAsset(blob)
  assert.match(values[id].value, /^data:image\/webp;base64,/)
  assert.deepEqual(await (await storage.getAsset(id)).arrayBuffer(), await blob.arrayBuffer())
  const persist = storage.storageOptions().storage
  await persist.getItem('omt.theme-mode')
  persist.setItem('omt.theme-mode', { state: { theme: 'dark' }, version: 0 })
  persist.setItem('omt.theme-mode', { state: { theme: 'light' }, version: 0 })
  await storage.flushStorage()
  assert.equal(JSON.parse(values['omt.theme-mode']).state.theme, 'light')
  values['omt.theme-mode'] = JSON.stringify({ state: { theme: 'system' }, version: 0 })
  persist.setItem('omt.theme-mode', { state: { theme: 'dark' }, version: 0 })
  await assert.rejects(storage.flushStorage(), /更新/)
  assert.equal(JSON.parse(values['omt.theme-mode']).state.theme, 'system')
  values['omt.home-settings'] = JSON.stringify({ state: { backgroundImage: id } })
  values[id].createdAt = 1
  values['asset:orphan'] = { createdAt: 1, value: 'old' }
  values['cache:favicon:x'] = {}
  await storage.clearCachedData()
  assert.ok(values[id], 'current image survives cleanup')
  assert.equal(values['asset:orphan'], undefined)
  assert.equal(values['cache:favicon:x'], undefined)
  await storage.editStoredEntries(() => ({ updates: { 'omt.webdav': null }, remove: [id] }))
  assert.equal(values['omt.webdav'], null)
  assert.equal(values[id], undefined)
  assert.equal(JSON.parse(values['omt.theme-mode']).state.theme, 'system')

})
