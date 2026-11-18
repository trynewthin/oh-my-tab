import HomeBackground from "@/pages/home/components/home-background"
import HomeUI from "@/pages/home/components/home-ui"

export default function HomePage() {
  return (
    <main data-home-ui className="relative isolate min-h-svh">
      <HomeBackground />
      <HomeUI />
    </main>
  )
}
