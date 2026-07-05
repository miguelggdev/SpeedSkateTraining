import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard, Activity, Map, Dumbbell, Heart,
  Target, Trophy, Bot, Settings, LogOut, Menu, X,
  Bike, ChevronRight, Users, TrendingUp
} from 'lucide-react'

const athleteNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/sessions', icon: Activity, label: 'Sesiones' },
  { to: '/routes', icon: Map, label: 'Rutas GPS' },
  { to: '/gym', icon: Dumbbell, label: 'Gym' },
  { to: '/wellness', icon: Heart, label: 'Bienestar' },
  { to: '/goals', icon: Target, label: 'Metas' },
  { to: '/achievements', icon: Trophy, label: 'Logros' },
  { to: '/ai-coach', icon: Bot, label: 'Coach IA' },
]

const coachNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/coach', icon: Users, label: 'Mis atletas' },
  { to: '/coach/compare', icon: TrendingUp, label: 'Comparativa' },
  { to: '/sessions', icon: Activity, label: 'Mis sesiones' },
  { to: '/ai-coach', icon: Bot, label: 'Coach IA' },
]

const sportColors: Record<string, string> = {
  skating: '#00C6EF',
  cycling: '#FF7A00',
  gym: '#8FCF00',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="flex h-screen bg-[#080E1C] text-white overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-60 bg-[#0D1A2E] border-r border-[#152038]
        flex flex-col transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:static lg:translate-x-0
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-[#152038]">
          <div className="w-8 h-8 rounded-lg bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center text-base">
            ⛸️
          </div>
          <div>
            <div className="text-sm font-black tracking-tight" style={{ fontFamily: "'Arial Black', sans-serif" }}>
              SpeedSkate
            </div>
            <div className="text-[10px] text-[#00C6EF] font-semibold tracking-wider uppercase">
              Training
            </div>
          </div>
          <button
            className="ml-auto lg:hidden text-[#4A6888] hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {(profile?.role === 'coach' || profile?.role === 'admin' ? coachNav : athleteNav).map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 group
                ${isActive
                  ? 'bg-[#00C6EF]/10 text-[#00C6EF] border border-[#00C6EF]/20'
                  : 'text-[#5A76A0] hover:text-white hover:bg-white/5'
                }`
              }
            >
              <Icon size={16} />
              {label}
              <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
            </NavLink>
          ))}
        </nav>

        {/* Sport quick stats */}
        <div className="px-3 pb-3">
          <div className="bg-[#060D1A] border border-[#152038] rounded-xl p-3">
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#3A5070] mb-2">Esta semana</div>
            <div className="space-y-1.5">
              {[
                { sport: 'skating', icon: '⛸️', label: 'Patinaje', value: '—' },
                { sport: 'cycling', icon: '🚴', label: 'Bicicleta', value: '—' },
                { sport: 'gym', icon: '🏋️', label: 'Gym', value: '—' },
              ].map(s => (
                <div key={s.sport} className="flex items-center gap-2">
                  <span className="text-xs">{s.icon}</span>
                  <span className="text-[11px] text-[#4A6888]">{s.label}</span>
                  <span
                    className="ml-auto text-[11px] font-mono font-semibold"
                    style={{ color: sportColors[s.sport] }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User / Settings */}
        <div className="border-t border-[#152038] p-3 space-y-0.5">
          <NavLink
            to="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#5A76A0] hover:text-white hover:bg-white/5 transition-all"
          >
            <Settings size={16} />
            Configuración
          </NavLink>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#5A76A0] hover:text-[#E84A5F] hover:bg-[#E84A5F]/5 transition-all"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>

          {/* Profile chip */}
          <div className="flex items-center gap-3 px-3 py-2 mt-1 rounded-lg bg-[#060D1A] border border-[#152038]">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#00C6EF]/20 flex items-center justify-center text-[11px] font-bold text-[#00C6EF]">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold text-white truncate">
                {profile?.full_name ?? 'Atleta'}
              </div>
              <div className="text-[10px] text-[#3A5070] capitalize">
                {profile?.category ?? profile?.role ?? 'atleta'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#0D1A2E] border-b border-[#152038]">
          <button onClick={() => setSidebarOpen(true)} className="text-[#5A76A0] hover:text-white">
            <Menu size={20} />
          </button>
          <span className="font-black text-sm" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            SpeedSkate<span className="text-[#00C6EF]">Training</span>
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
