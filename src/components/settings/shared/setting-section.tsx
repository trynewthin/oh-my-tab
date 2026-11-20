import { useId, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export default function SettingSection({
  title,
  icon,
  actions,
  className,
  headerClassName,
  children,
}: {
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
      aria-labelledby={headingId}
      className={cn("flex flex-col gap-4", className)}
    >
      <div
        className={cn(
          "flex items-center justify-between gap-3",
          headerClassName
        )}
      >
        <h3
          id={headingId}
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
      {children}
    </section>
  )
}
