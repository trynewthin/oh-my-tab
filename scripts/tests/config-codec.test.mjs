import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
const source = await readFile(new URL('../../src/lib/config-codec.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
const { encodeConfig, decodeConfig } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
test('compressed configuration preserves Unicode and layout data', async () => {
  const data = { version: 1, items: Array.from({ length: 100 }, (_, i) => ({ id: String(i), name: '工作台', url: 'https://example.com', x: 4, y: i })) }
  const encoded = await encodeConfig(data)
  assert.deepEqual(await decodeConfig(encoded), data)
  assert.deepEqual(await decodeConfig(`\n ${encoded}\n`), data)
  assert.ok(encoded.length < JSON.stringify(data).length / 3)
})
test('invalid version, malformed data and truncated payloads fail', async () => {
  await assert.rejects(decodeConfig('OMT2:abc'))
  await assert.rejects(decodeConfig('OMT1:invalid!'))
  const text = await encodeConfig({ a: 'test' })
  await assert.rejects(decodeConfig(text.slice(0, -8)))
})
