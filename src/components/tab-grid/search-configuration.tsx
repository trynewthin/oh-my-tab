import { useState } from "react"
import { useTranslation } from "react-i18next"

import SettingItem from "@/components/settings/shared/setting-item"
import { Input } from "@/components/ui/input"
import {
  componentLabel,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
} from "@/lib/grid/registry"
import type { GridItem, MinimalSearchItem } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import ComponentEditorFrame from "./component-editor-frame"
import SearchTile from "./search-tile"

type SearchItem = Extract<GridItem, { kind: "search-minimal" | "search-full" }>

export default function SearchConfiguration({
  item,
  onClose,
  onSaved,
}: {
  item: SearchItem
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(item.name)
  const [size, setSize] = useState<MinimalSearchItem["size"]>(item.size)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const currentSize = getComponentSize(item.kind, size)!
  const sizeOptions = getComponentSizeOptions(item.kind, "editor", item.size)
  const previewName = name.trim() || item.name
  const previewItem: SearchItem =
    item.kind === "search-minimal"
      ? { ...item, name: previewName, size }
      : { ...item, name: previewName }

  function save() {
    if (!name.trim()) return
    saveItem(previewItem)
    onSaved()
  }

  return (
    <ComponentEditorFrame
      title={t("grid.editor.editTitle", {
        label: componentLabel(item.kind, t),
      })}
      description={t("grid.editor.descriptionWithName")}
      width={currentSize.width}
      height={currentSize.height}
      preview={<SearchTile item={previewItem} preview />}
      previewBorder={false}
      sizeOptions={sizeOptions}
      size={size}
      onSizeChange={(value) => {
        if (item.kind === "search-minimal" && isComponentSize(item.kind, value))
          setSize(value as MinimalSearchItem["size"])
      }}
      submitLabel={t("grid.editor.save")}
      onSubmit={save}
      onClose={onClose}
    >
      <SettingItem label={t("grid.editor.name")} htmlFor="search-editor-name">
        <Input
          id="search-editor-name"
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </SettingItem>
    </ComponentEditorFrame>
  )
}
