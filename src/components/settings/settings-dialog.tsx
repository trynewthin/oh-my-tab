import AboutSettings from "./about-settings"
import EffectSurface from "@/components/effects/effect-surface"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import PersonalizationSettings from "./personalization-settings"
import {
  MagnifyingGlass,
  X,
  House,
  Gear,
  Palette,
  Info,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import SearchEngineSettings from "@/components/settings/search-engine-settings"
import { useSettingsStore, type SettingsSection } from "@/stores/settings-store"

import HomeSettings from "@/components/settings/home-settings"

import GeneralSettings from "./general-settings"

const sections = [
  { id: "general", label: "常规设置", icon: Gear },
  { id: "home", label: "主页设置", icon: House },
  { id: "search-engines", label: "搜索引擎", icon: MagnifyingGlass },
  { id: "personalization", label: "个性化", icon: Palette },
  { id: "about", label: "关于", icon: Info },
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
  const currentSection =
    sections.find((item) => item.id === section) ?? sections[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="h-[calc(100svh-1rem)] w-[calc(100%-1rem)] max-w-none gap-0 overflow-hidden p-0 sm:h-auto sm:w-full sm:max-w-3xl"
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
            visible={section === "personalization"}
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
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>
          <div className="shrink-0 px-4 pb-3 sm:hidden">
            <Select
              value={section}
              onValueChange={(value) => {
                const next = sections.find((item) => item.id === value)
                if (next) setSection(next.id)
              }}
            >
              <SelectTrigger
                aria-label="设置分类"
                className="w-full border-border bg-muted"
              >
                <SelectValue>
                  <currentSection.icon />
                  {currentSection.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                side="bottom"
                align="start"
                alignItemWithTrigger={false}
              >
                {sections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    <item.icon />
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <aside className="hidden w-44 shrink-0 flex-col overflow-y-auto p-4 pt-6 sm:flex">
            <div className="px-2 pb-6 text-left text-base leading-6 font-medium">
              设置
            </div>
            <nav aria-label="设置分类" className="space-y-1">
              {sections.map((item) => (
                <Button
                  key={item.id}
                  variant={section === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start px-2 text-sm"
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
                className="w-full justify-start px-2 text-sm"
                onClick={() => setOpen(false)}
              >
                <X />
                关闭
              </Button>
            </div>
          </aside>
          <div
            data-settings-content
            className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:p-6"
          >
            {section === "about" ? (
              <AboutSettings />
            ) : section === "general" ? (
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
