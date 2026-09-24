import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { ArrowUpRight, SlidersHorizontal } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { UtilityWidgetItem } from "@/lib/grid/utility-types"
import { CollectionCardHeader } from "../collection/header"
import ComponentBackground from "../shared/component-background"
import "./widgets.css"

export type WidgetProps<T extends UtilityWidgetItem = UtilityWidgetItem> = {
  item: T
  preview?: boolean
  /** Only catalog previews substitute illustrative sample content. */
  sample?: boolean
  onOpen: () => void
}

export function WidgetAction({
  label,
  children,
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "aria-label" | "size" | "variant"> & {
  label: string
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("utility-action", className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </Button>
  )
}

export function WidgetSurface({
  item,
  preview = false,
  onOpen,
  children,
  title = item.name,
  header = true,
  className,
  footer,
}: WidgetProps & {
  children: ReactNode
  title?: string
  header?: boolean
  className?: string
  footer?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={item.name}
      data-utility-widget={item.kind}
      data-size={item.size}
      data-preview={preview || undefined}
      className={cn("utility-surface", className)}
      style={{ "--utility-accent": item.color } as CSSProperties}
      onMouseDown={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button, input, textarea, select, a")
        )
          event.stopPropagation()
      }}
      onPointerDown={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button, input, textarea, select, a")
        )
          event.stopPropagation()
      }}
    >
      <ComponentBackground
        color={item.color}
        animated={!preview && !!item.dynamicEffect}
      />
      <div className="utility-body">
        {header && (
          <CollectionCardHeader className="utility-header">
            <span className="utility-eyebrow" title={title}>
              {title}
            </span>
            {!preview && (
              <WidgetAction
                label={t("widgets.configure")}
                className="utility-settings"
                onClick={onOpen}
              >
                <SlidersHorizontal size={16} />
              </WidgetAction>
            )}
          </CollectionCardHeader>
        )}
        {children}
        {footer && <footer className="utility-footer">{footer}</footer>}
      </div>
    </section>
  )
}

export function WidgetEmpty({
  preview,
  onOpen,
  icon,
  title,
  hint,
}: Pick<WidgetProps, "preview" | "onOpen"> & {
  icon: ReactNode
  title: string
  hint?: string
}) {
  const content = (
    <>
      <span className="utility-empty-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="utility-empty-title">{title}</span>
      {hint && <span className="utility-empty-hint">{hint}</span>}
      {!preview && (
        <ArrowUpRight
          className="utility-empty-arrow"
          size={16}
          aria-hidden="true"
        />
      )}
    </>
  )
  return preview ? (
    <div className="utility-empty">{content}</div>
  ) : (
    <button
      type="button"
      className="utility-empty utility-focus"
      onClick={onOpen}
    >
      {content}
    </button>
  )
}

export function Dial({ hour, minute }: { hour: number; minute: number }) {
  return (
    <svg viewBox="0 0 48 48" className="utility-dial" aria-hidden="true">
      <circle cx="24" cy="24" r="21" className="utility-dial-face" />
      {[0, 90, 180, 270].map((angle) => (
        <line
          key={angle}
          x1="24"
          y1="5"
          x2="24"
          y2="8"
          transform={`rotate(${angle} 24 24)`}
          className="utility-dial-tick"
        />
      ))}
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="13"
        transform={`rotate(${(hour % 12) * 30 + minute / 2} 24 24)`}
        className="utility-dial-hour"
      />
      <line
        x1="24"
        y1="24"
        x2="24"
        y2="9"
        transform={`rotate(${minute * 6} 24 24)`}
        className="utility-dial-minute"
      />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  )
}
