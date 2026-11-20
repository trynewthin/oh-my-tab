import { SlidersHorizontal } from "@phosphor-icons/react"
import { useId, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { MaterialStyle } from "@/lib/material"
import {
  backgroundMaskLimits,
  resolveSettingsBackgroundMask,
  type SettingsBackgroundMask,
  type SettingsMaterialParameters,
} from "@/lib/ui-appearance"
import SettingsMaterialSurface from "../settings-material-surface"
import { settingsControlClassName } from "../shared/control-styles"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import { AppearancePreviewFrame } from "./appearance-preview-stage"

const controls = [
  { key: "strength", label: "settings.material.maskStrength", unit: "%" },
  { key: "blur", label: "settings.material.maskBlur", unit: "px" },
] as const

export default function SettingsBackgroundMaskSetting({
  material,
  mask,
  parameters,
  onSave,
}: {
  material: MaterialStyle
  mask?: SettingsBackgroundMask
  parameters?: SettingsMaterialParameters
  onSave: (mask: SettingsBackgroundMask) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const [draft, setDraft] = useState(() =>
    resolveSettingsBackgroundMask(material, mask)
  )
  const title = t("settings.material.backgroundMask")

  return (
    <SettingItem label={title}>
      <Dialog
        onOpenChange={(open) => {
          if (open) setDraft(resolveSettingsBackgroundMask(material, mask))
        }}
      >
        <DialogTrigger
          aria-label={title}
          disabled={material === "none"}
          render={
            <Button variant="outline" className={settingsControlClassName} />
          }
        >
          <SlidersHorizontal />
          {t("settings.material.editMask")}
        </DialogTrigger>
        <DialogContent
          className="max-h-[calc(100svh-2rem)] overflow-y-auto"
          showCloseButton={false}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <AppearancePreviewFrame
            surface="sample"
            aria-hidden="true"
            className="relative h-[clamp(6rem,25svh,10rem)] bg-none"
          >
            <SettingsMaterialSurface
              placement="background"
              material={material}
              backgroundMask={draft}
              parameters={parameters}
            />
          </AppearancePreviewFrame>
          <div className="space-y-3">
            {controls.map(({ key, label, unit }) => {
              const controlId = `${id}-${key}`
              return (
                <SettingItem key={key} label={t(label)} htmlFor={controlId}>
                  <SettingRange
                    id={controlId}
                    label={t(label)}
                    min={0}
                    max={backgroundMaskLimits[key]}
                    value={draft[key]}
                    unit={unit}
                    editable={false}
                    onChange={(value) =>
                      setDraft((current) => ({ ...current, [key]: value }))
                    }
                  />
                </SettingItem>
              )
            })}
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("settings.common.cancel")}
            </DialogClose>
            <DialogClose render={<Button />} onClick={() => onSave(draft)}>
              {t("settings.common.save")}
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingItem>
  )
}
