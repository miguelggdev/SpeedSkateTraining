import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Video, Upload, Sparkles, X, Play, Tag } from 'lucide-react'
import { toast } from 'sonner'

interface VideoAnalysis {
  id: string
  video_url: string
  thumbnail_url: string | null
  title: string | null
  analysis: string | null
  tags: string[] | null
  analyzed_at: string | null
  created_at: string
}

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'https://api.skate.arkanatech.tech'

export default function VideoAnalysis() {
  const { profile } = useAuth()
  const [videos, setVideos] = useState<VideoAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState<string | null>(null)
  const [selected, setSelected] = useState<VideoAnalysis | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (profile) loadVideos() }, [profile])

  async function loadVideos() {
    setLoading(true)
    const { data } = await supabase
      .from('video_analyses')
      .select('*')
      .eq('user_id', profile!.id)
      .order('created_at', { ascending: false })
    if (data) setVideos(data)
    setLoading(false)
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith('video/')) { toast.error('Solo archivos de video'); return }
    if (file.size > 100 * 1024 * 1024) { toast.error('Máximo 100 MB por video'); return }
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${profile!.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('videos').upload(path, file)
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('videos').getPublicUrl(path)
      const { data, error } = await supabase.from('video_analyses').insert({
        user_id: profile!.id,
        video_url: publicUrl,
        title: file.name.replace(/\.[^.]+$/, ''),
      }).select().single()
      if (error) throw error
      setVideos(v => [data, ...v])
      toast.success('Video subido — listo para analizar')
    } catch (e: any) {
      toast.error(e.message ?? 'Error al subir video')
    }
    setUploading(false)
  }

  async function analyzeVideo(video: VideoAnalysis) {
    setAnalyzing(video.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${BACKEND_URL}/api/analyze-video`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ video_id: video.id, video_url: video.video_url }),
      })
      if (!res.ok) throw new Error(await res.text())
      const result = await res.json()
      setVideos(v => v.map(x => x.id === video.id ? { ...x, analysis: result.analysis, tags: result.tags, analyzed_at: result.analyzed_at } : x))
      if (selected?.id === video.id) setSelected(v => v ? { ...v, analysis: result.analysis, tags: result.tags ?? [], analyzed_at: result.analyzed_at } : v)
      toast.success('Análisis completado')
    } catch {
      // Fallback: local AI analysis hint
      const mockAnalysis = `**Análisis de Técnica de Patinaje**\n\n*El backend de IA no está disponible en este momento. Conecta el servidor FastAPI para análisis con Claude Vision.*\n\n**Puntos a evaluar manualmente:**\n- Posición baja y ángulo de rodilla\n- Extensión completa del empuje lateral\n- Sincronización de brazos con el movimiento\n- Posición del tronco en curvas\n- Recuperación de pierna después del empuje`
      await supabase.from('video_analyses').update({ analysis: mockAnalysis, analyzed_at: new Date().toISOString() }).eq('id', video.id)
      setVideos(v => v.map(x => x.id === video.id ? { ...x, analysis: mockAnalysis, analyzed_at: new Date().toISOString() } : x))
      if (selected?.id === video.id) setSelected(v => v ? { ...v, analysis: mockAnalysis } : v)
      toast.info('Análisis simulado — conecta el backend para análisis real con IA')
    }
    setAnalyzing(null)
  }

  async function deleteVideo(id: string) {
    await supabase.from('video_analyses').delete().eq('id', id)
    setVideos(v => v.filter(x => x.id !== id))
    if (selected?.id === id) setSelected(null)
    toast.success('Video eliminado')
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Video size={24} className="text-[#F59E0B]" /> Análisis de Video
          </h1>
          <p className="text-sm text-[#4A6888] mt-0.5">Análisis de técnica con Claude Vision IA</p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-[#F59E0B] text-black rounded-lg text-sm font-bold hover:bg-[#D97706] transition disabled:opacity-50"
        >
          <Upload size={16} /> {uploading ? 'Subiendo...' : 'Subir video'}
        </button>
        <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f) }} />
      </div>

      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-[#152038] hover:border-[#F59E0B]/40 rounded-xl p-10 text-center cursor-pointer transition"
        onClick={() => fileRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleUpload(f) }}
      >
        <Video size={40} className="mx-auto text-[#3A5070] mb-3" />
        <p className="text-[#5A76A0] text-sm">Arrastra un video o haz clic para seleccionar</p>
        <p className="text-[#3A5070] text-xs mt-1">MP4, MOV, AVI — máx 100 MB</p>
      </div>

      {/* Video grid */}
      {loading && <div className="text-[#4A6888] text-sm">Cargando...</div>}
      {!loading && videos.length === 0 && (
        <div className="text-center text-[#4A6888] py-8">No hay videos subidos aún</div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(v => (
          <div
            key={v.id}
            className={`bg-[#0D1A2E] border rounded-xl overflow-hidden cursor-pointer transition ${selected?.id === v.id ? 'border-[#F59E0B]/50' : 'border-[#152038] hover:border-[#F59E0B]/20'}`}
            onClick={() => setSelected(v.id === selected?.id ? null : v)}
          >
            <div className="aspect-video bg-[#060D1A] relative flex items-center justify-center">
              {v.thumbnail_url ? (
                <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Play size={32} className="text-[#3A5070]" />
              )}
              {v.analyzed_at && (
                <div className="absolute top-2 right-2 bg-[#F59E0B]/90 text-black text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles size={8} /> IA
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-white truncate">{v.title ?? 'Sin título'}</div>
              <div className="text-[11px] text-[#4A6888] mt-0.5">
                {new Date(v.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
              {v.tags && v.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {v.tags.map(t => (
                    <span key={t} className="text-[9px] bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-1.5 py-0.5 rounded font-semibold">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                {!v.analyzed_at && (
                  <button
                    onClick={e => { e.stopPropagation(); analyzeVideo(v) }}
                    disabled={analyzing === v.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 rounded-lg text-xs font-bold hover:bg-[#F59E0B]/20 transition disabled:opacity-50"
                  >
                    <Sparkles size={12} /> {analyzing === v.id ? 'Analizando...' : 'Analizar con IA'}
                  </button>
                )}
                <button
                  onClick={e => { e.stopPropagation(); deleteVideo(v.id) }}
                  className="p-1.5 text-[#3A5070] hover:text-[#E84A5F] border border-transparent hover:border-[#E84A5F]/20 rounded-lg transition"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis panel */}
      {selected && selected.analysis && (
        <div className="bg-[#0D1A2E] border border-[#F59E0B]/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#F59E0B]" /> Análisis: {selected.title}
            </h2>
            <button onClick={() => setSelected(null)} className="text-[#3A5070] hover:text-white"><X size={18} /></button>
          </div>
          {selected.tags && selected.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              <Tag size={12} className="text-[#3A5070] self-center" />
              {selected.tags.map(t => (
                <span key={t} className="text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 px-2 py-0.5 rounded-full font-semibold">{t}</span>
              ))}
            </div>
          )}
          <div className="prose prose-invert max-w-none text-sm text-[#B8C8D8] whitespace-pre-wrap leading-relaxed">
            {selected.analysis}
          </div>
          <div className="mt-4 text-[11px] text-[#3A5070]">
            Analizado: {selected.analyzed_at ? new Date(selected.analyzed_at).toLocaleString('es-CO') : '—'}
          </div>
        </div>
      )}
    </div>
  )
}
