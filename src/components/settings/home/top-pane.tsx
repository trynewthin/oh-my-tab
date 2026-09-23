import { matrixPets, isMatrixPet } from "@/lib/matrix-pets"
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
import SettingItem from "../shared/setting-item"

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
      <SettingItem
        label={t("settings.home.topComponent")}
        htmlFor="home-top-component"
      >
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
      </SettingItem>
      {topComponent === "dot-matrix" && (
        <>
          <SettingItem
            label={t("settings.home.matrixContent")}
            htmlFor="matrix-content"
          >
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
          </SettingItem>
          {content === "text" && (
            <SettingItem
              label={t("settings.home.matrixText")}
              htmlFor="matrix-text"
            >
              <Input
                id="matrix-text"
                className={`min-w-0 ${settingsControlClassName}`}
                value={text}
                maxLength={80}
                placeholder={t("settings.home.matrixTextPlaceholder")}
                onChange={(event) => setText(event.target.value)}
              />
            </SettingItem>
          )}
          {content === "pet" && (
            <SettingItem label={t("settings.home.pet")} htmlFor="matrix-pet">
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
            </SettingItem>
          )}
        </>
      )}
    </>
  )
}
