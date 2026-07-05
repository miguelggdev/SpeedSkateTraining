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
            <ProtectedLayout>
              <Placeholder icon="⛸️" title="Sesiones" description="Historial completo de todos tus entrenamientos de patinaje, bicicleta y gym." />
            </ProtectedLayout>
          } />
          <Route path="/sessions/new" element={
            <ProtectedLayout>
              <Placeholder icon="➕" title="Nueva Sesión" description="Registra una sesión de patinaje, bicicleta o gym con todos sus detalles." />
            </ProtectedLayout>
          } />
          <Route path="/routes" element={
            <ProtectedLayout>
              <Placeholder icon="🗺️" title="Rutas GPS" description="Visualiza tus recorridos de bicicleta y patinaje en ruta abierta con mapa interactivo." />
            </ProtectedLayout>
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
            <ProtectedLayout>
              <Placeholder icon="🤖" title="Coach IA" description="Agente inteligente que analiza tu progreso y genera recomendaciones personalizadas." />
            </ProtectedLayout>
          } />
          <Route path="/nfc" element={
            <ProtectedLayout>
              <Placeholder icon="📡" title="Configurar NFC" description="Registra los tags NFC de tus cascos para inicio automático de sesiones." />
            </ProtectedLayout>
          } />
          <Route path="/settings" element={
            <ProtectedLayout>
              <Placeholder icon="⚙️" title="Configuración" description="Perfil, Google Fit, notificaciones y preferencias de la app." />
            </ProtectedLayout>
          } />

          <Route path="/index" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
