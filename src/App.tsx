import { lazy, Suspense, useEffect, useState } from "react"
import AppRouter from "@/router"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

async function retryDevImport<T>(load: () => Promise<T>): Promise<T> {
  const delays = import.meta.env.DEV ? [0, 100, 300] : [0]
  let failure: unknown
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay))
    try {
      return await load()
    } catch (error) {
      failure = error
    }
  }
  throw failure
}

const loadSettingsApplication = () =>
  retryDevImport(() => import("@/components/settings/settings-application"))
const loadComponentsApplication = () =>
  import("@/components/tab-grid/grid-item-dialog")
const loadSystemCreateDialog = () =>
  import("@/components/application/system-create-dialog")

const SettingsApplication = lazy(loadSettingsApplication)
const ComponentsApplication = lazy(loadComponentsApplication)
const SystemCreateDialog = lazy(loadSystemCreateDialog)

// The settings tree is heavy and only needed after the first open; it stays
// mounted afterwards so open/close animations keep working.
function DeferredSettingsApplication() {
  const [everOpened, setEverOpened] = useState(
    () => useSystemOverlayStore.getState().active === "settings"
  )
  useEffect(
    () =>
      useSystemOverlayStore.subscribe((state) => {
        if (state.active === "settings") setEverOpened(true)
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
  const open = useSystemOverlayStore((state) => state.active === "components")
  const close = useSystemOverlayStore((state) => state.close)
  const [everOpened, setEverOpened] = useState(
    () => useSystemOverlayStore.getState().active === "components"
  )
  useEffect(
    () =>
      useSystemOverlayStore.subscribe((state) => {
        if (state.active === "components") setEverOpened(true)
      }),
    []
  )
  if (!everOpened) return null
  return (
    <Suspense fallback={null}>
      <ComponentsApplication open={open} onClose={() => close("components")} />
    </Suspense>
  )
}

function DeferredCreateDialog() {
  const active = useSystemOverlayStore((state) => state.active)
  const close = useSystemOverlayStore((state) => state.close)
  if (active !== "add-tab" && active !== "add-folder") return null
  return (
    <Suspense fallback={null}>
      <SystemCreateDialog
        key={active}
        kind={active === "add-tab" ? "tab" : "folder"}
        onClose={() => close(active)}
      />
    </Suspense>
  )
}

export default function App() {
  useEffect(() => {
    const preload = () => {
      // A failed warm-up must leave the normal lazy-load path available to retry.
      void Promise.allSettled([
        loadSettingsApplication(),
        loadComponentsApplication(),
        loadSystemCreateDialog(),
      ])
    }
    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(preload)
      return () => window.cancelIdleCallback(handle)
    }
    const timer = setTimeout(preload, 1500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <AppRouter />
      <DeferredSettingsApplication />
      <DeferredComponentsApplication />
      <DeferredCreateDialog />
    </>
  )
}
