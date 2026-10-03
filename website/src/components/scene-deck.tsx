import { useCallback, useEffect, useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"
import "./scene-deck.css"

export function SceneDeck({
  scenes,
  footer,
}: {
  scenes: ReactNode[]
  footer: ReactNode
}) {
  const { i18n } = useTranslation()
  const root = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const current = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const enterTimer = useRef<number | undefined>(undefined)
  const locked = useRef(false)
  const english = i18n.resolvedLanguage === "en"
  const move = useCallback(
    (target: number) => {
      if (
        locked.current ||
        target < 0 ||
        target >= scenes.length ||
        target === current.current
      )
        return
      locked.current = true
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches
      setLeaving(true)
      timer.current = window.setTimeout(
        () => {
          current.current = target
          setIndex(target)
          setLeaving(false)
          enterTimer.current = window.setTimeout(
            () => {
              locked.current = false
            },
            reduced ? 0 : 650
          )
          root.current
            ?.querySelector<HTMLElement>(".scene-panel")
            ?.scrollTo(0, 0)
        },
        reduced ? 0 : 280
      )
    },
    [scenes.length]
  )
  useEffect(() => {
    const node = root.current
    if (!node) return
    let wheelTotal = 0
    let lastWheel = 0
    let consumed = false
    let start: { x: number; y: number } | null = null
    const canScroll = (target: EventTarget | null, delta: number) => {
      const panel =
        target instanceof Element ? target.closest(".scene-panel") : null
      return (
        panel &&
        (delta > 0
          ? panel.scrollTop + panel.clientHeight < panel.scrollHeight - 2
          : panel.scrollTop > 2)
      )
    }
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY))
        return
      if (canScroll(event.target, event.deltaY)) return
      event.preventDefault()
      const now = performance.now()
      if (now - lastWheel > 220) {
        wheelTotal = 0
        consumed = false
      }
      lastWheel = now
      if (consumed || locked.current) {
        consumed = true
        return
      }
      wheelTotal +=
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? node.clientHeight
            : 1)
      if (Math.abs(wheelTotal) < 60) return
      consumed = true
      move(current.current + Math.sign(wheelTotal))
    }
    const touchStart = (event: TouchEvent) => {
      start =
        event.touches.length === 1
          ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
          : null
    }
    const touchEnd = (event: TouchEvent) => {
      if (!start || !event.changedTouches.length) return
      const touch = event.changedTouches[0]
      const dy = start.y - touch.clientY
      const dx = start.x - touch.clientX
      start = null
      if (
        Math.abs(dy) < 60 ||
        Math.abs(dy) <= Math.abs(dx) ||
        canScroll(event.target, dy)
      )
        return
      move(current.current + Math.sign(dy))
    }
    const key = (event: KeyboardEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("input,textarea,select,[contenteditable=true]")
      )
        return
      if (!["ArrowDown", "ArrowUp", "PageDown", "PageUp"].includes(event.key))
        return
      const direction =
        event.key === "ArrowDown" || event.key === "PageDown" ? 1 : -1
      if (canScroll(event.target, direction)) return
      event.preventDefault()
      move(current.current + direction)
    }
    node.addEventListener("wheel", wheel, { passive: false })
    node.addEventListener("touchstart", touchStart, { passive: true })
    node.addEventListener("touchend", touchEnd, { passive: true })
    window.addEventListener("keydown", key)
    return () => {
      node.removeEventListener("wheel", wheel)
      node.removeEventListener("touchstart", touchStart)
      node.removeEventListener("touchend", touchEnd)
      window.removeEventListener("keydown", key)
      clearTimeout(timer.current)
      clearTimeout(enterTimer.current)
    }
  }, [move])
  return (
    <div
      className="scene-deck"
      ref={root}
      onClick={(event) => {
        const anchor = (event.target as Element).closest('a[href="#features"]')
        if (anchor) {
          event.preventDefault()
          move(1)
        }
      }}
    >
      <div
        key={index}
        className={[
          "scene-panel",
          leaving && "scene-panel--leaving",
          index === scenes.length - 1 && "scene-panel--final",
        ]
          .filter(Boolean)
          .join(" ")}
        tabIndex={0}
        aria-label={`${index + 1} / ${scenes.length}`}
      >
        <div className="scene-content">
          {scenes[index]}
          {index > 0 && (
            <nav
              className="scene-controls"
              aria-label={english ? "Page navigation" : "页面导航"}
            >
              <button
                type="button"
                disabled={leaving}
                className="scene-previous"
                onClick={() => move(index - 1)}
                aria-label={english ? "Previous" : "上一页"}
              >
                <span className="scene-chevron">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M2 5h4v3h3v3h2V8h3V5h4v4h-3v3h-3v3H8v-3H5V9H2Z" />
                  </svg>
                </span>
              </button>
              <span aria-live="polite">
                {Math.round((index / (scenes.length - 1)) * 100)}%
              </span>
              <button
                type="button"
                disabled={leaving}
                onClick={() => {
                  if (index === scenes.length - 1) {
                    const panel =
                      root.current?.querySelector<HTMLElement>(".scene-panel")
                    const footerElement =
                      panel?.querySelector<HTMLElement>(".scene-footer")
                    if (panel && footerElement)
                      panel.scrollTo({
                        top: footerElement.offsetTop,
                        behavior: window.matchMedia(
                          "(prefers-reduced-motion: reduce)"
                        ).matches
                          ? "instant"
                          : "smooth",
                      })
                  } else move(index + 1)
                }}
                aria-label={english ? "Next" : "下一页"}
              >
                <span className="scene-chevron">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M2 5h4v3h3v3h2V8h3V5h4v4h-3v3h-3v3H8v-3H5V9H2Z" />
                  </svg>
                </span>
              </button>
            </nav>
          )}
        </div>
        {index === scenes.length - 1 && (
          <div className="scene-footer">{footer}</div>
        )}
      </div>
    </div>
  )
}
