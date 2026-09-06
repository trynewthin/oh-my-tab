import { useCallback, useEffect, useId, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useDndContext } from "@dnd-kit/core"
import gsap from "gsap"
import { X } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import { useTabGridStore } from "@/stores/tab-grid-store"
import FolderBackground from "./folder-background"
import FolderExpandedGrid from "./folder-expanded-grid"

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

export default function FolderExpansion({
  folderId,
  onClose,
  suspended = false,
}: {
  folderId: string
  onClose: () => void
  suspended?: boolean
}) {
  const folder = useTabGridStore((state) =>
    state.items.find((item) => item.id === folderId)
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
    const source =
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-grid-item-id]")
      ).find((node) => node.dataset.gridItemId === folderId) ?? null
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
        onComplete: () => panel.focus({ preventScroll: true }),
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
      if (source) source.style.visibility = sourceVisibility.current
      if (
        previousFocus?.isConnected &&
        (document.activeElement === document.body ||
          panel.contains(document.activeElement))
      )
        previousFocus.focus({ preventScroll: true })
    }
  }, [folderId])

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
    gsap.to(panel, {
      ...(origin
        ? {
            left: origin.left,
            top: origin.top,
            width: origin.width,
            height: origin.height,
          }
        : { opacity: 0 }),
      duration: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 0.3,
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

  if (!folder || folder.kind !== "folder") return null

  return createPortal(
    <section
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-expanded-folder={folder.id}
      className="folder-expansion fixed isolate z-[60] overflow-hidden rounded-2xl border bg-card shadow-xl outline-none"
    >
      <FolderBackground
        color={folder.color}
        animated={!!folder.dynamicEffect}
      />
      <div className="relative z-10 flex h-full min-h-0 [scrollbar-width:none] flex-col gap-4 overflow-y-auto p-5 [&::-webkit-scrollbar]:hidden">
        <header className="flex shrink-0 items-center justify-between gap-3">
          <h2 id={titleId} className="min-w-0 truncate text-base font-medium">
            {folder.name}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            aria-label="关闭文件夹"
            onClick={close}
          >
            <X />
          </Button>
        </header>
        {folder.tabs.length > 0 && <FolderExpandedGrid folder={folder} />}
      </div>
    </section>,
    document.body
  )
}
