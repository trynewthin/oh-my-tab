import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import { settingsControlClassName } from "../shared/control-styles"
import type { Pending } from "./data-settings-types"
import type { SyncProvider } from "./use-data-settings"

export default function SyncProviderSelect({
  provider,
  busy,
  ready,
  pending,
  onSelect,
}: {
  provider: SyncProvider
  busy: boolean
  ready: boolean
  pending: Pending | null
  onSelect: (provider: SyncProvider) => Promise<void>
}) {
  const { t } = useTranslation()
  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <label
        id="sync-settings-title"
        htmlFor="sync-provider"
        className="text-sm"
      >
        {t("settings.sync.label")}
      </label>
      <Select
        value={provider}
        disabled={busy || !!pending || !ready}
        onValueChange={(value) => {
          if (value !== "local" && value !== "webdav") return
          void onSelect(value)
        }}
      >
        <SelectTrigger
          id="sync-provider"
          className={`w-full ${settingsControlClassName}`}
        >
          <SelectValue>
            {provider === "webdav" ? "WebDAV" : t("settings.sync.off")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="local">{t("settings.sync.off")}</SelectItem>
          <SelectItem value="webdav">WebDAV</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
