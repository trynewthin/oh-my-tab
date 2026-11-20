import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export default function SettingSection({
  id,
  title,
  icon,
  actions,
  className,
  headerClassName,
  children,
}: {
  id?: string
  title: string
  icon?: ReactNode
  actions?: ReactNode
  className?: string
  headerClassName?: string
  children: ReactNode
}) {
  const headingId = useId()

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("flex min-w-0 flex-col gap-4", className)}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          headerClassName
        )}
      >
        <h3
          id={headingId}
          data-settings-panel-title
          className="flex min-w-0 items-center gap-2 text-base font-semibold"
        >
          {icon && (
            <span
              aria-hidden="true"
              className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground [&>*]:size-full"
            >
              {icon}
            </span>
          )}
          {title}
        </h3>
        {actions}
      </div>
      <div
        data-settings-panel
        className="flex min-w-0 flex-col gap-4 rounded-(--ui-radius-panel) border p-3 sm:p-(--ui-padding-panel)"
      >
        {children}
      </div>
    </section>
  )
}
