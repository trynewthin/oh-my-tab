export const appIds = ["settings", "components", "notes"] as const
export type AppId = (typeof appIds)[number]
export type AppWindowId = AppId | "apps"

export function isAppWindow(id: string | null): id is AppWindowId {
  return id === "apps" || appIds.some((appId) => appId === id)
}
