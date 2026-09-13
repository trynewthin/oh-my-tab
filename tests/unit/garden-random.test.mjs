import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'
const source = await readFile(new URL('../../src/lib/garden.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext}})
const {generateGardenSeed, plantFamily} = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
test('new plant families stay balanced and avoid the two most recent families', () => {
  const history = []
  const counts = Array(6).fill(0)
  for (let i=0;i<60;i++) {
    const seed = generateGardenSeed(history, (i*1234567)>>>0)
    const family = plantFamily(seed)
    assert.ok(!history.slice(-2).some(p => plantFamily(p.seed)===family))
    assert.ok(!history.some(p => p.seed===seed))
    counts[family]++
    assert.ok(Math.max(...counts)-Math.min(...counts)<=1)
    history.push({slot:4,seed,plantedAt:i,species:'flowers'})
  }
})
test('generation is deterministic for the same history and entropy', () => {
  assert.equal(generateGardenSeed([],1234),generateGardenSeed([],1234))
})
