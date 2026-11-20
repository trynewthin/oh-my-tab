import { Database, Gear } from "@phosphor-icons/react"
import SettingItem from "../shared/setting-item"
import SettingSection from "../shared/setting-section"
import { settingsControlClassName } from "../shared/control-styles"
import CacheSettings from "./cache-settings"
import BookmarkImport from "./bookmark-import"
import LanguageSetting from "./language-setting"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import DataSettings from "./data-settings"

export default function GeneralSettings() {
  const { t } = useTranslation()
  return (
    <div className="relative isolate min-h-full space-y-4">
      <SettingSection title={t("settings.nav.generalBasic")} icon={<Gear />}>
        <LanguageSetting />
        <SettingItem label={t("settings.general.onboarding")}>
          <Button
            variant="outline"
            className={settingsControlClassName}
            onClick={() => {
              useSystemOverlayStore.getState().close("settings")
              useOnboardingStore.getState().start()
            }}
          >
            {t("settings.general.restartOnboarding")}
          </Button>
        </SettingItem>
      </SettingSection>
      <SettingSection
        title={t("settings.general.dataTitle")}
        icon={<Database />}
      >
        <CacheSettings />
        <BookmarkImport />
        <DataSettings />
      </SettingSection>
    </div>
  )
}
