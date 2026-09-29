import { useState } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "@/components/settings/shared/setting-item"
import { Input } from "@/components/ui/input"
import { getComponentDefinition, getComponentSize } from "@/lib/grid/registry"
import { normalizeTabUrl, type TabEntry } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"
import ComponentEditorFrame from "./component-editor-frame"
import FolderTabRow from "./folder-tab-row"
import TabIconControls from "./tab-icon-controls"

export default function FolderTabEditor({
  folderId,
  tab,
  onClose,
}: {
  folderId: string
  tab: TabEntry
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(tab.name)
  const [url, setUrl] = useState(tab.url)
  const [icon, setIcon] = useState(tab.icon)
  const folder = useTabGridStore((state) =>
    state.items.find((item) => item.kind === "folder" && item.id === folderId)
  )
  const updateFolderTab = useTabGridStore((state) => state.updateFolderTab)
  const dimensions = getComponentSize("tab", "small")!
  const previewTab: TabEntry = {
    ...tab,
    name: name.trim() || tab.name,
    url: normalizeTabUrl(url) ?? tab.url,
    icon,
  }

  function save() {
    const normalized = normalizeTabUrl(url)
    if (!name.trim() || !normalized) {
      toast(t("grid.folder.invalidTab"), "error")
      return
    }
    updateFolderTab(folderId, tab.id, {
      name: name.trim(),
      url: normalized,
      icon,
    })
    onClose()
  }

  return (
    <ComponentEditorFrame
      contentClassName="z-[90]"
      overlayClassName="z-[80]"
      title={t("grid.folder.editTabTitle")}
      description={t("grid.editor.descriptionWithName")}
      width={dimensions.width}
      height={dimensions.height}
      preview={
        <FolderTabRow
          tab={previewTab}
          color={
            folder?.kind === "folder"
              ? folder.color
              : getComponentDefinition("folder").defaultColor
          }
          folderId={folderId}
          animated={folder?.kind === "folder" && !!folder.dynamicEffect}
          preview
        />
      }
      previewBorder={false}
      submitLabel={t("grid.folder.save")}
      cancelLabel={t("grid.folder.cancel")}
      onSubmit={save}
      onClose={onClose}
    >
      <SettingItem
        label={t("grid.folder.name")}
        htmlFor="folder-tab-editor-name"
      >
        <Input
          id="folder-tab-editor-name"
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </SettingItem>
      <SettingItem label={t("grid.folder.url")} htmlFor="folder-tab-editor-url">
        <Input
          id="folder-tab-editor-url"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </SettingItem>
      <TabIconControls
        url={url}
        icon={icon}
        onIconChange={setIcon}
        alertClassName="z-[100]"
        alertOverlayClassName="z-[100]"
      />
    </ComponentEditorFrame>
  )
}
