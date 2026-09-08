import { useEffect, useRef } from "react"
import {
  extensionApi,
  canSelectBrowserSearch,
  usePrivacyStore,
} from "@/stores/privacy-store"
import { toast } from "@/stores/toast-store"
import Toaster from "@/components/ui/toaster"
import OnboardingTour from "@/components/onboarding/onboarding-tour"
import HomePromptInput from "@/pages/home/components/home-prompt-input"

import HomeContentContainer from "@/pages/home/components/home-content-container"

import DotMatrix from "@/components/dot-matrix/dot-matrix"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

import { useSearchEngineStore } from "@/stores/search-engine-store"
import { buildSearchUrl } from "@/lib/search-engines"

import TabGrid from "@/components/tab-grid/tab-grid"

export default function HomeUI() {
  const rootRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const onWheel = (event: WheelEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
      )
        return
      const target = event.target
      if (
        !(target instanceof Element) ||
        target.closest('[role="dialog"], [role="menu"], [role="listbox"]')
      )
        return
      const grid = root.querySelector<HTMLElement>("[data-grid-scroll]")
      if (!grid || grid.contains(target)) return
      for (
        let node: Element | null = target;
        node && node !== root;
        node = node.parentElement
      ) {
        if (
          node instanceof HTMLElement &&
          /auto|scroll/.test(getComputedStyle(node).overflowY) &&
          node.scrollHeight > node.clientHeight
        )
          return
      }
      if (grid.scrollHeight <= grid.clientHeight) return
      event.preventDefault()
      grid.scrollTop +=
        event.deltaY *
        (event.deltaMode === 1
          ? 16
          : event.deltaMode === 2
            ? grid.clientHeight
            : 1)
    }
    root.addEventListener("wheel", onWheel, { passive: false })
    return () => root.removeEventListener("wheel", onWheel)
  }, [])
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  function search(query: string) {
    if (usePrivacyStore.getState().browserSearch && canSelectBrowserSearch()) {
      const api = extensionApi()
      if (api?.search)
        void api.search
          .query({ text: query, disposition: "NEW_TAB" })
          .catch(() => toast("搜索失败，请重试", "error"))
      else toast("开发预览：已选择浏览器默认。实际搜索请在扩展中测试。")
      return
    }
    const { engines, selectedId } = useSearchEngineStore.getState()
    const engine = engines.find((item) => item.id === selectedId)
    if (!engine) return
    const url = buildSearchUrl(engine.url, query)
    if (url) window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <div
      ref={rootRef}
      className="relative z-10 flex h-dvh flex-col overflow-hidden px-6 pt-6 sm:px-10 xl:px-12"
    >
      <HomeContentContainer>
        {topComponent === "dot-matrix" && <DotMatrix />}
      </HomeContentContainer>
      <HomePromptInput onSubmit={search} />
      <TabGrid />
      <OnboardingTour />
      <Toaster />
    </div>
  )
}
