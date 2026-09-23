import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslation } from "react-i18next"
import SettingItem from "../shared/setting-item"
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
    <SettingItem
      label={t("settings.sync.label")}
      htmlFor="sync-provider"
      labelId="sync-settings-title"
    >
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
    </SettingItem>
  )
}
