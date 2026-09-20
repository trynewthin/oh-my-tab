import { buildSearchUrl } from "@/lib/search-engines"
import {
  canSelectBrowserSearch,
  extensionApi,
  usePrivacyStore,
} from "@/stores/privacy-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { toast } from "@/stores/toast-store"

export function runHomeSearch(query: string, t: (key: string) => string) {
  if (usePrivacyStore.getState().browserSearch && canSelectBrowserSearch()) {
    const api = extensionApi()
    if (api?.search)
      void api.search
        .query({ text: query, disposition: "NEW_TAB" })
        .catch(() => toast(t("shell.home.searchFailed"), "error"))
    else toast(t("shell.home.previewBrowserDefault"))
    return
  }
  const { engines, selectedId } = useSearchEngineStore.getState()
  const engine = engines.find((item) => item.id === selectedId)
  if (!engine) return
  const url = buildSearchUrl(engine.url, query)
  if (url) window.open(url, "_blank", "noopener,noreferrer")
}
