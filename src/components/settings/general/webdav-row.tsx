import { useTranslation } from "react-i18next"
import { ArrowsClockwise, Trash } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavRow({ state }: { state: DataSettingsState }) {
  const { t } = useTranslation()
  const {
    busy,
    ready,
    pending,
    syncPlan,
    saved,
    connected,
    run,
    sync,
    removeOpen,
    setRemoveOpen,
    setWebdavOpen,
  } = state
  const disabled = busy || !ready || !!pending || !!syncPlan || removeOpen
  const connectionLabel = t(
    connected ? "settings.webdav.connected" : "settings.webdav.disconnected"
  )
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
      {saved ? (
        <div
          role="group"
          aria-label="WebDAV"
          className="grid w-full min-w-0 grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2"
        >
          <Button
            variant="outline"
            size="icon"
            className={settingsControlClassName}
            disabled={disabled}
            aria-label={t("settings.webdav.connectionSettings", {
              status: connectionLabel,
            })}
            title={t("settings.webdav.connectionSettings", {
              status: connectionLabel,
            })}
            onClick={() => setWebdavOpen(true)}
          >
            <span
              role="status"
              aria-label={connectionLabel}
              className={`size-2 rounded-full ${connected ? "bg-emerald-500" : "bg-red-500"}`}
            />
          </Button>
          <Button
            variant="outline"
            className={`min-w-0 gap-1 px-1 ${settingsControlClassName}`}
            disabled={disabled}
            aria-label={t("settings.webdav.syncNow")}
            title={t("settings.webdav.syncNow")}
            onClick={() => void run(sync)}
          >
            <ArrowsClockwise aria-hidden="true" />
            <span className="truncate">{t("settings.webdav.syncNow")}</span>
          </Button>
          <Button
            variant="outline"
            className={`min-w-0 gap-1 px-1 ${settingsControlClassName}`}
            disabled={disabled}
            aria-label={t("settings.webdav.remove")}
            title={t("settings.webdav.remove")}
            onClick={() => setRemoveOpen(true)}
          >
            <Trash aria-hidden="true" />
            <span className="truncate">{t("settings.webdav.remove")}</span>
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className={settingsControlClassName}
          disabled={disabled}
          onClick={() => setWebdavOpen(true)}
        >
          {t("settings.common.manage")}
        </Button>
      )}
    </SettingItem>
  )
}
