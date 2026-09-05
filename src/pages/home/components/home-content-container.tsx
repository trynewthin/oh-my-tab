import type { ComponentProps } from "react"

import { cn } from "@/lib/utils"

export default function HomeContentContainer({
  children,
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-40 w-full max-w-3xl shrink-0 flex-col justify-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
