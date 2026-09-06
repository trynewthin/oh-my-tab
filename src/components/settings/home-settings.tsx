import { matrixPets, isMatrixPet } from "@/components/dot-matrix/pet-catalog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function HomeSettings() {
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  const content = useHomeSettingsStore((state) => state.content)
  const text = useHomeSettingsStore((state) => state.text)
  const pet = useHomeSettingsStore((state) => state.pet)
  const setTopComponent = useHomeSettingsStore((state) => state.setTopComponent)
  const setContent = useHomeSettingsStore((state) => state.setContent)
  const setText = useHomeSettingsStore((state) => state.setText)
  const setPet = useHomeSettingsStore((state) => state.setPet)

  return (
    <section className="space-y-6" aria-labelledby="home-settings-title">
      <h2 id="home-settings-title" className="text-base font-medium">
        主页设置
      </h2>
      <div className="space-y-5">
        <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <label htmlFor="home-top-component" className="text-sm">
            顶部显示的组件
          </label>
          <Select
            value={topComponent}
            onValueChange={(value) => {
              if (value === "none" || value === "dot-matrix")
                setTopComponent(value)
            }}
          >
            <SelectTrigger id="home-top-component" className="w-full min-w-0">
              <SelectValue>
                {topComponent === "none" ? "不显示" : "电子点阵"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">不显示</SelectItem>
              <SelectItem value="dot-matrix">电子点阵</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {topComponent === "dot-matrix" && (
          <>
            <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
              <label htmlFor="matrix-content" className="text-sm">
                点阵显示内容
              </label>
              <Select
                value={content}
                onValueChange={(value) => {
                  if (
                    value === "time" ||
                    value === "text" ||
                    value === "pet" ||
                    value === "breathing"
                  )
                    setContent(value)
                }}
              >
                <SelectTrigger id="matrix-content" className="w-full min-w-0">
                  <SelectValue>
                    {
                      {
                        time: "时间",
                        text: "字符",
                        pet: "宠物",
                        breathing: "呼吸",
                      }[content]
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="time">时间</SelectItem>
                  <SelectItem value="text">字符</SelectItem>
                  <SelectItem value="pet">宠物</SelectItem>
                  <SelectItem value="breathing">呼吸</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {content === "text" && (
              <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <label htmlFor="matrix-text" className="text-sm">
                  显示字符
                </label>
                <Input
                  id="matrix-text"
                  className="min-w-0"
                  value={text}
                  maxLength={80}
                  placeholder="英文、数字或符号"
                  onChange={(event) => setText(event.target.value)}
                />
              </div>
            )}
            {content === "pet" && (
              <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
                <label htmlFor="matrix-pet" className="text-sm">
                  宠物
                </label>
                <Select
                  value={pet}
                  onValueChange={(value) => {
                    if (isMatrixPet(value)) setPet(value)
                  }}
                >
                  <SelectTrigger id="matrix-pet" className="w-full min-w-0">
                    <SelectValue>
                      {matrixPets.find((item) => item.id === pet)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {matrixPets.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
