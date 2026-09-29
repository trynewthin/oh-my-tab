import { toast } from "@/stores/toast-store"
import { useState } from "react"
import SettingItem from "@/components/settings/shared/setting-item"
import ColorPicker from "@/components/ui/color-picker"
import { Input } from "@/components/ui/input"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { normalizeTabUrl, type TabItem } from "@/lib/grid/types"
import {
  componentDefaultName,
  componentLabel,
  getComponentDefinition,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
  type GridItemSize,
} from "@/lib/grid/registry"
import { configureComponent } from "@/lib/grid/factory"
import { useTranslation } from "react-i18next"
import ComponentEditorFrame from "./component-editor-frame"
import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import TabIconControls from "./tab-icon-controls"

// The tab is the first component on the shared editor. It supplies its own
// fields and live preview; the frame owns the dialog chrome.
export default function TabEditor({
  item,
  onClose,
  onSaved,
}: {
  item?: TabItem
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const definition = getComponentDefinition("tab")
  const [name, setName] = useState(item?.name ?? "")
  const [url, setUrl] = useState(item?.url ?? "")
  const [size, setSize] = useState<GridItemSize>(
    item?.size ?? definition.defaultSize
  )
  const [color, setColor] = useState(item?.color ?? definition.defaultColor)
  const [icon, setIcon] = useState(item?.icon)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const sizeOptions = getComponentSizeOptions("tab", "editor", item?.size)
  const current = getComponentSize("tab", size) ?? definition.sizes[0]
  const resolvedSize = (
    isComponentSize("tab", size) ? size : definition.defaultSize
  ) as TabItem["size"]
  const previewName = name.trim() || componentDefaultName("tab", t)
  const preview: TabItem = {
    id,
    kind: "tab",
    name: previewName,
    url: normalizeTabUrl(url) ?? "https://example.com",
    size: resolvedSize,
    color,
    icon,
    dynamicEffect: item?.dynamicEffect,
  }

  function save() {
    const normalized = normalizeTabUrl(url)
    const resolvedName = name.trim()
    if (!resolvedName || !normalized) {
      toast(t("grid.editor.invalidTab"), "error")
      return
    }
    saveItem(
      configureComponent({
        existing: item,
        id,
        kind: "tab",
        name: resolvedName,
        size: resolvedSize,
        color,
        url: normalized,
        icon,
      })
    )
    onSaved()
  }

  return (
    <ComponentEditorFrame
      title={
        item
          ? t("grid.editor.editTitle", { label: componentLabel("tab", t) })
          : t("grid.editor.configTitle", { label: componentLabel("tab", t) })
      }
      description={t("grid.editor.descriptionWithName")}
      width={current.width}
      height={current.height}
      preview={
        <>
          <TabBackground item={preview} />
          <TabUI item={preview} preview />
        </>
      }
      sizeOptions={sizeOptions}
      size={size}
      onSizeChange={(value) => {
        if (isComponentSize("tab", value)) setSize(value)
      }}
      submitLabel={item ? t("grid.editor.save") : t("grid.editor.confirmAdd")}
      onSubmit={save}
      onClose={onClose}
    >
      <SettingItem label={t("grid.editor.name")} htmlFor="tab-editor-name">
        <Input
          id="tab-editor-name"
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </SettingItem>
      <SettingItem label={t("grid.editor.url")} htmlFor="tab-editor-url">
        <Input
          id="tab-editor-url"
          required
          placeholder="https://example.com"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </SettingItem>
      <SettingItem label={t("grid.editor.backgroundColor")}>
        <ColorPicker
          label={t("grid.editor.backgroundColor")}
          value={color}
          onChange={setColor}
        />
      </SettingItem>
      <TabIconControls url={url} icon={icon} onIconChange={setIcon} />
    </ComponentEditorFrame>
  )
}
