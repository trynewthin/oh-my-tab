import { useLayoutEffect } from "react"
import { setHomeBurningFramesPaused } from "@/components/effects/burning-clock"
import HomeBackground from "@/pages/home/components/home-background"
import HomeUI from "@/pages/home/components/home-ui"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

export default function HomePage() {
  const effectsPaused = useSystemOverlayStore(
    (state) => state.active === "settings" || state.closingApp === "settings"
  )
  useLayoutEffect(() => {
    setHomeBurningFramesPaused(effectsPaused)
    return () => setHomeBurningFramesPaused(false)
  }, [effectsPaused])

  return (
    <main
      data-home-ui
      data-home-effects-paused={effectsPaused ? "" : undefined}
      className="relative isolate min-h-svh"
    >
      <HomeBackground />
      <HomeUI />
    </main>
  )
}
