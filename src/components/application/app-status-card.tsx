import { useTranslation } from "react-i18next"
import type { AppFrameDetails } from "@/components/application/app-registry"
import AppWindowFrame from "@/components/application/app-window-frame"
import "./app-status-card.css"

const dotColors = {
  loading: "text-primary",
  error: "text-destructive",
  warning: "text-amber-700 dark:text-amber-400",
}

type AppStatusCardProps = AppFrameDetails &
  (
    | { variant: "loading"; message?: never }
    | { variant: "error" | "warning"; message: string }
  )

export default function AppStatusCard({
  id,
  title,
  icon: Icon,
  variant,
  message,
}: AppStatusCardProps) {
  const { t } = useTranslation()
  const loading = variant === "loading"

  return (
    <AppWindowFrame
      id={id}
      title={title}
      phase={loading ? "loading" : "blocked"}
      className="w-56 rounded-[calc(var(--ui-radius-window)*4/3)] bg-card text-card-foreground"
    >
      <div role={loading ? "status" : "alert"}>
        <div
          aria-hidden="true"
          className="grid min-h-24 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 px-5 py-4"
        >
          <Icon
            className="size-9 justify-self-center text-primary"
            weight="regular"
          />
          <span
            data-variant={variant}
            className={`app-status-dots grid grid-cols-3 place-items-center ${dotColors[variant]}`}
          >
            <span className="size-2.5 rounded-full bg-current" />
            <span className="size-2.5 rounded-full bg-current" />
            <span className="size-2.5 rounded-full bg-current" />
          </span>
        </div>
        <span className="sr-only">
          {loading ? t("shell.apps.loading") : message}
        </span>
      </div>
    </AppWindowFrame>
  )
}
