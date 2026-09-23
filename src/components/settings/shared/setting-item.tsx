import type { ReactNode } from "react"
import { Info } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function SettingItem({
  label,
  htmlFor,
  labelId,
  description,
  children,
}: {
  label: string
  htmlFor?: string
  labelId?: string
  description?: ReactNode
  children: ReactNode
}) {
  const { t } = useTranslation()
  const infoLabel = t("settings.common.info", { label })

  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="flex items-center gap-1">
        {htmlFor ? (
          <label id={labelId} htmlFor={htmlFor} className="text-sm">
            {label}
          </label>
        ) : (
          <span id={labelId} className="text-sm">
            {label}
          </span>
        )}
        {description !== undefined && (
          <Popover>
            <PopoverTrigger
              openOnHover
              delay={150}
              closeDelay={100}
              aria-label={infoLabel}
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-full text-muted-foreground"
                />
              }
            >
              <Info className="size-4" aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="w-80 max-w-[calc(100vw-2rem)] gap-3 rounded-xl p-3"
              aria-label={infoLabel}
            >
              <div className="text-xs leading-5 text-muted-foreground">
                {description}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      {children}
    </div>
  )
}
