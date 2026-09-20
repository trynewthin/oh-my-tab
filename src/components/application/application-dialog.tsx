import { List, X } from "@phosphor-icons/react"
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
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

function scrollPercent(node: HTMLElement) {
  const max = node.scrollHeight - node.clientHeight
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((node.scrollTop / max) * 100)))
}

function useScrollProgress(node: HTMLElement | null) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!node) return
    const target = node
    function update() {
      setProgress(scrollPercent(target))
    }
    update()
    target.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(target)
    Array.from(target.children).forEach((child) => observer.observe(child))
    return () => {
      target.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [node])

  return progress
}

function ApplicationNavigation<RouteId extends string>({
  groups,
  activeRoute,
  onRouteChange,
  ariaLabel,
  accentColor,
  surface = "sidebar",
}: {
  groups: ApplicationNavigationGroup<RouteId>[]
  activeRoute: RouteId
  onRouteChange: (route: RouteId) => void
  ariaLabel: string
  accentColor: string
  surface?: "sidebar" | "menu"
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={surface === "menu" ? "space-y-3" : "space-y-4"}
      style={{ "--application-accent": accentColor } as CSSProperties}
    >
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          {group.label && (
            <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
              {group.label}
            </div>
          )}
          {group.items.map((item) => {
            const selected = activeRoute === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start px-4 text-sm hover:bg-[color-mix(in_srgb,var(--application-accent)_12%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--application-accent)_12%,transparent)] ${surface === "menu" ? "rounded-xl" : "rounded-none rounded-r-full"}`}
                style={
                  selected
                    ? {
                        backgroundColor:
                          "color-mix(in srgb, var(--application-accent) 22%, transparent)",
                        color: "var(--application-accent)",
                      }
                    : undefined
                }
                aria-current={selected ? "page" : undefined}
                onClick={() => onRouteChange(item.id)}
              >
                {item.icon}
                {item.label}
              </Button>
            )
          })}
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
  const scrollProgress = useScrollProgress(scrollNode)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="-ml-1 rounded-lg text-muted-foreground hover:text-foreground"
          />
        }
      >
        <List className="size-5" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        aria-label={ariaLabel}
        className="w-56 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0"
      >
        <div
          ref={setScrollNode}
          className="relative max-h-[min(58svh,24rem)] [scrollbar-width:none] overflow-y-auto p-2 [&::-webkit-scrollbar]:hidden"
        >
          <div className="sticky top-0 z-20 flex h-0 justify-end">
            <span
              role="progressbar"
              aria-label={progressAriaLabel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scrollProgress}
              className="flex size-7 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground tabular-nums shadow-sm ring-1 ring-border"
            >
              {scrollProgress}
            </span>
          </div>
          <div className="px-3 pt-1 pr-10 pb-2 text-base font-medium">
            {title}
          </div>
          <ApplicationNavigation
            groups={groups}
            activeRoute={activeRoute}
            onRouteChange={(route) => {
              onRouteChange(route)
              setOpen(false)
            }}
            ariaLabel={ariaLabel}
            accentColor={accentColor}
            surface="menu"
          />
        </div>
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
  children: ReactNode
}) {
  const applicationNode = useRef<HTMLDivElement>(null)
  const pointerStartedInside = useRef(false)
  const [navNode, setNavNode] = useState<HTMLDivElement | null>(null)
  const [mobileActionsNode, setMobileActionsNode] =
    useState<HTMLDivElement | null>(null)
  const navProgress = useScrollProgress(navNode)
  const activeItem = navigation
    .flatMap((group) => group.items)
    .find((item) => item.id === activeRoute)

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
        showCloseButton={false}
        overlayClassName="bg-black/10 backdrop-blur-xl"
        className="h-svh w-screen max-w-none gap-0 overflow-hidden rounded-none p-0 ring-0 sm:h-auto sm:w-full sm:max-w-3xl sm:rounded-[min(var(--radius-4xl),24px)]"
      >
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        <ApplicationHeaderActionsContext.Provider value={mobileActionsNode}>
          <div
            ref={applicationNode}
            role="application"
            aria-label={title}
            data-application={applicationId}
            className="relative z-10 flex h-full min-h-0 min-w-0 flex-col sm:h-[min(560px,80svh)] sm:flex-row"
          >
            <header className="flex shrink-0 items-center gap-3 px-4 pt-4 pb-2 sm:hidden">
              <ApplicationNavigationMenu
                groups={navigation}
                activeRoute={activeRoute}
                onRouteChange={onRouteChange}
                ariaLabel={navigationAriaLabel}
                title={title}
                accentColor={accentColor}
                progressAriaLabel={navigationProgressAriaLabel}
              />
              <span className="min-w-0 truncate text-base font-medium">
                {activeItem?.label ?? title}
              </span>
              <div
                ref={setMobileActionsNode}
                className="ml-auto flex shrink-0 items-center gap-2"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={closeAriaLabel}
                className="text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                onClick={() => onOpenChange(false)}
              >
                <CloseIcon />
              </Button>
            </header>
            <aside className="relative hidden h-full min-h-0 w-36 shrink-0 sm:block">
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-popover from-70% to-transparent px-4 pt-6 pb-4">
                <div className="text-left text-base leading-6 font-medium">
                  {title}
                </div>
              </div>
              <div
                ref={setNavNode}
                className="h-full min-h-0 [scrollbar-width:none] overflow-y-auto pt-14 pb-[4.5rem] [&::-webkit-scrollbar]:hidden"
              >
                <ApplicationNavigation
                  groups={navigation}
                  activeRoute={activeRoute}
                  onRouteChange={onRouteChange}
                  ariaLabel={navigationAriaLabel}
                  accentColor={accentColor}
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 isolate z-10 px-4 pb-4">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 -z-10 bg-gradient-to-t from-popover/75 via-popover/30 to-transparent"
                />
                <div className="relative overflow-hidden rounded-2xl bg-popover shadow-md dark:border dark:border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    className="pointer-events-auto w-full justify-start rounded-none bg-transparent px-2 text-sm shadow-none hover:bg-muted dark:hover:bg-muted"
                    onClick={() => onOpenChange(false)}
                  >
                    <X />
                    {closeLabel}
                  </Button>
                  <span
                    role="progressbar"
                    aria-label={navigationProgressAriaLabel}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={navProgress}
                    className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end pr-2.5 text-xs text-muted-foreground tabular-nums"
                  >
                    {navProgress}
                  </span>
                </div>
              </div>
            </aside>
            <section
              aria-label={activeItem?.label}
              data-application-content
              className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:p-6"
            >
              {children}
            </section>
          </div>
        </ApplicationHeaderActionsContext.Provider>
      </DialogContent>
    </Dialog>
  )
}
