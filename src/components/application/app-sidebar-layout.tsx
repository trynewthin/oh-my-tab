import { CaretRight, List, X } from "@phosphor-icons/react"
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

import AppWindowFrame from "@/components/application/app-window-frame"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { AppId } from "@/lib/apps/ids"
import type { UiAppearanceOverrides } from "@/lib/ui-appearance"
import { cn } from "@/lib/utils"

export type ApplicationNavigationItem<RouteId extends string> = {
  id: RouteId
  label: string
  icon?: ReactNode
  children?: ApplicationNavigationItem<RouteId>[]
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

function navigationLeaves<RouteId extends string>(
  items: ApplicationNavigationItem<RouteId>[]
): ApplicationNavigationItem<RouteId>[] {
  return items.flatMap((item) =>
    item.children?.length ? navigationLeaves(item.children) : [item]
  )
}

type NavigationSurface = "sidebar" | "menu" | "panel"

function NavigationEntry<RouteId extends string>({
  item,
  activeRoute,
  onRouteChange,
  surface,
  nested = false,
}: {
  item: ApplicationNavigationItem<RouteId>
  activeRoute: RouteId
  onRouteChange: (route: RouteId) => void
  surface: NavigationSurface
  nested?: boolean
}) {
  const children = item.children
  const activeChild = children?.length
    ? navigationLeaves(children).some((child) => child.id === activeRoute)
    : false
  const [disclosure, setDisclosure] = useState({
    route: activeRoute,
    expanded: activeChild,
  })
  const expanded =
    activeChild && disclosure.route !== activeRoute ? true : disclosure.expanded
  const selected = !children?.length && activeRoute === item.id
  const padding =
    surface === "panel"
      ? nested
        ? "pr-2 pl-6"
        : "px-2"
      : nested
        ? "pr-3 pl-8"
        : "px-4"
  return (
    <div>
      <Button
        variant="ghost"
        className={`relative w-full justify-start text-sm hover:z-30 hover:bg-[color-mix(in_srgb,var(--application-accent)_12%,var(--popover))] ${padding} ${selected ? "z-30" : ""} ${surface === "sidebar" ? "rounded-none rounded-r-(--ui-radius-control) bg-clip-border" : "rounded-(--ui-radius-control)"}`}
        style={
          selected
            ? {
                backgroundColor:
                  "color-mix(in srgb, var(--application-accent) 22%, var(--popover))",
                color: "var(--application-accent)",
              }
            : undefined
        }
        aria-current={selected ? "page" : undefined}
        aria-expanded={children?.length ? expanded : undefined}
        onClick={() =>
          children?.length
            ? setDisclosure({ route: activeRoute, expanded: !expanded })
            : onRouteChange(item.id)
        }
      >
        {item.icon}
        {item.label}
        {!!children?.length && (
          <CaretRight
            className={`ml-auto size-3 shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`}
          />
        )}
      </Button>
      {!!children?.length && expanded && (
        <div className="mt-1 space-y-1">
          {children.map((child) => (
            <NavigationEntry
              key={child.id}
              item={child}
              activeRoute={activeRoute}
              onRouteChange={onRouteChange}
              surface={surface}
              nested
            />
          ))}
        </div>
      )}
    </div>
  )
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
  surface?: NavigationSurface
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={surface === "menu" ? "space-y-3" : "space-y-4"}
      style={{ "--application-accent": accentColor } as CSSProperties}
    >
      {groups.map((group) => (
        <div
          key={group.id}
          role="group"
          aria-label={group.label}
          className="space-y-1"
        >
          {group.label && (
            <div
              className={`py-1 text-xs font-medium text-muted-foreground ${surface === "panel" ? "px-2" : "px-4"}`}
            >
              {group.label}
            </div>
          )}
          {group.items.map((item) => (
            <NavigationEntry
              key={item.id}
              item={item}
              activeRoute={activeRoute}
              onRouteChange={onRouteChange}
              surface={surface}
            />
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
  background,
  translucent,
}: {
  groups: ApplicationNavigationGroup<RouteId>[]
  activeRoute: RouteId
  onRouteChange: (route: RouteId) => void
  ariaLabel: string
  title: string
  accentColor: string
  progressAriaLabel: string
  background?: ReactNode
  translucent: boolean
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
            className="-ml-1 rounded-(--ui-radius-control) text-muted-foreground hover:text-foreground"
          />
        }
      >
        <List className="size-5" />
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        aria-label={ariaLabel}
        className={cn(
          "w-56 max-w-[calc(100vw-2rem)] gap-0 overflow-hidden p-0",
          translucent && "bg-transparent"
        )}
      >
        {background}
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

export default function AppSidebarLayout<RouteId extends string>({
  applicationId,
  onClose,
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
  sidebarBackground,
  sidebarTranslucent = false,
  windowStyle,
  appearance,
  size = "default",
  sidebarStyle = "floating",
  sidebarFooter,
  children,
}: {
  applicationId: AppId
  onClose: () => void
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
  sidebarBackground?: ReactNode
  sidebarTranslucent?: boolean
  windowStyle?: CSSProperties
  appearance?: UiAppearanceOverrides
  size?: "default" | "large"
  sidebarStyle?: "floating" | "panel"
  sidebarFooter?: ApplicationNavigationItem<RouteId>
  children: ReactNode
}) {
  const [mobileActionsNode, setMobileActionsNode] =
    useState<HTMLDivElement | null>(null)
  const panelSidebar = sidebarStyle === "panel"
  const pinnedItem = panelSidebar ? sidebarFooter : undefined
  const sidebarNavigation = pinnedItem
    ? navigation.flatMap((group) => {
        const items = group.items.filter((item) => item.id !== pinnedItem.id)
        if (items.length === group.items.length) return [group]
        if (!items.length) return []
        return [
          {
            ...group,
            items,
            label: items.length === 1 ? undefined : group.label,
          },
        ]
      })
    : navigation
  const activeItem = navigation
    .flatMap((group) => navigationLeaves(group.items))
    .find((item) => item.id === activeRoute)

  return (
    <AppWindowFrame
      id={applicationId}
      title={title}
      description={description}
      background={background}
      style={windowStyle}
      appearance={appearance}
      className={`h-svh w-screen max-w-none rounded-none ring-0 sm:h-auto sm:w-full sm:rounded-(--ui-radius-window) ${size === "large" ? "sm:max-w-[min(960px,calc(100vw-3rem))]" : "sm:max-w-3xl"}`}
    >
      <ApplicationHeaderActionsContext.Provider value={mobileActionsNode}>
        <div
          role="application"
          aria-label={title}
          data-application={applicationId}
          className={`relative flex h-full min-h-0 min-w-0 flex-col sm:flex-row ${size === "large" ? "sm:h-[min(720px,85svh)]" : "sm:h-[min(560px,80svh)]"}`}
        >
          <header className="relative z-30 flex shrink-0 items-center gap-3 px-4 pt-4 pb-2 sm:hidden">
            <ApplicationNavigationMenu
              groups={navigation}
              activeRoute={activeRoute}
              onRouteChange={onRouteChange}
              ariaLabel={navigationAriaLabel}
              title={title}
              accentColor={accentColor}
              progressAriaLabel={navigationProgressAriaLabel}
              background={sidebarBackground}
              translucent={sidebarTranslucent}
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
              onClick={onClose}
            >
              <CloseIcon />
            </Button>
          </header>
          <aside
            className={cn(
              "relative hidden min-h-0 shrink-0",
              panelSidebar
                ? "my-5 ms-5 w-44 flex-col overflow-hidden rounded-(--ui-radius-panel) border border-ui-border-panel shadow-(--ui-shadow-panel) sm:flex"
                : "h-full w-36 sm:block",
              panelSidebar &&
                !sidebarTranslucent &&
                "bg-(--settings-sidebar-bg) [--settings-sidebar-bg:color-mix(in_oklab,var(--muted)_35%,var(--popover))]"
            )}
          >
            {sidebarBackground}
            <div
              className={cn(
                panelSidebar
                  ? "absolute inset-x-0 top-0 z-10 flex h-13 items-center justify-between gap-2 ps-4 pe-3"
                  : "pointer-events-none absolute inset-x-0 top-0 px-4 pt-6 pb-4",
                panelSidebar &&
                  !sidebarTranslucent &&
                  "bg-[linear-gradient(to_bottom,var(--settings-sidebar-bg)_65%,transparent)]"
              )}
            >
              {!panelSidebar && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 z-10 bg-gradient-to-b from-popover from-70% to-transparent"
                />
              )}
              <div className="relative z-30 text-left text-base leading-6 font-medium">
                {title}
              </div>
              {panelSidebar && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={closeLabel}
                  title={closeAriaLabel}
                  className="text-muted-foreground"
                  onClick={onClose}
                >
                  <CloseIcon className="size-4" />
                </Button>
              )}
            </div>
            <div
              className={cn(
                "relative z-0 min-h-0 [scrollbar-width:none] overflow-y-auto [&::-webkit-scrollbar]:hidden",
                panelSidebar
                  ? `flex-1 scroll-pt-13 px-2 pt-13 ${pinnedItem ? "scroll-pb-13 pb-13" : "pb-3"}`
                  : "h-full pt-14 pb-[4.5rem]",
                // Fade the scrolling items without painting over the glass.
                panelSidebar &&
                  sidebarTranslucent &&
                  "[mask-image:linear-gradient(to_bottom,transparent_2.125rem,black_3.25rem,black_calc(100%_-_var(--sidebar-footer-height,0px)),transparent_calc(100%_-_var(--sidebar-footer-height,0px)*0.65))]",
                sidebarTranslucent &&
                  pinnedItem &&
                  "[--sidebar-footer-height:3.25rem]"
              )}
            >
              <ApplicationNavigation
                groups={sidebarNavigation}
                activeRoute={activeRoute}
                onRouteChange={onRouteChange}
                ariaLabel={navigationAriaLabel}
                accentColor={accentColor}
                surface={panelSidebar ? "panel" : "sidebar"}
              />
            </div>
            {pinnedItem && (
              <div
                className={cn(
                  "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-13 items-center px-2",
                  !sidebarTranslucent &&
                    "bg-[linear-gradient(to_top,var(--settings-sidebar-bg)_65%,transparent)]"
                )}
                style={{ "--application-accent": accentColor } as CSSProperties}
              >
                <div className="pointer-events-auto w-full">
                  <NavigationEntry
                    item={pinnedItem}
                    activeRoute={activeRoute}
                    onRouteChange={onRouteChange}
                    surface="panel"
                  />
                </div>
              </div>
            )}
            {!panelSidebar && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-4">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 z-10 bg-gradient-to-t from-popover/75 via-popover/30 to-transparent"
                />
                <div className="relative z-30 overflow-hidden rounded-(--ui-radius-panel) border border-ui-border-panel bg-popover shadow-(--ui-shadow-panel)">
                  <Button
                    type="button"
                    variant="ghost"
                    className="pointer-events-auto w-full justify-between rounded-none border-0 bg-transparent px-4 text-sm shadow-none hover:bg-muted dark:hover:bg-muted"
                    onClick={onClose}
                  >
                    <X aria-hidden="true" />
                    {closeLabel}
                  </Button>
                </div>
              </div>
            )}
          </aside>
          <section
            aria-label={activeItem?.label}
            data-application-content
            className={`relative z-30 min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 ${
              panelSidebar
                ? "sm:px-(--ui-padding-window)"
                : "sm:p-(--ui-padding-window)"
            }`}
          >
            {children}
          </section>
        </div>
      </ApplicationHeaderActionsContext.Provider>
    </AppWindowFrame>
  )
}
