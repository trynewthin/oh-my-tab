import { lazy, Suspense } from "react"
import AppHost from "@/components/application/app-host"
import AppRouter from "@/router"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

const SystemCreateDialog = lazy(
  () => import("@/components/application/system-create-dialog")
)

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
      <AppHost />
      <DeferredCreateDialog />
    </>
  )
}
