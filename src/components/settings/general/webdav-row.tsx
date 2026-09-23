import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import SettingItem from "../shared/setting-item"
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
    <SettingItem
      label="WebDAV"
      description={
        <>
          <p>{t("settings.webdav.intro")}</p>
          <ol className="mt-2 list-decimal space-y-2 pl-4">
            <li>{t("settings.webdav.step1")}</li>
            <li>{t("settings.webdav.step2")}</li>
            <li>{t("settings.webdav.step3")}</li>
          </ol>
        </>
      }
    >
      <Button
        variant="outline"
        className={settingsControlClassName}
        disabled={disabled}
        onClick={onManage}
      >
        {t("settings.common.manage")}
      </Button>
    </SettingItem>
  )
}
