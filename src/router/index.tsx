import { HashRouter, Navigate, Route, Routes } from "react-router"

import RootLayout from "@/layouts/root-layout"
import HomePage from "@/pages/home"

export default function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
