import GridPane from "./grid-pane"
import LayoutPane from "./layout-pane"
import SearchPane from "./search-pane"
import SearchShortcutsSetting from "./search-shortcuts-setting"
import TopPane from "./top-pane"
import QuickBarPane from "./quick-bar-pane"
import QuickBarPreview from "./quick-bar-preview"
import TraditionalPreview from "./traditional-preview"
import { AppearancePreviewFrame } from "@/components/settings/personalization/appearance-preview-stage"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function HomeSettings() {
  const layoutMode = useHomeSettingsStore((state) => state.layoutMode)
  return (
    <section className="relative isolate min-h-full space-y-4">
      <AppearancePreviewFrame className="h-40 sm:h-48">
        {layoutMode === "traditional" ? (
          <TraditionalPreview />
        ) : (
          <QuickBarPreview />
        )}
      </AppearancePreviewFrame>
      <LayoutPane />
      {layoutMode === "traditional" ? (
        <>
          <TopPane />
          <SearchPane />
          <SearchShortcutsSetting />
        </>
      ) : (
        <QuickBarPane />
      )}
      <GridPane />
    </section>
  )
}
