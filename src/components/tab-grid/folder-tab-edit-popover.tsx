import { useId, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "@/components/settings/shared/setting-item"
import { Input } from "@/components/ui/input"
import { normalizeTabUrl, type TabEntry } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import ItemEditPopover from "./item-edit-popover"
import TabIconControls from "./tab-icon-controls"

export default function FolderTabEditPopover({
  folderId,
  tab,
  anchor,
  onClose,
}: {
  folderId: string
  tab: TabEntry
  anchor: HTMLElement
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const nameRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(tab.name)
  const [url, setUrl] = useState(tab.url)
  const [dialogOpen, setDialogOpen] = useState(false)
  const valid = name.trim().length > 0 && normalizeTabUrl(url) !== null
  function update(changes: Partial<Pick<TabEntry, "name" | "url" | "icon">>) {
    const store = useTabGridStore.getState()
    const folder = store.items.find((item) => item.id === folderId)
    const current =
      folder?.kind === "folder"
        ? folder.tabs.find((item) => item.id === tab.id)
        : undefined
    if (current)
      store.updateFolderTab(folderId, tab.id, {
        name: current.name,
        url: current.url,
        icon: current.icon,
        ...changes,
      })
  }
  return (
    <ItemEditPopover
      title={t("grid.folder.editTabTitle")}
      anchor={anchor}
      onClose={onClose}
      dialogOpen={dialogOpen}
      initialFocus={nameRef}
      layer={80}
    >
      <SettingItem label={t("grid.folder.name")} htmlFor={`${id}-name`}>
        <Input
          ref={nameRef}
          id={`${id}-name`}
          maxLength={40}
          value={name}
          aria-invalid={!name.trim()}
          onChange={(event) => {
            setName(event.target.value)
            if (event.target.value.trim())
              update({ name: event.target.value.trim() })
          }}
        />
      </SettingItem>
      <SettingItem label={t("grid.folder.url")} htmlFor={`${id}-url`}>
        <Input
          id={`${id}-url`}
          value={url}
          aria-invalid={!normalizeTabUrl(url)}
          onChange={(event) => {
            setUrl(event.target.value)
            const next = normalizeTabUrl(event.target.value)
            if (next) update({ url: next })
          }}
        />
      </SettingItem>
      {!valid && (
        <p role="status" className="text-xs text-destructive">
          {t("grid.folder.invalidTab")}
        </p>
      )}
      <TabIconControls
        url={url}
        icon={tab.icon}
        onIconChange={(icon) => update({ icon })}
        onDialogOpenChange={setDialogOpen}
        alertClassName="z-[100]"
        alertOverlayClassName="z-[100]"
      />
    </ItemEditPopover>
  )
}
