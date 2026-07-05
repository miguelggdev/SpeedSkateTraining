import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import ProtectedRoute from "@/components/ProtectedRoute"
import AppLayout from "@/components/AppLayout"
import Login from "@/pages/Login"
import Dashboard from "@/pages/Dashboard"
import NotFound from "@/pages/NotFound"
import Placeholder from "@/pages/Placeholder"
import NewSession from "@/pages/NewSession"
import Sessions from "@/pages/Sessions"
import NfcSetup from "@/pages/NfcSetup"
import Routes from "@/pages/Routes"
import LiveSession from "@/pages/LiveSession"
import AiCoach from "@/pages/AiCoach"
import Settings from "@/pages/Settings"

const queryClient = new QueryClient()

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route path="/dashboard" element={
            <ProtectedLayout><Dashboard /></ProtectedLayout>
          } />
          <Route path="/sessions" element={
            <ProtectedLayout><Sessions /></ProtectedLayout>
          } />
          <Route path="/sessions/new" element={
            <ProtectedLayout><NewSession /></ProtectedLayout>
          } />
          <Route path="/routes" element={
            <ProtectedLayout><Routes /></ProtectedLayout>
          } />
          <Route path="/live-session" element={
            <ProtectedLayout><LiveSession /></ProtectedLayout>
          } />
          <Route path="/gym" element={
            <ProtectedLayout>
              <Placeholder icon="🏋️" title="Gym" description="Registro de sesiones de fuerza con ejercicios, series, repeticiones y carga." />
            </ProtectedLayout>
          } />
          <Route path="/wellness" element={
            <ProtectedLayout>
              <Placeholder icon="❤️" title="Bienestar Diario" description="Registra tu sueño, nivel de fatiga, hidratación y estado de ánimo cada día." />
            </ProtectedLayout>
          } />
          <Route path="/goals" element={
            <ProtectedLayout>
              <Placeholder icon="🎯" title="Metas" description="Define y sigue tus objetivos de distancia, tiempo, velocidad y sesiones." />
            </ProtectedLayout>
          } />
          <Route path="/achievements" element={
            <ProtectedLayout>
              <Placeholder icon="🏆" title="Logros" description="Badges y reconocimientos desbloqueados por tus hitos de entrenamiento." />
            </ProtectedLayout>
          } />
          <Route path="/ai-coach" element={
            <ProtectedLayout><AiCoach /></ProtectedLayout>
          } />
          <Route path="/nfc" element={
            <ProtectedLayout><NfcSetup /></ProtectedLayout>
          } />
          <Route path="/settings" element={
            <ProtectedLayout><Settings /></ProtectedLayout>
          } />

          <Route path="/index" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
