import { settingsControlClassName } from "../shared/control-styles"
import CacheSettings from "./cache-settings"
import BookmarkImport from "./bookmark-import"
import LanguageSetting from "./language-setting"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSettingsStore } from "@/stores/settings-store"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import DataSettings from "./data-settings"

export default function GeneralSettings({ pane }: { pane: "basic" | "data" }) {
  const { t } = useTranslation()
  return (
    <section
      className="relative isolate min-h-full space-y-5"
      aria-labelledby="general-settings-title"
    >
      <h2
        id="general-settings-title"
        className="text-base leading-6 font-medium"
      >
        {pane === "basic"
          ? t("settings.nav.generalBasic")
          : t("settings.nav.generalData")}
      </h2>
      {pane === "basic" ? (
        <>
          <LanguageSetting />
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">{t("settings.general.onboarding")}</span>
            <Button
              variant="outline"
              className={settingsControlClassName}
              onClick={() => {
                useSettingsStore.getState().setOpen(false)
                useOnboardingStore.getState().start()
              }}
            >
              {t("settings.general.restartOnboarding")}
            </Button>
          </div>
        </>
      ) : (
        <>
          <CacheSettings />
          <BookmarkImport />
          <DataSettings />
        </>
      )}
    </section>
  )
}
