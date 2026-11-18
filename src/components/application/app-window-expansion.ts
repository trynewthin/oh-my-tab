import { createContext, useCallback, useRef } from "react"

type WindowGeometry = {
  width: number
  height: number
  radius: string
}

export type AppWindowPhase = "loading" | "ready" | "blocked"

export const AppWindowExpansionContext = createContext<
  ((popup: HTMLElement, phase: AppWindowPhase) => void) | null
>(null)

export function useAppWindowExpansion(onReadyChange: (ready: boolean) => void) {
  const loadingWindow = useRef<{
    popup: HTMLElement
    geometry: WindowGeometry
  } | null>(null)

  return useCallback(
    (popup: HTMLElement, phase: AppWindowPhase) => {
      const from = loadingWindow.current
      loadingWindow.current = null

      if (phase === "ready") {
        if (
          from &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          prepareWindowExpansion(popup, from.geometry)
      } else {
        // Keep the card steady when startup moves from one status to another.
        if (from && from.popup !== popup)
          popup.dataset.appWindowExpansion = "done"
        if (phase === "loading") {
          const geometry = readWindowGeometry(popup)
          if (geometry.width && geometry.height)
            loadingWindow.current = { popup, geometry }
        }
      }

      onReadyChange(phase === "ready")
    },
    [onReadyChange]
  )
}

function readWindowGeometry(popup: HTMLElement): WindowGeometry {
  return {
    width: popup.offsetWidth,
    height: popup.offsetHeight,
    radius: getComputedStyle(popup).borderRadius,
  }
}

function prepareWindowExpansion(popup: HTMLElement, from: WindowGeometry) {
  const to = readWindowGeometry(popup)
  const content = popup.querySelector<HTMLElement>(
    ":scope > [data-app-window-content]"
  )
  if (!to.width || !to.height || !content) return

  const { style } = popup
  style.setProperty("--app-window-from-width", `${from.width}px`)
  style.setProperty("--app-window-from-height", `${from.height}px`)
  style.setProperty("--app-window-from-radius", from.radius)
  style.setProperty("--app-window-to-width", `${to.width}px`)
  style.setProperty("--app-window-to-height", `${to.height}px`)
  style.setProperty("--app-window-to-radius", to.radius)
  style.setProperty("--app-window-content-width", `${content.offsetWidth}px`)
  style.setProperty("--app-window-content-height", `${content.offsetHeight}px`)
  popup.dataset.appWindowExpansion = "running"
}
