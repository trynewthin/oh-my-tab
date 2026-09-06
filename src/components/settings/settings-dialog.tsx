import EffectSurface from "@/components/effects/effect-surface"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import PersonalizationSettings from "./personalization-settings"
import { MagnifyingGlass, X, House, Gear, Palette } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import SearchEngineSettings from "@/components/settings/search-engine-settings"
import { useSettingsStore, type SettingsSection } from "@/stores/settings-store"

import HomeSettings from "@/components/settings/home-settings"

import GeneralSettings from "./general-settings"

const sections = [
  { id: "general", label: "常规设置", icon: Gear },
  { id: "home", label: "主页设置", icon: House },
  { id: "personalization", label: "个性化", icon: Palette },
  { id: "search-engines", label: "搜索引擎", icon: MagnifyingGlass },
] satisfies {
  id: SettingsSection
  label: string
  icon: typeof MagnifyingGlass
}[]

export default function SettingsDialog() {
  const color = useHomeSettingsStore((state) => state.color)
  const open = useSettingsStore((state) => state.open)
  const setOpen = useSettingsStore((state) => state.setOpen)
  const section = useSettingsStore((state) => state.section)
  const setSection = useSettingsStore((state) => state.setSection)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-3xl"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] opacity-40"
        >
          <EffectSurface
            textureId={"personalization-background"}
            color={color}
            animated
            visible={section === "personalization"}
          />
        </div>
        <div className="relative z-10 flex h-[min(560px,80svh)] min-h-0 min-w-0">
          <aside className="flex w-28 shrink-0 flex-col overflow-y-auto p-2 pt-6 sm:w-44 sm:p-4 sm:pt-6">
            <DialogHeader className="px-2 pb-6 text-left">
              <DialogTitle>设置</DialogTitle>
              <DialogDescription className="sr-only">
                选择左侧分类，管理对应设置。
              </DialogDescription>
            </DialogHeader>
            <nav aria-label="设置分类" className="space-y-1">
              {sections.map((item) => (
                <Button
                  key={item.id}
                  variant={section === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start px-2 text-xs sm:text-sm"
                  aria-current={section === item.id ? "page" : undefined}
                  onClick={() => setSection(item.id)}
                >
                  <item.icon />
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="mt-auto pt-6">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start px-2 text-xs sm:text-sm"
                onClick={() => setOpen(false)}
              >
                <X />
                关闭
              </Button>
            </div>
          </aside>
          <div className="min-w-0 flex-1 overflow-y-auto px-3 py-6 sm:p-6">
            {section === "general" ? (
              <GeneralSettings />
            ) : section === "search-engines" ? (
              <SearchEngineSettings />
            ) : section === "personalization" ? (
              <PersonalizationSettings />
            ) : (
              <HomeSettings />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
