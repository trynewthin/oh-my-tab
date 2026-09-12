import { settingsControlClassName } from "./control-styles"
import CacheSettings from "./cache-settings"
import BookmarkImport from "./bookmark-import"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { Button } from "@/components/ui/button"
import DataSettings from "./data-settings"

export default function GeneralSettings() {
  const color = useHomeSettingsStore((state) => state.color)
  return (
    <section
      className="relative isolate min-h-full"
      aria-labelledby="general-settings-title"
    >
      <h2 id="general-settings-title" className="sr-only">
        常规
      </h2>
      <div className="space-y-8">
        <section className="space-y-5" aria-labelledby="basic-settings-title">
          <h3
            id="basic-settings-title"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            基础
          </h3>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">新手教程</span>
            <Button
              variant="outline"
              className={settingsControlClassName}
              onClick={() => {
                useSettingsStore.getState().setOpen(false)
                useOnboardingStore.getState().start()
              }}
            >
              重新开始教程
            </Button>
          </div>
        </section>
        <section className="space-y-5" aria-labelledby="data-settings-title">
          <h3
            id="data-settings-title"
            className="flex items-center gap-2 text-sm font-medium"
          >
            <span
              aria-hidden="true"
              className="h-4 w-1 rounded-full"
              style={{ backgroundColor: color }}
            />
            数据
          </h3>
          <CacheSettings />
          <BookmarkImport />
          <DataSettings />
        </section>
      </div>
    </section>
  )
}
