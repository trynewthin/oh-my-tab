import SearchShortcuts from "./search-shortcuts"

export default function SearchShortcutsPreview({
  compact,
}: {
  compact: boolean
}) {
  return <SearchShortcuts compact={compact} preview />
}
