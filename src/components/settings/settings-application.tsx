import {
  createElement,
  Suspense,
  useMemo,
  useState,
  type CSSProperties,
} from "react"
import { useTranslation } from "react-i18next"

import AppSidebarLayout, {
  type ApplicationNavigationGroup,
  type ApplicationNavigationItem,
} from "@/components/application/app-sidebar-layout"
import { controlMaterialImage } from "@/components/effects/control-material-image"
import {
  DEFAULT_STAR_TRAIL_SPEED,
  MAX_STAR_TRAIL_SPEED,
  MIN_STAR_TRAIL_SPEED,
} from "@/lib/star-trails"
import { MaterialPreviewContext } from "./personalization/material-preview-context"
import type {
  MaterialPreviewStyle,
  StarTrailMode,
} from "./personalization/material-preview-context"
import type { SettingsSection } from "@/lib/settings-sections"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import { useThemeStore } from "@/stores/theme-store"

import {
  availableSettingsNav,
  resolveSettingsSection,
  settingsIcon,
  type SettingsNavNode,
} from "./settings-routes"
import { settingsViews } from "./settings-views"
import SettingsMaterialSurface from "./settings-material-surface"
import "./settings-materials.css"

function settingsNavigation(
  t: (key: string) => string,
  routes: SettingsNavNode[]
): ApplicationNavigationGroup<SettingsSection>[] {
  const navigationItem = (
    route: SettingsNavNode
  ): ApplicationNavigationItem<SettingsSection> => {
    const Icon = settingsIcon(route.icon)
    return {
      id: route.id as SettingsSection,
      label: t(route.labelKey),
      icon: Icon ? createElement(Icon, { "aria-hidden": true }) : undefined,
      children: route.children?.map(navigationItem),
    }
  }
  return routes.map((node) => {
    const items = node.children?.length ? node.children : [node]
    return {
      id: node.id,
      label: node.children?.length ? t(node.labelKey) : undefined,
      items: items.map(navigationItem),
    }
  })
}

export default function SettingsApplication({
  onClose,
}: {
  onClose: () => void
}) {
  const { t } = useTranslation()
  const requestedSection = useSystemOverlayStore(
    (state) => state.settingsSection
  )
  const setSection = useSystemOverlayStore((state) => state.setSettingsSection)
  const accentColor = useHomeSettingsStore((state) => state.color)
  const tabTexture = useHomeSettingsStore((state) => state.tabTexture)
  const appearance = useThemeStore((state) => state.settingsAppearance)
  const controlParameters = appearance?.materialParameters?.control
  const glass = useHomeSettingsStore(
    (state) => controlParameters?.["liquid-glass"] ?? state.liquidGlass
  )
  const controlMaterial = appearance?.controlMaterial
  const controlStrength =
    controlMaterial === "burning" || controlMaterial === "particles"
      ? controlParameters?.[controlMaterial]
      : undefined
  const controlImage = useMemo(
    () =>
      controlMaterialImage(
        controlMaterial,
        accentColor,
        glass,
        controlStrength
      ),
    [controlMaterial, accentColor, glass, controlStrength]
  )
  const routes = availableSettingsNav()
  const section = resolveSettingsSection(requestedSection, routes)
  const View = settingsViews[section]
  const [materialPreview, setMaterialPreview] =
    useState<MaterialPreviewStyle>(tabTexture)
  const [starTrailSpeed, setStarTrailSpeed] = useState(DEFAULT_STAR_TRAIL_SPEED)
  const [starTrailMode, setStarTrailMode] = useState<StarTrailMode>("dynamic")

  return (
    <AppSidebarLayout
      applicationId="settings"
      size="large"
      appearance={appearance}
      windowStyle={
        controlImage
          ? ({ "--settings-control-image": controlImage } as CSSProperties)
          : undefined
      }
      background={
        appearance?.backgroundMaterial &&
        appearance.backgroundMaterial !== "none" ? (
          <SettingsMaterialSurface
            placement="background"
            material={appearance.backgroundMaterial}
            backgroundMask={appearance.backgroundMask}
            parameters={appearance.materialParameters?.background}
          />
        ) : undefined
      }
      sidebarBackground={
        appearance?.sidebarMaterial && appearance.sidebarMaterial !== "none" ? (
          <SettingsMaterialSurface
            placement="sidebar"
            material={appearance.sidebarMaterial}
            parameters={appearance.materialParameters?.sidebar}
          />
        ) : undefined
      }
      sidebarStyle="panel"
      sidebarTranslucent={appearance?.sidebarMaterial === "liquid-glass"}
      sidebarFooter={{
        id: "about",
        label: t("settings.nav.about"),
        icon: (
          <>
            <img
              src={`${import.meta.env.BASE_URL}icons/mark-32.png`}
              alt=""
              className="size-5 dark:hidden"
              width={20}
              height={20}
            />
            <img
              src={`${import.meta.env.BASE_URL}icons/mark-dark-32.png`}
              alt=""
              className="hidden size-5 dark:block"
              width={20}
              height={20}
            />
          </>
        ),
      }}
      onClose={onClose}
      title={t("settings.dialog.title")}
      description={t("settings.dialog.description")}
      closeLabel={t("settings.common.close")}
      closeAriaLabel={t("settings.dialog.closeAria")}
      navigationAriaLabel={t("settings.sidebar.categoriesAria")}
      navigationProgressAriaLabel={t("settings.dialog.sidebarScrollProgress")}
      navigation={settingsNavigation(t, routes)}
      activeRoute={section}
      onRouteChange={(route) => {
        if (route === "personalization-material") {
          setMaterialPreview(tabTexture)
        }
        setSection(route)
      }}
      accentColor={accentColor}
    >
      <div data-settings-content className="contents">
        <MaterialPreviewContext.Provider
          value={{
            value: materialPreview,
            setValue: setMaterialPreview,
            starTrailSpeed,
            starTrailMode,
            setStarTrailMode,
            setStarTrailSpeed: (value) => {
              if (Number.isFinite(value))
                setStarTrailSpeed(
                  Math.min(
                    MAX_STAR_TRAIL_SPEED,
                    Math.max(MIN_STAR_TRAIL_SPEED, value)
                  )
                )
            },
          }}
        >
          <Suspense
            fallback={
              <div role="status" className="space-y-4 p-1">
                <span className="sr-only">{t("shell.apps.loading")}</span>
                <div className="h-8 w-1/3 rounded-(--ui-radius-control) bg-muted" />
                <div className="h-24 rounded-(--ui-radius-panel) bg-muted" />
              </div>
            }
          >
            <View />
          </Suspense>
        </MaterialPreviewContext.Provider>
      </div>
    </AppSidebarLayout>
  )
}
