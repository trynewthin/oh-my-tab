import { useRef } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { toast } from "@/stores/toast-store"
import { createBackup, readBackup, downloadBackup } from "@/application/backup"
import { storageRevision } from "@/lib/storage"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import type { Pending } from "./data-settings-types"

export default function LocalBackup({
  busy,
  pending,
  setPending,
  run,
}: {
  busy: boolean
  pending: Pending | null
  setPending: (pending: Pending | null) => void
  run: (action: () => Promise<void>) => Promise<void>
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-2">
      <SettingItem label={t("settings.backup.title")}>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className={settingsControlClassName}
            disabled={busy || !!pending}
            onClick={() =>
              void run(async () => {
                downloadBackup(await createBackup())
                toast(t("settings.backup.created"), "success")
              })
            }
          >
            {t("settings.backup.backup")}
          </Button>
          <Button
            variant="outline"
            className={settingsControlClassName}
            disabled={busy || !!pending}
            onClick={() => input.current?.click()}
          >
            {t("settings.backup.restore")}
          </Button>
        </div>
      </SettingItem>
      <input
        ref={input}
        type="file"
        accept=".zip,.txt,application/zip,text/plain"
        className="sr-only"
        aria-label={t("settings.backup.importAria")}
        disabled={busy || !!pending}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ""
          if (file)
            void run(async () => {
              const revision = await storageRevision()
              setPending({
                kind: "restore",
                backup: await readBackup(file),
                revision,
                source: file.name,
              })
            })
        }}
      />
    </div>
  )
}
