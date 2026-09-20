import { reloadVisibleFavicons } from "@/lib/favicon-cache"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import {
  setNetworkFeature,
  usePrivacyStore,
  type NetworkFeature,
} from "@/stores/privacy-store"
import { toast } from "@/stores/toast-store"
import { Checkbox } from "@/components/ui/checkbox"

export type NetworkChoices = { suggestions: boolean; icons: boolean }

type PrivacySettingsProps = {
  choices?: NetworkChoices
  onChange?: (feature: NetworkFeature, enabled: boolean) => void
  disabled?: boolean
}

export default function PrivacySettings({
  choices,
  onChange,
  disabled = false,
}: PrivacySettingsProps = {}) {
  const { t } = useTranslation()
  const settings = usePrivacyStore()
  const [busy, setBusy] = useState(false)
  async function toggle(feature: NetworkFeature, enabled: boolean) {
    if (onChange) {
      onChange(feature, enabled)
      return
    }
    setBusy(true)
    try {
      if (!(await setNetworkFeature(feature, enabled)))
        toast(t("settings.privacy.permissionDenied"), "error")
      else if (feature === "icons") reloadVisibleFavicons()
    } catch {
      toast(t("settings.privacy.permissionFailed"), "error")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <h3 className="text-sm font-medium">{t("settings.privacy.title")}</h3>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox
          checked={choices?.suggestions ?? settings.suggestions}
          disabled={busy || disabled}
          className="mt-0.5"
          onCheckedChange={(checked) => void toggle("suggestions", checked)}
        />
        <span>
          {t("settings.privacy.suggestions")}
          <span className="block text-xs text-muted-foreground">
            {t("settings.privacy.suggestionsHint")}
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox
          checked={choices?.icons ?? settings.icons}
          disabled={busy || disabled}
          className="mt-0.5"
          onCheckedChange={(checked) => void toggle("icons", checked)}
        />
        <span>
          {t("settings.privacy.icons")}
          <span className="block text-xs text-muted-foreground">
            {t("settings.privacy.iconsHint")}
          </span>
        </span>
      </label>
      <a
        className="block text-right text-sm underline"
        href="https://ohmytab.vercel.app/privacy"
        target="_blank"
        rel="noreferrer"
      >
        {t("settings.privacy.policy")}
      </a>
    </div>
  )
}
