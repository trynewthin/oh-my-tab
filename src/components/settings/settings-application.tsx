import { createElement, Suspense, useState } from "react"
import { useTranslation } from "react-i18next"

import AppSidebarLayout, {
  type ApplicationNavigationGroup,
  type ApplicationNavigationItem,
} from "@/components/application/app-sidebar-layout"
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

import {
  availableSettingsNav,
  resolveSettingsSection,
  settingsIcon,
  type SettingsNavNode,
} from "./settings-routes"
import { settingsViews } from "./settings-views"

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
      icon: Icon ? createElement(Icon) : undefined,
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
