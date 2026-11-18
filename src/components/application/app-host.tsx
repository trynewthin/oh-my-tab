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
import { appRegistry } from "@/components/application/app-registry"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { isAppWindow, type AppWindowId } from "@/lib/apps/ids"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

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
  const [storage] = useState(() =>
    id === "apps" ? null : appRepository.storageFor(id)
  )
  const pointerStartedInside = useRef(false)
  const finishClosing = useSystemOverlayStore((state) => state.finishClosingApp)
  const close = () => useSystemOverlayStore.getState().close(id)
  const title = t(id === "apps" ? "shell.apps.title" : appRegistry[id].title)
  const View = id === "apps" ? null : appRegistry[id].View

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
      <AppErrorBoundary
        fallback={
          <DialogContent data-app-window={id}>
            <DialogTitle>{title}</DialogTitle>
            <p role="alert">{t("shell.apps.openFailed")}</p>
          </DialogContent>
        }
      >
        <Suspense
          fallback={
            <DialogContent data-app-window={id}>
              <DialogTitle>{title}</DialogTitle>
              <p role="status">{t("shell.apps.loading")}</p>
            </DialogContent>
          }
        >
          {View && storage ? (
            <View onClose={close} storage={storage} />
          ) : (
            <AppDirectory />
          )}
        </Suspense>
      </AppErrorBoundary>
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
