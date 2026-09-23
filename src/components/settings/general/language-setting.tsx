import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LANGUAGE_PREFERENCES, isLanguagePreference } from "@/i18n/language"
import { useLocaleStore } from "@/stores/locale-store"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"

export default function LanguageSetting() {
  const { t } = useTranslation()
  const preference = useLocaleStore((state) => state.preference)
  const setPreference = useLocaleStore((state) => state.setPreference)

  const labels = {
    system: t("core.language.followSystem"),
    "zh-CN": t("core.language.chinese"),
    en: t("core.language.english"),
  }

  return (
    <SettingItem label={t("core.language.label")} htmlFor="language">
      <Select
        value={preference}
        onValueChange={(value) => {
          if (isLanguagePreference(value)) setPreference(value)
        }}
      >
        <SelectTrigger
          id="language"
          className={`w-full ${settingsControlClassName}`}
        >
          <SelectValue>{labels[preference]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGE_PREFERENCES.map((value) => (
            <SelectItem key={value} value={value}>
              {labels[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </SettingItem>
  )
}
