import { describe, expect, it } from "vitest"
import { readdir, readFile } from "node:fs/promises"

const root = new URL("../../", import.meta.url)
const storesDir = new URL("src/stores/", root)

async function read(path: string) {
  return readFile(new URL(path, root), "utf8")
}

// Persisted stores that hydrate.ts is not allowed to rehydrate by design.
// Everything else using persist() must appear in the `stores` array, or its
// data silently never reloads after startup.
const exempt: string[] = []

describe("persist registration", () => {
  it("registers every persisted store in hydrate.ts", async () => {
    const files = (await readdir(storesDir)).filter((file) =>
      file.endsWith(".ts")
    )
    const persisted: { file: string; hook?: string }[] = []
    for (const file of files) {
      const source = await readFile(new URL(file, storesDir), "utf8")
      if (!/\bpersist\s*(<[^>]*>)?\s*\(/.test(source)) continue
      const hook = source.match(/export const (use\w+Store)\s*=\s*create/)
      persisted.push({ file, hook: hook?.[1] })
    }

    const hydrate = await read("src/lib/hydrate.ts")
    const registered = new Set(
      [...hydrate.matchAll(/^\s*(use\w+Store),?\s*$/gm)].map((m) => m[1])
    )

    for (const { file, hook } of persisted) {
      expect(
        hook,
        `${file}: persisted store must export a useXxxStore hook`
      ).toBeTruthy()
      if (exempt.includes(hook!)) continue
      expect(
        registered.has(hook!),
        `${file}: ${hook} uses persist() but is missing from hydrate.ts stores[] — its data will never rehydrate`
      ).toBe(true)
    }
  })

  it("declares every omt.* persist name as a storage key", async () => {
    const storage = await read("src/lib/storage.ts")
    const keys = new Set(
      [...storage.matchAll(/"(omt\.[^"]+)"/g)].map((m) => m[1])
    )
    const files = (await readdir(storesDir)).filter((file) =>
      file.endsWith(".ts")
    )
    for (const file of files) {
      const source = await readFile(new URL(file, storesDir), "utf8")
      for (const [, name] of source.matchAll(/\bname:\s*"(omt\.[^"]+)"/g))
        expect(
          keys.has(name),
          `${file}: persist name "${name}" is not in DATA_KEYS or DEVICE_KEYS — backups and sync will skip it`
        ).toBe(true)
    }
  })
})
