import { reloadVisibleFavicons } from "@/lib/favicon-cache"
import { useState } from "react"
import {
  setNetworkFeature,
  usePrivacyStore,
  type NetworkFeature,
} from "@/stores/privacy-store"
import { toast } from "@/stores/toast-store"
import { Checkbox } from "@/components/ui/checkbox"

export type NetworkChoices = { suggestions: boolean; icons: boolean }

type PrivacySettingsProps = {
  choices?: NetworkChoices
  onChange?: (feature: NetworkFeature, enabled: boolean) => void
  disabled?: boolean
}

export default function PrivacySettings({
  choices,
  onChange,
  disabled = false,
}: PrivacySettingsProps = {}) {
  const settings = usePrivacyStore()
  const [busy, setBusy] = useState(false)
  async function toggle(feature: NetworkFeature, enabled: boolean) {
    if (onChange) {
      onChange(feature, enabled)
      return
    }
    setBusy(true)
    try {
      if (!(await setNetworkFeature(feature, enabled)))
        toast("未获得网站访问授权，功能保持关闭", "error")
      else if (feature === "icons") reloadVisibleFavicons()
    } catch {
      toast("权限更新失败，请重试", "error")
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3 rounded-2xl border p-4">
      <h3 className="text-sm font-medium">隐私与联网服务</h3>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox
          checked={choices?.suggestions ?? settings.suggestions}
          disabled={busy || disabled}
          className="mt-0.5"
          onCheckedChange={(checked) => void toggle("suggestions", checked)}
        />
        <span>
          启用搜索联想
          <span className="block text-xs text-muted-foreground">
            输入关键词将发送给当前选择的
            Google、Bing、DuckDuckGo、Yahoo、Brave、Ecosia 或 Yandex
            联想服务。浏览器默认、Startpage 和自定义引擎仅匹配本地书签。
          </span>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <Checkbox
          checked={choices?.icons ?? settings.icons}
          disabled={busy || disabled}
          className="mt-0.5"
          onCheckedChange={(checked) => void toggle("icons", checked)}
        />
        <span>
          下载网站图标
          <span className="block text-xs text-muted-foreground">
            将书签域名发送给 Favicon.im，失败时发送给
            DuckDuckGo；服务会收到网络请求及 IP 地址。关闭后保留已缓存图标。
          </span>
        </span>
      </label>
      <a
        className="block text-right text-sm underline"
        href="https://ohmytab.vercel.app/privacy"
        target="_blank"
        rel="noreferrer"
      >
        隐私政策与数据删除说明
      </a>
    </div>
  )
}
