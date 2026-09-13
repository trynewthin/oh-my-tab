import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { LandingPage, PrivacyPage } from "./pages"
import "./styles.css"

const page = document.body.dataset.page

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {page === "privacy" ? <PrivacyPage /> : <LandingPage />}
  </StrictMode>
)
