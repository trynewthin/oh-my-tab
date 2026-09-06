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
  function search(query: string) {
    const { engines, selectedId } = useSearchEngineStore.getState()
    const engine = engines.find((item) => item.id === selectedId)
    if (!engine) return
    const url = buildSearchUrl(engine.url, query)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="relative z-10 flex h-dvh flex-col overflow-hidden px-6 pt-6">
      <HomeContentContainer>
        {topComponent === "dot-matrix" && <DotMatrix />}
      </HomeContentContainer>
      <HomePromptInput onSubmit={search} />
      <TabGrid />
      <OnboardingTour />
      <Toaster />
    </div>
  )
}
