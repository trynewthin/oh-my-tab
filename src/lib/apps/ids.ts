export const appIds = ["settings", "components"] as const
export type AppId = (typeof appIds)[number]

export function isAppWindow(id: string | null): id is AppId {
  return appIds.some((appId) => appId === id)
}
