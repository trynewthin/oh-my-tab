export const DATA_KEYS = [
  "omt.home-settings",
  "omt.theme-mode",
  "omt.search-engines",
  "omt.tab-grid",
  "omt.garden",
  "omt.onboarding",
] as const

export const DEVICE_KEYS = [
  "omt.privacy",
  "omt.webdav",
  "omt.sync-provider",
  "omt.locale",
] as const

export const REVISION_KEY = "omt.revision"

export const documentKeys = {
  home: "omt.home-settings",
  theme: "omt.theme-mode",
  onboarding: "omt.onboarding",
  search: "omt.search-engines",
  grid: "omt.tab-grid",
  garden: "omt.garden",
} as const
export type WorkspaceSection = keyof typeof documentKeys
export const documentRevisionKey = (section: WorkspaceSection) =>
  `doc-revision:${section}`

export function documentRevisions(updates: Record<string, unknown>) {
  return Object.fromEntries(
    (Object.entries(documentKeys) as [WorkspaceSection, string][])
      .filter(([, key]) => Object.hasOwn(updates, key))
      .map(([section]) => [section, crypto.randomUUID()])
  ) as Partial<Record<WorkspaceSection, string>>
}

export function revisionEntries(
  revisions: Partial<Record<WorkspaceSection, string>>
) {
  return Object.fromEntries(
    Object.entries(revisions).map(([section, revision]) => [
      documentRevisionKey(section as WorkspaceSection),
      revision,
    ])
  )
}
