import { useTranslation } from "react-i18next"
import { appRegistry } from "@/components/application/app-registry"
import { Button } from "@/components/ui/button"
import { appIds } from "@/lib/apps/ids"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

const managedAppIds = appIds.filter((id) => id !== "settings")

export default function AppSettings() {
  const { t } = useTranslation()
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t("shell.apps.description")}
      </p>
      <ul className="divide-y divide-border/60 overflow-hidden rounded-(--ui-radius-panel) border border-ui-border-panel">
        {managedAppIds.map((id) => {
          const { title, icon: Icon } = appRegistry[id]
          const name = t(title)
          return (
            <li
              key={id}
              className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-3 sm:px-4"
            >
              <Icon
                aria-hidden="true"
                className="size-5 text-muted-foreground"
              />
              <div className="min-w-16 flex-1">
                <div className="font-medium">{name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t("shell.apps.systemApp")}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                aria-label={t("shell.apps.openNamed", { name })}
                onClick={() => useSystemOverlayStore.getState().open(id)}
              >
                {t("shell.apps.open")}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
