import { readdir, readFile } from "node:fs/promises"
import path from "node:path"

// Static architecture guard for the import-direction contract:
//   model/infrastructure (`src/lib`) -> never `components`, `pages`, `stores`
//   application orchestration         -> never `components`, `pages`
//   state (`src/stores`)              -> never `components`, `pages`
//   reusable components               -> never `pages`
// It also rejects internal static import cycles anywhere under `src`; entry
// composition (`main.tsx`, `App.tsx`, `router/`, `layouts/`) stays free to
// depend downward.
//
// Algorithm: every `.ts`/`.tsx` file under `src` is tokenized by a small state
// machine that drops comments, regex literals and template literals while
// keeping string literals. Import/export statements are read off that token
// stream, so `import type`, side-effect imports, `export ... from` and
// multiline clauses are all covered. Specifiers resolve through the
// `@/* -> src/*` alias and relative paths against `.ts`, `.tsx` and
// `index.ts(x)`. Resolved edges feed two graphs: boundary checks (static and
// statically-literal dynamic imports) and cycle detection (static imports
// only, because a deferred `import()` never participates in module
// evaluation).
//
// Limitations: no type checking; external, type-only-to-`.d.ts` and
// unresolvable specifiers are ignored; the tokenizer does not model a regex
// literal nested inside a template interpolation.

const root = path.resolve(import.meta.dirname, "../..")
const sourceDir = path.join(root, "src")
const extensions = [".ts", ".tsx"]

const boundaryRules = [
  { from: "lib", to: ["components", "pages", "stores"] },
  { from: "application", to: ["components", "pages"] },
  { from: "stores", to: ["components", "pages"] },
  { from: "components", to: ["pages"] },
]

const relative = (file) => path.relative(root, file).split(path.sep).join("/")

const isTestFile = (name) => /\.(test|spec)\.[cm]?tsx?$/.test(name)
const isSourceFile = (name) =>
  extensions.includes(path.extname(name)) && !name.endsWith(".d.ts")

async function collectSource(dir) {
  const files = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "__tests__") continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...(await collectSource(full)))
    else if (isSourceFile(entry.name) && !isTestFile(entry.name))
      files.push(full)
  }
  return files
}

const identifierChars = /[A-Za-z0-9_$]/
const punctuation = new Set([..."(){}[];,=*:.<>!?|&+-"])
const valueEnd = new Set(["word", "string", "template", "regex", ")", "]"])
const regexKeywords = new Set([
  "return",
  "typeof",
  "instanceof",
  "in",
  "of",
  "case",
  "delete",
  "void",
  "new",
  "do",
  "else",
  "yield",
  "await",
  "default",
])
const statementBoundaryWords = new Set(["import", "export"])

function scan(source) {
  const tokens = []
  const length = source.length

  const readQuoted = (start) => {
    const quote = source[start]
    let index = start + 1
    while (index < length) {
      const char = source[index]
      if (char === "\\") {
        index += 2
        continue
      }
      if (char === quote) return index + 1
      if (char === "\n") return index
      index += 1
    }
    return length
  }

  const readTemplate = (start) => {
    let index = start + 1
    while (index < length) {
      const char = source[index]
      if (char === "\\") {
        index += 2
        continue
      }
      if (char === "`") return index + 1
      if (char === "$" && source[index + 1] === "{") {
        index = readInterpolation(index + 2)
        continue
      }
      index += 1
    }
    return length
  }

  const readInterpolation = (start) => {
    let index = start
    let depth = 1
    while (index < length) {
      const char = source[index]
      if (char === "\\") {
        index += 2
        continue
      }
      if (char === "`") {
        index = readTemplate(index)
        continue
      }
      if (char === "\"" || char === "'") {
        index = readQuoted(index)
        continue
      }
      if (char === "/" && source[index + 1] === "/") {
        const newline = source.indexOf("\n", index)
        index = newline < 0 ? length : newline + 1
        continue
      }
      if (char === "/" && source[index + 1] === "*") {
        const close = source.indexOf("*/", index + 2)
        index = close < 0 ? length : close + 2
        continue
      }
      if (char === "{") depth += 1
      else if (char === "}") {
        depth -= 1
        if (depth === 0) return index + 1
      }
      index += 1
    }
    return length
  }

  const readRegex = (start) => {
    let index = start + 1
    let inClass = false
    while (index < length) {
      const char = source[index]
      if (char === "\\") {
        index += 2
        continue
      }
      if (char === "\n") return 0
      if (inClass) {
        if (char === "]") inClass = false
      } else if (char === "[") inClass = true
      else if (char === "/") {
        index += 1
        while (index < length && /[a-z]/i.test(source[index])) index += 1
        return index
      }
      index += 1
    }
    return 0
  }

  let previous = null
  let index = 0
  while (index < length) {
    const char = source[index]
    if (char === "/" && source[index + 1] === "/") {
      const newline = source.indexOf("\n", index)
      index = newline < 0 ? length : newline + 1
      continue
    }
    if (char === "/" && source[index + 1] === "*") {
      const close = source.indexOf("*/", index + 2)
      index = close < 0 ? length : close + 2
      continue
    }
    if (char === "\"" || char === "'") {
      const end = readQuoted(index)
      tokens.push({ type: "string", value: source.slice(index + 1, end - 1) })
      previous = "string"
      index = end
      continue
    }
    if (char === "`") {
      index = readTemplate(index)
      previous = "template"
      continue
    }
    if (char === "/" && !valueEnd.has(previous)) {
      const end = readRegex(index)
      if (end) {
        previous = "regex"
        index = end
        continue
      }
    }
    if (identifierChars.test(char)) {
      let end = index
      while (end < length && identifierChars.test(source[end])) end += 1
      const value = source.slice(index, end)
      tokens.push({ type: "word", value })
      previous = regexKeywords.has(value) ? value : "word"
      index = end
      continue
    }
    if (punctuation.has(char)) {
      tokens.push({ type: "punct", value: char })
      previous = char
      index += 1
      continue
    }
    previous = "other"
    index += 1
  }
  return tokens
}

function readSpecifiers(tokens) {
  const specifiers = []
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== "word") continue
    if (token.value !== "import" && token.value !== "export") continue
    const next = tokens[index + 1]
    if (!next) continue
    if (token.value === "import") {
      if (next.type === "punct" && next.value === "(") {
        const argument = tokens[index + 2]
        const closing = tokens[index + 3]
        if (
          argument?.type === "string" &&
          closing?.type === "punct" &&
          closing.value === ")"
        )
          specifiers.push({ specifier: argument.value, kind: "dynamic" })
        continue
      }
      if (next.type === "string") {
        specifiers.push({ specifier: next.value, kind: "static" })
        continue
      }
      if (next.type === "punct" && next.value === ".") continue
    }
    for (let cursor = index + 1; cursor < tokens.length; cursor += 1) {
      const current = tokens[cursor]
      if (current.type === "punct") {
        if (
          current.value === ";" ||
          current.value === "=" ||
          current.value === "("
        )
          break
        continue
      }
      if (current.type !== "word") continue
      if (statementBoundaryWords.has(current.value)) break
      if (current.value !== "from") continue
      const literal = tokens[cursor + 1]
      if (literal?.type === "string")
        specifiers.push({ specifier: literal.value, kind: "static" })
      break
    }
  }
  return specifiers
}

const files = await collectSource(sourceDir)
const sourceFiles = new Set(files)

function resolveSpecifier(importer, specifier) {
  const base = specifier.startsWith("@/")
    ? path.join(sourceDir, specifier.slice(2))
    : specifier.startsWith(".")
      ? path.resolve(path.dirname(importer), specifier)
      : null
  if (!base) return null
  const candidates = [
    base,
    ...extensions.map((extension) => base + extension),
    ...extensions.map((extension) => path.join(base, `index${extension}`)),
  ]
  return candidates.find((candidate) => sourceFiles.has(candidate)) ?? null
}

// importer -> imported -> { static }
const edges = new Map()
for (const file of files) {
  const outgoing = new Map()
  edges.set(file, outgoing)
  for (const { specifier, kind } of readSpecifiers(
    scan(await readFile(file, "utf8"))
  )) {
    const target = resolveSpecifier(file, specifier)
    if (!target) continue
    const edge = outgoing.get(target) ?? { static: false }
    edge.static ||= kind === "static"
    outgoing.set(target, edge)
  }
}

// `src/lib/foo.ts` -> `lib`; entry files (`src/App.tsx`) have no rule.
const area = (file) => relative(file).split("/")[1]

const violations = []
for (const [importer, outgoing] of edges) {
  const rule = boundaryRules.find((candidate) => candidate.from === area(importer))
  if (!rule) continue
  for (const imported of outgoing.keys())
    if (rule.to.includes(area(imported)))
      violations.push({ importer, imported, from: rule.from, to: area(imported) })
}
violations.sort(
  (a, b) =>
    relative(a.importer).localeCompare(relative(b.importer)) ||
    relative(a.imported).localeCompare(relative(b.imported))
)

const staticEdges = new Map()
for (const [importer, outgoing] of edges)
  staticEdges.set(
    importer,
    [...outgoing]
      .filter(([, edge]) => edge.static)
      .map(([target]) => target)
  )

const cycles = []
const cycleKeys = new Set()
const state = new Map()
const stack = []

function recordCycle(cycle) {
  const body = cycle.slice(0, -1)
  const key = body
    .map((_, index) => [...body.slice(index), ...body.slice(0, index)])
    .map((rotation) => rotation.map(relative).join(" -> "))
    .sort()[0]
  if (cycleKeys.has(key)) return
  cycleKeys.add(key)
  cycles.push(key)
}

function visit(node) {
  state.set(node, 1)
  stack.push(node)
  for (const next of staticEdges.get(node) ?? []) {
    const status = state.get(next) ?? 0
    if (status === 1) recordCycle([...stack.slice(stack.indexOf(next)), next])
    else if (status === 0) visit(next)
  }
  stack.pop()
  state.set(node, 2)
}

for (const file of files) if ((state.get(file) ?? 0) === 0) visit(file)
cycles.sort()

let failed = false
if (violations.length) {
  failed = true
  console.error(`Forbidden import directions (${violations.length}):`)
  for (const { importer, imported, from, to } of violations)
    console.error(
      `  ${relative(importer)} -> ${relative(imported)} ` +
        `(${from} must not depend on ${to})`
    )
}
if (cycles.length) {
  failed = true
  console.error(`Internal import cycles (${cycles.length}):`)
  for (const cycle of cycles) console.error(`  ${cycle}`)
}
if (failed) {
  console.error("FAIL: architecture boundaries are violated.")
  process.exitCode = 1
} else {
  console.log(
    `PASS: ${files.length} modules respect the import directions and contain no static cycle.`
  )
}
