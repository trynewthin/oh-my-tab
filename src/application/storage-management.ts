import {
  workspace,
  workspaceRevision,
  dataError,
} from "@/application/workspace"
import { editStoredEntries } from "@/lib/storage"
import { cacheDeletionPlan } from "@/lib/data/maintenance"
import type { StorageCategory } from "@/lib/storage-usage"

export async function clearStorageCategories(categories: StorageCategory[]) {
  const business = categories.filter(
    (id): id is "preferences" | "background" | "bookmarks" | "garden" =>
      id === "preferences" ||
      id === "background" ||
      id === "bookmarks" ||
      id === "garden"
  )
  if (business.length) {
    try {
      await workspace.execute({
        command: { type: "workspace.reset", categories: business },
        expectedRevision: await workspaceRevision(),
        requestId: crypto.randomUUID(),
        issuedAt: Date.now(),
      })
    } catch (error) {
      throw dataError(error)
    }
  }
  if (
    !categories.some((category) =>
      ["icons", "unused-images", "webdav"].includes(category)
    )
  )
    return
  await editStoredEntries((entries) => {
    const plan = cacheDeletionPlan(entries)
    return {
      updates: categories.includes("webdav")
        ? { "omt.webdav": null, "omt.sync-provider": "local" }
        : {},
      remove: plan.remove.filter((key) =>
        key.startsWith("cache:")
          ? categories.includes("icons")
          : categories.includes("unused-images")
      ),
    }
  })
}
