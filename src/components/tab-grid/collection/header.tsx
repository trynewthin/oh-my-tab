import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function CollectionCardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <header
      data-collection-header
      className={cn(
        "relative z-20 flex h-5 shrink-0 items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

export function CollectionTitleButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      data-collection-title
      className={cn(
        "min-w-0 flex-1 truncate text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm",
        className
      )}
      {...props}
    />
  )
}

export function CollectionHeaderAction({
  label,
  children,
  className,
  ...props
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> & {
  label: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      data-collection-actions
      aria-label={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full p-1 text-foreground hover:bg-muted disabled:opacity-40",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
