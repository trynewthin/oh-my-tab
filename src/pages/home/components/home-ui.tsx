import {
  extensionApi,
  canSelectBrowserSearch,
  usePrivacyStore,
} from "@/stores/privacy-store"
import {
  backgroundPaletteStyle,
  getBackgroundPalette,
} from "@/lib/background-palettes"
import { toast } from "@/stores/toast-store"
import Toaster from "@/components/ui/toaster"
import OnboardingTour from "@/components/onboarding/onboarding-tour"
import HomePromptInput from "@/pages/home/components/home-prompt-input"

import HomeContentContainer from "@/pages/home/components/home-content-container"

import DotMatrix from "@/components/dot-matrix/dot-matrix"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

import { useSearchEngineStore } from "@/stores/search-engine-store"
import { buildSearchUrl } from "@/lib/search-engines"

import TabGrid from "@/components/tab-grid/tab-grid"

export default function HomeUI() {
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const paletteId = useHomeSettingsStore((state) => state.backgroundPalette)
  const palette = getBackgroundPalette(paletteId)
  function search(query: string) {
    if (usePrivacyStore.getState().browserSearch && canSelectBrowserSearch()) {
      const api = extensionApi()
      if (api?.search)
        void api.search
          .query({ text: query, disposition: "NEW_TAB" })
          .catch(() => toast("搜索失败，请重试", "error"))
      else toast("开发预览：已选择浏览器默认。实际搜索请在扩展中测试。")
      return
    }
    const { engines, selectedId } = useSearchEngineStore.getState()
    const engine = engines.find((item) => item.id === selectedId)
    if (!engine) return
    const url = buildSearchUrl(engine.url, query)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      data-home-palette={palette.id}
      data-home-background-type={backgroundType}
      className="relative z-10 h-dvh overflow-hidden"
      style={backgroundPaletteStyle(paletteId)}
    >
      <div
        data-grid-scroll
        tabIndex={0}
        aria-label="滚动标签网格"
        className="h-full [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain outline-none [overflow-anchor:none] [&::-webkit-scrollbar]:hidden"
      >
        <div className="sticky top-0 isolate z-40 px-6 pt-6 pb-3 sm:px-10 xl:px-12">
          {backgroundType === "solid" && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 -bottom-8 -z-10"
              style={{
                background:
                  "linear-gradient(to bottom, var(--home-background), var(--home-background) calc(100% - 96px), transparent)",
              }}
            />
          )}
          {topComponent === "dot-matrix" && (
            <HomeContentContainer>
              <DotMatrix />
            </HomeContentContainer>
          )}
          <HomePromptInput onSubmit={search} />
        </div>
        <div className="px-6 sm:px-10 xl:px-12">
          <TabGrid />
        </div>
      </div>
      <OnboardingTour />
      <Toaster />
    </div>
  )
}
