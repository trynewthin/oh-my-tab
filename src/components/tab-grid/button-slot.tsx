import type { CSSProperties, ReactNode } from "react"
import { Minus, Plus } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { runSystemAction } from "@/application/system-actions"
import { systemActionIcons } from "@/components/system-action-icons"
import { useSystemActionState } from "@/components/system-action-state"
import { systemActionRegistry } from "@/lib/system-actions"
import { buttonSlotCapacity } from "@/lib/grid/button-slot"
import type { ButtonSlotControl, ButtonSlotItem } from "@/lib/grid/types"
import TabSurface from "./tab-surface"
import TabBackground from "./tab-background"
import TabIcon from "./tab-icon"
import { useTabAppearance } from "./use-tab-style"
import { tabTextStyle } from "./tab-text-style"

const controlClassName =
  "relative flex h-full min-h-0 min-w-0 items-center justify-center rounded-[inherit] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40"

function SystemSlotControl({
  control,
  style,
  children,
  preview,
}: {
  control: Extract<ButtonSlotControl, { kind: "system" }>
  style: CSSProperties
  children: ReactNode
  preview: boolean
}) {
  const { t } = useTranslation()
  const { disabled, pressed } = useSystemActionState(control.action)
  const label = t(systemActionRegistry[control.action].labelKey)
  if (preview)
    return (
      <div style={style} className={controlClassName} title={label}>
        {children}
      </div>
    )
  return (
    <button
      type="button"
      style={style}
      className={controlClassName}
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-pressed={pressed}
      onClick={(event) => {
        event.stopPropagation()
        runSystemAction(control.action)
      }}
    >
      {children}
    </button>
  )
}

export default function ButtonSlot({
  item,
  preview = false,
  editing = false,
  onAddControl,
  onRemoveControl,
}: {
  item: ButtonSlotItem
  preview?: boolean
  editing?: boolean
  onAddControl?: () => void
  onRemoveControl?: (controlId: string, anchor: HTMLElement) => void
}) {
  const { t } = useTranslation()
  const size = item.size === "medium" ? "square-medium" : "small"
  const appearance = useTabAppearance(size)
  const wide = item.size === "wide"
  const rows = item.size === "medium" ? 2 : 1
  const capacity = buttonSlotCapacity(item.size)
  const adding = editing && !preview && !!onAddControl
  const columns = wide
    ? adding
      ? capacity
      : Math.max(1, item.controls.length)
    : 2
  const border = appearance.borderStyle === "none" ? 0 : appearance.borderWidth
  const iconSize =
    ((item.size === "medium" ? 48 : 28) * appearance.iconScale) / 100
  const controlStyle: CSSProperties = {
    containerType: "size",
    alignItems: !wide
      ? "center"
      : appearance.direction === "top"
        ? "flex-start"
        : appearance.direction === "bottom"
          ? "flex-end"
          : "center",
  }
  const glyphStyle: CSSProperties = {
    width: `min(${iconSize}px, 100cqw, 100cqh)`,
    height: `min(${iconSize}px, 100cqw, 100cqh)`,
    opacity: appearance.iconOpacity / 100,
  }
  const layoutStyle: CSSProperties = {
    padding: `${Math.max(editing ? 6 : 0, appearance.paddingY) + border}px ${Math.max(editing ? 6 : 0, appearance.paddingX) + border}px`,
    gap: appearance.gap,
    alignItems: "center",
  }
  const controlsStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
    gap: appearance.gap,
    flex: wide ? `0 1 ${(columns / capacity) * 70}%` : "1 1 0%",
    height: "100%",
    minWidth: 0,
  }
  const glyph = (control: ButtonSlotControl) => {
    const Icon =
      control.kind === "system" ? systemActionIcons[control.action] : undefined
    return (
      <span
        className="flex min-h-0 min-w-0 items-center justify-center overflow-hidden"
        style={glyphStyle}
      >
        {control.kind === "site" ? (
          <TabIcon
            url={control.url}
            src={control.icon}
            className="h-full w-full"
            imageStyle={{
              objectFit: appearance.iconFit,
              borderRadius: `${appearance.iconRadius}%`,
            }}
          />
        ) : Icon ? (
          <Icon className="h-full w-full" />
        ) : null}
      </span>
    )
  }
  return (
    <TabSurface size={size}>
      <TabBackground
        item={{ id: item.id, color: item.color, size }}
        animated={!!item.dynamicEffect}
        entrance={!preview}
      />
      <div
        role="toolbar"
        aria-label={item.name}
        className="absolute inset-0 z-10 flex min-h-0 min-w-0 overflow-hidden"
        style={layoutStyle}
        onMouseDown={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("button, a")
          )
            event.stopPropagation()
        }}
        onPointerDown={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest("button, a")
          )
            event.stopPropagation()
        }}
      >
        {wide && (
          <span
            data-dock-title
            className="min-h-0 max-w-full min-w-0"
            title={item.name}
            style={{ ...tabTextStyle(appearance), flex: "1 0 30%" }}
          >
            {item.name}
          </span>
        )}
        <div style={controlsStyle}>
          {item.controls.map((control) =>
            editing && !preview ? (
              <div
                key={control.id}
                style={controlStyle}
                className={`${controlClassName} rounded-lg border border-foreground/20`}
              >
                {glyph(control)}
                <button
                  type="button"
                  className="absolute -top-1.5 -right-1.5 z-10 flex size-4 items-center justify-center rounded-full bg-red-500 text-white shadow-sm outline-none hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={t("grid.buttonSlot.remove")}
                  title={t("grid.buttonSlot.remove")}
                  onClick={(event) => {
                    event.stopPropagation()
                    onRemoveControl?.(control.id, event.currentTarget)
                  }}
                >
                  <Minus className="size-3" weight="bold" />
                </button>
              </div>
            ) : control.kind === "system" ? (
              <SystemSlotControl
                key={control.id}
                control={control}
                style={controlStyle}
                preview={preview}
              >
                {glyph(control)}
              </SystemSlotControl>
            ) : preview ? (
              <div
                key={control.id}
                style={controlStyle}
                className={controlClassName}
                title={control.name}
              >
                {glyph(control)}
              </div>
            ) : (
              <a
                key={control.id}
                href={control.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={control.name}
                title={control.name}
                style={controlStyle}
                className={controlClassName}
                onClick={(event) => event.stopPropagation()}
              >
                {glyph(control)}
              </a>
            )
          )}
          {adding &&
            Array.from(
              { length: Math.max(0, capacity - item.controls.length) },
              (_, index) => (
                <button
                  key={`empty-${index}`}
                  type="button"
                  className={`${controlClassName} text-muted-foreground transition-colors hover:text-foreground`}
                  style={controlStyle}
                  aria-label={t("grid.buttonSlot.add")}
                  title={t("grid.buttonSlot.add")}
                  onClick={(event) => {
                    event.stopPropagation()
                    onAddControl?.()
                  }}
                >
                  <Plus style={glyphStyle} />
                </button>
              )
            )}
        </div>
      </div>
    </TabSurface>
  )
}
