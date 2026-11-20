import { Tabs } from "@base-ui/react/tabs"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"

export default function AppearanceTabs<T extends string>({
  label,
  options,
  value,
  onChange,
  previewId,
  hint,
  getOptionLabel,
  disabledOptions,
}: {
  label: string
  options: readonly T[]
  value: T | null
  onChange: (value: T) => void
  previewId?: string
  hint?: string
  getOptionLabel?: (option: T) => string
  disabledOptions?: readonly T[]
}) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <SettingItem label={label} labelId={id}>
      <Tabs.Root
        value={value}
        onValueChange={(next) => {
          const option = options.find((option) => option === next)
          if (option !== undefined && !disabledOptions?.includes(option))
            onChange(option)
        }}
      >
        <Tabs.List
          aria-labelledby={id}
          className={`segmented-control flex min-w-0 p-0.5 ${settingsControlSurface}`}
        >
          {options.map((option) => (
            <Tabs.Tab
              key={option}
              value={option}
              disabled={disabledOptions?.includes(option)}
              aria-controls={previewId}
              className="flex h-7 min-w-0 flex-auto items-center justify-center rounded-(--ui-radius-control) px-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-disabled:opacity-40 data-disabled:hover:text-muted-foreground data-active:bg-background data-active:text-foreground data-active:shadow-(--ui-shadow-control) dark:data-active:bg-input"
            >
              <span className="truncate">
                {getOptionLabel?.(option) ??
                  t(`settings.uiAppearance.options.${option}`)}
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </Tabs.Root>
    </SettingItem>
  )
}
