import type { CSSProperties } from "react"
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
import {
  findSettingsRoute,
  settingsIcon,
  settingsNav,
  type SettingsNavNode,
} from "./settings-routes"
import { isSettingsSection, type SettingsSection } from "./settings-views"

function SettingsIcon({
  name,
  className,
}: {
  name?: string
  className?: string
}) {
  const Icon = settingsIcon(name)
  return Icon ? <Icon className={className} /> : null
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
  if (!node.children?.length) {
    return (
      <NavButton
        id={node.id}
        label={node.label}
        icon={node.icon}
        current={current}
        onSelect={onSelect}
      />
    )
  }
  return (
    <div className="space-y-1">
      <div className="px-4 py-1 text-xs font-medium text-muted-foreground">
        {node.label}
      </div>
      {node.children.map((child) => (
        <NavButton
          key={child.id}
          id={child.id}
          label={child.label}
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
  const color = useHomeSettingsStore((state) => state.color)
  return (
    <nav
      aria-label="设置分类"
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
  const current = findSettingsRoute(section)
  return (
    <Select
      value={section}
      onValueChange={(value) => {
        if (value && isSettingsSection(value)) onSelect(value)
      }}
    >
      <SelectTrigger
        aria-label="设置分类"
        className="w-full border-border bg-muted"
      >
        <SelectValue>
          <SettingsIcon name={current?.route.icon} />
          {current?.route.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent side="bottom" align="start" alignItemWithTrigger={false}>
        {settingsNav.map((node) =>
          node.children?.length ? (
            <SelectGroup key={node.id}>
              <SelectLabel>{node.label}</SelectLabel>
              {node.children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ) : (
            <SelectItem key={node.id} value={node.id}>
              <SettingsIcon name={node.icon} />
              {node.label}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  )
}
