import { settingsControlClassName } from "./control-styles"
import CacheSettings from "./cache-settings"
import BookmarkImport from "./bookmark-import"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSettingsStore } from "@/stores/settings-store"
import { Button } from "@/components/ui/button"
import DataSettings from "./data-settings"

export default function GeneralSettings({ pane }: { pane: "basic" | "data" }) {
  return (
    <section
      className="relative isolate min-h-full space-y-5"
      aria-labelledby="general-settings-title"
    >
      <h2
        id="general-settings-title"
        className="text-base leading-6 font-medium"
      >
        {pane === "basic" ? "基础" : "数据"}
      </h2>
      {pane === "basic" ? (
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
      ) : (
        <>
          <CacheSettings />
          <BookmarkImport />
          <DataSettings />
        </>
      )}
    </section>
  )
}
