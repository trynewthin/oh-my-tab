import { AppWindow as AppWindowIcon } from "@phosphor-icons/react"
import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { appRepository } from "@/application/apps"
import AppCompactLayout from "@/components/application/app-compact-layout"
import { appRegistry } from "@/components/application/app-registry"
import AppStatusCard from "@/components/application/app-status-card"
import {
  AppWindowExpansionContext,
  useAppWindowExpansion,
} from "@/components/application/app-window-expansion"
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog"
import { isAppWindow, type AppWindowId } from "@/lib/apps/ids"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import "./app-window-backdrop.css"

const AppDirectory = lazy(() => import("./app-directory"))

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

function AppWindow({ id, open }: { id: AppWindowId; open: boolean }) {
  const { t } = useTranslation()
  const [openedOnMount] = useState(open)
  const [ready, setReady] = useState(false)
  const [storage] = useState(() =>
    id === "apps" ? null : appRepository.storageFor(id)
  )
  const pointerStartedInside = useRef(false)
  const registerPopup = useAppWindowExpansion(setReady)
  const finishClosing = useSystemOverlayStore((state) => state.finishClosingApp)
  const close = () => useSystemOverlayStore.getState().close(id)
  const app = id === "apps" ? null : appRegistry[id]
  const View = app?.View
  const description = app ? app.description : "shell.apps.description"

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
    title: t(app?.title ?? "shell.apps.title"),
    description: description ? t(description) : undefined,
    icon: app?.icon ?? AppWindowIcon,
  }
  const usesNavigation = app?.layout === "navigation"
  const appContent =
    View && storage ? (
      <View frame={frame} onClose={close} storage={storage} />
    ) : (
      <AppCompactLayout {...frame}>
        <AppDirectory />
      </AppCompactLayout>
    )
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
          onAnimationEnd={(event) => {
            if (
              event.target === event.currentTarget &&
              event.animationName === "app-backdrop-spread"
            )
              event.currentTarget.dataset.appBackdropSettled = ""
          }}
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
            <Suspense fallback={loading}>{appContent}</Suspense>
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
