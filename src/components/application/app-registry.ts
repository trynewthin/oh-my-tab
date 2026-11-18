import { Gear, NotePencil, SquaresFour } from "@phosphor-icons/react"
import { lazy, type ComponentType } from "react"
import type { AppId } from "@/lib/apps/ids"
import type { AppStorage } from "@/lib/apps/storage"

export type AppWindowProps = {
  onClose: () => void
  storage: AppStorage
}

export const appRegistry = {
  settings: {
    title: "settings.dialog.title",
    icon: Gear,
    optional: false,
    View: lazy(() => import("@/components/settings/settings-application")),
  },
  components: {
    title: "grid.dialog.catalogTitle",
    icon: SquaresFour,
    optional: false,
    View: lazy(() => import("@/components/tab-grid/grid-item-dialog")),
  },
  notes: {
    title: "shell.apps.notes",
    icon: NotePencil,
    optional: true,
    View: lazy(() => import("./notes-application")),
  },
} satisfies Record<
  AppId,
  {
    title: string
    optional: boolean
    icon: typeof Gear
    View: ComponentType<AppWindowProps>
  }
>
