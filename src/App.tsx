import { lazy, Suspense, useEffect, useState } from "react"
import AppRouter from "@/router"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

const SettingsApplication = lazy(
  () => import("@/components/settings/settings-application")
)
const ComponentsApplication = lazy(
  () => import("@/components/tab-grid/grid-item-dialog")
)
const SystemCreateDialog = lazy(
  () => import("@/components/application/system-create-dialog")
)

// The settings tree is heavy (fflate zip, WebDAV, every section panel) and
// only needed once the user opens it. Defer the chunk until the first open
// and keep it mounted afterwards so open/close animations keep working.
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
  return (
    <>
      <AppRouter />
      <DeferredSettingsApplication />
      <DeferredComponentsApplication />
      <DeferredCreateDialog />
    </>
  )
}
