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
import ComponentBackground from "../shared/component-background"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export type ExpandedCollection = {
  id: string
  name: string
  color: string
  dynamicEffect?: boolean
}

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

type Frame = {
  left: number
  top: number
  width: number
  height: number
}

type CollectionFrame = Frame & {
  opacity: number
  shade: number
  zIndex: number
}

function frame(element: Element): Frame {
  const rect = element.getBoundingClientRect()
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

function projectFrame(value: Frame, from: Frame, to: Frame): Frame {
  const scaleX = to.width / from.width
  const scaleY = to.height / from.height
  return {
    left: to.left + (value.left - from.left) * scaleX,
    top: to.top + (value.top - from.top) * scaleY,
    width: value.width * scaleX,
    height: value.height * scaleY,
  }
}

function collectionFrames(source: HTMLElement | null) {
  return new Map(
    Array.from(
      source?.querySelectorAll<HTMLElement>("[data-stack-row]") ?? []
    ).map((row) => {
      const opacity = Number.parseFloat(row.style.opacity || "1")
      const shade = Number.parseFloat(
        row.style.getPropertyValue("--stack-shade") || "0"
      )
      const zIndex = Number.parseInt(row.style.zIndex || "0", 10)
      return [
        row.dataset.tabId,
        {
          ...frame(row),
          opacity: Number.isFinite(opacity) ? opacity : 1,
          shade: Number.isFinite(shade) ? shade : 0,
          zIndex: Number.isFinite(zIndex) ? zIndex : 0,
        },
      ] as const
    })
  )
}

function pinRows(rows: HTMLElement[], frames: CollectionFrame[]) {
  rows.forEach((row, index) => {
    const value = frames[index]
    gsap.set(row, {
      position: "fixed",
      left: value.left,
      top: value.top,
      width: value.width,
      height: value.height,
      margin: 0,
      opacity: value.opacity,
      zIndex: value.zIndex,
      "--stack-shade": value.shade,
    })
  })
}

function clearRows(grid: HTMLElement, rows: HTMLElement[]) {
  gsap.set(rows, {
    clearProps:
      "position,left,top,width,height,margin,opacity,z-index,transform,transform-origin",
  })
  rows.forEach((row) => row.style.removeProperty("--stack-shade"))
  grid.style.removeProperty("min-height")
}

function resetClosingStyles(panel: HTMLElement) {
  const content = panel.querySelector<HTMLElement>("[data-expansion-content]")
  const grid = panel.querySelector<HTMLElement>(
    "[data-expanded-collection-grid]"
  )
  const rows = panel.querySelectorAll<HTMLElement>("[data-stack-row]")
  const header = panel.querySelector<HTMLElement>("[data-collection-header]")
  const title = panel.querySelector<HTMLElement>("[data-collection-title]")
  const actions = panel.querySelector<HTMLElement>("[data-collection-actions]")
  if (content) {
    gsap.killTweensOf(content)
    gsap.set(content, { clearProps: "padding,gap,overflow,opacity" })
  }
  if (grid) {
    delete grid.dataset.collapsing
    grid.style.removeProperty("grid-template-columns")
    grid.style.removeProperty("gap")
    grid.style.removeProperty("min-height")
  }
  gsap.killTweensOf(rows)
  gsap.set(rows, {
    clearProps:
      "position,left,top,width,height,margin,opacity,z-index,transform,transform-origin",
  })
  rows.forEach((row) => row.style.removeProperty("--stack-shade"))
  if (header) {
    gsap.killTweensOf(header)
    gsap.set(header, { clearProps: "opacity,transform" })
  }
  if (title) {
    gsap.killTweensOf(title)
    gsap.set(title, {
      clearProps: "font-size,line-height,opacity,transform",
    })
  }
  if (actions) {
    gsap.killTweensOf(actions)
    gsap.set(actions, { clearProps: "opacity,transform" })
  }
}

export default function CollectionExpansion({
  collection,
  closeLabel,
  onClose,
  suspended = false,
  headerActions,
  children,
}: {
  collection: ExpandedCollection
  closeLabel: string
  onClose: () => void
  suspended?: boolean
  headerActions?: ReactNode
  children: ReactNode
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const { active } = useDndContext()
  const panelRef = useRef<HTMLElement | null>(null)
  const sourceRef = useRef<HTMLElement | null>(null)
  const sourceVisibility = useRef("")
  const sourceOpacity = useRef("")
  const sourcePointerEvents = useRef("")
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
      ).find((node) => node.dataset.gridItemId === collection.id) ?? null
    sourceRef.current = source
    sourceVisibility.current = source?.style.visibility ?? ""
    sourceOpacity.current = source?.style.opacity ?? ""
    sourcePointerEvents.current = source?.style.pointerEvents ?? ""
    const origin = source?.getBoundingClientRect()
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    closing.current = false
    if (source) {
      source.style.visibility = "hidden"
      source.style.opacity = "0"
      source.style.pointerEvents = "none"
    }
    const destination = expandedBounds()
    const start = origin
      ? {
          left: origin.left,
          top: origin.top,
          width: origin.width,
          height: origin.height,
        }
      : destination
    gsap.set(panel, { ...destination, opacity: 1 })
    const grid = panel.querySelector<HTMLElement>(
      "[data-expanded-collection-grid]"
    )
    const rows = Array.from(
      grid?.querySelectorAll<HTMLElement>("[data-stack-row]") ?? []
    )
    const destinationFrames = rows.map(frame)
    const sourceRows = collectionFrames(source)
    const startFrames = rows.map((row, index) => {
      const sourceFrame = sourceRows.get(row.dataset.tabId)
      return (
        sourceFrame ?? {
          ...projectFrame(destinationFrames[index], destination, start),
          opacity: 0,
          shade: 1,
          zIndex: rows.length - index,
        }
      )
    })
    if (grid && rows.length) {
      grid.style.minHeight = `${grid.getBoundingClientRect().height}px`
      pinRows(rows, startFrames)
    }
    const header = panel.querySelector<HTMLElement>("[data-collection-header]")
    const title = panel.querySelector<HTMLElement>("[data-collection-title]")
    const sourceTitle = source?.querySelector<HTMLElement>(
      "[data-collection-title]"
    )
    const expandedTitleStyle = title ? getComputedStyle(title) : null
    const expandedTitle = expandedTitleStyle
      ? {
          fontSize: expandedTitleStyle.fontSize,
          lineHeight: expandedTitleStyle.lineHeight,
        }
      : null
    const sourceTitleStyle = sourceTitle ? getComputedStyle(sourceTitle) : null
    if (title && sourceTitleStyle)
      gsap.set(title, {
        fontSize: sourceTitleStyle.fontSize,
        lineHeight: sourceTitleStyle.lineHeight,
      })
    gsap.set(panel, {
      ...start,
      opacity: origin ? 1 : 0,
    })
    void panel.offsetWidth
    const play = () => {
      const timeline = gsap.timeline({
        onComplete: () => {
          if (grid) clearRows(grid, rows)
          if (!panel.contains(document.activeElement))
            panel.focus({ preventScroll: true })
        },
      })
      timeline.to(
        panel,
        {
          ...destination,
          opacity: 1,
          duration: reduced ? 0 : 0.42,
          ease: "power3.inOut",
        },
        0
      )
      rows.forEach((row, index) => {
        timeline.to(
          row,
          {
            ...destinationFrames[index],
            opacity: 1,
            "--stack-shade": 0,
            duration: reduced ? 0 : 0.42,
            ease: "power3.inOut",
          },
          0
        )
      })
      if (title && expandedTitle) {
        timeline.to(
          title,
          {
            fontSize: expandedTitle.fontSize,
            lineHeight: expandedTitle.lineHeight,
            duration: reduced ? 0 : 0.42,
            ease: "power3.inOut",
          },
          0
        )
      }
      if (header) {
        timeline.to(
          header,
          {
            y: -14,
            opacity: 0,
            duration: reduced ? 0 : 0.16,
            ease: "power2.in",
          },
          reduced ? 0 : 0.06
        )
        timeline.to(
          header,
          {
            y: 0,
            opacity: 1,
            duration: reduced ? 0 : 0.18,
            ease: "power2.out",
          },
          reduced ? 0 : 0.42
        )
      }
    }
    let animationFrame = 0
    if (reduced) play()
    else animationFrame = requestAnimationFrame(play)
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
      cancelAnimationFrame(animationFrame)
      gsap.killTweensOf(panel)
      resetClosingStyles(panel)
      if (source) {
        source.style.visibility = sourceVisibility.current
        source.style.opacity = sourceOpacity.current
        source.style.pointerEvents = sourcePointerEvents.current
      }
      if (
        previousFocus?.isConnected &&
        (document.activeElement === document.body ||
          panel.contains(document.activeElement))
      )
        previousFocus.focus({ preventScroll: true })
    }
  }, [collection.id])

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    gsap.set(panel, {
      opacity: suspended ? 0 : 1,
      pointerEvents: suspended ? "none" : "auto",
    })
    const source = sourceRef.current
    if (!source) return
    source.style.visibility = suspended ? sourceVisibility.current : "hidden"
    source.style.opacity = suspended ? sourceOpacity.current : "0"
    source.style.pointerEvents = suspended
      ? sourcePointerEvents.current
      : "none"
  }, [suspended])

  const close = useCallback(() => {
    const panel = panelRef.current
    if (!panel || closing.current) return
    closing.current = true
    const source = sourceRef.current
    const origin = source?.isConnected ? source.getBoundingClientRect() : null
    const grid = panel.querySelector<HTMLElement>(
      "[data-expanded-collection-grid]"
    )
    const header = panel.querySelector<HTMLElement>("[data-collection-header]")
    const title = panel.querySelector<HTMLElement>("[data-collection-title]")
    const sourceHeader = source?.querySelector<HTMLElement>(
      "[data-collection-header]"
    )
    const sourceTitle = source?.querySelector<HTMLElement>(
      "[data-collection-title]"
    )
    const sourceTitleStyle = sourceTitle ? getComputedStyle(sourceTitle) : null
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (sourceHeader) gsap.set(sourceHeader, { y: 14, opacity: 0 })
    if (grid) grid.dataset.collapsing = "true"
    const rows = Array.from(
      grid?.querySelectorAll<HTMLElement>("[data-stack-row]") ?? []
    )
    const currentPanel = frame(panel)
    const targetPanel = origin
      ? {
          left: origin.left,
          top: origin.top,
          width: origin.width,
          height: origin.height,
        }
      : currentPanel
    const currentFrames = rows.map((row, index) => ({
      ...frame(row),
      opacity: 1,
      shade: 0,
      zIndex: rows.length - index,
    }))
    const sourceRows = collectionFrames(source)
    const targetFrames = rows.map((row, index) => {
      const sourceFrame = sourceRows.get(row.dataset.tabId)
      return (
        sourceFrame ?? {
          ...projectFrame(currentFrames[index], currentPanel, targetPanel),
          opacity: 0,
          shade: 1,
          zIndex: rows.length - index,
        }
      )
    })
    if (grid && rows.length) {
      grid.style.minHeight = `${grid.getBoundingClientRect().height}px`
      pinRows(rows, currentFrames)
    }
    void panel.offsetWidth
    const play = () => {
      const timeline = gsap.timeline({
        onComplete: () => {
          if (source) {
            source.style.visibility = sourceVisibility.current
            source.style.opacity = sourceOpacity.current
            source.style.pointerEvents = sourcePointerEvents.current
          }
          closeRef.current()
          if (sourceHeader)
            gsap.to(sourceHeader, {
              y: 0,
              opacity: 1,
              duration: reduced ? 0 : 0.18,
              ease: "power2.out",
              clearProps: "opacity,transform",
            })
        },
      })
      timeline.to(
        panel,
        {
          ...(origin ? targetPanel : { opacity: 0 }),
          duration: reduced ? 0 : 0.42,
          ease: "power3.inOut",
          overwrite: true,
        },
        0
      )
      rows.forEach((row, index) => {
        timeline.to(
          row,
          {
            left: targetFrames[index].left,
            top: targetFrames[index].top,
            width: targetFrames[index].width,
            height: targetFrames[index].height,
            opacity: targetFrames[index].opacity,
            zIndex: targetFrames[index].zIndex,
            "--stack-shade": targetFrames[index].shade,
            duration: reduced ? 0 : 0.42,
            ease: "power3.inOut",
          },
          0
        )
      })
      if (title && sourceTitleStyle)
        timeline.to(
          title,
          {
            fontSize: sourceTitleStyle.fontSize,
            lineHeight: sourceTitleStyle.lineHeight,
            duration: reduced ? 0 : 0.42,
            ease: "power3.inOut",
          },
          0
        )
      if (header)
        timeline.to(
          header,
          {
            y: 14,
            opacity: 0,
            duration: reduced ? 0 : 0.16,
            ease: "power2.in",
          },
          reduced ? 0 : 0.06
        )
    }
    if (reduced) play()
    else requestAnimationFrame(play)
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
        <header
          data-collection-header
          className="-mx-1 -mt-2 flex h-8 shrink-0 items-center justify-between gap-3"
        >
          <h2
            id={titleId}
            data-collection-title
            className="min-w-0 truncate text-base leading-6 font-medium"
          >
            {collection.name}
          </h2>
          <div
            data-collection-actions
            className="flex h-8 shrink-0 items-center gap-1"
          >
            {headerActions}
            <Button
              variant="ghost"
              size="icon"
              aria-label={closeLabel}
              className="text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
              onClick={close}
            >
              <CloseIcon />
            </Button>
          </div>
        </header>
        {children}
      </div>
    </section>,
    document.body
  )
}
