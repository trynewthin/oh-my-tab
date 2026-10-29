import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"

export default function TabPlaybackSetting() {
  const { t } = useTranslation()
  const color = useHomeSettingsStore((state) => state.color)
  const enabled = useHomeSettingsStore((state) => state.newTabsDynamicEffect)
  const setEnabled = useHomeSettingsStore(
    (state) => state.setNewTabsDynamicEffect
  )
  const setAll = useTabGridStore((state) => state.setAllTabDynamicEffects)
  const [applyExisting, setApplyExisting] = useState<boolean | null>(null)
  return (
    <>
      <SettingItem
        label={t("settings.tabs.newDynamicEffect")}
        description={t("settings.tabs.newDynamicEffectHint")}
      >
        <Switch
          aria-label={t("settings.tabs.newDynamicEffect")}
          checked={enabled}
          className={`justify-self-end ${settingsControlSurface} focus-visible:border-ring`}
          style={{ backgroundColor: enabled ? color : undefined }}
          onCheckedChange={(value) => {
            setEnabled(value)
            setApplyExisting(value)
          }}
        />
      </SettingItem>
      <AlertDialog
        open={applyExisting !== null}
        onOpenChange={(open) => {
          if (!open) setApplyExisting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                applyExisting
                  ? "settings.tabs.applyExistingEnableTitle"
                  : "settings.tabs.applyExistingDisableTitle"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                applyExisting
                  ? "settings.tabs.applyExistingEnableDescription"
                  : "settings.tabs.applyExistingDisableDescription"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(
                applyExisting
                  ? "settings.tabs.onlyNewTabsEnable"
                  : "settings.tabs.onlyNewTabsDisable"
              )}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (applyExisting !== null) setAll(applyExisting)
                setApplyExisting(null)
              }}
            >
              {t(
                applyExisting
                  ? "settings.tabs.applyAllTabsEnable"
                  : "settings.tabs.applyAllTabsDisable"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
