import { Layout } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import GridPane from "./grid-pane"
import HomeAppearanceSettings from "./home-appearance-settings"
import LayoutPane from "./layout-pane"
import SearchPane from "./search-pane"
import SearchShortcutsSetting from "./search-shortcuts-setting"
import TopPane from "./top-pane"
import QuickBarPane from "./quick-bar-pane"
import QuickBarPreview from "./quick-bar-preview"
import TraditionalPreview from "./traditional-preview"
import { AppearancePreviewFrame } from "@/components/settings/personalization/appearance-preview-stage"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import SettingSection from "../shared/setting-section"

export default function HomeSettings() {
  const { t } = useTranslation()
  const layoutMode = useHomeSettingsStore((state) => state.layoutMode)
  return (
    <section className="relative isolate min-h-full space-y-4">
      <AppearancePreviewFrame className="h-40 sm:h-48">
        {layoutMode === "traditional" ? (
          <TraditionalPreview />
        ) : (
          <QuickBarPreview />
        )}
      </AppearancePreviewFrame>
      <SettingSection title={t("settings.home.topBarTitle")} icon={<Layout />}>
        <LayoutPane />
        {layoutMode === "traditional" ? (
          <>
            <TopPane />
            <SearchPane />
            <SearchShortcutsSetting />
          </>
        ) : (
          <QuickBarPane />
        )}
      </SettingSection>
      <GridPane />
      <HomeAppearanceSettings />
    </section>
  )
}
