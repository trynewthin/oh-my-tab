import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { settingsControlClassName } from "../shared/control-styles"

export default function SearchPane() {
  const searchBoxStyle = useHomeSettingsStore((state) => state.searchBoxStyle)
  const setSearchBoxStyle = useHomeSettingsStore(
    (state) => state.setSearchBoxStyle
  )

  return (
    <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
      <label htmlFor="search-box-style" className="text-sm">
        搜索框样式
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
            {searchBoxStyle === "minimal" ? "简约" : "完整"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="full">完整</SelectItem>
          <SelectItem value="minimal">简约</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
