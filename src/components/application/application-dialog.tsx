import { List } from "@phosphor-icons/react"
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import logoUrl from "../../../public/icons/icon-32.png"
import "./workspace.css"

export type ApplicationNavigationItem<RouteId extends string> = {
  id: RouteId
  label: string
  icon?: ReactNode
}

export type ApplicationNavigationGroup<RouteId extends string> = {
  id: string
  label?: string
  items: ApplicationNavigationItem<RouteId>[]
}

const ApplicationHeaderActionsContext = createContext<HTMLElement | null>(null)

export function ApplicationHeaderActions({
  children,
}: {
  children: ReactNode
}) {
  const mobileTarget = useContext(ApplicationHeaderActionsContext)
  return (
    <>
      <span className="hidden sm:contents">{children}</span>
      {mobileTarget && createPortal(children, mobileTarget)}
    </>
  )
}

function useScrollProgress(node: HTMLElement | null) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!node) return
    function update() {
      if (!node) return
      const max = node.scrollHeight - node.clientHeight
      setProgress(
        max <= 0
          ? 0
          : Math.min(100, Math.max(0, Math.round((node.scrollTop / max) * 100)))
      )
    }
    update()
    node.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(node)
    Array.from(node.children).forEach((child) => observer.observe(child))
    return () => {
      node.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [node])
  return progress
}

function ScrollProgress({ value, label }: { value: number; label: string }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="workspace-scroll-progress"
    >
      <span style={{ width: `${value}%` }} />
    </div>
  )
}

function ApplicationNavigation<RouteId extends string>({
  groups,
  activeRoute,
  onRouteChange,
  ariaLabel,
}: {
  groups: ApplicationNavigationGroup<RouteId>[]
  activeRoute: RouteId
  onRouteChange: (route: RouteId) => void
  ariaLabel: string
}) {
  return (
    <nav aria-label={ariaLabel} className="workspace-navigation">
      {groups.map((group) => (
        <div key={group.id} className="workspace-navigation-group">
          {group.label && (
            <div className="workspace-navigation-label">{group.label}</div>
          )}
          {group.items.map((item) => (
            <button
              key={item.id}
              type="button"
              className="workspace-navigation-item"
              aria-current={activeRoute === item.id ? "page" : undefined}
              onClick={() => onRouteChange(item.id)}
            >
              <span className="workspace-navigation-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
              <span
                className="workspace-navigation-indicator"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      ))}
    </nav>
  )
}

function ApplicationNavigationMenu<RouteId extends string>({
  groups,
  activeRoute,
  onRouteChange,
  ariaLabel,
  title,
  accentColor,
  progressAriaLabel,
}: {
  groups: ApplicationNavigationGroup<RouteId>[]
  activeRoute: RouteId
  onRouteChange: (route: RouteId) => void
  ariaLabel: string
  title: string
  accentColor: string
  progressAriaLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [scrollNode, setScrollNode] = useState<HTMLDivElement | null>(null)
  const progress = useScrollProgress(scrollNode)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        render={<Button type="button" variant="ghost" size="icon" />}
      >
        <List className="size-5" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        aria-label={ariaLabel}
        className="workspace-navigation-menu"
        style={{ "--workspace-accent": accentColor } as CSSProperties}
      >
        <div className="workspace-menu-title">{title}</div>
        <div ref={setScrollNode} className="workspace-menu-scroll">
          <ApplicationNavigation
            groups={groups}
            activeRoute={activeRoute}
            onRouteChange={(route) => {
              onRouteChange(route)
              setOpen(false)
            }}
            ariaLabel={ariaLabel}
          />
        </div>
        <ScrollProgress value={progress} label={progressAriaLabel} />
      </PopoverContent>
    </Popover>
  )
}

export default function ApplicationDialog<RouteId extends string>({
  applicationId,
  open,
  onOpenChange,
  title,
  description,
  closeLabel,
  closeAriaLabel,
  navigationAriaLabel,
  navigationProgressAriaLabel,
  navigation,
  activeRoute,
  onRouteChange,
  accentColor,
  background,
  backgroundEffect,
  dialogRef,
  children,
}: {
  applicationId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  closeLabel: string
  closeAriaLabel: string
  navigationAriaLabel: string
  navigationProgressAriaLabel: string
  navigation: ApplicationNavigationGroup<RouteId>[]
  activeRoute: RouteId
  onRouteChange: (route: RouteId) => void
  accentColor: string
  background?: ReactNode
  backgroundEffect?: ReactNode
  dialogRef?: Ref<HTMLDivElement>
  children: ReactNode
}) {
  const applicationNode = useRef<HTMLDivElement>(null)
  const contentNode = useRef<HTMLElement>(null)
  const pointerStartedInside = useRef(false)
  const [navNode, setNavNode] = useState<HTMLDivElement | null>(null)
  const [mobileActionsNode, setMobileActionsNode] =
    useState<HTMLDivElement | null>(null)
  const navProgress = useScrollProgress(navNode)
  const activeGroup = navigation.find((group) =>
    group.items.some((item) => item.id === activeRoute)
  )
  const activeItem = activeGroup?.items.find((item) => item.id === activeRoute)

  useLayoutEffect(() => {
    if (contentNode.current) contentNode.current.scrollTop = 0
  }, [activeRoute, open])

  useEffect(() => {
    if (!open) return
    const trackPointerOrigin = (event: PointerEvent) => {
      pointerStartedInside.current =
        event.target instanceof Node &&
        !!applicationNode.current?.contains(event.target)
    }
    document.addEventListener("pointerdown", trackPointerOrigin, true)
    return () =>
      document.removeEventListener("pointerdown", trackPointerOrigin, true)
  }, [open])

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen, eventDetails) => {
        if (
          !nextOpen &&
          eventDetails.reason === "outside-press" &&
          pointerStartedInside.current
        ) {
          pointerStartedInside.current = false
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent
        ref={dialogRef}
        showCloseButton={false}
        overlayClassName="bg-black/20 backdrop-blur-md"
        className="workspace-dialog"
        style={{ "--workspace-accent": accentColor } as CSSProperties}
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        {background && <div className="workspace-atmosphere">{background}</div>}
        {backgroundEffect && (
          <div className="workspace-atmosphere">{backgroundEffect}</div>
        )}
        <ApplicationHeaderActionsContext.Provider value={mobileActionsNode}>
          <div
            ref={applicationNode}
            role="application"
            aria-label={title}
            data-application={applicationId}
            data-active-route={activeRoute}
            className="workspace-layout"
          >
            <aside className="workspace-sidebar">
              <div className="workspace-identity">
                <img
                  src={logoUrl}
                  className="workspace-brand-icon"
                  alt=""
                  width="28"
                  height="28"
                />
                <div>
                  <span className="workspace-wordmark">Oh My Tab</span>
                  <span className="workspace-name">{title}</span>
                </div>
              </div>
              <div ref={setNavNode} className="workspace-sidebar-scroll">
                <ApplicationNavigation
                  groups={navigation}
                  activeRoute={activeRoute}
                  onRouteChange={onRouteChange}
                  ariaLabel={navigationAriaLabel}
                />
              </div>
              <div className="workspace-sidebar-footer">
                <ScrollProgress
                  value={navProgress}
                  label={navigationProgressAriaLabel}
                />
              </div>
            </aside>
            <div className="workspace-main">
              <header className="workspace-header">
                <div className="workspace-mobile-menu">
                  <ApplicationNavigationMenu
                    groups={navigation}
                    activeRoute={activeRoute}
                    onRouteChange={onRouteChange}
                    ariaLabel={navigationAriaLabel}
                    title={title}
                    accentColor={accentColor}
                    progressAriaLabel={navigationProgressAriaLabel}
                  />
                </div>
                <div className="workspace-heading" key={activeRoute}>
                  <span className="workspace-kicker">
                    {activeGroup?.label ?? title}
                  </span>
                  <h2>{activeItem?.label ?? title}</h2>
                </div>
                <div
                  ref={setMobileActionsNode}
                  className="workspace-mobile-actions"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={closeLabel}
                  className="studio-close workspace-desktop-close"
                  onClick={() => onOpenChange(false)}
                >
                  <CloseIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={closeAriaLabel}
                  className="studio-close workspace-mobile-close"
                  onClick={() => onOpenChange(false)}
                >
                  <CloseIcon />
                </Button>
              </header>
              <section
                ref={contentNode}
                aria-label={activeItem?.label}
                data-application-content
                className="workspace-content"
              >
                <div className="workspace-body">{children}</div>
              </section>
            </div>
          </div>
        </ApplicationHeaderActionsContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
