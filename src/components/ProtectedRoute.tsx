import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080E1C] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl animate-pulse">⛸️</span>
          <div className="text-[#4A6888] text-sm font-medium">Cargando...</div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/" replace />

  return <>{children}</>
}
