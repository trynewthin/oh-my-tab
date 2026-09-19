import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <label
        id="sync-settings-title"
        htmlFor="sync-provider"
        className="text-sm"
      >
        多端同步
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
          <SelectValue>{provider === "webdav" ? "WebDAV" : "关闭"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="local">关闭</SelectItem>
          <SelectItem value="webdav">WebDAV</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
