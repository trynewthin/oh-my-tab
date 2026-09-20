import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"
import { settingsControlClassName } from "../shared/control-styles"

export default function SearchPane() {
  const { t } = useTranslation()
  const searchBoxStyle = useHomeSettingsStore((state) => state.searchBoxStyle)
  const setSearchBoxStyle = useHomeSettingsStore(
    (state) => state.setSearchBoxStyle
  )

  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <label htmlFor="search-box-style" className="text-sm">
        {t("settings.home.searchBoxStyle")}
      </label>
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
    </div>
  )
}
