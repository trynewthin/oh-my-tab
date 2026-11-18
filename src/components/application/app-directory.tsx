import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { appRepository } from "@/application/apps"
import { appRegistry } from "@/components/application/app-registry"
import { Button } from "@/components/ui/button"
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
    <ul className="divide-y divide-border/60 overflow-hidden rounded-(--ui-radius-panel) border border-ui-border-panel">
      {appIds.map((id) => {
        const { title, icon: Icon, optional } = appRegistry[id]
        const name = t(title)
        return (
          <li
            key={id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4"
          >
            <Icon aria-hidden="true" className="size-5 text-muted-foreground" />
            <div className="min-w-16 flex-1">
              <div className="font-medium">{name}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                {t(
                  optional ? "shell.apps.optionalApp" : "shell.apps.systemApp"
                )}
              </div>
            </div>
            {optional ? (
              <OptionalAppControls id={id} name={name} />
            ) : (
              <AppOpenButton id={id} />
            )}
          </li>
        )
      })}
    </ul>
  )
}
