import { Globe } from "@phosphor-icons/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { runSystemAction } from "@/application/system-actions"
import GradualBlur from "@/components/effects/gradual-blur"
import { systemActionIcons } from "@/components/system-action-icons"
import TabIcon from "@/components/tab-grid/tab-icon"
import { buttonActionLabelKeys } from "@/lib/grid/button-actions"
import { resolveGridGeometry } from "@/lib/grid/grid-layout"
import type {
  QuickBarCenter as QuickBarCenterConfig,
  QuickBarConfig,
  QuickBarControl,
} from "@/lib/quick-bar"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export function QuickBarGlyph({ control }: { control: QuickBarControl }) {
  const { t } = useTranslation()
  if (control.kind === "site")
    return (
      <TabIcon
        url={control.url}
        className="size-5"
        fallback={<Globe className="size-5" />}
      />
    )
  const Icon = systemActionIcons[control.action]
  return (
    <Icon
      className="size-5"
      aria-label={t(
        `grid.editor.buttonActions.${buttonActionLabelKeys[control.action]}`
      )}
    />
  )
}

function QuickControl({ control }: { control: QuickBarControl }) {
  const { t } = useTranslation()
  const className =
    "flex size-8 shrink-0 items-center justify-center rounded-lg text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
  if (control.kind === "site")
    return (
      <a
        href={control.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={control.name}
        title={control.name}
        className={className}
      >
        <QuickBarGlyph control={control} />
      </a>
    )

  const label = t(
    `grid.editor.buttonActions.${buttonActionLabelKeys[control.action]}`
  )
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={className}
      onClick={() => runSystemAction(control.action)}
    >
      <QuickBarGlyph control={control} />
    </button>
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
  return (
    <span className="block min-w-0 truncate text-center text-sm font-medium whitespace-nowrap text-foreground">
      {center.kind === "time"
        ? new Intl.DateTimeFormat(i18n.resolvedLanguage, {
            hour: "2-digit",
            minute: "2-digit",
          }).format(now)
        : center.text}
    </span>
  )
}

export function QuickBarTrack({ config }: { config: QuickBarConfig }) {
  const { t } = useTranslation()
  return (
    <div
      data-quick-bar-track
      role="toolbar"
      aria-label={t("shell.home.quickBar")}
      className="grid h-8 w-full grid-cols-3 items-center"
    >
      <div className="min-w-0 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full items-center gap-1">
          {config.left.map((control) => (
            <QuickControl key={control.id} control={control} />
          ))}
        </div>
      </div>
      <QuickBarCenter key={config.center.kind} center={config.center} />
      <div className="min-w-0 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max min-w-full items-center justify-end gap-1">
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
    <div ref={container} className="sticky top-0 z-40 w-full pt-2">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-10"
      >
        <GradualBlur
          position="top"
          target="parent"
          exponential
          strength={1}
          height="2.5rem"
          divCount={3}
          opacity={1}
          zIndex={0}
        />
      </div>
      <div className="relative z-10 mx-auto" style={{ width: trackWidth }}>
        <QuickBarTrack config={quickBar} />
      </div>
    </div>
  )
}
