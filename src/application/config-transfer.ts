import { migrateConfig } from "@/lib/migrations/v2"
import { workspace, dataError } from "@/application/workspace"
import { configSchema, type Config } from "@/lib/data/config"
import { i18n } from "@/i18n"
import { dataUrlToBlob } from "@/lib/data/assets"

export type { Config } from "@/lib/data/config"

export function validateConfig(value: unknown): Config {
  if (!value || typeof value !== "object")
    throw new Error(i18n.t("settings.errors.invalidContent"))
  const parsed = configSchema.safeParse(migrateConfig(value))
  if (!parsed.success) {
    const reason = parsed.error.issues.find(
      (issue) =>
        issue.message === "duplicateIds" || issue.message === "invalidGrid"
    )?.message
    throw new Error(
      i18n.t(
        reason === "duplicateIds"
          ? "settings.errors.duplicateIds"
          : reason === "invalidGrid"
            ? "settings.errors.invalidGrid"
            : "settings.errors.invalidContentOrSettings"
      )
    )
  }
  const image = parsed.data.home.backgroundImage
  // Files may contain embedded images; local asset references are never portable.
  if (
    image !== null &&
    (image.length > 2_000_000 ||
      !/^data:image\/(?:png|jpeg|webp);base64,/i.test(image))
  )
    throw new Error(i18n.t("settings.errors.invalidContentOrSettings"))
  return parsed.data
}

export async function importConfig(
  config: Config,
  revision: string | undefined
) {
  try {
    const embedded = config.home.backgroundImage
    const image = embedded?.startsWith("data:")
      ? dataUrlToBlob(embedded)
      : undefined
    if (image)
      config = { ...config, home: { ...config.home, backgroundImage: null } }
    await workspace.replace({
      config,
      image,
      expectedRevision: revision,
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
    })
  } catch (error) {
    throw dataError(error)
  }
}
