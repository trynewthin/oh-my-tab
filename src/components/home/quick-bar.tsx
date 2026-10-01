import { Globe } from "@phosphor-icons/react"
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react"
import { useTranslation } from "react-i18next"
import { runSystemAction } from "@/application/system-actions"
import { systemActionIcons } from "@/components/system-action-icons"
import { useSystemActionState } from "@/components/system-action-state"
import TabIcon from "@/components/tab-grid/tab-icon"
import { systemActionRegistry } from "@/lib/system-actions"
import { rovingIndex } from "@/lib/roving-index"
import { resolveGridGeometry } from "@/lib/grid/grid-layout"
import type {
  QuickBarCenter as QuickBarCenterConfig,
  QuickBarConfig,
  QuickBarControl,
} from "@/lib/quick-bar"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import "./home-composition.css"

export function QuickBarGlyph({ control }: { control: QuickBarControl }) {
  if (control.kind === "site")
    return (
      <TabIcon
        url={control.url}
        className="size-5"
        fallback={<Globe className="size-5" aria-hidden="true" />}
      />
    )
  const Icon = systemActionIcons[control.action]
  return <Icon className="size-5" aria-hidden="true" />
}

function SystemQuickControl({
  control,
}: {
  control: Extract<QuickBarControl, { kind: "system" }>
}) {
  const { t } = useTranslation()
  const { disabled, pressed } = useSystemActionState(control.action)
  const label = t(systemActionRegistry[control.action].labelKey)
  return (
    <button
      type="button"
      data-quick-control
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      className="desk-control"
      onClick={() => runSystemAction(control.action)}
    >
      <QuickBarGlyph control={control} />
    </button>
  )
}

function QuickControl({ control }: { control: QuickBarControl }) {
  if (control.kind === "system") return <SystemQuickControl control={control} />
  return (
    <a
      data-quick-control
      href={control.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={control.name}
      title={control.name}
      className="desk-control"
    >
      <QuickBarGlyph control={control} />
    </a>
  )
}

export function QuickBarCenter({ center }: { center: QuickBarCenterConfig }) {
  const { i18n } = useTranslation()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    if (center.kind !== "time") return
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [center.kind])
  if (center.kind === "none") return <span aria-hidden="true" />
  if (center.kind === "text")
    return (
      <span className="desk-center-text" title={center.text}>
        {center.text}
      </span>
    )
  return (
    <time className="desk-clock" dateTime={now.toISOString()}>
      <span className="desk-clock-time">
        {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
          hour: "2-digit",
          minute: "2-digit",
        }).format(now)}
      </span>
      <span className="desk-clock-date">
        {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
          month: "short",
          day: "numeric",
          weekday: "short",
        }).format(now)}
      </span>
    </time>
  )
}

function moveToolbarFocus(event: KeyboardEvent<HTMLDivElement>) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const controls = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      "[data-quick-control]:not(:disabled)"
    )
  )
  const current = controls.findIndex(
    (control) => control === document.activeElement
  )
  const next = rovingIndex(event.key, current, controls.length)
  if (next === null) return
  event.preventDefault()
  controls[next].focus()
}

export function QuickBarTrack({ config }: { config: QuickBarConfig }) {
  const { t } = useTranslation()
  return (
    <div
      data-quick-bar-track
      role="toolbar"
      aria-label={t("shell.home.quickBar")}
      className="desk-toolbar"
      onKeyDown={moveToolbarFocus}
    >
      <div className="desk-control-scroll">
        <div className="desk-controls">
          {config.left.map((control) => (
            <QuickControl key={control.id} control={control} />
          ))}
        </div>
      </div>
      <QuickBarCenter key={config.center.kind} center={config.center} />
      <div className="desk-control-scroll">
        <div className="desk-controls desk-controls--end">
          {config.right.map((control) => (
            <QuickControl key={control.id} control={control} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function QuickBar() {
  const quickBar = useHomeSettingsStore((state) => state.quickBar)
  const wideGridColumns = useHomeSettingsStore((state) => state.wideGridColumns)
  const narrowGridColumns = useHomeSettingsStore(
    (state) => state.narrowGridColumns
  )
  const color = useHomeSettingsStore((state) => state.color)
  const container = useRef<HTMLDivElement>(null)
  const [availableWidth, setAvailableWidth] = useState(0)
  useLayoutEffect(() => {
    const element = container.current
    if (!element) return
    const update = () =>
      setAvailableWidth(element.getBoundingClientRect().width)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const geometry = resolveGridGeometry(
    availableWidth,
    wideGridColumns,
    narrowGridColumns
  )
  const trackWidth = availableWidth > 0 ? geometry.visualWidth : undefined

  return (
    <div ref={container} className="desk-topbar">
      <div
        className="desk-topbar-track"
        style={{ width: trackWidth, borderTopColor: color }}
      >
        <QuickBarTrack config={quickBar} />
      </div>
    </div>
  )
}
