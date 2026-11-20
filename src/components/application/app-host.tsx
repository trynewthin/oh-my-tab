import {
  Component,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { appRepository } from "@/application/apps"
import { appRegistry } from "@/components/application/app-registry"
import AppStatusCard from "@/components/application/app-status-card"
import {
  AppWindowExpansionContext,
  useAppWindowExpansion,
} from "@/components/application/app-window-expansion"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { isAppWindow, type AppId } from "@/lib/apps/ids"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import "./app-window-backdrop.css"

class AppErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function AppWindow({ id, open }: { id: AppId; open: boolean }) {
  const { t } = useTranslation()
  const [openedOnMount] = useState(open)
  const [ready, setReady] = useState(false)
  const [storage] = useState(() => appRepository.storageFor(id))
  const pointerStartedInside = useRef(false)
  const registerPopup = useAppWindowExpansion(setReady)
  const finishClosing = useSystemOverlayStore((state) => state.finishClosingApp)
  const close = () => useSystemOverlayStore.getState().close(id)
  const { View, title, description, icon, layout } = appRegistry[id]

  useEffect(() => {
    if (!openedOnMount && !open) finishClosing(id)
    if (!open) return
    function trackPointerOrigin(event: PointerEvent) {
      pointerStartedInside.current =
        event.target instanceof Element &&
        event.target
          .closest("[data-app-window]")
          ?.getAttribute("data-app-window") === id
    }
    document.addEventListener("pointerdown", trackPointerOrigin, true)
    return () =>
      document.removeEventListener("pointerdown", trackPointerOrigin, true)
  }, [finishClosing, id, open, openedOnMount])

  if (!open && !openedOnMount) return null

  const frame = {
    id,
    title: t(title),
    description: description ? t(description) : undefined,
    icon,
  }
  const usesNavigation = layout === "navigation"
  const loading = <AppStatusCard {...frame} variant="loading" />

  return (
    <Dialog
      open={open}
      onOpenChange={(next, details) => {
        if (next) return
        if (
          details.reason === "outside-press" &&
          pointerStartedInside.current
        ) {
          pointerStartedInside.current = false
          return
        }
        close()
      }}
      onOpenChangeComplete={(next) => {
        if (!next) finishClosing(id)
      }}
    >
      <DialogPortal>
        <DialogOverlay
          className="app-window-backdrop"
          data-app-backdrop-ready={ready ? "" : undefined}
          data-app-backdrop-blur={usesNavigation ? "" : undefined}
        />
        <AppWindowExpansionContext.Provider value={registerPopup}>
          <AppErrorBoundary
            fallback={
              <AppStatusCard
                {...frame}
                variant="error"
                message={t("shell.apps.openFailed")}
              />
            }
          >
            <Suspense fallback={loading}>
              <View frame={frame} onClose={close} storage={storage} />
            </Suspense>
          </AppErrorBoundary>
        </AppWindowExpansionContext.Provider>
      </DialogPortal>
    </Dialog>
  )
}

export default function AppHost() {
  const active = useSystemOverlayStore((state) => state.active)
  const closingApp = useSystemOverlayStore((state) => state.closingApp)
  const id = isAppWindow(active) ? active : closingApp
  if (!id) return null
  return <AppWindow key={id} id={id} open={active === id} />
}
