import { createElement, type CSSProperties } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"
import {
  findSettingsRoute,
  settingsIcon,
  settingsNav,
  type SettingsNavNode,
} from "./settings-routes"
import { isSettingsSection, type SettingsSection } from "@/lib/settings-sections"

function SettingsIcon({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  const icon = settingsIcon(name)
  if (!icon) return null
  return createElement(icon, { className })
}

function NavButton({
  id,
  label,
  icon,
  current,
  onSelect,
}: {
  id: string
  label: string
  icon?: string
  current: string
  onSelect: (id: SettingsSection) => void
}) {
  const selected = current === id
  return (
    <Button
      variant="ghost"
      className="w-full justify-start rounded-none rounded-r-full px-4 text-sm hover:bg-[color-mix(in_srgb,var(--settings-accent)_12%,transparent)] dark:hover:bg-[color-mix(in_srgb,var(--settings-accent)_12%,transparent)]"
      style={
        selected
          ? {
              backgroundColor:
                "color-mix(in srgb, var(--settings-accent) 22%, transparent)",
              color: "var(--settings-accent)",
            }
          : undefined
      }
      aria-current={selected ? "page" : undefined}
      onClick={() => {
        if (isSettingsSection(id)) onSelect(id)
      }}
    >
      <SettingsIcon name={icon} />
      {label}
    </Button>
  )
}

function NavGroup({
  node,
  current,
  onSelect,
}: {
  node: SettingsNavNode
  current: string
  onSelect: (id: SettingsSection) => void
}) {
  const { t } = useTranslation()
  if (!node.children?.length) {
    return (
      <NavButton
        id={node.id}
        label={t(node.labelKey)}
        icon={node.icon}
        current={current}
        onSelect={onSelect}
      />
    )
  }
  return (
    <div className="space-y-1">
      <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
        {t(node.labelKey)}
      </div>
      {node.children.map((child) => (
        <NavButton
          key={child.id}
          id={child.id}
          label={t(child.labelKey)}
          current={current}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

export function SettingsSidebar({
  section,
  onSelect,
}: {
  section: SettingsSection
  onSelect: (id: SettingsSection) => void
}) {
  const { t } = useTranslation()
  const color = useHomeSettingsStore((state) => state.color)
  return (
    <nav
      aria-label={t("settings.sidebar.categoriesAria")}
      className="space-y-4"
      style={{ "--settings-accent": color } as CSSProperties}
    >
      {settingsNav.map((node) => (
        <NavGroup
          key={node.id}
          node={node}
          current={section}
          onSelect={onSelect}
        />
      ))}
    </nav>
  )
}

export function SettingsSectionSelect({
  section,
  onSelect,
}: {
  section: SettingsSection
  onSelect: (id: SettingsSection) => void
}) {
  const { t } = useTranslation()
  const current = findSettingsRoute(section)
  return (
    <Select
      value={section}
      onValueChange={(value) => {
        if (value && isSettingsSection(value)) onSelect(value)
      }}
    >
      <SelectTrigger
        aria-label={t("settings.sidebar.categoriesAria")}
        className="w-full border-border bg-muted"
      >
        <SelectValue>
          <SettingsIcon name={current?.route.icon} />
          {current && t(current.route.labelKey)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
        {settingsNav.map((node) =>
          node.children?.length ? (
            <SelectGroup key={node.id}>
              <SelectLabel>{t(node.labelKey)}</SelectLabel>
              {node.children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {t(child.labelKey)}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : (
            <SelectItem key={node.id} value={node.id}>
              <SettingsIcon name={node.icon} />
              {t(node.labelKey)}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  )
}
