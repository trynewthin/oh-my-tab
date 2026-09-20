import FolderTabStack from "./folder-tab-stack"
import type { FolderItem, TabEntry } from "@/lib/grid/types"
import {
  CollectionCardHeader,
  CollectionTitleButton,
} from "./collection/header"
import { useTranslation } from "react-i18next"

export default function FolderUI({
  item,
  onOpen,
  preview = false,
  tabs,
}: {
  item: FolderItem
  onOpen: () => void
  preview?: boolean
  tabs?: TabEntry[]
}) {
  const { t } = useTranslation()
  return (
    <div className="relative z-10 flex h-full w-full flex-col gap-1 overflow-hidden rounded-[inherit] px-2.5 pt-1.5 pb-2.5 text-left sm:gap-1.5 sm:px-3 sm:pt-2 sm:pb-3">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={t("grid.folder.open", { name: item.name })}
      />
      <CollectionCardHeader className="pr-2 pl-0.5 sm:pr-5 sm:pl-1">
        <CollectionTitleButton onClick={onOpen}>
          {item.name}
        </CollectionTitleButton>
      </CollectionCardHeader>
      {(tabs ?? item.tabs).length > 0 && (
        <FolderTabStack
          draggable={!preview}
          folder={item}
          tabs={tabs}
          topBleed={20}
          className="flex-1"
        />
      )}
    </div>
  )
}
