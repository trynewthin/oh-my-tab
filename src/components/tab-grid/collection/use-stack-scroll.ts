import { useLayoutEffect, type RefObject } from "react"
import gsap from "gsap"

export function useStackScroll(
  viewportRef: RefObject<HTMLDivElement | null>,
  {
    enabled = true,
    revision,
    singleRow = false,
    topBleed = 0,
    rowHeight = 44,
    rowStep = 52,
    innerColumns = 1,
  }: {
    enabled?: boolean
    revision: unknown
    singleRow?: boolean
    topBleed?: number
    rowHeight?: number
    rowStep?: number
    innerColumns?: number
  }
) {
  useLayoutEffect(() => {
    if (!enabled) return
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
      const height = singleRow ? rowHeight : viewport.clientHeight - topBleed
      const progress = Math.min(1, viewport.scrollTop / rowStep)
      const folding = progress * progress * (3 - 2 * progress)
      const focusLine = Math.max(0, height - 64)
      const spread = Math.max(12, height - rowHeight - focusLine)
      rows.forEach((row, index) => {
        const position =
          Math.floor(index / innerColumns) * rowStep - viewport.scrollTop
        const depth = Math.max(0, (position - focusLine) / rowStep)
        const projected =
          position <= focusLine
            ? position
            : focusLine + spread * (1 - Math.exp(-depth * 0.75))
        const scale = motion.matches
          ? 1
          : 1 - Math.min(0.22, depth * 0.07) * folding
        const bottomLimit = Math.max(0, height - rowHeight * scale - 1)
        const animatedPosition = position + (projected - position) * folding
        const boundedPosition = Math.min(animatedPosition, bottomLimit)
        const initiallyBelow =
          Math.floor(index / innerColumns) * rowStep + rowHeight > height
        const reveal = initiallyBelow ? folding : 1
        const opacity =
          (position < 0
            ? Math.max(0, 1 + position / rowHeight)
            : Math.max(0, 1 - (folding * Math.max(0, depth - 2)) / 3)) * reveal
        const hidden = motion.matches
          ? position + rowHeight <= 0 || position + rowHeight > height
          : opacity <= 0.02
        row.inert = hidden
        gsap.set(row, {
          y: motion.matches ? 0 : boundedPosition - position,
          scale,
          autoAlpha: hidden ? 0 : motion.matches || position >= 0 ? 1 : opacity,
          "--stack-shade": motion.matches || position < 0 ? 0 : 1 - opacity,
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
        `${Math.max(0, viewport.clientHeight - topBleed - rowHeight)}px`
      )
      const maxScroll = Math.max(
        0,
        (Math.ceil(rows.length / innerColumns) - 1) * rowStep
      )
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
        row.style.removeProperty("--stack-shade")
        row.inert = false
      })
    }
  }, [
    viewportRef,
    enabled,
    revision,
    singleRow,
    topBleed,
    rowStep,
    rowHeight,
    innerColumns,
  ])
}
