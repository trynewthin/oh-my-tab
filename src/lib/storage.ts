// Compatibility facade. Framework integration and the database driver are
// separate modules; new use cases depend on data contracts/repository ports.
import { clearEntries, editStoredEntries } from "@/lib/data/storage-engine"
import { resetStorageAdapter } from "@/lib/data/zustand-storage"
import { cacheDeletionPlan } from "@/lib/data/maintenance"
export * from "@/lib/data/storage-engine"
export {
  storageOptions,
  drainReadIssues,
  type ReadIssue,
} from "@/lib/data/zustand-storage"
export {
  putAsset,
  getAsset,
  blobToDataUrl,
  dataUrlToBlob,
} from "@/lib/data/assets"

export async function clearAllData() {
  await clearEntries()
  resetStorageAdapter()
}
export async function clearCachedData() {
  await editStoredEntries(cacheDeletionPlan)
}
