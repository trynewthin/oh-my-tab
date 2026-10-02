import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { landingDetailIds } from "../i18n/types"
import { OpeningAct } from "./opening-act"
import { SceneDeck } from "./scene-deck"
import "./landing-story.css"

export function LandingContent({
  theme,
  setTheme,
  footer,
}: {
  theme: "dark" | "light"
  setTheme: (theme: "dark" | "light") => void
  footer: ReactNode
}) {
  const { t } = useTranslation()
  const suffix = theme === "light" ? "-light" : ""
  const scenes: ReactNode[] = [
    <OpeningAct key="opening" theme={theme} setTheme={setTheme} />,
  ]
  for (const id of landingDetailIds) {
    const title = t(`landing.features.details.${id}.title`)
    scenes.push(
      <section className={`story-detail story-detail--${id}`} key={id}>
        <div className="story-copy">
          <h2>{title}</h2>
          <p>{t(`landing.features.details.${id}.text`)}</p>
        </div>
        <div className="story-art">
          <div className="story-art-grid" aria-hidden="true" />
          {id === "colors" ? (
            <div className="story-bookmarks" role="img" aria-label={title}>
              {["github", "notion", "spotify"].map((site) => (
                <img
                  key={site}
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
              src={`/showcase/detail-${id}${suffix}.webp`}
              alt={title}
            />
          )}
        </div>
      </section>
    )
  }
  for (const id of ["organize", "widgets"] as const) {
    scenes.push(
      <section className="story-workspace" key={id}>
        <div className="story-workspace-copy">
          <h2>{t(`landing.showcase.${id}.title`)}</h2>
          <p>{t(`landing.showcase.${id}.text`)}</p>
        </div>
        <div className="story-workspace-image">
          <img
            src={`/showcase/${id}-${theme}.webp`}
            width="3000"
            height="920"
            alt={t(`landing.showcase.${id}Alt`)}
          />
        </div>
      </section>
    )
  }
  return (
    <main className="landing">
      <SceneDeck scenes={scenes} footer={footer} />
    </main>
  )
}
