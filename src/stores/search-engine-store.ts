import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
  defaultSearchEngines,
  isSearchUrl,
  isPresetEngine,
  type SearchEngine,
} from "@/lib/search-engines"

type SearchEngineState = {
  engines: SearchEngine[]
  selectedId: string
  selectEngine: (id: string) => void
  addPreset: (id: string) => void
  saveEngine: (engine: SearchEngine) => void
  removeEngine: (id: string) => void
}

export const useSearchEngineStore = create<SearchEngineState>()(
  persist(
    (set) => ({
      engines: defaultSearchEngines.filter((engine) =>
        ["google", "bing", "bingcn"].includes(engine.id)
      ),
      selectedId: "google",
      selectEngine: (id) =>
        set((state) =>
          state.engines.some((engine) => engine.id === id)
            ? { selectedId: id }
            : state
        ),
      addPreset: (id) =>
        set((state) => {
          const preset = defaultSearchEngines.find((engine) => engine.id === id)
          if (!preset || state.engines.some((engine) => engine.id === id))
            return state
          return { engines: [...state.engines, preset] }
        }),
      saveEngine: (engine) => {
        if (isPresetEngine(engine.id)) return
        set((state) => ({
          engines: state.engines.some((item) => item.id === engine.id)
            ? state.engines.map((item) =>
                item.id === engine.id ? engine : item
              )
            : [...state.engines, engine],
        }))
      },
      removeEngine: (id) =>
        set((state) => {
          const engines = state.engines.filter((engine) => engine.id !== id)
          if (!engines.length) return state
          return {
            engines,
            selectedId:
              state.selectedId === id ? engines[0].id : state.selectedId,
          }
        }),
    }),
    {
      name: "omt.search-engines",
      partialize: ({ engines, selectedId }) => ({ engines, selectedId }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<SearchEngineState> | undefined
        const storedEngines = saved?.engines
        if (
          !Array.isArray(storedEngines) ||
          !storedEngines.length ||
          !storedEngines.every(
            (engine) =>
              engine &&
              typeof engine.id === "string" &&
              typeof engine.name === "string" &&
              typeof engine.url === "string" &&
              isSearchUrl(engine.url) &&
              (engine.icon === undefined ||
                defaultSearchEngines.some(
                  (preset) => preset.icon === engine.icon
                ))
          )
        )
          return current
        const engines = storedEngines.map(
          (engine) =>
            defaultSearchEngines.find((preset) => preset.id === engine.id) ??
            engine
        )
        return {
          ...current,
          engines,
          selectedId: engines.some((engine) => engine.id === saved?.selectedId)
            ? saved!.selectedId!
            : engines[0].id,
        }
      },
    }
  )
)
