import EffectSurface from "@/components/effects/effect-surface"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { X } from "@phosphor-icons/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSettingsStore } from "@/stores/settings-store"
import { settingsRouteSurface } from "./settings-routes"
import { defaultSettingsSection, settingsViews } from "./settings-views"
import { SettingsSectionSelect, SettingsSidebar } from "./settings-sidebar"

function scrollPercent(node: HTMLElement) {
  const max = node.scrollHeight - node.clientHeight
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((node.scrollTop / max) * 100)))
}

export default function SettingsDialog() {
  const color = useHomeSettingsStore((state) => state.color)
  const open = useSettingsStore((state) => state.open)
  const setOpen = useSettingsStore((state) => state.setOpen)
  const section = useSettingsStore((state) => state.section)
  const setSection = useSettingsStore((state) => state.setSection)
  const View = settingsViews[section] ?? settingsViews[defaultSettingsSection]
  const [navNode, setNavNode] = useState<HTMLDivElement | null>(null)
  const [navProgress, setNavProgress] = useState(0)

  useEffect(() => {
    if (!navNode) return
    const node = navNode
    function update() {
      setNavProgress(scrollPercent(node))
    }
    update()
    node.addEventListener("scroll", update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(node)
    if (node.firstElementChild) observer.observe(node.firstElementChild)
    return () => {
      node.removeEventListener("scroll", update)
      observer.disconnect()
    }
  }, [navNode])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/10 backdrop-blur-xl"
        className="h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden p-0 ring-0 sm:h-auto sm:w-full sm:max-w-3xl"
      >
        <DialogTitle className="sr-only">设置</DialogTitle>
        <DialogDescription className="sr-only">
          选择分类，管理对应设置。
        </DialogDescription>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-40"
        >
          <EffectSurface
            textureId={"personalization-background"}
            color={color}
            animated
            visible={
              settingsRouteSurface(section) === "personalization" &&
              section !== "personalization-tabs"
            }
          />
        </div>
        <div className="relative z-10 flex h-full min-h-0 min-w-0 flex-col sm:h-[min(560px,80svh)] sm:flex-row">
          <div className="flex shrink-0 items-center justify-between px-4 pt-4 pb-2 sm:hidden">
            <span className="text-base font-medium">设置</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="关闭设置"
              className="text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </Button>
          </div>
          <div className="shrink-0 px-4 pb-3 sm:hidden">
            <SettingsSectionSelect section={section} onSelect={setSection} />
          </div>
          <aside className="relative hidden h-full min-h-0 w-36 shrink-0 sm:block">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-popover from-70% to-transparent px-4 pt-6 pb-4">
              <div className="text-left text-base leading-6 font-medium">
                设置
              </div>
            </div>
            <div
              ref={setNavNode}
              onScroll={(event) =>
                setNavProgress(scrollPercent(event.currentTarget))
              }
              className="h-full min-h-0 [scrollbar-width:none] overflow-y-auto pt-14 pb-[4.5rem] [&::-webkit-scrollbar]:hidden"
            >
              <SettingsSidebar section={section} onSelect={setSection} />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 isolate z-10 px-4 pb-4">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 -top-16 bottom-0 -z-10 bg-gradient-to-t from-popover/75 via-popover/30 to-transparent"
              />
              <div className="relative overflow-hidden rounded-2xl bg-popover shadow-md">
                <Button
                  type="button"
                  variant="ghost"
                  className="pointer-events-auto w-full justify-start rounded-none bg-transparent px-2 text-sm shadow-none hover:bg-muted dark:hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  <X />
                  关闭
                </Button>
                <span
                  role="progressbar"
                  aria-label="设置列表滚动进度"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={navProgress}
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end pr-2.5 text-xs text-muted-foreground tabular-nums"
                >
                  {navProgress}
                </span>
              </div>
            </div>
          </aside>
          <div
            data-settings-content
            className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:p-6"
          >
            <View />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
