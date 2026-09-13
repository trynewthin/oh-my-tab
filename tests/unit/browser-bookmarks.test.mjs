import assert from 'node:assert/strict'
import test from 'node:test'
import { loadModule } from '../helpers/load-module.mjs'
const { parseBookmarkTree, readBrowserBookmarks, supportsBrowserBookmarks } = await loadModule('browser-bookmarks.ts')
const { mergeBookmarks } = await loadModule('bookmark-import.ts')
const factory = {
  createTab: ({ name, url }) => ({ id: crypto.randomUUID(), kind: 'tab', name, url, size: 'small', color: '#6c8bd4' }),
  createFolder: ({ name, tabs }) => ({ id: crypto.randomUUID(), kind: 'folder', name, tabs, size: 'large', color: '#6c8bd4' }),
}
const tree = [{ id: '0', title: '', children: [
  { id: '1', title: '书签栏', children: [
    { id: '10', title: '工作', children: [
      { id: '11', title: '文档', url: 'https://example.com/docs' },
      { id: '12', title: '脚本', url: 'javascript:alert(1)' },
      { id: '13', title: '无效', url: 'not a URL' },
    ] },
    { id: '14', title: '', url: 'https://other.example' },
  ] },
  { id: '2', title: '其他书签', children: [] },
] }]
test('browser tree preserves folder paths and order while filtering unsupported URLs', () => {
  assert.deepEqual(parseBookmarkTree(tree), {
    bookmarks: [
      { name: '文档', url: 'https://example.com/docs', folder: '书签栏 / 工作' },
      { name: 'other.example', url: 'https://other.example/', folder: '书签栏' },
    ],
    invalid: 2,
  })
  assert.deepEqual(parseBookmarkTree([]), { bookmarks: [], invalid: 0 })
})
test('repeated native imports deduplicate and merge into existing folders', () => {
  const parsed = parseBookmarkTree(tree)
  const first = mergeBookmarks([], parsed.bookmarks, factory)
  const second = mergeBookmarks(first.items, [...parsed.bookmarks, { name: '新增', url: 'https://new.example/', folder: '书签栏 / 工作' }], factory)
  assert.equal(second.duplicates, 2)
  assert.equal(second.added, 1)
  assert.equal(second.items.length, 2)
  assert.equal(second.items[0].tabs.length, 2)
  assert.equal(first.items[0].tabs.length, 1, 'original state remains unchanged')
})
test('bookmarks API is accessed only after the user grants permission', async () => {
  globalThis.location = { protocol: 'chrome-extension:' }
  const calls = []
  globalThis.chrome = { permissions: { request: async options => {
    calls.push(options)
    globalThis.chrome.bookmarks = { getTree: async () => { calls.push('getTree'); return tree } }
    return true
  } } }
  const result = await readBrowserBookmarks()
  assert.equal(result.bookmarks.length, 2)
  assert.deepEqual(calls, [{ permissions: ['bookmarks'] }, 'getTree'])
  globalThis.chrome.permissions.request = async () => false
  globalThis.chrome.bookmarks.getTree = async () => { throw new Error('must not read after denial') }
  await assert.rejects(readBrowserBookmarks(), /未获得/)
})
test('web pages cannot request native bookmark access', async () => {
  globalThis.location = { protocol: 'http:' }
  globalThis.chrome = { permissions: { request: async () => { throw new Error('must not request on a web page') } } }
  assert.equal(supportsBrowserBookmarks(), false)
  await assert.rejects(readBrowserBookmarks(), /扩展/)
})
