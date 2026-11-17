import { flushStorage } from "@/lib/storage"
import { workspaceClient } from "@/lib/data/service-client"
export { workspaceClient as workspace } from "@/lib/data/service-client"
import { DataError } from "@/lib/data/errors"
import { i18n } from "@/i18n"

// Localization is an application concern, not part of the data contract.
export function dataError(error: unknown): Error {
  if (!(error instanceof DataError))
    return error instanceof Error ? error : new Error(String(error))
  const key =
    error.code === "LEGACY_CHANGED"
      ? "core.storage.legacyChanged"
      : error.code === "UNSUPPORTED_VERSION"
        ? "core.storage.readOnly"
        : error.code === "CONFLICT"
          ? "core.storage.staleWrite"
          : error.code === "MISSING_ASSET"
            ? "core.storage.missingAsset"
            : "settings.errors.invalidContentOrSettings"
  return new Error(i18n.t(key), { cause: error })
}

export async function workspaceRevision() {
  await flushStorage()
  return (await workspaceClient.readSections([])).revision
}
