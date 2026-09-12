import assert from 'node:assert/strict'
import test from 'node:test'
import { loadModule } from './load-module.mjs'
const usage = await loadModule('storage-usage.ts')
globalThis.storageUsageFixture = usage
let entries
const saved = state => JSON.stringify({ state, version: 0 })
const replacements = {
  'import { editStoredEntries } from "./storage"': 'const editStoredEntries = (plan) => globalThis.editFixture(plan)',
  'import { categoryFor, storedState, type StorageCategory } from "./storage-usage"': 'const { categoryFor, storedState } = globalThis.storageUsageFixture',
}
for (const [name, file, state] of [
  ['useHomeSettingsStore', 'home-settings-store', { color: '#3478f6', backgroundImage: null, backgroundType: 'solid' }],
  ['useThemeStore', 'theme-store', { theme: 'light' }],
  ['useSearchEngineStore', 'search-engine-store', { engines: [], selectedId: '' }],
  ['useTabGridStore', 'tab-grid-store', { items: [{ id: 'mock' }], layouts: {}, mockDataVersion: 7 }],
  ['useGardenStore', 'garden-store', { points: 6, album: [], initialized: false }],
]) replacements[`import { ${name} } from "@/stores/${file}"`] = `const ${name} = { getInitialState: () => (${JSON.stringify(state)}) }`
globalThis.editFixture = plan => {
  const { updates, remove } = plan(entries)
  Object.assign(entries, updates)
  for (const key of remove) delete entries[key]
}
const { clearStorageCategories } = await loadModule('storage-management.ts', replacements)
function setup() {
  entries = {
    'omt.home-settings': saved({ backgroundImage: 'asset:current', backgroundType: 'image', color: '#ffffff' }),
    'omt.tab-grid': saved({ items: [{ id: 'bookmark' }], layouts: {} }),
    'omt.privacy': saved({ icons: true }),
    'omt.webdav': JSON.stringify({ url: 'https://example.com/', username: 'user' }),
    'asset:current': { createdAt: 1, value: new Blob(['original']) },
    'asset:old': { createdAt: 1, value: new Blob(['old']) },
    'asset:recent': { createdAt: Date.now(), value: new Blob(['new']) },
    'cache:favicon:x': { blob: new Blob(['icon']) },
  }
}
test('usage categorizes data and accounts for nested Blob bytes', () => {
  setup()
  const rows = usage.summarizeStorage(entries)
  assert.equal(rows.find(row => row.id === 'background').count, 1)
  assert.equal(rows.find(row => row.id === 'unused-images').count, 2)
  const unused = rows.find(row => row.id === 'unused-images')
  assert.ok(unused.clearableBytes < unused.bytes)
  assert.equal(usage.valueBytes(new Blob(['12345'])), 5)
  assert.equal(usage.formatStorageBytes(1024), '1.0 KB')
})
test('selective cache clearing preserves active, recent and unselected data', async () => {
  setup()
  await clearStorageCategories(['icons', 'unused-images', 'system'])
  assert.equal(entries['cache:favicon:x'], undefined)
  assert.equal(entries['asset:old'], undefined)
  assert.ok(entries['asset:current'])
  assert.ok(entries['asset:recent'])
  assert.ok(entries['omt.privacy'])
  assert.equal(usage.storedState(entries['omt.tab-grid']).items.length, 1)
})
test('clearing background unlinks it without resetting other preferences', async () => {
  setup()
  await clearStorageCategories(['background'])
  assert.equal(entries['asset:current'], undefined)
  assert.equal(usage.storedState(entries['omt.home-settings']).backgroundImage, null)
  assert.equal(usage.storedState(entries['omt.home-settings']).color, '#ffffff')
  assert.ok(entries['asset:old'])
})
test('resetting preferences preserves background while clearing bookmarks prevents mock data resurrection', async () => {
  setup()
  await clearStorageCategories(['preferences', 'bookmarks', 'webdav'])
  assert.equal(usage.storedState(entries['omt.home-settings']).backgroundImage, 'asset:current')
  assert.equal(usage.storedState(entries['omt.home-settings']).color, '#3478f6')
  assert.deepEqual(usage.storedState(entries['omt.tab-grid']).items, [])
  assert.equal(usage.storedState(entries['omt.tab-grid']).mockDataVersion, 7)
  assert.equal(entries['omt.webdav'], null)
  assert.equal(entries['omt.sync-provider'], 'local')
  assert.ok(entries['omt.privacy'])
})
