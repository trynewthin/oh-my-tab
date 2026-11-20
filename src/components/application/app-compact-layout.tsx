import type { Icon } from "@phosphor-icons/react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import AppWindowFrame from "@/components/application/app-window-frame"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import { DialogClose } from "@/components/ui/dialog"
import type { AppId } from "@/lib/apps/ids"

export default function AppCompactLayout({
  id,
  title,
  description,
  icon: Icon,
  children,
}: {
  id: AppId
  title: string
  description?: string
  icon: Icon
  children: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <AppWindowFrame
      id={id}
      title={title}
      description={description}
      className="flex max-h-[calc(100svh-2rem)] flex-col sm:max-w-lg"
    >
      <header className="flex shrink-0 items-start gap-3 border-b border-border/70 bg-muted/30 px-4 py-4 sm:px-5">
        <div className="grid size-10 shrink-0 place-items-center rounded-(--ui-radius-control) bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-5" weight="duotone" />
        </div>
        <div aria-hidden="true" className="min-w-0 flex-1 pt-0.5">
          <p className="text-base leading-tight font-semibold">{title}</p>
          {description && (
            <p className="mt-1 text-xs leading-normal text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground"
            />
          }
          aria-label={t("shell.common.close")}
        >
          <CloseIcon />
        </DialogClose>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
        {children}
      </div>
    </AppWindowFrame>
  )
}
