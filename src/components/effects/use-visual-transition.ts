import {
  useEffect,
  useEffectEvent,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import gsap from "gsap"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export type TransitionPhase = "hidden" | "entering" | "visible" | "exiting"
const profiles = {
  surface: { duration: 1.2, ease: "sine.inOut" },
  overlay: { duration: 0.24, ease: "power2.out" },
}
function subscribeMotion(listener: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)")
  media.addEventListener("change", listener)
  return () => media.removeEventListener("change", listener)
}
export function useVisualTransition(
  visible: boolean,
  options: {
    appear?: boolean
    profile?: keyof typeof profiles
    onUpdate?: (value: number) => void
    onHidden?: () => void
  } = {}
) {
  const enabled = useHomeSettingsStore((state) => state.transitionsEnabled)
  const reduced = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  )
  const [initial] = useState(
    visible && !(options.appear && enabled && !reduced) ? 1 : 0
  )
  const progress = useRef({ value: initial })
  const [phase, setPhase] = useState<TransitionPhase>(
    visible ? (initial ? "visible" : "entering") : "hidden"
  )
  const update = useEffectEvent((value: number) => options.onUpdate?.(value))
  const hidden = useEffectEvent(() => options.onHidden?.())
  const profile = options.profile ?? "surface"
  useEffect(() => {
    const state = progress.current
    const settings = profiles[profile]
    const tween = gsap.to(state, {
      value: visible ? 1 : 0,
      duration:
        state.value !== (visible ? 1 : 0) && enabled && !reduced
          ? settings.duration
          : 0,
      ease: settings.ease,
      onStart: () => setPhase(visible ? "entering" : "exiting"),
      onUpdate: () => update(state.value),
      onComplete: () => {
        update(state.value)
        setPhase(visible ? "visible" : "hidden")
        if (!visible) hidden()
      },
    })
    return () => {
      tween.kill()
    }
  }, [visible, enabled, reduced, profile])
  return { phase, progress, initial }
}
