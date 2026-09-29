import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavDialog({ state }: { state: DataSettingsState }) {
  const { t } = useTranslation()
  const {
    busy,
    ready,
    webdavOpen,
    setWebdavOpen,
    connection,
    updateConnection,
    snapshotLimit,
    setSnapshotLimit,
    run,
    connect,
    saved,
  } = state
  return (
    <Dialog open={webdavOpen} onOpenChange={setWebdavOpen}>
      <DialogContent
        className="max-h-[85svh] overflow-y-auto sm:max-w-md"
        aria-describedby={undefined}
      >
        <div className="grid min-w-0 gap-6 px-2 py-1">
          <DialogTitle>WebDAV</DialogTitle>
          <fieldset disabled={busy || !ready} className="min-w-0 space-y-4">
            <SettingItem label={t("settings.webdav.url")} htmlFor="webdav-url">
              <Input
                id="webdav-url"
                className={settingsControlClassName}
                type="url"
                placeholder="https://dav.example.com/oh-my-tab/"
                value={connection.url}
                onChange={(e) => updateConnection({ url: e.target.value })}
              />
            </SettingItem>
            <SettingItem
              label={t("settings.webdav.username")}
              htmlFor="webdav-user"
            >
              <Input
                id="webdav-user"
                className={settingsControlClassName}
                autoComplete="off"
                value={connection.username}
                onChange={(e) => updateConnection({ username: e.target.value })}
              />
            </SettingItem>
            <SettingItem
              label={t("settings.webdav.password")}
              htmlFor="webdav-password"
              description={t("settings.webdav.passwordHint")}
            >
              <Input
                id="webdav-password"
                className={settingsControlClassName}
                type="password"
                autoComplete="off"
                value={connection.password}
                onChange={(e) => updateConnection({ password: e.target.value })}
              />
            </SettingItem>
            <SettingItem
              label={t("settings.webdav.snapshotLimit")}
              htmlFor="webdav-snapshot-limit"
              description={t("settings.webdav.snapshotHint")}
            >
              <Input
                id="webdav-snapshot-limit"
                className={settingsControlClassName}
                type="number"
                min={1}
                max={100}
                step={1}
                value={Number.isNaN(snapshotLimit) ? "" : snapshotLimit}
                onChange={(e) =>
                  setSnapshotLimit(
                    e.target.value === "" ? NaN : Number(e.target.value)
                  )
                }
              />
            </SettingItem>
          </fieldset>
          <div className="flex justify-end">
            <Button
              variant="outline"
              className={settingsControlClassName}
              disabled={busy || !ready}
              onClick={() => void run(connect)}
            >
              {busy
                ? t("settings.webdav.connecting")
                : saved
                  ? t("settings.webdav.saveConnection")
                  : t("settings.webdav.connect")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
