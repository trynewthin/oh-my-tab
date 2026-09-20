import { createElement } from "react"
import { useTranslation } from "react-i18next"

import ApplicationDialog, {
  type ApplicationNavigationGroup,
} from "@/components/application/application-dialog"
import {
  defaultSettingsSection,
  type SettingsSection,
} from "@/lib/settings-sections"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useSettingsStore } from "@/stores/settings-store"

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
  const open = useSettingsStore((state) => state.open)
  const setOpen = useSettingsStore((state) => state.setOpen)
  const section = useSettingsStore((state) => state.section)
  const setSection = useSettingsStore((state) => state.setSection)
  const accentColor = useHomeSettingsStore((state) => state.color)
  const View = settingsViews[section] ?? settingsViews[defaultSettingsSection]

  return (
    <ApplicationDialog
      applicationId="settings"
      open={open}
      onOpenChange={setOpen}
      title={t("settings.dialog.title")}
      description={t("settings.dialog.description")}
      closeLabel={t("settings.common.close")}
      closeAriaLabel={t("settings.dialog.closeAria")}
      navigationAriaLabel={t("settings.sidebar.categoriesAria")}
      navigationProgressAriaLabel={t("settings.dialog.sidebarScrollProgress")}
      navigation={settingsNavigation(t)}
      activeRoute={section}
      onRouteChange={setSection}
      accentColor={accentColor}
    >
      <div data-settings-content className="contents">
        <View />
      </div>
    </ApplicationDialog>
  )
}
