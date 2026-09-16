import { lazy, Suspense, useEffect, useState } from "react"
import AppRouter from "@/router"
import { useSettingsStore } from "@/stores/settings-store"

const SettingsDialog = lazy(
  () => import("@/components/settings/settings-dialog")
)

// The settings tree is heavy (fflate zip, WebDAV, every section panel) and
// only needed once the user opens it. Defer the chunk until the first open
// and keep it mounted afterwards so open/close animations keep working.
function DeferredSettingsDialog() {
  const [everOpened, setEverOpened] = useState(
    () => useSettingsStore.getState().open
  )
  useEffect(
    () =>
      useSettingsStore.subscribe((state) => {
        if (state.open) setEverOpened(true)
      }),
    []
  )
  if (!everOpened) return null
  return (
    <Suspense fallback={null}>
      <SettingsDialog />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <AppRouter />
      <DeferredSettingsDialog />
    </>
  )
}

