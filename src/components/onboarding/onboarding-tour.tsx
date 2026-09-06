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
    text: "输入关键词后，上方显示匹配书签，下方显示实时联想。点击书签直接打开网站，点击联想词使用当前搜索引擎搜索。直接按 Enter 或点击向上箭头搜索输入内容，提交后自动清空。",
  },
  {
    target: "more",
    title: "四宫格：更多操作",
    text: "点击搜索框左侧的四宫格，展开添加组件、批量操作和深浅色模式。旁边的齿轮可直接打开设置。",
  },
  {
    target: "more",
    title: "组件：预览、配置与添加",
    text: "在更多菜单中选择「添加组件」，或右键网格空白处打开组件窗口。点击标签或文件夹预览，填写名称、网址等配置，选择大小与颜色，最后点击「确认添加」。",
  },
  {
    target: "more",
    title: "批量操作：成组与删除",
    text: "选择「批量操作」后，点击组件进行多选；选中项会恢复动态效果并显示光晕。底部工具栏支持全选、成组和删除。成组会将选中标签及文件夹内书签合入新文件夹，点击「完成」退出多选。",
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
    text: "右键组件可调整尺寸、编辑内容、随机颜色和切换动态效果，标签还可刷新图标。删除需要再次确认；删除后顶部通知提供「撤销」，可恢复标签或整个文件夹，批量删除也能一次恢复。",
  },
  {
    target: "settings",
    title: "设置：按分类管理",
    text: "点击齿轮进入设置，左侧可选择常规设置、主页设置、个性化和搜索引擎。设置会自动保存，点击「关闭」回到主页。",
  },
  {
    target: "settings",
    title: "主页设置：电子点阵",
    text: "选择显示或隐藏点阵，并切换时间、字符、宠物或呼吸模式。字符支持英文、数字和符号，超长内容自动滚动；宠物提供各有动作的颜文字角色。点阵颗粒大小固定，列数随窗口宽度调整。",
  },
  {
    target: "settings",
    title: "个性化：主题色与燃烧",
    text: "主题色统一应用于点阵、通知和多选栏。点击色块选择预设色、自定义颜色或输入十六进制值。「燃烧幅度」调整全局强度，「过渡效果」控制入场和退出动画，页面背景可实时预览。",
  },
  {
    target: "settings",
    title: "常规设置：导入浏览器书签",
    text: "点击「导入书签 HTML」，选择浏览器导出的书签文件。新书签会增量添加，重复网址自动跳过，同名文件夹合并；多级目录以路径名称保留。导入结果会在顶部通知中显示。",
  },
  {
    target: "settings",
    title: "配置管理：备份与恢复",
    text: "「导出」将配置复制到剪贴板。恢复时在输入区点击「粘贴」或直接粘贴文本，点击「导入」校验，再点击「确认覆盖并导入」恢复配置。此操作会覆盖现有配置，请先备份；「清除」仅清空输入区。",
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
    text: "完成或跳过后，教程不会再次自动弹出。需要重看时，打开「设置 → 常规设置」，点击「重新开始教程」。",
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
