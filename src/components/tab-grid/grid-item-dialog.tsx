import { useState } from "react"
import { WidgetEditor } from "./widget-ui"
import CatalogComponentPreview from "./catalog-component-preview"
import { useTabGridStore } from "@/stores/tab-grid-store"
import {
  CalendarCheck,
  DotsNine,
  MagnifyingGlass,
  PottedPlant,
  Plus,
} from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import ApplicationDialog, {
  type ApplicationNavigationGroup,
} from "@/components/application/application-dialog"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { GridItem } from "@/lib/grid/types"
import {
  catalogComponentKinds,
  componentDescription,
  componentLabel,
  getComponentDefinition,
  getComponentSizeOptions,
  occupancyMark,
  type CatalogComponentKind,
  type CatalogSection,
  type GridItemSize,
} from "@/lib/grid/registry"
import { createCatalogComponent } from "@/lib/grid/factory"
import { useTranslation } from "react-i18next"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

type CatalogRoute = CatalogSection

export default function GridItemDialog({
  item,
  onClose,
  open = true,
}: {
  item?: GridItem
  onClose: () => void
  open?: boolean
}) {
  const [selected, setSelected] = useState<CatalogComponentKind | null>(null)
  const [confirmSize, setConfirmSize] = useState<GridItemSize | false>(false)
  const [route, setRoute] = useState<CatalogRoute>("common")
  const { t } = useTranslation()
  const saveItem = useTabGridStore((state) => state.saveItem)
  const accentColor = useHomeSettingsStore((state) => state.color)
  const navigation: ApplicationNavigationGroup<CatalogRoute>[] = [
    {
      id: "basic",
      label: t("grid.dialog.categoryBasic"),
      items: [
        {
          id: "common",
          label: t("grid.dialog.categoryCommon"),
          icon: <MagnifyingGlass />,
        },
        {
          id: "productivity",
          label: t("grid.dialog.categoryProductivity"),
          icon: <CalendarCheck />,
        },
      ],
    },
    {
      id: "creative",
      label: t("grid.dialog.categoryCreative"),
      items: [
        {
          id: "dots",
          label: t("grid.dialog.categoryDots"),
          icon: <DotsNine />,
        },
        {
          id: "fun",
          label: t("grid.dialog.categoryFun"),
          icon: <PottedPlant />,
        },
      ],
    },
  ]
  const visibleKinds = catalogComponentKinds.filter(
    (kind) => getComponentDefinition(kind).catalogSection === route
  )
  function closeCatalog() {
    setSelected(null)
    setConfirmSize(false)
    setRoute("common")
    onClose()
  }
  function addComponent(kind: CatalogComponentKind, size?: GridItemSize) {
    saveItem(createCatalogComponent(kind, size))
    closeCatalog()
  }
  if (item)
    return <WidgetEditor item={item} onClose={onClose} onSaved={onClose} />
  return (
    <ApplicationDialog
      applicationId="components"
      open={open}
      onOpenChange={(open: boolean) => {
        if (!open) closeCatalog()
      }}
      title={t("grid.dialog.catalogTitle")}
      description={t("grid.dialog.catalogDescription")}
      closeLabel={t("shell.common.close")}
      closeAriaLabel={t("shell.common.close")}
      navigationAriaLabel={t("grid.dialog.catalogNav")}
      navigationProgressAriaLabel={t("grid.dialog.catalogScrollProgress")}
      navigation={navigation}
      activeRoute={route}
      onRouteChange={(nextRoute) => {
        setRoute(nextRoute)
        setSelected(null)
        setConfirmSize(false)
      }}
      accentColor={accentColor}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visibleKinds.map((kind) => {
          return (
            <div key={kind} className="min-w-0">
              <button
                type="button"
                aria-label={t("grid.dialog.selectComponent", {
                  label: componentLabel(kind, t),
                })}
                aria-haspopup="dialog"
                className="relative h-64 w-full min-w-0 overflow-hidden rounded-2xl border border-border bg-zinc-100 text-left transition-[border-color,box-shadow,transform] duration-200 outline-none hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none dark:border-white/15 dark:bg-zinc-950 dark:hover:border-white/30"
                onClick={() => {
                  if (selected !== kind) {
                    setSelected(kind)
                    setConfirmSize(false)
                  } else {
                    setSelected(null)
                    setConfirmSize(false)
                  }
                }}
              >
                <CatalogComponentPreview kind={kind} fill />
                <span className="absolute right-3 bottom-3 left-3 rounded-2xl border border-black/10 bg-white/80 px-4 py-3 text-zinc-950 shadow-lg backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/80 dark:text-white">
                  <span className="block text-sm font-medium">
                    {componentLabel(kind, t)}
                  </span>
                  <span className="mt-1 block truncate text-xs leading-relaxed text-zinc-600 dark:text-white/65">
                    {componentDescription(kind, t)}
                  </span>
                </span>
              </button>
            </div>
          )
        })}
        {selected && (
          <Dialog
            open
            onOpenChange={(open) => {
              if (!open) {
                setSelected(null)
                setConfirmSize(false)
              }
            }}
          >
            <DialogContent className="h-[min(36rem,calc(100svh-2rem))] gap-0 overflow-hidden bg-zinc-100 p-0 sm:max-w-xl dark:bg-zinc-950">
              <CatalogComponentPreview
                kind={selected}
                detail
                fill
                size={
                  confirmSize || getComponentDefinition(selected).defaultSize
                }
              />
              <div className="absolute right-3 bottom-3 left-3 min-w-0 rounded-2xl border border-black/10 bg-white/80 p-4 text-zinc-950 shadow-lg backdrop-blur-md sm:right-4 sm:bottom-4 sm:left-4 dark:border-white/10 dark:bg-zinc-900/80 dark:text-white">
                <DialogTitle className="text-xl font-semibold">
                  {componentLabel(selected, t)}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-white/65">
                  {componentDescription(selected, t)}
                </DialogDescription>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <div
                    role="group"
                    aria-label={t("grid.dialog.availableSizes")}
                    className="flex min-w-0 items-center gap-2 overflow-x-auto py-1"
                  >
                    {getComponentSizeOptions(selected, "catalog").map(
                      (option) => (
                        <Button
                          key={option.value}
                          className="shrink-0"
                          variant={
                            (confirmSize ||
                              getComponentDefinition(selected).defaultSize) ===
                            option.value
                              ? "default"
                              : "outline"
                          }
                          aria-pressed={
                            (confirmSize ||
                              getComponentDefinition(selected).defaultSize) ===
                            option.value
                          }
                          onClick={() => setConfirmSize(option.value)}
                        >
                          {occupancyMark(option.width, option.height)}
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    className="shrink-0"
                    onClick={() =>
                      addComponent(
                        selected,
                        confirmSize ||
                          getComponentDefinition(selected).defaultSize
                      )
                    }
                  >
                    <Plus />
                    {t("grid.dialog.add")}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </ApplicationDialog>
  )
}
