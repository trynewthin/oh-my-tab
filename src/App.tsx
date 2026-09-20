import { lazy, Suspense, useEffect, useState } from "react"
import AppRouter from "@/router"
import { useComponentsApplicationStore } from "@/stores/components-application-store"
import { useSettingsStore } from "@/stores/settings-store"

const SettingsApplication = lazy(
  () => import("@/components/settings/settings-application")
)
const ComponentsApplication = lazy(
  () => import("@/components/tab-grid/grid-item-dialog")
)

// The settings tree is heavy (fflate zip, WebDAV, every section panel) and
// only needed once the user opens it. Defer the chunk until the first open
// and keep it mounted afterwards so open/close animations keep working.
function DeferredSettingsApplication() {
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
      <SettingsApplication />
    </Suspense>
  )
}

function DeferredComponentsApplication() {
  const open = useComponentsApplicationStore((state) => state.open)
  const setOpen = useComponentsApplicationStore((state) => state.setOpen)
  const [everOpened, setEverOpened] = useState(
    () => useComponentsApplicationStore.getState().open
  )
  useEffect(
    () =>
      useComponentsApplicationStore.subscribe((state) => {
        if (state.open) setEverOpened(true)
      }),
    []
  )
  if (!everOpened) return null
  return (
    <Suspense fallback={null}>
      <ComponentsApplication open={open} onClose={() => setOpen(false)} />
    </Suspense>
  )
}

export default function App() {
  return (
    <>
      <AppRouter />
      <DeferredSettingsApplication />
      <DeferredComponentsApplication />
    </>
  )
}
