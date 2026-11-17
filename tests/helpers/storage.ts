import type { Page } from "@playwright/test"
import { STORAGE_VERSION } from "../../src/lib/data-version"

export function readStoredValue<T>(
  page: Page,
  key: string
): Promise<T | undefined> {
  return page.evaluate(
    (storageKey) =>
      new Promise<T | undefined>((resolve, reject) => {
        const request = indexedDB.open("oh-my-tab-workspace")
        request.onupgradeneeded = () => request.transaction?.abort()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const read = db
            .transaction("entries")
            .objectStore("entries")
            .get(storageKey)
          read.onerror = () => {
            db.close()
            reject(read.error)
          }
          read.onsuccess = () => {
            resolve(read.result?.value)
            db.close()
          }
        }
      }),
    key
  )
}

export async function readStoredState<T>(page: Page, key: string): Promise<T> {
  const raw = await readStoredValue<string>(page, key)
  if (typeof raw !== "string")
    throw new Error(`Missing persisted state: ${key}`)
  return JSON.parse(raw).state as T
}

export async function writeStoredState<T>(
  page: Page,
  key: string,
  state: T,
  version = STORAGE_VERSION
): Promise<void> {
  await waitForStorageWrites(page)
  return page.evaluate(
    ({ storageKey, value, storageVersion }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("oh-my-tab-workspace")
        request.onupgradeneeded = () => request.transaction?.abort()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction("entries", "readwrite")
          transaction.onabort = () => {
            db.close()
            reject(transaction.error)
          }
          transaction.oncomplete = () => {
            db.close()
            resolve()
          }
          transaction.objectStore("entries").put({
            key: storageKey,
            value: JSON.stringify({ state: value, version: storageVersion }),
          })
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
