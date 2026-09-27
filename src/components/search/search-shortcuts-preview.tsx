import { Button } from "@/components/ui/button"
import { surfaceShadowClassName } from "@/components/ui/surface-shadow"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { searchShortcutGroups } from "@/lib/search-shortcuts"
import { moreShortcutIcon, searchShortcutIcons } from "./search-shortcut-icons"

export default function SearchShortcutsPreview({
  compact,
}: {
  compact: boolean
}) {
  const config = useHomeSettingsStore((state) => state.searchShortcuts)
  if (!config.controls.length) return null
  const { hidden, visible } = searchShortcutGroups(config)
  const className = compact
    ? `size-10 shrink-0 rounded-full border-border bg-card/70 bg-clip-padding backdrop-blur-xl ${surfaceShadowClassName}`
    : undefined
  const MoreIcon = moreShortcutIcon
  return (
    <div
      className={
        compact
          ? "-m-3 flex max-w-[20rem] items-center gap-2 overflow-hidden p-3"
          : "mr-auto flex max-w-[45%] items-center gap-1 overflow-hidden"
      }
    >
      {hidden.length > 0 && (
        <Button variant="ghost" size="icon" tabIndex={-1} className={className}>
          <MoreIcon className="size-5" />
        </Button>
      )}
      {visible.map((control) => {
        const Icon = searchShortcutIcons[control.action]
        return (
          <Button
            key={control.id}
            variant="ghost"
            size="icon"
            tabIndex={-1}
            className={className}
          >
            <Icon className="size-5" />
          </Button>
        )
      })}
    </div>
  )
}
