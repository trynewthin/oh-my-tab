import { Gear, SquaresFour, type Icon } from "@phosphor-icons/react"
import { lazy, type ComponentType } from "react"
import type { AppId } from "@/lib/apps/ids"
import type { AppStorage } from "@/lib/apps/storage"

export type AppFrameDetails = {
  id: AppId
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
  layout?: "navigation"
  View: ComponentType<AppWindowProps>
}

export const appRegistry: Record<AppId, AppDefinition> = {
  settings: {
    title: "settings.dialog.title",
    icon: Gear,
    layout: "navigation",
    View: lazy(() => import("@/components/settings/settings-application")),
  },
  components: {
    title: "grid.dialog.catalogTitle",
    icon: SquaresFour,
    layout: "navigation",
    View: lazy(() => import("@/components/tab-grid/grid-item-dialog")),
  },
}
