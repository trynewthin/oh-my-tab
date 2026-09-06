import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useOnboardingStore } from "@/stores/onboarding-store"

const steps = [
  {
    target: "search",
    title: "搜索与打开结果",
    text: "按 / 聚焦搜索框，输入关键词查看收藏建议。按 ↑ ↓ 选择、Enter 打开，Esc 收起；直接按 Enter 或点击向上箭头执行搜索。打开后输入框会清空。",
  },
  {
    target: "add",
    title: "加号：添加标签或文件夹",
    text: "点击加号，选择标签或文件夹，填写名称；标签还需要网址。选择尺寸和颜色后点击保存，即可把常用网站放到主页。",
  },
  {
    target: "theme",
    title: "主题：切换页面外观",
    text: "太阳、月亮或显示器图标表示当前主题。每点击一次，会依次切换浅色、深色、跟随系统，选择会自动保存。",
  },
  {
    target: "engine",
    title: "搜索引擎：选择搜索方式",
    text: "点击搜索引擎名称展开列表，选择本次及后续搜索使用的引擎。列表底部的「自定义搜索引擎」可进入管理页面。",
  },
  {
    target: "settings",
    title: "齿轮：打开设置",
    text: "点击齿轮进入设置。左侧可以切换常规设置、主页设置和搜索引擎，点击「关闭」返回主页。",
  },
  {
    target: "settings",
    title: "主页设置：定制电子点阵",
    text: "在「主页设置」中，可以显示或隐藏顶部电子点阵，选择时间、字符、宠物或呼吸模式，并调整颜色。字符模式可输入英文、数字或符号；宠物模式可选择小猫或小狗。",
  },
  {
    target: "settings",
    title: "搜索引擎设置：添加与管理",
    text: "在「搜索引擎」中点击「添加」，填写名称和搜索地址后保存。你也可以选择使用、编辑或删除列表中的引擎。",
  },
  {
    target: "settings",
    title: "常规设置：备份与恢复",
    text: "「导出」会把配置文本复制到剪贴板。恢复时粘贴配置文本，点击「导入」，校验后点击「确认覆盖并导入」。导入会覆盖当前配置，请先备份。这里也可以再次打开新手教程。",
  },
  {
    target: "grid",
    title: "标签网格：打开、拖动与分组",
    text: "点击标签打开网站，拖动标签或文件夹调整位置。把标签拖到文件夹中心并停留可以放入；点击文件夹展开，还可以将其中的标签拖出。空白主页可先用加号添加内容。",
  },
  {
    target: "grid",
    title: "右键菜单：管理标签与文件夹",
    text: "右键点击标签或文件夹，可以调整尺寸、编辑内容、更换随机颜色和切换动态效果。标签还可刷新网站图标。点击删除后需要再次点击确认。",
  },
  {
    title: "扩展按钮：快速收藏当前网页",
    text: "在浏览器工具栏固定 Oh My Tab 扩展。浏览其他网页时点击扩展图标，可读取当前页面标题和链接，快速添加到主页。以后想重看教程，打开「设置 → 常规设置 → 新手教程」。",
  },
]

function Tour() {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
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
          if (!open) finish()
        }}
      >
        <DialogContent
          showCloseButton={false}
          overlayClassName={
            rect
              ? "bg-transparent supports-backdrop-filter:backdrop-blur-none"
              : "bg-black/45 supports-backdrop-filter:backdrop-blur-none"
          }
          className="top-auto bottom-4 z-[60] max-h-[45svh] -translate-y-0 gap-4 overflow-y-auto sm:bottom-6"
        >
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground" aria-live="polite">
              新手教程 · {step + 1} / {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={finish}>
              跳过教程
            </Button>
          </div>
          <DialogHeader aria-live="polite" aria-atomic="true">
            <DialogTitle>{current.title}</DialogTitle>
            <DialogDescription className="leading-relaxed">
              {current.text}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              disabled={step === 0}
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
          </div>
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
