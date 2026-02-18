import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/layouts/app-layout";
import { LandingPage } from "@/pages/landing";
import { RegisterPage } from "@/pages/register";
import { AdminPanelPage } from "@/pages/admin-panel";

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/admin" element={<AdminPanelPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
