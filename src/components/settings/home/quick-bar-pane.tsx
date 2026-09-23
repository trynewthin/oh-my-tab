import { Tabs } from "@base-ui/react/tabs"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { buttonActionLabelKeys, buttonActions } from "@/lib/grid/button-actions"
import { normalizeTabUrl, type ButtonAction } from "@/lib/grid/types"
import type { QuickBarControl, QuickBarSide } from "@/lib/quick-bar"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { settingsControlClassName } from "../shared/control-styles"
import SettingItem from "../shared/setting-item"

export function SiteFields({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Extract<QuickBarControl, { kind: "site" }>
  onSave: (name: string, url: string) => boolean
  onCancel?: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? "")
  const [url, setUrl] = useState(initial?.url ?? "")
  const [invalid, setInvalid] = useState(false)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (onSave(name, url)) {
      setName("")
      setUrl("")
      setInvalid(false)
    } else setInvalid(true)
  }
  return (
    <form className="grid gap-2" onSubmit={submit}>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input
          aria-label={t("settings.home.quickBarSiteName")}
          placeholder={t("settings.home.quickBarSiteName")}
          maxLength={80}
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          aria-label={t("settings.home.quickBarSiteUrl")}
          placeholder="https://example.com"
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      {invalid && (
        <p role="alert" className="text-xs text-destructive">
          {t("settings.home.quickBarInvalidSite")}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("settings.home.quickBarCancel")}
          </Button>
        )}
        <Button type="submit" variant="outline">
          {t("settings.home.quickBarSave")}
        </Button>
      </div>
    </form>
  )
}

export function QuickBarSideEditor({
  side,
  onAdded,
}: {
  side: QuickBarSide
  onAdded: () => void
}) {
  const { t } = useTranslation()
  const addSystem = useHomeSettingsStore((state) => state.addQuickSystemControl)
  const addSite = useHomeSettingsStore((state) => state.addQuickSiteControl)
  const [kind, setKind] = useState<"system" | "site">("system")
  const [action, setAction] = useState<ButtonAction>(buttonActions[0])
  const [url, setUrl] = useState("")
  const [invalid, setInvalid] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (kind === "system") {
      addSystem(side, action)
    } else {
      const normalized = normalizeTabUrl(url)
      if (
        !normalized ||
        !addSite(side, new URL(normalized).hostname.slice(0, 80), normalized)
      ) {
        setInvalid(true)
        return
      }
    }
    onAdded()
  }

  return (
    <Tabs.Root
      value={kind}
      onValueChange={(value) => {
        if (value === "system" || value === "site") setKind(value)
      }}
    >
      <form className="grid gap-4" onSubmit={submit}>
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{t("settings.home.quickBarAdd")}</span>
            <Tabs.List
              aria-label={t("settings.home.quickBarType")}
              className="flex rounded-2xl border border-border bg-muted p-0.5 text-sm"
            >
              <Tabs.Tab
                value="system"
                className="rounded-xl px-3 py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:data-active:bg-input"
              >
                {t("settings.home.quickBarTabSystem")}
              </Tabs.Tab>
              <Tabs.Tab
                value="site"
                className="rounded-xl px-3 py-1 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-active:bg-background data-active:text-foreground data-active:shadow-sm dark:data-active:bg-input"
              >
                {t("settings.home.quickBarTabSite")}
              </Tabs.Tab>
            </Tabs.List>
            <span>
              {t(
                side === "left"
                  ? "settings.home.quickBarToLeft"
                  : "settings.home.quickBarToRight"
              )}
            </span>
          </DialogTitle>
        </DialogHeader>
        <Tabs.Panel value="system">
          <Select
            value={action}
            onValueChange={(value) => {
              if (buttonActions.includes(value as ButtonAction))
                setAction(value as ButtonAction)
            }}
          >
            <SelectTrigger
              aria-label={t("settings.home.quickBarSystemAction")}
              className={`w-full min-w-0 ${settingsControlClassName}`}
            >
              <SelectValue>
                {t(
                  `grid.editor.buttonActions.${buttonActionLabelKeys[action]}`
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {buttonActions.map((option) => (
                <SelectItem key={option} value={option}>
                  {t(
                    `grid.editor.buttonActions.${buttonActionLabelKeys[option]}`
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Tabs.Panel>
        <Tabs.Panel value="site">
          <Input
            aria-label={t("settings.home.quickBarSiteUrl")}
            placeholder="https://example.com"
            required
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
          {invalid && (
            <p role="alert" className="mt-2 text-xs text-destructive">
              {t("settings.home.quickBarInvalidSite")}
            </p>
          )}
        </Tabs.Panel>
        <DialogFooter>
          <Button type="submit">{t("settings.home.quickBarAdd")}</Button>
        </DialogFooter>
      </form>
    </Tabs.Root>
  )
}

export default function QuickBarPane() {
  const { t } = useTranslation()
  const center = useHomeSettingsStore((state) => state.quickBar.center)
  const setCenter = useHomeSettingsStore((state) => state.setQuickBarCenter)
  const centerLabel = {
    none: "settings.home.quickBarCenterNone",
    time: "settings.home.quickBarCenterTime",
    text: "settings.home.quickBarCenterText",
  } as const
  return (
    <section className="space-y-4">
      <SettingItem
        label={t("settings.home.quickBarCenter")}
        htmlFor="home-quick-bar-center"
      >
        <Select
          value={center.kind}
          onValueChange={(value) => {
            if (value === "none" || value === "time") setCenter({ kind: value })
            if (value === "text") setCenter({ kind: value, text: "" })
          }}
        >
          <SelectTrigger
            id="home-quick-bar-center"
            className={`w-full min-w-0 ${settingsControlClassName}`}
          >
            <SelectValue>{t(centerLabel[center.kind])}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              {t("settings.home.quickBarCenterNone")}
            </SelectItem>
            <SelectItem value="time">
              {t("settings.home.quickBarCenterTime")}
            </SelectItem>
            <SelectItem value="text">
              {t("settings.home.quickBarCenterText")}
            </SelectItem>
          </SelectContent>
        </Select>
      </SettingItem>
      {center.kind === "text" && (
        <SettingItem
          label={t("settings.home.quickBarText")}
          htmlFor="home-quick-bar-text"
        >
          <Input
            id="home-quick-bar-text"
            className={`min-w-0 ${settingsControlClassName}`}
            maxLength={80}
            value={center.text}
            onChange={(event) =>
              setCenter({ kind: "text", text: event.target.value })
            }
          />
        </SettingItem>
      )}
    </section>
  )
}
