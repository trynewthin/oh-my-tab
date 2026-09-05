import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import DraggableFolderTab from "./draggable-folder-tab"
import FolderTabRow from "./folder-tab-row"
import type { FolderItem } from "./types"

const ROW_HEIGHT = 44

export default function FolderTabStack({
  folder,
  className = "",
  topBleed = 0,
  surface = "preview",
  draggable = true,
}: {
  folder: FolderItem
  className?: string
  topBleed?: number
  surface?: "preview" | "dialog"
  draggable?: boolean
}) {
  const rowGap = folder.size === "tall" && surface === "preview" ? 4 : 8
  const rowStep = ROW_HEIGHT + rowGap
  const viewportRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const rows = Array.from(
      viewport.querySelectorAll<HTMLElement>("[data-stack-row]")
    )
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    let animationFrame = 0
    let wheelTarget = viewport.scrollTop

    function draw() {
      if (!viewport) return
      const height = viewport.clientHeight - topBleed
      const progress = Math.min(1, viewport.scrollTop / rowStep)
      const folding = progress * progress * (3 - 2 * progress)
      const focusLine = Math.max(0, height - 64)
      const spread = Math.max(12, height - ROW_HEIGHT - focusLine)
      rows.forEach((row, index) => {
        const position = index * rowStep - viewport.scrollTop
        const depth = Math.max(0, (position - focusLine) / rowStep)
        const projected =
          position <= focusLine
            ? position
            : focusLine + spread * (1 - Math.exp(-depth * 0.75))
        const scale = motion.matches
          ? 1
          : 1 - Math.min(0.22, depth * 0.07) * folding
        const bottomLimit = Math.max(0, height - ROW_HEIGHT * scale - 1)
        const animatedPosition = position + (projected - position) * folding
        const boundedPosition = Math.min(animatedPosition, bottomLimit)
        const initiallyBelow = index * rowStep + ROW_HEIGHT > height
        const reveal = initiallyBelow ? folding : 1
        const opacity =
          (position < 0
            ? Math.max(0, 1 + position / ROW_HEIGHT)
            : Math.max(0, 1 - (folding * Math.max(0, depth - 2)) / 3)) * reveal
        const hidden = motion.matches
          ? position + ROW_HEIGHT <= 0 || position + ROW_HEIGHT > height
          : opacity <= 0.02
        row.inert = hidden
        gsap.set(row, {
          y: motion.matches ? 0 : boundedPosition - position,
          scale,
          autoAlpha: hidden ? 0 : motion.matches ? 1 : opacity,
          zIndex: rows.length - index,
          transformOrigin: "center top",
        })
      })
    }
    function scheduleDraw() {
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(draw)
    }
    function resize() {
      if (!viewport) return
      viewport.style.setProperty(
        "--stack-bottom",
        `${Math.max(0, viewport.clientHeight - topBleed - ROW_HEIGHT)}px`
      )
      const maxScroll = Math.max(0, (rows.length - 1) * rowStep)
      viewport.scrollTop = Math.min(viewport.scrollTop, maxScroll)
      wheelTarget = viewport.scrollTop
      draw()
    }
    function wheel(event: WheelEvent) {
      if (
        !viewport ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return
      const max = viewport.scrollHeight - viewport.clientHeight
      if (max <= 0) return
      event.preventDefault()
      event.stopPropagation()
      if (!gsap.isTweening(viewport)) wheelTarget = viewport.scrollTop
      const delta =
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? viewport.clientHeight
            : 1)
      wheelTarget = Math.max(0, Math.min(max, wheelTarget + delta))
      gsap.to(viewport, {
        scrollTop: wheelTarget,
        duration: motion.matches ? 0 : 0.24,
        ease: "power2.out",
        overwrite: true,
        onUpdate: draw,
      })
    }
    function stopWheel() {
      if (!viewport) return
      gsap.killTweensOf(viewport)
      wheelTarget = viewport.scrollTop
    }
    const observer = new ResizeObserver(resize)
    observer.observe(viewport)
    viewport.addEventListener("scroll", scheduleDraw, { passive: true })
    viewport.addEventListener("wheel", wheel, { passive: false })
    viewport.addEventListener("touchstart", stopWheel, { passive: true })
    viewport.addEventListener("mousedown", stopWheel)
    motion.addEventListener("change", draw)
    resize()
    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      viewport.removeEventListener("scroll", scheduleDraw)
      viewport.removeEventListener("wheel", wheel)
      viewport.removeEventListener("touchstart", stopWheel)
      viewport.removeEventListener("mousedown", stopWheel)
      motion.removeEventListener("change", draw)
      gsap.killTweensOf(viewport)
      rows.forEach((row) => {
        gsap.killTweensOf(row)
        gsap.set(row, {
          clearProps: "transform,transformOrigin,opacity,visibility,zIndex",
        })
        row.inert = false
      })
    }
  }, [folder.id, folder.tabs, topBleed, rowStep])

  return (
    <div
      ref={viewportRef}
      data-folder-surface={draggable ? surface : undefined}
      data-folder-id={draggable ? folder.id : undefined}
      role="region"
      aria-label={`${folder.name}内的标签`}
      tabIndex={0}
      style={{ marginTop: -topBleed, paddingTop: topBleed }}
      className={`relative min-h-0 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl outline-none [overflow-anchor:none] focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-scrollbar]:hidden ${className}`}
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        const amount =
          event.key === "ArrowDown"
            ? rowStep
            : event.key === "ArrowUp"
              ? -rowStep
              : 0
        if (!amount && event.key !== "Home" && event.key !== "End") return
        event.preventDefault()
        event.stopPropagation()
        const viewport = event.currentTarget
        const top =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? viewport.scrollHeight
              : viewport.scrollTop + amount
        viewport.scrollTo({
          top,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        })
      }}
    >
      <div
        role="list"
        className="relative"
        style={{ paddingBottom: "var(--stack-bottom, 0px)" }}
      >
        {folder.tabs.map((tab, index) => (
          <div
            key={tab.id}
            data-stack-row
            data-tab-id={tab.id}
            role="listitem"
            className="relative h-11 will-change-transform"
            style={{ marginBottom: index < folder.tabs.length - 1 ? rowGap : 0 }}
          >
            {draggable ? (
              <DraggableFolderTab
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                animated={!!folder.dynamicEffect}
                surface={surface}
              />
            ) : (
              <FolderTabRow
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                animated={!!folder.dynamicEffect}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
