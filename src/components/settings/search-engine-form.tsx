import { toast } from "@/stores/toast-store"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { isSearchUrl, type SearchEngine } from "@/lib/search-engines"
import { useSearchEngineStore } from "@/stores/search-engine-store"

export default function SearchEngineForm({
  engine,
  onClose,
  inDialog = false,
}: {
  engine: SearchEngine
  onClose: () => void
  inDialog?: boolean
}) {
  const [name, setName] = useState(engine.name)
  const [url, setUrl] = useState(engine.url)
  const saveEngine = useSearchEngineStore((state) => state.saveEngine)

  function save(event: FormEvent) {
    event.preventDefault()
    if (!name.trim() || !isSearchUrl(url.trim())) {
      toast("请输入名称，以及包含 {query} 的 http / https 搜索地址。", "error")
      return
    }
    saveEngine({ ...engine, name: name.trim(), url: url.trim() })
    onClose()
  }

  return (
    <form
      className={inDialog ? "space-y-4" : "space-y-4 rounded-2xl border p-4"}
      onSubmit={save}
    >
      {!inDialog && (
        <h3 className="text-sm font-medium">
          {engine.name ? "编辑搜索引擎" : "添加搜索引擎"}
        </h3>
      )}
      <label className="grid gap-2 text-sm">
        名称
        <Input
          autoFocus
          required
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="例如 DuckDuckGo"
        />
      </label>
      <label className="grid gap-2 text-sm">
        搜索地址
        <Input
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://duckduckgo.com/?q={query}"
          aria-describedby="search-url-hint"
        />
      </label>
      <p id="search-url-hint" className="text-xs text-muted-foreground">
        用 {"{query}"} 表示搜索关键词。
      </p>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  )
}
