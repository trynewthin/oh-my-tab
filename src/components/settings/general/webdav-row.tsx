import { Info } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import { settingsControlClassName } from "../shared/control-styles"

export default function WebdavRow({
  disabled,
  onManage,
}: {
  disabled: boolean
  onManage: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <div className="flex items-center gap-1">
        <span className="text-sm">WebDAV</span>
        <Popover>
          <PopoverTrigger
            openOnHover
            delay={150}
            closeDelay={100}
            aria-label={t("settings.webdav.infoAria")}
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
            aria-label={t("settings.webdav.infoAria")}
          >
            <PopoverDescription className="text-xs leading-5">
              {t("settings.webdav.intro")}
            </PopoverDescription>
            <ol className="list-decimal space-y-2 pl-4 text-xs leading-5 text-muted-foreground">
              <li>{t("settings.webdav.step1")}</li>
              <li>{t("settings.webdav.step2")}</li>
              <li>{t("settings.webdav.step3")}</li>
            </ol>
          </PopoverContent>
        </Popover>
      </div>
      <Button
        variant="outline"
        className={settingsControlClassName}
        disabled={disabled}
        onClick={onManage}
      >
        {t("settings.common.manage")}
      </Button>
    </div>
  )
}
