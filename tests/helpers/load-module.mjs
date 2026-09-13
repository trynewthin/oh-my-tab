import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
const require = createRequire(import.meta.url)
let instance = 0
export async function loadModule(file, replacements = {}) {
  let source = await readFile(new URL(`../../src/lib/${file}`, import.meta.url), 'utf8')
  for (const [from, to] of Object.entries(replacements)) source = source.replace(from, to)
  for (const specifier of ['fflate', 'zustand/middleware']) source = source.replaceAll(`"${specifier}"`, JSON.stringify(pathToFileURL(require.resolve(specifier)).href))
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext } })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}#${instance++}`)
}
