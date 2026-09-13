import assert from 'node:assert/strict'
import test from 'node:test'
import { zipSync, unzipSync, strToU8 } from 'fflate'
import { loadModule } from '../helpers/load-module.mjs'
const { encodeBackup, decodeBackup } = await loadModule('backup-codec.ts')
test('ZIP preserves original image bytes and Unicode data', async () => {
  const bytes = Uint8Array.from({ length: 50000 }, (_, i) => i % 256)
  const config = { version: 1, name: '工作台', home: { backgroundImage: null }, items: ['https://example.com'] }
  const zip = await encodeBackup(config, new Blob([bytes], { type: 'image/png' }))
  const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  assert.deepEqual(files['assets/background'], bytes)
  const restored = await decodeBackup(zip)
  assert.deepEqual(restored.config, config)
  assert.deepEqual(new Uint8Array(await restored.image.arrayBuffer()), bytes)
  assert.equal(restored.image.type, 'image/png')
})
test('ZIP supports a backup without an image', async () => {
  const restored = await decodeBackup(await encodeBackup({ items: [] }))
  assert.deepEqual(restored, { config: { items: [] } })
})
test('ZIP rejects damaged or missing images before restore', async () => {
  const zip = await encodeBackup({}, new Blob([new Uint8Array([1, 2, 3])], { type: 'image/webp' }))
  const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  files['assets/background'][0] ^= 1
  await assert.rejects(decodeBackup(new Blob([zipSync(files)])), /图片/)
  delete files['assets/background']
  await assert.rejects(decodeBackup(new Blob([zipSync(files)])), /图片/)
})
test('ZIP rejects unknown versions, paths and oversized expanded manifests', async () => {
  await assert.rejects(decodeBackup(new Blob([zipSync({ 'manifest.json': strToU8('{"format":"oh-my-tab","version":99}') })])), /版本/)
  await assert.rejects(decodeBackup(new Blob([zipSync({ '../manifest.json': strToU8('{}') })])), /结构/)
  const bomb = zipSync({ 'manifest.json': new Uint8Array(8 * 1024 * 1024 + 1) })
  await assert.rejects(decodeBackup(new Blob([bomb])), /限制/)
  await assert.rejects(decodeBackup(new Blob(['broken'])))
})

test('ZIP rejects altered configuration even if the JSON remains valid', async () => {
  const zip = await encodeBackup({ name: 'original' })
  const files = unzipSync(new Uint8Array(await zip.arrayBuffer()))
  const manifest = JSON.parse(new TextDecoder().decode(files['manifest.json']))
  manifest.config.name = 'changed'
  files['manifest.json'] = strToU8(JSON.stringify(manifest))
  await assert.rejects(decodeBackup(new Blob([zipSync(files)])), /校验失败/)
})
