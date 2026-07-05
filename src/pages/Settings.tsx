import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { CheckCircle, ExternalLink, RefreshCw, User, Activity, Bell, Palette } from 'lucide-react'
import { toast } from 'sonner'

const GFIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.location.read',
].join(' ')

export default function Settings() {
  const { user, profile } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [tab, setTab] = useState<'profile' | 'integrations' | 'notifications'>('profile')

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    weight_kg: profile?.weight_kg ?? '',
    height_cm: profile?.height_cm ?? '',
    birth_date: profile?.birth_date ?? '',
    category: profile?.category ?? 'velocista',
    years_practice: profile?.years_practice ?? '',
    skate_club: profile?.skate_club ?? '',
    hr_max: profile?.hr_max ?? '',
    instagram_handle: profile?.instagram_handle ?? '',
  })

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      full_name: form.full_name || null,
      phone: form.phone || null,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      birth_date: form.birth_date || null,
      category: form.category as any,
      years_practice: form.years_practice ? Number(form.years_practice) : null,
      skate_club: form.skate_club || null,
      hr_max: form.hr_max ? Number(form.hr_max) : null,
      instagram_handle: form.instagram_handle || null,
      updated_at: new Date().toISOString(),
    }).eq('id', user.id)
    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado')
  }

  async function connectGoogleFit() {
    setSyncing(true)
    // Google Fit OAuth2 — opens Google consent screen
    // After auth, tokens are stored and sync happens from the backend
    const clientId = import.meta.env.VITE_GFIT_CLIENT_ID
    if (!clientId) {
      toast.error('Configura VITE_GFIT_CLIENT_ID en .env')
      setSyncing(false)
      return
    }
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: `${window.location.origin}/settings?gfit=callback`,
      response_type: 'code',
      scope: GFIT_SCOPES,
      access_type: 'offline',
      prompt: 'consent',
      state: user!.id,
    })
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  }

  const inputCls = "w-full bg-[#080E1C] border border-[#152038] text-white text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#00C6EF]/50 placeholder:text-[#2A3A55]"
  const labelCls = "block text-[11px] font-bold uppercase tracking-wider text-[#3A5070] mb-1.5"

  const tabs = [
    { key: 'profile',       label: 'Perfil',        icon: User },
    { key: 'integrations',  label: 'Integraciones', icon: Activity },
    { key: 'notifications', label: 'Notif.',         icon: Bell },
  ] as const

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
        Configuración
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D1A2E] border border-[#152038] rounded-xl p-1">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all"
            style={tab === t.key
              ? { background: '#00C6EF18', color: '#00C6EF', border: '1px solid #00C6EF30' }
              : { color: '#4A6888' }
            }
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#3A5070]">Información personal</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre completo</label>
                <input className={inputCls} value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Tu nombre" />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+57 300..." />
              </div>
              <div>
                <label className={labelCls}>Fecha de nacimiento</label>
                <input type="date" className={inputCls} value={form.birth_date}
                  onChange={e => setForm(f => ({ ...f, birth_date: e.target.value }))} />
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <select className={inputCls} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="velocista">Velocista</option>
                  <option value="fondista">Fondista</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4 space-y-4">
            <div className="text-xs font-bold uppercase tracking-widest text-[#3A5070]">Datos físicos & deportivos</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: 'weight_kg',  label: 'Peso (kg)',   placeholder: '70' },
                { key: 'height_cm',  label: 'Talla (cm)',  placeholder: '175' },
                { key: 'hr_max',     label: 'FC Máx',      placeholder: '195' },
                { key: 'years_practice', label: 'Años patinando', placeholder: '3' },
              ].map(f => (
                <div key={f.key}>
                  <label className={labelCls}>{f.label}</label>
                  <input type="number" className={inputCls} value={(form as any)[f.key]}
                    placeholder={f.placeholder}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Club / Equipo</label>
                <input className={inputCls} value={form.skate_club}
                  onChange={e => setForm(f => ({ ...f, skate_club: e.target.value }))} placeholder="Club Velocidad..." />
              </div>
              <div>
                <label className={labelCls}>Instagram</label>
                <input className={inputCls} value={form.instagram_handle}
                  onChange={e => setForm(f => ({ ...f, instagram_handle: e.target.value }))} placeholder="@usuario" />
              </div>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-sm py-3 rounded-xl transition-all active:scale-95">
            Guardar cambios
          </button>
        </form>
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="space-y-3">
          {/* Google Fit */}
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-[#152038] flex items-center justify-center flex-shrink-0 text-2xl">
                🏃
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">Google Fit</span>
                  {profile?.gfit_connected ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C48C] bg-[#00C48C]/10 border border-[#00C48C]/20 px-2 py-0.5 rounded-full">
                      <CheckCircle size={10} /> Conectado
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-[#4A6888] bg-[#152038] px-2 py-0.5 rounded-full">
                      No conectado
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#4A6888] mb-3">
                  Sincroniza frecuencia cardíaca, calorías, cadencia y datos de actividad desde Google Fit automáticamente después de cada sesión.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={connectGoogleFit}
                    disabled={syncing}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-[#152038] text-white text-xs font-bold px-3 py-2 rounded-lg transition-all"
                  >
                    <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                    {profile?.gfit_connected ? 'Re-conectar' : 'Conectar Google Fit'}
                  </button>
                  <a href="https://developers.google.com/fit/rest/v1/get-started" target="_blank" rel="noreferrer"
                     className="flex items-center gap-1 text-[#00C6EF] text-xs hover:underline">
                    <ExternalLink size={11} /> Docs
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* NFC */}
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center flex-shrink-0 text-2xl">
                📡
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm mb-1">Tags NFC</div>
                <p className="text-xs text-[#4A6888] mb-3">
                  Registra los tags NFC de tus cascos para iniciar sesiones automáticamente al acercar el teléfono.
                </p>
                <a href="/nfc"
                   className="inline-flex items-center gap-1.5 bg-[#00C6EF]/10 hover:bg-[#00C6EF]/20 border border-[#00C6EF]/25 text-[#00C6EF] text-xs font-bold px-3 py-2 rounded-lg transition-all">
                  Gestionar tags NFC →
                </a>
              </div>
            </div>
          </div>

          {/* API */}
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center flex-shrink-0 text-2xl">
                🔌
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm mb-1">API REST</div>
                <p className="text-xs text-[#4A6888] mb-3">
                  Accede a los datos de entrenamiento desde otras apps via API. Swagger disponible en el servidor backend.
                </p>
                <a href={`${import.meta.env.VITE_API_URL ?? 'https://api.skate.arkanatech.tech'}/docs`}
                   target="_blank" rel="noreferrer"
                   className="inline-flex items-center gap-1.5 bg-[#A78BFA]/10 hover:bg-[#A78BFA]/20 border border-[#A78BFA]/25 text-[#A78BFA] text-xs font-bold px-3 py-2 rounded-lg transition-all">
                  <ExternalLink size={11} /> Ver Swagger docs
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === 'notifications' && (
        <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 space-y-4">
          <div className="text-xs font-bold uppercase tracking-widest text-[#3A5070]">Preferencias de notificaciones</div>
          {[
            { label: 'Reporte semanal del Coach IA', sub: 'Resumen de entrenamiento cada lunes', enabled: true },
            { label: 'Recordatorio de sesión', sub: 'Aviso cuando llevas 2 días sin entrenar', enabled: false },
            { label: 'Metas alcanzadas', sub: 'Notificación al superar objetivos', enabled: true },
            { label: 'Sesión iniciada por NFC', sub: 'Confirmación cuando un tag inicia sesión', enabled: true },
          ].map(n => (
            <div key={n.label} className="flex items-start justify-between gap-4 py-2 border-b border-[#152038] last:border-0">
              <div>
                <div className="text-sm font-semibold text-white">{n.label}</div>
                <div className="text-xs text-[#3A5070] mt-0.5">{n.sub}</div>
              </div>
              <div className="flex-shrink-0">
                <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${n.enabled ? 'bg-[#00C6EF]' : 'bg-[#152038]'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-[#2A3A55]">Las notificaciones push requieren aceptar permisos del navegador.</p>
        </div>
      )}
    </div>
  )
}
