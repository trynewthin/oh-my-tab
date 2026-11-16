// Sync provider registry. Adding a provider = implement SyncBackend plus a
// ProviderDef entry here (plus its connection UI); the sync engine itself is
// backend-agnostic.
export type SyncProviderDef = {
  id: string
  remote: boolean
}

export const SYNC_PROVIDERS: readonly SyncProviderDef[] = [
  { id: "local", remote: false },
  { id: "webdav", remote: true },
] as const

export type SyncProviderId = "local" | "webdav"

export function isSyncProviderId(value: unknown): value is SyncProviderId {
  return SYNC_PROVIDERS.some((provider) => provider.id === value)
}
