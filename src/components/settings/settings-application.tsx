import { createElement, useState } from "react"
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
  // Base UI keeps the portal mounted while the dialog exit animation runs.
  // Keep the material presentation intact for that interval so the dialog
  // does not flash back to the regular settings surface before disappearing.
  const materialVisible = material
  const [materialPreview, setMaterialPreview] =
    useState<MaterialPreviewStyle>(tabTexture)

  return (
    <ApplicationDialog
      applicationId="settings"
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
      backgroundEffect={
        <div
          className="absolute inset-0"
          style={{ opacity: materialVisible ? 1 : 0 }}
        >
          <EffectSurface
            color={accentColor}
            textureId="settings-material-background"
            coverage={72}
            effectStyle={materialPreview}
            animated
            entrance
            transparent
            visible={materialVisible}
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
