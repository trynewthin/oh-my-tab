import { indexedDB } from "fake-indexeddb"

// Browser globals that src/lib/storage.ts touches at module scope or during
// use. These are direct assignments (not vi.stubGlobal) so tests that call
// vi.unstubAllGlobals() cannot remove them.
const locks = new Map<string, Promise<void>>()
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    locks: {
      request<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
        const promise = (locks.get(key) ?? Promise.resolve()).then(fn)
        locks.set(
          key,
          promise.then(
            () => {},
            () => {}
          )
        )
        return promise
      },
    },
  },
})
Object.defineProperty(globalThis, "indexedDB", {
  configurable: true,
  value: indexedDB,
})
Object.defineProperty(globalThis, "location", {
  configurable: true,
  value: { protocol: "http:" },
})
Object.defineProperty(globalThis, "window", {
  configurable: true,
  value: new EventTarget(),
})
const legacyLocalStorage = new Map<string, string>()
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string) => legacyLocalStorage.get(key) ?? null,
  },
})
export { legacyLocalStorage }
Object.defineProperty(globalThis, "BroadcastChannel", {
  configurable: true,
  value: class {
    postMessage() {}
    close() {}
  },
})
