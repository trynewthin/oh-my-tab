import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import type { GridPlacement } from "@/lib/grid/grid-layout"

export function useGridResizeMotion(
  placement: GridPlacement,
  columnStep: number,
  rowStep: number
) {
  const ref = useRef<HTMLDivElement>(null)
  const previous = useRef<{ width: number; height: number } | null>(null)
  const animation = useRef<gsap.core.Tween | null>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const width = element.offsetWidth
    const height = element.offsetHeight
    const last = previous.current
    previous.current = { width, height }
    if (!last || (last.width === width && last.height === height)) return

    if (
      width <= 0 ||
      height <= 0 ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animation.current?.kill()
      animation.current = null
      gsap.set(element, { clearProps: "transform,willChange" })
      return
    }

    // Retarget from the visible size, including an interrupted transition.
    const scaleX =
      (last.width * Number(gsap.getProperty(element, "scaleX"))) / width
    const scaleY =
      (last.height * Number(gsap.getProperty(element, "scaleY"))) / height
    animation.current?.kill()

    // Layout and texture measurement happen once per size step; frames only transform.
    gsap.set(element, { scaleX, scaleY, willChange: "transform" })
    animation.current = gsap.to(element, {
      scaleX: 1,
      scaleY: 1,
      duration: 0.26,
      ease: "power3.out",
      overwrite: "auto",
      onComplete: () => {
        animation.current = null
        gsap.set(element, { clearProps: "transform,willChange" })
      },
    })
  }, [placement.width, placement.height, columnStep, rowStep])

  useLayoutEffect(
    () => () => {
      animation.current?.kill()
    },
    []
  )
  return ref
}
