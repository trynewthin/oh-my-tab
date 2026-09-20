import { applyNetworkChoices, usePrivacyStore } from "@/stores/privacy-store"
import { reloadVisibleFavicons } from "@/application/favicon-cache"
import { toast } from "@/stores/toast-store"
import PrivacySettings from "@/components/settings/about/privacy-settings"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOnboardingStore } from "@/stores/onboarding-store"

const steps: {
  key: string
  body?: boolean
  target?: string
}[] = [
  {
    key: "welcome",
  },
  {
    target: "search",
    key: "search",
    body: true,
  },
  {
    target: "more",
    key: "moreActions",
    body: true,
  },
  {
    target: "more",
    key: "components",
    body: true,
  },
  {
    target: "more",
    key: "batch",
    body: true,
  },
  {
    target: "more",
    key: "theme",
    body: true,
  },
  {
    target: "engine",
    key: "engine",
    body: true,
  },
  {
    target: "grid",
    key: "gridDrag",
    body: true,
  },
  {
    target: "grid",
    key: "gridManage",
    body: true,
  },
  {
    target: "settings",
    key: "settings",
    body: true,
  },
  {
    target: "settings",
    key: "dotMatrix",
    body: true,
  },
  {
    target: "settings",
    key: "personalization",
    body: true,
  },
  {
    target: "settings",
    key: "importBookmarks",
    body: true,
  },
  {
    target: "settings",
    key: "dataManagement",
    body: true,
  },
  ...(location.protocol === "chrome-extension:"
    ? [
        {
          key: "quickSave",
          body: true,
        },
      ]
    : []),
  {
    target: "settings",
    key: "replay",
    body: true,
  },
]

const sentences = /(?<=[。！？])|(?<=[.!?])\s+/

function Tour() {
  const { t } = useTranslation()
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [choices, setChoices] = useState(() => {
    const { suggestions, icons } = usePrivacyStore.getState()
    return { suggestions, icons }
  })
  async function consent(agree: boolean) {
    setBusy(true)
    try {
      const selected = agree ? choices : { suggestions: false, icons: false }
      const granted = await applyNetworkChoices(selected)
      reloadVisibleFavicons()
      if (!granted) {
        setChoices({ suggestions: false, icons: false })
        toast(t("shell.onboarding.consentDenied"), "error")
        return
      }
      setChoices(selected)
      setStep(1)
    } catch {
      toast(t("shell.onboarding.consentFailed"), "error")
    } finally {
      setBusy(false)
    }
  }
  const [rect, setRect] = useState<DOMRect | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [bodyHeight, setBodyHeight] = useState<number>()
  const finish = useOnboardingStore((state) => state.finish)
  const current = steps[step]
  const title = t(`shell.onboarding.steps.${current.key}.title`)
  const text = current.body
    ? t(`shell.onboarding.steps.${current.key}.text`)
    : undefined

  useEffect(() => {
    const target = current.target
      ? document.querySelector(`[data-tour="${current.target}"]`)
      : null
    const update = () => setRect(target?.getBoundingClientRect() ?? null)
    const frame = requestAnimationFrame(update)
    const observer = new ResizeObserver(update)
    if (target) observer.observe(target)
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [current.target])

  useLayoutEffect(() => {
    const element = bodyRef.current
    if (!element) return
    const update = () => setBodyHeight(element.scrollHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [step, text, title])

  return (
    <>
      {rect &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-50 rounded-xl outline-2 outline-violet-400"
            style={{
              top: rect.top - 5,
              left: rect.left - 5,
              width: rect.width + 10,
              height: rect.height + 10,
              boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)",
            }}
          />,
          document.body
        )}
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !busy) finish()
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName={
            rect
              ? "bg-transparent supports-backdrop-filter:backdrop-blur-none"
              : "bg-black/45 supports-backdrop-filter:backdrop-blur-none"
          }
          className={
            step === 0
              ? "z-[60] gap-4 overflow-hidden"
              : "top-auto bottom-4 z-[60] max-h-[45svh] -translate-y-0 gap-4 overflow-hidden sm:bottom-6"
          }
        >
          <DialogHeader
            aria-live="polite"
            aria-atomic="true"
            className="flex-row items-start justify-between gap-4"
          >
            <DialogTitle className="pt-1">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="-mt-1 -mr-2 shrink-0"
              onClick={finish}
            >
              {t("shell.onboarding.skip")}
            </Button>
          </DialogHeader>
          {step === 0 ? (
            <>
              <DialogDescription className="sr-only">
                {t("shell.onboarding.consentPrompt")}
              </DialogDescription>
              <PrivacySettings
                choices={choices}
                disabled={busy}
                onChange={(feature, enabled) =>
                  setChoices((current) => ({ ...current, [feature]: enabled }))
                }
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void consent(false)}
                >
                  {t("shell.onboarding.decline")}
                </Button>
                <Button disabled={busy} onClick={() => void consent(true)}>
                  {t("shell.onboarding.agree")}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div
                className="overflow-hidden transition-[height] duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={bodyHeight ? { height: bodyHeight } : undefined}
              >
                <div ref={bodyRef} className="space-y-3">
                  {text
                    ?.split(sentences)
                    .filter((sentence) => sentence.trim())
                    .map((sentence, index) =>
                      index === 0 ? (
                        <DialogDescription
                          key={`${current.key}-${index}`}
                          className="animate-in leading-relaxed duration-200 fade-in-0 motion-reduce:animate-none"
                        >
                          {sentence}
                        </DialogDescription>
                      ) : (
                        <p
                          key={`${current.key}-${index}`}
                          className="animate-in text-sm leading-relaxed text-muted-foreground duration-200 fade-in-0 motion-reduce:animate-none"
                        >
                          {sentence}
                        </p>
                      )
                    )}
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  {t("shell.onboarding.previous")}
                </Button>
                <Button
                  onClick={() =>
                    step === steps.length - 1 ? finish() : setStep(step + 1)
                  }
                >
                  {step === steps.length - 1
                    ? t("shell.onboarding.start")
                    : t("shell.onboarding.next")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function OnboardingTour() {
  const seen = useOnboardingStore((state) => state.seen)
  const replay = useOnboardingStore((state) => state.replay)
  return !seen || replay ? <Tour /> : null
}
