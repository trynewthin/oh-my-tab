import type { Page } from "@playwright/test"

export function readStoredState<T>(page: Page, key: string): Promise<T> {
  return page.evaluate(
    (storageKey) =>
      new Promise<T>((resolve, reject) => {
        const request = indexedDB.open("oh-my-tab-data", 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const read = db
            .transaction("entries")
            .objectStore("entries")
            .get(storageKey)
          read.onerror = () => reject(read.error)
          read.onsuccess = () => {
            resolve(JSON.parse(read.result).state)
            db.close()
          }
        }
      }),
    key
  )
}

export function writeStoredState<T>(
  page: Page,
  key: string,
  state: T,
  version = 0
): Promise<void> {
  return page.evaluate(
    ({ storageKey, value, storageVersion }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("oh-my-tab-data", 1)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction("entries", "readwrite")
          transaction.onerror = () => reject(transaction.error)
          transaction.oncomplete = () => {
            db.close()
            resolve()
          }
          transaction
            .objectStore("entries")
            .put(
              JSON.stringify({ state: value, version: storageVersion }),
              storageKey
            )
        }
      }),
    { storageKey: key, value: state, storageVersion: version }
  )
}

export async function waitForStorageWrites(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
    await navigator.locks.request("omt-write", async () => {})
  })
}
