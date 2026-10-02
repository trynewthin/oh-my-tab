import { useTranslation } from "react-i18next"
import { landingDetailIds, type LandingDetailId } from "../i18n/types"
import { OpeningAct } from "./opening-act"
import "./landing-story.css"

type DetailVisual = {
  image: "detail-colors" | "detail-todos" | "detail-calendar" | "detail-plant"
  tone: string
}

// Product captures stay separate so each bookmark keeps its own silhouette.
const detailVisuals: Record<LandingDetailId, DetailVisual> = {
  colors: { image: "detail-colors", tone: "lilac" },
  todos: { image: "detail-todos", tone: "blue" },
  calendar: { image: "detail-calendar", tone: "rose" },
  plant: { image: "detail-plant", tone: "green" },
}

export function LandingContent({
  theme,
  setTheme,
}: {
  theme: "dark" | "light"
  setTheme: (theme: "dark" | "light") => void
}) {
  const { t } = useTranslation()
  const suffix = theme === "light" ? "-light" : ""

  return (
    <main className="landing">
      <OpeningAct theme={theme} setTheme={setTheme} />

      <section
        className="story-details"
        id="features"
        aria-labelledby="details-title"
      >
        <div className="story-heading">
          <h2 id="details-title">{t("landing.features.heading")}</h2>
          <div className="story-dots" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        {landingDetailIds.map((id) => {
          const visual = detailVisuals[id]
          const title = t(`landing.features.details.${id}.title`)
          return (
            <article
              className={`story-detail story-detail--${id} story-detail--${visual.tone}`}
              key={id}
            >
              <div className="story-copy">
                <h3>{title}</h3>
                <p>{t(`landing.features.details.${id}.text`)}</p>
              </div>
              <div className="story-art">
                <div className="story-art-grid" aria-hidden="true" />
                {id === "colors" ? (
                  <div
                    className="story-bookmarks"
                    role="img"
                    aria-label={title}
                  >
                    {["github", "notion", "spotify"].map((site) => (
                      <img
                        key={site}
                        loading="lazy"
                        src={`/showcase/detail-${site}${suffix}.webp`}
                        alt=""
                        width="564"
                        height="118"
                      />
                    ))}
                  </div>
                ) : (
                  <img
                    className="story-widget"
                    loading="lazy"
                    src={`/showcase/${visual.image}${suffix}.webp`}
                    alt={title}
                  />
                )}
              </div>
            </article>
          )
        })}
      </section>

      <section
        className="story-desktop"
        id="showcase"
        aria-labelledby="desktop-title"
      >
        <div className="story-heading">
          <h2 id="desktop-title">{t("landing.showcase.heading")}</h2>
        </div>
        <article className="story-workspace story-workspace--organize">
          <div className="story-workspace-copy">
            <h3>{t("landing.showcase.organize.title")}</h3>
            <p>{t("landing.showcase.organize.text")}</p>
          </div>
          <div className="story-workspace-image">
            <img
              loading="lazy"
              width="3000"
              height="920"
              src={`/showcase/organize-${theme}.webp`}
              alt={t("landing.showcase.organizeAlt")}
            />
          </div>
        </article>
        <article className="story-workspace story-workspace--widgets">
          <div className="story-workspace-copy">
            <h3>{t("landing.showcase.widgets.title")}</h3>
            <p>{t("landing.showcase.widgets.text")}</p>
          </div>
          <div className="story-workspace-image">
            <img
              loading="lazy"
              width="3000"
              height="920"
              src={`/showcase/widgets-${theme}.webp`}
              alt={t("landing.showcase.widgetsAlt")}
            />
          </div>
        </article>
      </section>
    </main>
  )
}
