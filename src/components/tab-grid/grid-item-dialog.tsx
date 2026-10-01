import { useId, useState, type CSSProperties } from "react"
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
  const id = useId()
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
  function closeDetail() {
    setSelected(null)
    setConfirmSize(false)
  }
  function closeCatalog() {
    closeDetail()
    setRoute("common")
    onClose()
  }
  function addComponent(kind: CatalogComponentKind, size?: GridItemSize) {
    saveItem(createCatalogComponent(kind, size))
    closeCatalog()
  }
  if (item)
    return <WidgetEditor item={item} onClose={onClose} onSaved={onClose} />

  const selectedSize = selected
    ? confirmSize || getComponentDefinition(selected).defaultSize
    : undefined

  return (
    <ApplicationDialog
      applicationId="components"
      open={open}
      onOpenChange={(next) => {
        if (!next) closeCatalog()
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
        closeDetail()
      }}
      accentColor={accentColor}
    >
      <p className="catalog-introduction">
        {t("grid.dialog.catalogDescription")}
      </p>
      <div className="catalog-gallery" data-single={visibleKinds.length === 1}>
        {visibleKinds.map((kind) => {
          const descriptionId = `${id}-${kind}`
          const sizes = getComponentSizeOptions(kind, "catalog")
          return (
            <article className="catalog-card" key={kind}>
              <div className="catalog-card-preview" aria-hidden="true">
                <CatalogComponentPreview kind={kind} fill />
              </div>
              <div className="catalog-card-copy">
                <h3>{componentLabel(kind, t)}</h3>
                <p id={descriptionId}>{componentDescription(kind, t)}</p>
                <div className="catalog-card-meta" aria-hidden="true">
                  <span>
                    {sizes
                      .map((size) => occupancyMark(size.width, size.height))
                      .join(" / ")}
                  </span>
                  <span className="catalog-card-arrow">↗</span>
                </div>
              </div>
              <button
                type="button"
                aria-label={t("grid.dialog.selectComponent", {
                  label: componentLabel(kind, t),
                })}
                aria-describedby={descriptionId}
                aria-haspopup="dialog"
                className="catalog-card-open"
                onClick={() => {
                  setSelected(kind)
                  setConfirmSize(false)
                }}
              />
            </article>
          )
        })}
      </div>
      {selected && (
        <Dialog
          open
          onOpenChange={(next) => {
            if (!next) closeDetail()
          }}
        >
          <DialogContent
            className="catalog-detail"
            style={{ "--workspace-accent": accentColor } as CSSProperties}
          >
            <header className="catalog-detail-heading">
              <DialogTitle className="studio-title">
                {componentLabel(selected, t)}
              </DialogTitle>
              <DialogDescription className="studio-description">
                {componentDescription(selected, t)}
              </DialogDescription>
            </header>
            <div className="catalog-detail-layout">
              <div className="catalog-detail-stage">
                <CatalogComponentPreview
                  kind={selected}
                  detail
                  fill
                  size={selectedSize}
                />
              </div>
              <div className="catalog-detail-options">
                <fieldset className="studio-size-field">
                  <legend>{t("grid.dialog.availableSizes")}</legend>
                  <div className="catalog-size-options">
                    {getComponentSizeOptions(selected, "catalog").map(
                      (option) => (
                        <button
                          key={option.value}
                          type="button"
                          className="catalog-size-option"
                          aria-pressed={selectedSize === option.value}
                          onClick={() => setConfirmSize(option.value)}
                        >
                          <span
                            className="catalog-size-diagram"
                            aria-hidden="true"
                          >
                            <i
                              style={{
                                width: `${(option.width / Math.max(option.width, option.height)) * 100}%`,
                                aspectRatio: `${option.width} / ${option.height}`,
                              }}
                            />
                          </span>
                          <span>
                            {occupancyMark(option.width, option.height)}
                          </span>
                          <span
                            className="catalog-size-selected"
                            aria-hidden="true"
                          />
                        </button>
                      )
                    )}
                  </div>
                </fieldset>
                <div className="catalog-detail-actions">
                  <Button
                    className="studio-submit"
                    onClick={() => addComponent(selected, selectedSize)}
                  >
                    <Plus />
                    {t("grid.dialog.add")}
                  </Button>
                  <Button variant="ghost" onClick={closeDetail}>
                    {t("grid.editor.cancel")}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </ApplicationDialog>
  )
}
