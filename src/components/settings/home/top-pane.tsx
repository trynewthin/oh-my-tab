import { matrixPets, isMatrixPet } from "@/components/dot-matrix/pet-catalog"
import { Input } from "@/components/ui/input"
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

const contentLabels = {
  time: "settings.home.contentTime",
  text: "settings.home.contentText",
  pet: "settings.home.contentPet",
  breathing: "settings.home.contentBreathing",
} as const

export default function TopPane() {
  const { t } = useTranslation()
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  const content = useHomeSettingsStore((state) => state.content)
  const text = useHomeSettingsStore((state) => state.text)
  const pet = useHomeSettingsStore((state) => state.pet)
  const setTopComponent = useHomeSettingsStore((state) => state.setTopComponent)
  const setContent = useHomeSettingsStore((state) => state.setContent)
  const setText = useHomeSettingsStore((state) => state.setText)
  const setPet = useHomeSettingsStore((state) => state.setPet)

  return (
    <>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <label htmlFor="home-top-component" className="text-sm">
          {t("settings.home.topComponent")}
        </label>
        <Select
          value={topComponent}
          onValueChange={(value) => {
            if (value === "none" || value === "dot-matrix")
              setTopComponent(value)
          }}
        >
          <SelectTrigger
            id="home-top-component"
            className={`w-full min-w-0 ${settingsControlClassName}`}
          >
            <SelectValue>
              {topComponent === "none"
                ? t("settings.home.topNone")
                : t("settings.home.topDotMatrix")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("settings.home.topNone")}</SelectItem>
            <SelectItem value="dot-matrix">
              {t("settings.home.topDotMatrix")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {topComponent === "dot-matrix" && (
        <>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <label htmlFor="matrix-content" className="text-sm">
              {t("settings.home.matrixContent")}
            </label>
            <Select
              value={content}
              onValueChange={(value) => {
                if (
                  value === "time" ||
                  value === "text" ||
                  value === "pet" ||
                  value === "breathing"
                )
                  setContent(value)
              }}
            >
              <SelectTrigger
                id="matrix-content"
                className={`w-full min-w-0 ${settingsControlClassName}`}
              >
                <SelectValue>{t(contentLabels[content])}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">
                  {t("settings.home.contentTime")}
                </SelectItem>
                <SelectItem value="text">
                  {t("settings.home.contentText")}
                </SelectItem>
                <SelectItem value="pet">
                  {t("settings.home.contentPet")}
                </SelectItem>
                <SelectItem value="breathing">
                  {t("settings.home.contentBreathing")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {content === "text" && (
            <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <label htmlFor="matrix-text" className="text-sm">
                {t("settings.home.matrixText")}
              </label>
              <Input
                id="matrix-text"
                className={`min-w-0 ${settingsControlClassName}`}
                value={text}
                maxLength={80}
                placeholder={t("settings.home.matrixTextPlaceholder")}
                onChange={(event) => setText(event.target.value)}
              />
            </div>
          )}
          {content === "pet" && (
            <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <label htmlFor="matrix-pet" className="text-sm">
                {t("settings.home.pet")}
              </label>
              <Select
                value={pet}
                onValueChange={(value) => {
                  if (isMatrixPet(value)) setPet(value)
                }}
              >
                <SelectTrigger
                  id="matrix-pet"
                  className={`w-full min-w-0 ${settingsControlClassName}`}
                >
                  <SelectValue>
                    {t(matrixPets.find((item) => item.id === pet)!.labelKey)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {matrixPets.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {t(item.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </>
  )
}
