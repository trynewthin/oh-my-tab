import { useTranslation } from "react-i18next"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  LANGUAGE_PREFERENCES,
  isLanguagePreference,
} from "@/i18n/language"
import { useLocaleStore } from "@/stores/locale-store"
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
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <label id="language-setting-title" htmlFor="language" className="text-sm">
        {t("core.language.label")}
      </label>
      <Select
        value={preference}
        onValueChange={(value) => {
          if (isLanguagePreference(value)) setPreference(value)
        }}
      >
        <SelectTrigger
          id="language"
          aria-labelledby="language-setting-title"
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
    </div>
  )
}
