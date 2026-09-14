import { applyNetworkChoices, usePrivacyStore } from "@/stores/privacy-store"
import { reloadVisibleFavicons } from "@/lib/favicon-cache"
import { toast } from "@/stores/toast-store"
import PrivacySettings from "@/components/settings/privacy-settings"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOnboardingStore } from "@/stores/onboarding-store"

const steps: {
  title: string
  text?: string
  target?: string
}[] = [
  {
    title: "欢迎使用 Oh My Tab",
  },
  {
    target: "search",
    title: "搜索与打开结果",
    text: "输入关键词后显示本地匹配书签。可在关于中授权启用搜索联想，启用后输入关键词会发送给所选引擎的联想服务。默认搜索使用浏览器设置，也可自行选择搜索引擎。点击书签直接打开网站，点击联想词使用当前搜索引擎搜索。直接按 Enter 或点击向上箭头搜索输入内容，提交后自动清空。",
  },
  {
    target: "more",
    title: "四宫格：更多操作",
    text: "点击搜索框左侧的四宫格，展开添加标签、添加文件夹、添加组件、批量操作和深浅色模式。旁边的齿轮可直接打开设置。",
  },
  {
    target: "more",
    title: "组件：预览与添加",
    text: "在更多菜单中选择「添加组件」，或右键网格空白处打开组件窗口。选择组件预览和大小，再次点击确认添加到主页，随后可通过右键「编辑」修改内容。",
  },
  {
    target: "more",
    title: "批量操作：成组与删除",
    text: "选择「批量操作」后，点击组件进行多选；选中项会恢复动态效果并显示光晕。选中一个文件夹和若干标签时会移入该文件夹；仅标签或多个文件夹时会组成新文件夹。包含其他组件时不可成组。点击「完成」退出多选。",
  },
  {
    target: "more",
    title: "深浅色模式",
    text: "在更多菜单中点击「深浅色模式」，依次切换浅色、深色和跟随系统。当前模式显示在菜单右侧，选择会自动保存。",
  },
  {
    target: "engine",
    title: "选择搜索引擎",
    text: "点击搜索引擎名称或图标展开列表，选择后会用于后续搜索。底部的「自定义搜索引擎」可进入管理页面，添加、编辑或移除引擎。",
  },
  {
    target: "grid",
    title: "网格：拖拽与布局恢复",
    text: "拖动组件调整位置，空位会保留。宽屏最多显示五列；不同列数分别保存排版，缩放窗口后切回来会恢复。拖动标签到文件夹中心并停留可放入，展开文件夹后也可将标签拖出。",
  },
  {
    target: "grid",
    title: "右键管理与删除撤销",
    text: "右键可编辑组件内容；标签和文件夹还支持调整尺寸、随机颜色和切换动态效果，标签可刷新图标。删除需要再次确认；删除后顶部通知提供「撤销」，可恢复标签或整个文件夹，批量删除也能一次恢复。",
  },
  {
    target: "settings",
    title: "设置：按分类管理",
    text: "点击齿轮进入设置，左侧可选择常规、主页、个性化、搜索和关于。设置会自动保存，点击「关闭」回到主页。",
  },
  {
    target: "settings",
    title: "主页：电子点阵",
    text: "选择显示或隐藏点阵，并切换时间、字符、宠物或呼吸模式。字符支持英文、数字和符号，超长内容自动滚动；宠物提供各有动作的颜文字角色。点阵颗粒大小固定，列数随窗口宽度调整。",
  },
  {
    target: "settings",
    title: "个性化：主题色与燃烧",
    text: "主题色统一应用于点阵、通知和多选栏。点击色块选择预设色、自定义颜色或输入十六进制值。「燃烧幅度」调整全局强度，「过渡效果」控制入场和退出动画，页面背景可实时预览。",
  },
  {
    target: "settings",
    title: "常规：导入浏览器书签",
    text: "点击「从浏览器书签导入」旁的「导入」，首次使用时允许书签访问，即可直接读取当前浏览器书签。新书签会增量添加，重复网址自动跳过，同名文件夹合并；多级目录以路径名称保留。导入结果会在顶部通知中显示。",
  },
  {
    target: "settings",
    title: "数据管理：备份与恢复",
    text: "在「常规 → 数据」点击「备份」保存包含原图的备份。点击「恢复」选择 ZIP 或旧版文本文件，校验后确认覆盖本机数据。将多端同步方案选为 WebDAV，点击「WebDAV」的「管理」填写自己的目录，可在多台设备间手动上传、下载备份；恢复前建议先备份本机数据。",
  },
  ...(location.protocol === "chrome-extension:"
    ? [
        {
          title: "快捷收藏当前网页",
          text: "在浏览器工具栏固定 Oh My Tab 扩展。浏览其他网页时点击扩展图标，可读取当前页面标题和链接，快速添加到主页。",
        },
      ]
    : []),
  {
    target: "settings",
    title: "随时重看教程",
    text: "完成或跳过后，教程不会再次自动弹出。需要重看时，打开「设置 → 常规」，点击「重新开始教程」。",
  },
]

function Tour() {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [choices, setChoices] = useState(() => {
    const { suggestions, icons } = usePrivacyStore.getState()
    return { suggestions, icons }
  })
  async function consent(agree: boolean) {
    setBusy(true)
    try {
      const selected = agree ? choices : { suggestions: false, icons: false }
      const granted = await applyNetworkChoices(selected)
      reloadVisibleFavicons()
      if (!granted) {
        setChoices({ suggestions: false, icons: false })
        toast("未获得网站访问授权，联网服务保持关闭", "error")
        return
      }
      setChoices(selected)
      setStep(1)
    } catch {
      toast("权限更新失败，请重试", "error")
    } finally {
      setBusy(false)
    }
  }
  const [rect, setRect] = useState<DOMRect | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [bodyHeight, setBodyHeight] = useState<number>()
  const finish = useOnboardingStore((state) => state.finish)
  const current = steps[step]

  useEffect(() => {
    const target = current.target
      ? document.querySelector(`[data-tour="${current.target}"]`)
      : null
    const update = () => setRect(target?.getBoundingClientRect() ?? null)
    const frame = requestAnimationFrame(update)
    const observer = new ResizeObserver(update)
    if (target) observer.observe(target)
    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [current.target])

  useLayoutEffect(() => {
    const element = bodyRef.current
    if (!element) return
    const update = () => setBodyHeight(element.scrollHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [step, current.text, current.title])

  return (
    <>
      {rect &&
        createPortal(
          <div
            aria-hidden="true"
            className="pointer-events-none fixed z-50 rounded-xl outline-2 outline-violet-400"
            style={{
              top: rect.top - 5,
              left: rect.left - 5,
              width: rect.width + 10,
              height: rect.height + 10,
              boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.45)",
            }}
          />,
          document.body
        )}
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && !busy) finish()
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName={
            rect
              ? "bg-transparent supports-backdrop-filter:backdrop-blur-none"
              : "bg-black/45 supports-backdrop-filter:backdrop-blur-none"
          }
          className={
            step === 0
              ? "z-[60] gap-4 overflow-hidden"
              : "top-auto bottom-4 z-[60] max-h-[45svh] -translate-y-0 gap-4 overflow-hidden sm:bottom-6"
          }
        >
          <DialogHeader
            aria-live="polite"
            aria-atomic="true"
            className="flex-row items-start justify-between gap-4"
          >
            <DialogTitle className="pt-1">{current.title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              className="-mt-1 -mr-2 shrink-0"
              onClick={finish}
            >
              跳过教程
            </Button>
          </DialogHeader>
          {step === 0 ? (
            <>
              <DialogDescription className="sr-only">
                选择需要的联网服务后继续教程。
              </DialogDescription>
              <PrivacySettings
                choices={choices}
                disabled={busy}
                onChange={(feature, enabled) =>
                  setChoices((current) => ({ ...current, [feature]: enabled }))
                }
              />
              <DialogFooter>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => void consent(false)}
                >
                  不同意
                </Button>
                <Button disabled={busy} onClick={() => void consent(true)}>
                  我同意
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <div
                className="overflow-hidden transition-[height] duration-240 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={bodyHeight ? { height: bodyHeight } : undefined}
              >
                <div ref={bodyRef} className="space-y-3">
                  {current.text
                    ?.split(/(?<=。)/)
                    .filter((sentence) => sentence.trim())
                    .map((sentence, index) =>
                      index === 0 ? (
                        <DialogDescription
                          key={`${current.title}-${sentence}`}
                          className="leading-relaxed animate-in fade-in-0 duration-200 motion-reduce:animate-none"
                        >
                          {sentence}
                        </DialogDescription>
                      ) : (
                        <p
                          key={`${current.title}-${sentence}`}
                          className="text-sm leading-relaxed text-muted-foreground animate-in fade-in-0 duration-200 motion-reduce:animate-none"
                        >
                          {sentence}
                        </p>
                      )
                    )}
                </div>
              </div>
              <DialogFooter className="sm:justify-between">
                <Button
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  上一步
                </Button>
                <Button
                  onClick={() =>
                    step === steps.length - 1 ? finish() : setStep(step + 1)
                  }
                >
                  {step === steps.length - 1 ? "开始使用" : "下一步"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function OnboardingTour() {
  const seen = useOnboardingStore((state) => state.seen)
  const replay = useOnboardingStore((state) => state.replay)
  return !seen || replay ? <Tour /> : null
}
