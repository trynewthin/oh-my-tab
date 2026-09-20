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
                className="w-full min-w-0 rounded-2xl border border-border bg-card p-1.5 text-left transition-[border-color,box-shadow,transform] duration-200 outline-none hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none dark:border-white/15 dark:bg-zinc-900 dark:hover:border-white/30"
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
                <CatalogComponentPreview kind={kind} />
                <span className="block px-3 py-3 text-sm font-medium">
                  {componentLabel(kind, t)}
                </span>
                <span className="block truncate px-3 pb-3 text-xs leading-relaxed text-muted-foreground">
                  {componentDescription(kind, t)}
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
            <DialogContent className="max-h-[90svh] gap-5 overflow-y-auto p-5 sm:max-w-xl sm:p-6">
              <CatalogComponentPreview
                kind={selected}
                detail
                size={
                  confirmSize || getComponentDefinition(selected).defaultSize
                }
              />
              <div className="min-w-0 space-y-3">
                <DialogTitle className="pr-8 text-xl font-semibold">
                  {componentLabel(selected, t)}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                  {componentDescription(selected, t)}
                </DialogDescription>
                <div className="flex items-center justify-between gap-3 pt-2">
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
