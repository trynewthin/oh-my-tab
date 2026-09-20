import { Star } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"

const starPixels = [
  "00000100000",
  "00001110000",
  "00001110000",
  "11111111111",
  "01111111110",
  "00111111100",
  "00011111000",
  "00111111100",
  "00111011100",
  "01110001110",
  "01100000110",
]

function PixelStar() {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      aria-hidden="true"
      className="size-full"
    >
      <circle
        cx="90"
        cy="90"
        r="78"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeDasharray="2 7"
      />
      <circle
        cx="90"
        cy="90"
        r="64"
        stroke="currentColor"
        strokeOpacity="0.1"
      />
      {starPixels.flatMap((row, y) =>
        [...row].map((pixel, x) => (
          <rect
            key={`${x}-${y}`}
            x={37 + x * 10}
            y={35 + y * 10}
            width="7"
            height="7"
            rx="1.6"
            fill="currentColor"
            opacity={pixel === "1" ? 0.9 : 0.07}
          />
        ))
      )}
      <path
        d="M151 31v12m-6-6h12M23 125v8m-4-4h8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="133" cy="156" r="3" fill="currentColor" fillOpacity="0.5" />
    </svg>
  )
}

export default function ProjectSupport() {
  const { t } = useTranslation()
  return (
    <section
      aria-labelledby="project-support-title"
      className="relative isolate grid grid-cols-[minmax(0,1fr)_5rem] items-center gap-4 overflow-hidden rounded-2xl border border-border bg-muted p-5 sm:grid-cols-[minmax(0,1fr)_7rem]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_right,rgba(245,158,11,0.14),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_right,rgba(245,158,11,0.11),transparent_70%)]"
      />
      <div className="min-w-0">
        <h3
          id="project-support-title"
          className="text-xl leading-snug font-semibold tracking-tight sm:text-2xl"
        >
          {t("settings.about.supportTitleLine1")}
          <br />
          {t("settings.about.supportTitleLine2")}
        </h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("settings.about.supportBody")}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <a
            href="https://github.com/trynewthin/oh-my-tab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-amber-500/25 bg-amber-100 px-3 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-200 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none dark:border-amber-200/30 dark:bg-amber-200 dark:hover:bg-amber-100"
          >
            <Star weight="fill" className="size-4" aria-hidden="true" />
            {t("settings.about.star")}
          </a>
          <a
            href="https://github.com/trynewthin/oh-my-tab/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            {t("settings.about.shareIdea")}
          </a>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none aspect-square w-full text-amber-500 dark:text-amber-300/85"
      >
        <PixelStar />
      </div>
    </section>
  )
}
