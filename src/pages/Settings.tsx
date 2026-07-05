import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { CheckCircle, ExternalLink, RefreshCw, User, Activity, Bell, Camera, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { getWsCategory } from '@/hooks/usePersonalBests'

const GFIT_SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
  'https://www.googleapis.com/auth/fitness.location.read',
].join(' ')

export default function Settings() {
  const { user, profile } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [tab, setTab] = useState<'profile' | 'physical' | 'integrations' | 'notifications'>('profile')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    full_name:       profile?.full_name ?? '',
    phone:           profile?.phone ?? '',
    birth_date:      profile?.birth_date ?? '',
    gender:          profile?.gender ?? '',
    category:        profile?.category ?? 'velocista',
    years_practice:  String(profile?.years_practice ?? ''),
    skate_club:      profile?.skate_club ?? '',
    instagram_handle:profile?.instagram_handle ?? '',
    strava_link:     profile?.strava_link ?? '',
    // Physical
    weight_kg:       String(profile?.weight_kg ?? ''),
    height_cm:       String(profile?.height_cm ?? ''),
    hr_max:          String(profile?.hr_max ?? ''),
    hr_zone2_top:    String(profile?.hr_zone2_top ?? ''),
    hr_zone3_top:    String(profile?.hr_zone3_top ?? ''),
    hr_zone4_top:    String(profile?.hr_zone4_top ?? ''),
  })

  function set(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // Auto-compute HR zones from hr_max (60-70%, 70-80%, 80-90%)
  function computeZones(hrMax: number) {
    setForm(prev => ({
      ...prev,
      hr_zone2_top: String(Math.round(hrMax * 0.70)),
      hr_zone3_top: String(Math.round(hrMax * 0.80)),
      hr_zone4_top: String(Math.round(hrMax * 0.90)),
    }))
  }

  async function uploadAvatar(file: File) {
    if (!user) return
    setUploadingAvatar(true)
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
    if (upErr) { toast.error('Error subiendo imagen'); setUploadingAvatar(false); return }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    const url = data.publicUrl
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
    setAvatarUrl(url)
    setUploadingAvatar(false)
    toast.success('Foto actualizada ✓')
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    const { error } = await supabase.from('profiles').update({
      full_name:        form.full_name || null,
      phone:            form.phone || null,
      birth_date:       form.birth_date || null,
      gender:           form.gender || null,
      category:         form.category as any,
      years_practice:   form.years_practice ? Number(form.years_practice) : null,
      skate_club:       form.skate_club || null,
      instagram_handle: form.instagram_handle || null,
      strava_link:      form.strava_link || null,
      weight_kg:        form.weight_kg ? Number(form.weight_kg) : null,
      height_cm:        form.height_cm ? Number(form.height_cm) : null,
      hr_max:           form.hr_max ? Number(form.hr_max) : null,
      hr_zone2_top:     form.hr_zone2_top ? Number(form.hr_zone2_top) : null,
      hr_zone3_top:     form.hr_zone3_top ? Number(form.hr_zone3_top) : null,
      hr_zone4_top:     form.hr_zone4_top ? Number(form.hr_zone4_top) : null,
      updated_at:       new Date().toISOString(),
    }).eq('id', user.id)
    if (error) toast.error('Error al guardar')
    else toast.success('Perfil actualizado ✓')
  }

  async function connectGoogleFit() {
    setSyncing(true)
    const clientId = import.meta.env.VITE_GFIT_CLIENT_ID
    if (!clientId) { toast.error('Configura VITE_GFIT_CLIENT_ID en .env'); setSyncing(false); return }
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

  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'
  const wsCategory = getWsCategory(profile?.birth_date ?? null)

  const tabs = [
    { key: 'profile',       label: 'Perfil',     icon: User },
    { key: 'physical',      label: 'Físico',      icon: Activity },
    { key: 'integrations',  label: 'Integraciones', icon: RefreshCw },
    { key: 'notifications', label: 'Alertas',    icon: Bell },
  ] as const

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl font-black text-white">Configuración</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0D1A2E] border border-[#152038] rounded-xl p-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap"
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
          {/* Avatar */}
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 flex items-center gap-5">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-[#152038]" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#00C6EF]/10 border-2 border-[#00C6EF]/20 flex items-center justify-center text-2xl font-black text-[#00C6EF]">
                  {initials}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#00C6EF] text-black flex items-center justify-center hover:bg-[#00C6EF]/90 transition-colors"
              >
                {uploadingAvatar ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
              </button>
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }}
              />
            </div>
            <div>
              <div className="font-bold text-white">{profile?.full_name ?? 'Tu nombre'}</div>
              <div className="text-xs text-[#4A6888] capitalize mt-0.5">{profile?.role} · {profile?.category ?? '—'}</div>
              <div className="text-xs text-[#3A5070] mt-0.5">{user?.email}</div>
              {wsCategory && (
                <div className="mt-1 text-[11px] text-[#F59E0B] font-semibold">
                  🏅 {wsCategory.label} (World Skate)
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-[11px] text-[#00C6EF] hover:underline mt-1"
              >
                Cambiar foto
              </button>
            </div>
          </div>

          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 space-y-4">
            <div className={labelCls}>Información personal</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Nombre completo</label>
                <input className={inputCls} value={form.full_name}
                  onChange={e => set('full_name', e.target.value)} placeholder="Tu nombre completo" />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input className={inputCls} value={form.phone}
                  onChange={e => set('phone', e.target.value)} placeholder="+57 300..." />
              </div>
              <div>
                <label className={labelCls}>Fecha de nacimiento</label>
                <input type="date" className={inputCls} value={form.birth_date}
                  onChange={e => set('birth_date', e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Género</label>
                <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">No especificado</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="other">Otro</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Categoría</label>
                <select className={inputCls} value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="velocista">Velocista</option>
                  <option value="fondista">Fondista</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Años patinando</label>
                <input type="number" className={inputCls} value={form.years_practice}
                  onChange={e => set('years_practice', e.target.value)} placeholder="3" />
              </div>
              <div>
                <label className={labelCls}>Club / Equipo</label>
                <input className={inputCls} value={form.skate_club}
                  onChange={e => set('skate_club', e.target.value)} placeholder="Club Velocidad..." />
              </div>
              <div>
                <label className={labelCls}>Instagram</label>
                <input className={inputCls} value={form.instagram_handle}
                  onChange={e => set('instagram_handle', e.target.value)} placeholder="@usuario" />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Strava</label>
                <input className={inputCls} value={form.strava_link}
                  onChange={e => set('strava_link', e.target.value)} placeholder="https://strava.com/athletes/..." />
              </div>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-sm py-3 rounded-xl transition-all active:scale-95">
            Guardar perfil
          </button>
        </form>
      )}

      {/* Physical Tab */}
      {tab === 'physical' && (
        <form onSubmit={saveProfile} className="space-y-4">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 space-y-4">
            <div className={labelCls}>Medidas corporales</div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Peso (kg)</label>
                <input type="number" step="0.1" className={inputCls} value={form.weight_kg}
                  onChange={e => set('weight_kg', e.target.value)} placeholder="70" />
              </div>
              <div>
                <label className={labelCls}>Talla (cm)</label>
                <input type="number" className={inputCls} value={form.height_cm}
                  onChange={e => set('height_cm', e.target.value)} placeholder="175" />
              </div>
            </div>
            {form.weight_kg && form.height_cm && (
              <div className="bg-[#060D1A] border border-[#152038] rounded-xl px-4 py-3">
                <span className="text-xs text-[#4A6888]">IMC: </span>
                <span className="text-sm font-bold text-white">
                  {(Number(form.weight_kg) / Math.pow(Number(form.height_cm) / 100, 2)).toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5 space-y-4">
            <div className={labelCls}>Zonas de frecuencia cardíaca</div>
            <p className="text-xs text-[#4A6888]">
              Ingresa tu FC máxima y las zonas se calcularán automáticamente. Puedes ajustarlas manualmente.
            </p>
            <div>
              <label className={labelCls}>FC Máxima (bpm)</label>
              <input
                type="number" className={inputCls} value={form.hr_max}
                onChange={e => { set('hr_max', e.target.value); if (e.target.value) computeZones(Number(e.target.value)) }}
                placeholder="195"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'hr_zone2_top', label: 'Zona 2 tope', color: '#8FCF00', pct: '70%' },
                { key: 'hr_zone3_top', label: 'Zona 3 tope', color: '#F59E0B', pct: '80%' },
                { key: 'hr_zone4_top', label: 'Zona 4 tope', color: '#E84A5F', pct: '90%' },
              ].map(z => (
                <div key={z.key}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: z.color }}>
                    {z.label} <span className="text-[#3A5070]">({z.pct})</span>
                  </label>
                  <input
                    type="number" className={inputCls} value={(form as any)[z.key]}
                    onChange={e => set(z.key as keyof typeof form, e.target.value)}
                    placeholder="—"
                  />
                </div>
              ))}
            </div>
            {form.hr_max && (
              <div className="space-y-2 mt-2">
                {[
                  { label: 'Zona 1 – Recuperación', range: `< ${Math.round(Number(form.hr_max)*0.60)} bpm`, color: '#4A6888', w: 20 },
                  { label: 'Zona 2 – Base aeróbica', range: `${Math.round(Number(form.hr_max)*0.60)}–${form.hr_zone2_top || Math.round(Number(form.hr_max)*0.70)} bpm`, color: '#8FCF00', w: 40 },
                  { label: 'Zona 3 – Umbral aeróbico', range: `${form.hr_zone2_top || '—'}–${form.hr_zone3_top || '—'} bpm`, color: '#F59E0B', w: 60 },
                  { label: 'Zona 4 – Umbral anaeróbico', range: `${form.hr_zone3_top || '—'}–${form.hr_zone4_top || '—'} bpm`, color: '#FF7A00', w: 80 },
                  { label: 'Zona 5 – VO2 Máx', range: `> ${form.hr_zone4_top || '—'} bpm`, color: '#E84A5F', w: 100 },
                ].map(z => (
                  <div key={z.label} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: z.color }} />
                    <div className="flex-1">
                      <div className="h-1.5 rounded-full bg-[#060D1A] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${z.w}%`, background: z.color }} />
                      </div>
                    </div>
                    <div className="text-[10px] text-[#4A6888] w-40 text-right shrink-0">{z.label}</div>
                    <div className="text-[10px] font-mono text-white w-28 text-right shrink-0">{z.range}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit"
            className="w-full bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-sm py-3 rounded-xl transition-all active:scale-95">
            Guardar datos físicos
          </button>
        </form>
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="space-y-3">
          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-[#152038] flex items-center justify-center shrink-0 text-2xl">🏃</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white text-sm">Google Fit</span>
                  {profile?.gfit_connected
                    ? <span className="flex items-center gap-1 text-[10px] font-bold text-[#00C48C] bg-[#00C48C]/10 border border-[#00C48C]/20 px-2 py-0.5 rounded-full"><CheckCircle size={10} /> Conectado</span>
                    : <span className="text-[10px] font-bold text-[#4A6888] bg-[#152038] px-2 py-0.5 rounded-full">No conectado</span>}
                </div>
                <p className="text-xs text-[#4A6888] mb-3">Sincroniza FC, calorías y datos de actividad automáticamente.</p>
                <button onClick={connectGoogleFit} disabled={syncing}
                  className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-[#152038] text-white text-xs font-bold px-3 py-2 rounded-lg transition-all">
                  <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                  {profile?.gfit_connected ? 'Re-conectar' : 'Conectar Google Fit'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center shrink-0 text-2xl">📡</div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm mb-1">Tags NFC</div>
                <p className="text-xs text-[#4A6888] mb-3">Registra tags NFC para iniciar sesiones automáticamente.</p>
                <a href="/nfc" className="inline-flex items-center gap-1.5 bg-[#00C6EF]/10 hover:bg-[#00C6EF]/20 border border-[#00C6EF]/25 text-[#00C6EF] text-xs font-bold px-3 py-2 rounded-lg transition-all">
                  Gestionar tags NFC →
                </a>
              </div>
            </div>
          </div>

          <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#A78BFA]/10 border border-[#A78BFA]/20 flex items-center justify-center shrink-0 text-2xl">🔌</div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm mb-1">API REST</div>
                <p className="text-xs text-[#4A6888] mb-3">Accede a datos via API. Swagger disponible en el backend.</p>
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
          <div className={labelCls}>Preferencias de notificaciones</div>
          {[
            { label: 'Reporte semanal del Coach IA', sub: 'Resumen de entrenamiento cada lunes', enabled: true },
            { label: 'Recordatorio de sesión', sub: 'Aviso cuando llevas 2 días sin entrenar', enabled: false },
            { label: 'Metas alcanzadas', sub: 'Notificación al superar objetivos', enabled: true },
            { label: 'Alerta de ruedas', sub: 'Cuando una rueda llega al 80% de su límite', enabled: true },
            { label: 'Sesión por NFC', sub: 'Confirmación cuando un tag inicia sesión', enabled: true },
            { label: 'Mensaje del coach', sub: 'Cuando tu entrenador te envía un mensaje', enabled: true },
          ].map(n => (
            <div key={n.label} className="flex items-start justify-between gap-4 py-2 border-b border-[#152038] last:border-0">
              <div>
                <div className="text-sm font-semibold text-white">{n.label}</div>
                <div className="text-xs text-[#3A5070] mt-0.5">{n.sub}</div>
              </div>
              <div className={`w-10 h-5 rounded-full transition-colors cursor-pointer shrink-0 ${n.enabled ? 'bg-[#00C6EF]' : 'bg-[#152038]'}`}>
                <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${n.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
