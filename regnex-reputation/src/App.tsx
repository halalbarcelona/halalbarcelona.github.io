import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Login } from "@/pages/Login";
import { Dashboard } from "@/pages/Dashboard";
import { Reviews } from "@/pages/Reviews";
import { Alerts } from "@/pages/Alerts";
import { Insights } from "@/pages/Insights";
import { WeeklyReport } from "@/pages/WeeklyReport";
import { Notifications } from "@/pages/Notifications";
import { Settings } from "@/pages/Settings";
import { NotFound } from "@/pages/NotFound";

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter basename="/regnex-reputation">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/resenas" element={<Reviews />} />
            <Route path="/alertas" element={<Alerts />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/informe-semanal" element={<WeeklyReport />} />
            <Route path="/notificaciones" element={<Notifications />} />
            <Route path="/configuracion" element={<Settings />} />
          </Route>
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
