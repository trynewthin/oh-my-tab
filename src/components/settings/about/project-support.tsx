import { Star } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import BorderGlow from "@/components/ui/border-glow"

export default function ProjectSupport() {
  const { t } = useTranslation()
  return (
    <BorderGlow
      animated
      backgroundColor="var(--card)"
      glowColor="270 90 75"
      colors={["#c084fc", "#f472b6", "#38bdf8"]}
      className="mx-auto w-full max-w-[34rem] text-card-foreground"
    >
      <section
        aria-labelledby="project-support-title"
        className="relative min-w-0 p-4 sm:p-5"
      >
        <h3
          id="project-support-title"
          className="text-lg leading-snug font-semibold tracking-tight sm:text-xl"
        >
          {t("settings.about.supportTitleLine1")}
          <br />
          {t("settings.about.supportTitleLine2")}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground">
          {t("settings.about.supportBody")}
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <a
            href="https://github.com/trynewthin/oh-my-tab/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            {t("settings.about.shareIdea")}
          </a>
          <a
            href="https://github.com/trynewthin/oh-my-tab"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center justify-center gap-2 rounded-full bg-foreground px-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/80 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <Star weight="fill" className="size-4" aria-hidden="true" />
            {t("settings.about.star")}
          </a>
        </div>
      </section>
    </BorderGlow>
  )
}
