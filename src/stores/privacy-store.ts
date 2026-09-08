import { suggestionOrigins } from "@/lib/search-suggestions"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export const NETWORK_ORIGINS = {
  suggestions: suggestionOrigins,
  icons: ["https://a.favicon.im/*", "https://icons.duckduckgo.com/*"],
}
export type NetworkFeature = keyof typeof NETWORK_ORIGINS
export const extensionApi = () =>
  (
    globalThis as typeof globalThis & {
      chrome?: {
        permissions?: {
          request: (value: { origins: string[] }) => Promise<boolean>
          remove: (value: { origins: string[] }) => Promise<boolean>
          contains: (value: { origins: string[] }) => Promise<boolean>
        }
        search?: {
          query: (value: {
            text: string
            disposition: "NEW_TAB"
          }) => Promise<void>
        }
      }
    }
  ).chrome

type PrivacyState = {
  suggestions: boolean
  icons: boolean
  browserSearch: boolean
  setBrowserSearch: (value: boolean) => void
}
export const usePrivacyStore = create<PrivacyState>()(
  persist(
    (set) => ({
      suggestions: false,
      icons: false,
      browserSearch: true,
      setBrowserSearch: (browserSearch) => set({ browserSearch }),
    }),
    {
      name: "omt.privacy",
      version: 1,
      migrate: (persisted) => {
        const old = persisted as Partial<PrivacyState> | undefined
        return {
          suggestions: false,
          icons: old?.icons === true,
          browserSearch: old?.browserSearch !== false,
        }
      },
    }
  )
)

export async function setNetworkFeature(
  feature: NetworkFeature,
  enabled: boolean
) {
  const permissions = extensionApi()?.permissions
  const origins = NETWORK_ORIGINS[feature]
  if (enabled && permissions && !(await permissions.request({ origins })))
    return false
  usePrivacyStore.setState({ [feature]: enabled })
  if (!enabled && permissions) await permissions.remove({ origins })
  return true
}
export async function networkAllowed(feature: NetworkFeature) {
  if (!usePrivacyStore.getState()[feature]) return false
  const permissions = extensionApi()?.permissions
  return (
    !permissions || permissions.contains({ origins: NETWORK_ORIGINS[feature] })
  )
}

export const supportsBrowserSearch = () =>
  typeof extensionApi()?.search?.query === "function"

export async function applyNetworkChoices(choices: {
  suggestions: boolean
  icons: boolean
}) {
  const permissions = extensionApi()?.permissions
  const features: NetworkFeature[] = ["suggestions", "icons"]
  const origins = features.flatMap((feature) =>
    choices[feature] ? NETWORK_ORIGINS[feature] : []
  )
  const granted =
    !origins.length || !permissions || (await permissions.request({ origins }))
  const next = {
    suggestions: granted && choices.suggestions,
    icons: granted && choices.icons,
  }
  usePrivacyStore.setState(next)
  const removed = features.flatMap((feature) =>
    next[feature] ? [] : NETWORK_ORIGINS[feature]
  )
  if (permissions && removed.length)
    await permissions.remove({ origins: removed })
  return granted
}

export const canSelectBrowserSearch = () =>
  import.meta.env.DEV || supportsBrowserSearch()
