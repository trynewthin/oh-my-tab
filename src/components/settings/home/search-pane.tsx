import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"

export default function SearchPane() {
  const { t } = useTranslation()
  const searchBoxStyle = useHomeSettingsStore((state) => state.searchBoxStyle)
  const setSearchBoxStyle = useHomeSettingsStore(
    (state) => state.setSearchBoxStyle
  )

  return (
    <SettingItem
      label={t("settings.home.searchBoxStyle")}
      htmlFor="search-box-style"
    >
      <Select
        value={searchBoxStyle}
        onValueChange={(value) => {
          if (value === "full" || value === "minimal") setSearchBoxStyle(value)
        }}
      >
        <SelectTrigger
          id="search-box-style"
          className={`w-full min-w-0 ${settingsControlClassName}`}
        >
          <SelectValue>
            {searchBoxStyle === "minimal"
              ? t("settings.home.searchBoxMinimal")
              : t("settings.home.searchBoxFull")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="full">
            {t("settings.home.searchBoxFull")}
          </SelectItem>
          <SelectItem value="minimal">
            {t("settings.home.searchBoxMinimal")}
          </SelectItem>
        </SelectContent>
      </Select>
    </SettingItem>
  )
}
