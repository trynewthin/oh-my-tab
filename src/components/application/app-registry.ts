import { Gear, NotePencil, SquaresFour, type Icon } from "@phosphor-icons/react"
import { lazy, type ComponentType } from "react"
import type { AppId, AppWindowId } from "@/lib/apps/ids"
import type { AppStorage } from "@/lib/apps/storage"

export type AppFrameDetails = {
  id: AppWindowId
  title: string
  description?: string
  icon: Icon
}

export type AppWindowProps = {
  frame: AppFrameDetails
  onClose: () => void
  storage: AppStorage
}

type AppDefinition = {
  title: string
  description?: string
  icon: Icon
  optional: boolean
  layout?: "navigation"
  View: ComponentType<AppWindowProps>
}

export const appRegistry: Record<AppId, AppDefinition> = {
  settings: {
    title: "settings.dialog.title",
    icon: Gear,
    optional: false,
    layout: "navigation",
    View: lazy(() => import("@/components/settings/settings-application")),
  },
  components: {
    title: "grid.dialog.catalogTitle",
    icon: SquaresFour,
    optional: false,
    layout: "navigation",
    View: lazy(() => import("@/components/tab-grid/grid-item-dialog")),
  },
  notes: {
    title: "shell.apps.notes",
    description: "shell.apps.noteDescription",
    icon: NotePencil,
    optional: true,
    View: lazy(() => import("./notes-application")),
  },
}
