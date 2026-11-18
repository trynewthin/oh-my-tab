import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"
import type { AppWindowProps } from "@/components/application/app-registry"
import { Button } from "@/components/ui/button"
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { AppStorage } from "@/lib/apps/storage"
import { DataError } from "@/lib/data/errors"
import { NOTE_MAX_LENGTH } from "@/lib/widgets/model"

const noteVersion = 1
const noteText = z.string().max(NOTE_MAX_LENGTH)

type Note = { text: string; revision: string | null }
type ReadState =
  | { status: "loading" | "failed" | "unsupported" }
  | { status: "ready"; note: Note }

function NoteEditor({
  initial,
  storage,
}: {
  initial: Note
  storage: AppStorage
}) {
  const { t } = useTranslation()
  const [saved, setSaved] = useState(initial)
  const [draft, setDraft] = useState(initial.text)
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "conflict" | "failed"
  >("idle")

  async function save() {
    setStatus("saving")
    try {
      const document = await storage.save(
        { version: noteVersion, data: draft },
        saved.revision
      )
      setSaved({ text: draft, revision: document.revision })
      setStatus("saved")
    } catch (error) {
      setStatus(
        error instanceof DataError && error.code === "CONFLICT"
          ? "conflict"
          : "failed"
      )
    }
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void save()
      }}
    >
      <Textarea
        className="h-56 max-h-[45svh] overflow-y-auto"
        aria-label={t("shell.apps.notes")}
        value={draft}
        maxLength={NOTE_MAX_LENGTH}
        placeholder={t("widgets.notePlaceholder")}
        onChange={(event) => setDraft(event.target.value)}
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        {status === "saved" && draft === saved.text && (
          <p role="status" className="text-sm text-muted-foreground">
            {t("shell.apps.noteSaved")}
          </p>
        )}
        {status === "failed" && (
          <p role="alert" className="text-sm text-destructive">
            {t("shell.apps.noteSaveFailed")}
          </p>
        )}
        {status === "conflict" && (
          <p role="alert" className="text-sm text-destructive">
            {t("shell.apps.noteConflict")}
          </p>
        )}
        <Button
          type="submit"
          disabled={
            draft === saved.text || status === "saving" || status === "conflict"
          }
        >
          {t("shell.apps.saveNote")}
        </Button>
      </div>
    </form>
  )
}

export default function NotesApplication({ storage }: AppWindowProps) {
  const { t } = useTranslation()
  const [state, setState] = useState<ReadState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    void storage
      .read()
      .then((document) => {
        if (cancelled) return
        if (document && document.version !== noteVersion) {
          setState({ status: "unsupported" })
          return
        }
        setState({
          status: "ready",
          note: {
            text: document ? noteText.parse(document.data) : "",
            revision: document?.revision ?? null,
          },
        })
      })
      .catch(() => {
        if (!cancelled) setState({ status: "failed" })
      })
    return () => {
      cancelled = true
    }
  }, [storage])

  return (
    <DialogContent data-app-window="notes" className="sm:max-w-lg">
      <header className="space-y-2 pr-8">
        <DialogTitle>{t("shell.apps.notes")}</DialogTitle>
        <DialogDescription>{t("shell.apps.noteDescription")}</DialogDescription>
      </header>
      {state.status === "ready" && (
        <NoteEditor initial={state.note} storage={storage} />
      )}
      {state.status === "loading" && (
        <p role="status">{t("shell.apps.loading")}</p>
      )}
      {state.status === "failed" && (
        <p role="alert">{t("shell.apps.noteReadFailed")}</p>
      )}
      {state.status === "unsupported" && (
        <p role="alert">{t("shell.apps.noteUnsupported")}</p>
      )}
    </DialogContent>
  )
}
