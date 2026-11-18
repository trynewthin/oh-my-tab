import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { appRepository } from "@/application/apps"
import { appRegistry } from "@/components/application/app-registry"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { appIds, type AppId } from "@/lib/apps/ids"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

function openApp(id: AppId) {
  const overlays = useSystemOverlayStore.getState()
  if (id === "settings") overlays.openSettings()
  else overlays.open(id)
}

function AppOpenButton({ id, disabled }: { id: AppId; disabled?: boolean }) {
  const { t } = useTranslation()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled}
      aria-label={t("shell.apps.openNamed", { name: t(appRegistry[id].title) })}
      onClick={() => openApp(id)}
    >
      {t("shell.apps.open")}
    </Button>
  )
}

function OptionalAppControls({ id, name }: { id: AppId; name: string }) {
  const { t } = useTranslation()
  const [enabled, setEnabled] = useState<boolean | null>(null)
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(
    () => appRepository.watchEnabled(id, setEnabled, () => setFailed(true)),
    [id]
  )

  async function changeEnabled(next: boolean) {
    setPending(true)
    setFailed(false)
    try {
      await appRepository.setEnabled(id, next)
      setEnabled(next)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Switch
        aria-label={t("shell.apps.enableNamed", { name })}
        checked={enabled === true}
        disabled={pending || enabled === null}
        onCheckedChange={changeEnabled}
      />
      <AppOpenButton id={id} disabled={pending || enabled !== true} />
      {failed && (
        <p role="alert" className="basis-full text-sm text-destructive">
          {t("shell.apps.preferenceFailed")}
        </p>
      )}
    </>
  )
}

export default function AppDirectory() {
  const { t } = useTranslation()
  return (
    <DialogContent data-app-window="apps" className="sm:max-w-lg">
      <header className="space-y-2 pr-8">
        <DialogTitle>{t("shell.apps.title")}</DialogTitle>
        <DialogDescription>{t("shell.apps.description")}</DialogDescription>
      </header>
      <ul className="grid gap-2">
        {appIds.map((id) => {
          const { title, icon: Icon, optional } = appRegistry[id]
          const name = t(title)
          return (
            <li
              key={id}
              className="flex flex-wrap items-center gap-3 rounded-xl border px-3 py-2"
            >
              <Icon
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
              <span className="min-w-0 flex-1 font-medium">{name}</span>
              {optional ? (
                <OptionalAppControls id={id} name={name} />
              ) : (
                <AppOpenButton id={id} />
              )}
            </li>
          )
        })}
      </ul>
    </DialogContent>
  )
}
