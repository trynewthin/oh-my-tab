import { lazy, Suspense } from "react"
import { useTranslation } from "react-i18next"
import DotMatrix from "@/components/dot-matrix/dot-matrix"
import TabGrid from "@/components/tab-grid/tab-grid"
import Toaster from "@/components/ui/toaster"
import {
  backgroundPaletteStyle,
  getBackgroundPalette,
} from "@/lib/background-palettes"
import { runHomeSearch } from "@/application/home-search"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import HomeContentContainer from "@/pages/home/components/home-content-container"
import SearchPrompt from "@/components/search/search-prompt"

// Only first-run users (or an explicit replay) need the tour; keep its bundle
// off the initial page for everyone else.
const OnboardingTour = lazy(
  () => import("@/components/onboarding/onboarding-tour")
)

export default function HomeUI() {
  const { t } = useTranslation()
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  const layoutMode = useHomeSettingsStore((state) => state.layoutMode)
  const needsTour = useOnboardingStore((state) => !state.seen || state.replay)
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const paletteId = useHomeSettingsStore((state) => state.backgroundPalette)
  const palette = getBackgroundPalette(paletteId)
  function search(query: string) {
    runHomeSearch(query, t)
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
        aria-label={t("shell.home.gridScroll")}
        className="h-full [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain outline-none [overflow-anchor:none] [&::-webkit-scrollbar]:hidden"
      >
        {layoutMode === "traditional" && (
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
            <SearchPrompt onSubmit={search} />
          </div>
        )}
        <div
          className={
            layoutMode === "free"
              ? "min-h-full px-6 sm:px-10 xl:px-12"
              : "px-6 sm:px-10 xl:px-12"
          }
        >
          <TabGrid fullViewport={layoutMode === "free"} />
        </div>
      </div>
      {needsTour && (
        <Suspense fallback={null}>
          <OnboardingTour />
        </Suspense>
      )}
      <Toaster />
    </div>
  )
}
