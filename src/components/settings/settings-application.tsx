import {
  createElement,
  lazy,
  Suspense,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react"
import { useTranslation } from "react-i18next"

import ApplicationDialog, {
  type ApplicationNavigationGroup,
} from "@/components/application/application-dialog"
import EffectSurface from "@/components/effects/effect-surface"
import { MaterialPreviewContext } from "./personalization/material-preview-context"
import type { MaterialPreviewStyle } from "./personalization/material-preview-context"
import {
  defaultSettingsSection,
  type SettingsSection,
} from "@/lib/settings-sections"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

import { settingsIcon, settingsNav } from "./settings-routes"
import { settingsViews } from "./settings-views"

const RandomGhostStorm = lazy(
  () => import("@/components/effects/random-ghost-storm")
)

function settingsNavigation(
  t: (key: string) => string
): ApplicationNavigationGroup<SettingsSection>[] {
  return settingsNav.map((node) => {
    const routes = node.children?.length ? node.children : [node]
    return {
      id: node.id,
      label: node.children?.length ? t(node.labelKey) : undefined,
      items: routes.map((route) => {
        const Icon = settingsIcon(route.icon)
        return {
          id: route.id as SettingsSection,
          label: t(route.labelKey),
          icon: Icon ? createElement(Icon) : undefined,
        }
      }),
    }
  })
}

const darkMaterialColors = {
  "--foreground": "oklch(0.985 0 0)",
  "--card": "#000",
  "--card-foreground": "oklch(0.985 0 0)",
  "--popover": "#000",
  "--popover-foreground": "oklch(0.985 0 0)",
  "--primary": "oklch(0.92 0.004 286.32)",
  "--primary-foreground": "oklch(0.21 0.006 285.885)",
  "--secondary": "oklch(0.274 0.006 286.033)",
  "--secondary-foreground": "oklch(0.985 0 0)",
  "--muted": "oklch(0.274 0.006 286.033)",
  "--muted-foreground": "oklch(0.705 0.015 286.067)",
  "--accent": "oklch(0.274 0.006 286.033)",
  "--accent-foreground": "oklch(0.985 0 0)",
  "--border": "oklch(1 0 0 / 10%)",
  "--tile-border": "oklch(0.269 0.006 285.885)",
  "--input": "oklch(1 0 0 / 15%)",
  "--ring": "oklch(0.552 0.016 285.938)",
} as const

const materialColorNames = Object.keys(darkMaterialColors) as Array<
  keyof typeof darkMaterialColors
>

export default function SettingsApplication() {
  const { t } = useTranslation()
  const open = useSystemOverlayStore((state) => state.active === "settings")
  const close = useSystemOverlayStore((state) => state.close)
  const section = useSystemOverlayStore((state) => state.settingsSection)
  const setSection = useSystemOverlayStore((state) => state.setSettingsSection)
  const accentColor = useHomeSettingsStore((state) => state.color)
  const tabTexture = useHomeSettingsStore((state) => state.tabTexture)
  const View = settingsViews[section] ?? settingsViews[defaultSettingsSection]
  const material = section === "personalization-material"
  const [materialPreview, setMaterialPreview] =
    useState<MaterialPreviewStyle>(tabTexture)
  const dialogNode = useRef<HTMLDivElement>(null)
  const materialLayer = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const dialog = dialogNode.current
    const layer = materialLayer.current
    if (!dialog || !layer) return
    if (!open || !material) {
      layer.style.opacity = "0"
      for (const name of materialColorNames) dialog.style.removeProperty(name)
      dialog.style.removeProperty("background-color")
      return
    }
    const dark = document.documentElement.classList.contains("dark")
    const base = dark ? "#000" : "#fff"
    layer.style.setProperty("--material-base", base)
    layer.style.opacity = "1"
    dialog.style.backgroundColor = base
    for (const name of materialColorNames) {
      if (dark) dialog.style.setProperty(name, darkMaterialColors[name])
      else dialog.style.removeProperty(name)
    }
  }, [material, open])

  return (
    <ApplicationDialog
      applicationId="settings"
      dialogRef={dialogNode}
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          close("settings")
        }
      }}
      title={t("settings.dialog.title")}
      description={t("settings.dialog.description")}
      closeLabel={t("settings.common.close")}
      closeAriaLabel={t("settings.dialog.closeAria")}
      navigationAriaLabel={t("settings.sidebar.categoriesAria")}
      navigationProgressAriaLabel={t("settings.dialog.sidebarScrollProgress")}
      navigation={settingsNavigation(t)}
      activeRoute={section}
      onRouteChange={(route) => {
        if (route === "personalization-material") {
          setMaterialPreview(tabTexture)
        }
        setSection(route)
      }}
      accentColor={accentColor}
      background={
        <div
          ref={materialLayer}
          className="absolute inset-0 opacity-0"
          style={
            {
              "--card": "var(--material-base)",
              "--material-base": "#000",
            } as CSSProperties
          }
        >
          {materialPreview === "storm" ? (
            <Suspense fallback={null}>
              <RandomGhostStorm color={accentColor} active={material} />
            </Suspense>
          ) : (
            <EffectSurface
              color={accentColor}
              textureId="settings-material-background"
              coverage={72}
              effectStyle={materialPreview}
              animated
              visible={material}
            />
          )}
          <div
            className="pointer-events-none absolute top-0 left-0 z-10 hidden h-24 w-36 sm:block"
            style={{
              backgroundImage:
                "linear-gradient(to bottom, var(--material-base) 55%, transparent)",
            }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 z-10 hidden h-32 w-36 sm:block"
            style={{
              backgroundImage:
                "linear-gradient(to top, var(--material-base) 55%, transparent)",
            }}
          />
        </div>
      }
    >
      <div data-settings-content className="contents">
        <MaterialPreviewContext.Provider
          value={{ value: materialPreview, setValue: setMaterialPreview }}
        >
          <View />
        </MaterialPreviewContext.Provider>
      </div>
    </ApplicationDialog>
  )
}
