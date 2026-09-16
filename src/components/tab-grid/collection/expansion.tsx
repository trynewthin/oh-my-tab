import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { useDndContext } from "@dnd-kit/core"
import gsap from "gsap"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import { useTabGridStore } from "@/stores/tab-grid-store"
import type { TabEntry } from "@/lib/grid/types"
import ComponentBackground from "../shared/component-background"
import FolderExpandedGrid from "../folder-expanded-grid"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import {
  getComponentDefinition,
  supportsComponentAction,
} from "@/lib/grid/registry"

function expandedBounds() {
  const width = Math.min(
    window.innerWidth >= 1024 ? 800 : 560,
    window.innerWidth - 32
  )
  const height = Math.min(560, window.innerHeight - 48)
  return {
    left: (window.innerWidth - width) / 2,
    top: (window.innerHeight - height) / 2,
    width,
    height,
  }
}

function resetClosingStyles(panel: HTMLElement) {
  const content = panel.querySelector<HTMLElement>("[data-expansion-content]")
  const grid = panel.querySelector<HTMLElement>("[data-expanded-folder-grid]")
  const rows = panel.querySelectorAll<HTMLElement>("[data-stack-row]")
  if (content) {
    gsap.killTweensOf(content)
    gsap.set(content, { clearProps: "padding,gap,overflow,opacity" })
  }
  if (grid) {
    delete grid.dataset.collapsing
    grid.style.removeProperty("grid-template-columns")
    grid.style.removeProperty("gap")
  }
  gsap.killTweensOf(rows)
  gsap.set(rows, {
    clearProps:
      "position,left,top,width,height,margin,opacity,transform,transform-origin",
  })
}

export default function CollectionExpansion({
  itemId,
  onClose,
  suspended = false,
  children,
  headerActions,
  folderTabs,
}: {
  itemId: string
  onClose: () => void
  suspended?: boolean
  children?: ReactNode
  headerActions?: ReactNode
  folderTabs?: TabEntry[]
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const collection = useTabGridStore((state) =>
    state.items.find((item) => item.id === itemId)
  )
  const { active } = useDndContext()
  const panelRef = useRef<HTMLElement | null>(null)
  const sourceRef = useRef<HTMLElement | null>(null)
  const sourceVisibility = useRef("")
  const closeRef = useRef(onClose)
  const closing = useRef(false)
  const titleId = useId()

  useEffect(() => {
    closeRef.current = onClose
  }, [onClose])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    resetClosingStyles(panel)
    const source =
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-grid-item-id]")
      ).find((node) => node.dataset.gridItemId === itemId) ?? null
    sourceRef.current = source
    sourceVisibility.current = source?.style.visibility ?? ""
    const origin = source?.getBoundingClientRect()
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    closing.current = false
    if (source) source.style.visibility = "hidden"
    gsap.fromTo(
      panel,
      origin
        ? {
            left: origin.left,
            top: origin.top,
            width: origin.width,
            height: origin.height,
            opacity: 1,
          }
        : { ...expandedBounds(), opacity: 0 },
      {
        ...expandedBounds(),
        opacity: 1,
        duration: reduced ? 0 : 0.38,
        ease: "power3.inOut",
        onComplete: () => {
          if (!panel.contains(document.activeElement))
            panel.focus({ preventScroll: true })
        },
      }
    )
    function resize() {
      if (!closing.current)
        gsap.to(panel, {
          ...expandedBounds(),
          duration: reduced ? 0 : 0.2,
          overwrite: true,
        })
    }
    window.addEventListener("resize", resize)
    return () => {
      window.removeEventListener("resize", resize)
      gsap.killTweensOf(panel)
      resetClosingStyles(panel)
      if (source) source.style.visibility = sourceVisibility.current
      if (
        previousFocus?.isConnected &&
        (document.activeElement === document.body ||
          panel.contains(document.activeElement))
      )
        previousFocus.focus({ preventScroll: true })
    }
  }, [itemId])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, {
      opacity: suspended ? 0 : 1,
      pointerEvents: suspended ? "none" : "auto",
    })
    if (sourceRef.current)
      sourceRef.current.style.visibility = suspended
        ? sourceVisibility.current
        : "hidden"
  }, [suspended])

  const close = useCallback(() => {
    const panel = panelRef.current
    if (!panel || closing.current) return
    closing.current = true
    const source = sourceRef.current
    const origin = source?.isConnected ? source.getBoundingClientRect() : null
    const content = panel.querySelector<HTMLElement>("[data-expansion-content]")
    const grid = panel.querySelector<HTMLElement>("[data-expanded-folder-grid]")
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (grid) {
      const targets = new Map(
        Array.from(
          source?.querySelectorAll<HTMLElement>("[data-stack-row]") ?? []
        ).map(
          (row) => [row.dataset.tabId, row.getBoundingClientRect()] as const
        )
      )
      const rows = Array.from(
        grid.querySelectorAll<HTMLElement>("[data-stack-row]")
      ).map((row) => ({
        row,
        before: row.getBoundingClientRect(),
        target: targets.get(row.dataset.tabId),
      }))
      grid.dataset.collapsing = "true"
      if (content) gsap.set(content, { overflow: "visible" })
      rows.forEach(({ row, before, target }) => {
        gsap.set(row, {
          position: "fixed",
          left: before.left,
          top: before.top,
          width: before.width,
          height: before.height,
          margin: 0,
        })
        gsap.to(row, {
          left: target?.left ?? before.left,
          top: target?.top ?? before.top,
          width: target?.width ?? before.width,
          height: target?.height ?? before.height,
          opacity: target ? 1 : 0,
          duration: reduced ? 0 : 0.3,
          ease: "power3.inOut",
          overwrite: true,
        })
      })
    }
    if (content)
      gsap.to(content, {
        padding: 12,
        gap: 8,
        duration: reduced ? 0 : 0.3,
        ease: "power3.inOut",
        overwrite: true,
      })
    gsap.to(panel, {
      ...(origin
        ? {
            left: origin.left,
            top: origin.top,
            width: origin.width,
            height: origin.height,
          }
        : { opacity: 0 }),
      duration: reduced ? 0 : 0.3,
      ease: "power3.inOut",
      overwrite: true,
      onComplete: () => closeRef.current(),
    })
  }, [])

  useEffect(() => {
    function outside(event: PointerEvent) {
      if (
        panelRef.current?.querySelector('[data-folder-interaction-open="true"]')
      )
        return
      if (
        !active &&
        !suspended &&
        !panelRef.current?.contains(event.target as Node)
      )
        close()
    }
    function escape(event: KeyboardEvent) {
      if (
        panelRef.current?.querySelector('[data-folder-interaction-open="true"]')
      )
        return
      if (event.key === "Escape" && !active && !event.defaultPrevented) {
        event.preventDefault()
        close()
      }
    }
    document.addEventListener("pointerdown", outside)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outside)
      document.removeEventListener("keydown", escape)
    }
  }, [active, suspended, close])

  if (!collection || !supportsComponentAction(collection.kind, "expandable"))
    return null
  const definition = getComponentDefinition(collection.kind)

  return createPortal(
    <section
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-expanded-collection={collection.id}
      className={`collection-expansion fixed isolate z-[60] overflow-hidden rounded-2xl border shadow-xl outline-none ${backgroundType === "solid" ? "bg-card" : "bg-transparent"}`}
    >
      <ComponentBackground
        color={collection.color}
        animated={!!collection.dynamicEffect}
      />
      <div
        data-expansion-content
        className="relative z-10 flex h-full min-h-0 [scrollbar-width:none] flex-col gap-4 overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden"
      >
        <header className="-mx-1 -mt-2 flex h-8 shrink-0 items-center justify-between gap-3">
          <h2
            id={titleId}
            className="min-w-0 truncate text-base leading-6 font-medium"
          >
            {collection.name}
          </h2>
          <div className="flex h-8 shrink-0 items-center gap-1">
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              aria-label={`关闭${definition.label}`}
              className="text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
              onClick={close}
            >
              <CloseIcon />
            </Button>
          </div>
        </header>
        {children ??
          (collection.kind === "folder" &&
            (folderTabs ?? collection.tabs).length > 0 && (
              <FolderExpandedGrid folder={collection} tabs={folderTabs} />
            ))}
      </div>
    </section>,
    document.body
  )
}
