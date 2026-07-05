import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const { user, loading, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/dashboard')
  }, [user, loading, navigate])

  return (
    <div className="min-h-screen bg-[#080E1C] flex items-center justify-center p-4">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#00C6EF] opacity-5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-[#FF7A00] opacity-5 blur-[100px] rounded-full" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#00C6EF]/10 border border-[#00C6EF]/20 mb-5">
            <span className="text-3xl">⛸️</span>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2"
              style={{ fontFamily: "'Arial Black', sans-serif" }}>
            SpeedSkate
            <span className="text-[#00C6EF]">Training</span>
          </h1>
          <p className="text-[#4A6888] text-sm">
            Patinaje · Bicicleta · Gym · IA Coach
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white mb-1">Ingresa a tu cuenta</h2>
            <p className="text-[#4A6888] text-sm">
              Registra tus entrenamientos, analiza tu progreso y recibe recomendaciones de tu coach IA.
            </p>
          </div>

          {/* Sport badges */}
          <div className="flex gap-2 mb-7 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/25 text-[#00C6EF]">
              ⛸️ Patinaje
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FF7A00]/10 border border-[#FF7A00]/25 text-[#FF7A00]">
              🚴 Bicicleta
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#8FCF00]/10 border border-[#8FCF00]/25 text-[#8FCF00]">
              🏋️ Gym
            </span>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/25 text-[#A78BFA]">
              🤖 IA Coach
            </span>
          </div>

          {/* Google Sign In button */}
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <p className="text-center text-[#3A5070] text-xs mt-5">
            Al ingresar aceptas los términos de uso.<br />
            Tus datos de entrenamiento son privados y seguros.
          </p>
        </div>

        {/* Features strip */}
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: '📡', label: 'NFC Automático' },
            { icon: '🗺️', label: 'Rutas GPS' },
            { icon: '📊', label: 'Analytics IA' },
          ].map(f => (
            <div key={f.label} className="bg-[#0D1A2E]/60 border border-[#152038] rounded-xl p-3">
              <div className="text-xl mb-1">{f.icon}</div>
              <div className="text-[10px] font-semibold text-[#4A6888] uppercase tracking-wide">{f.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
