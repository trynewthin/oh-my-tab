import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

async function load(name) {
  const source = await readFile(new URL(`../../src/components/effects/${name}.ts`, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const { burningCell, createBurningTexture } = await load('burning-texture')
const { particleCell, createParticleCell } = await load('particle-texture')

const frames = [
  [undefined, 1, 1], [0, 1, 1], [2.5, 1, 1], [2.5, 0.4, 1],
  [2.5, 0.4, 2], [2.5, 0, 2], [40, 1, 2], [40, 1, 0],
  [undefined, 1, 1], [0.2, 1, 1],
]

test('burning rows remain correct across time, reveal, amplitude and row changes', () => {
  for (const columns of [1, 19, 37]) {
    const paint = createBurningTexture('#3478f6', 183477, columns)
    for (const [time, visibility, amplitude] of frames) {
      for (const y of [0, 1, 7, 23, 0]) {
        for (let x = 0; x < columns; x++) {
          assert.equal(paint(x, y, time, visibility, amplitude),
            burningCell('#3478f6', 183477, x, y, columns, time, visibility, amplitude))
        }
      }
    }
  }
})

test('prepared particles preserve pointer, reduced motion and reveal states', () => {
  for (let y = 0; y < 14; y++) {
    for (let x = 0; x < 19; x++) {
      const paint = createParticleCell('#eb9970', 739281, x, y, 19)
      for (const [time, visibility, amplitude] of frames) {
        for (const pointer of [null, { x: x * 9 + 4, y: y * 9 + 4 }, { x: 160, y: 100 }]) {
          assert.deepEqual(paint(time, visibility, amplitude, pointer),
            particleCell('#eb9970', 739281, x, y, 19, time, visibility, amplitude, pointer))
        }
      }
    }
  }
})
