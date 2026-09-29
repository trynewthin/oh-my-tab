import { useTranslation } from "react-i18next"
import currentReleaseConfig from "@/content/current-release.yaml"
import { releaseNoteLocale, validateReleaseNotes } from "@/lib/release-notes"

const currentRelease = validateReleaseNotes(currentReleaseConfig)

export default function ReleaseNotesCard() {
  const { t, i18n } = useTranslation()
  const notes =
    currentRelease.notes[
      releaseNoteLocale(i18n.resolvedLanguage ?? i18n.language)
    ]
  return (
    <section
      aria-labelledby="current-release-title"
      className="rounded-2xl border bg-card p-4 text-card-foreground sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 id="current-release-title" className="text-base font-semibold">
          {t("settings.about.releaseNotes")}
        </h3>
        <span className="rounded-full border px-2.5 py-1 text-xs font-medium text-muted-foreground">
          v{currentRelease.version}
        </span>
      </div>
      <ul className="mt-4 space-y-2 text-sm leading-5 text-muted-foreground">
        {notes.map((note) => (
          <li key={note} className="flex gap-2">
            <span
              aria-hidden="true"
              className="mt-2 size-1 shrink-0 rounded-full bg-current"
            />
            <span>{note}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
