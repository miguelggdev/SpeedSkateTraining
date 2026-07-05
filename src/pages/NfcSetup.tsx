import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { NfcTag } from '@/types/database'
import { Radio, CheckCircle, XCircle, Tag, Trash2 } from 'lucide-react'

type NfcStatus = 'idle' | 'scanning' | 'success' | 'error' | 'unsupported'

export default function NfcSetup() {
  const { user } = useAuth()
  const [tags, setTags] = useState<NfcTag[]>([])
  const [status, setStatus] = useState<NfcStatus>('idle')
  const [scannedUid, setScannedUid] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!('NDEFReader' in window)) setStatus('unsupported')
    fetchTags()
  }, [])

  async function fetchTags() {
    if (!user) return
    const { data } = await supabase
      .from('nfc_tags')
      .select('*')
      .eq('athlete_id', user.id)
      .order('registered_at', { ascending: false })
    setTags(data ?? [])
  }

  async function startScan() {
    setStatus('scanning')
    setScannedUid('')
    setErrorMsg('')
    try {
      // @ts-ignore — Web NFC API
      const reader = new window.NDEFReader()
      await reader.scan()
      reader.onreading = (event: any) => {
        const uid = event.serialNumber ?? event.message?.records?.[0]?.data ?? 'unknown'
        setScannedUid(String(uid))
        setStatus('success')
      }
      reader.onerror = () => {
        setStatus('error')
        setErrorMsg('Error al leer el tag NFC')
      }
    } catch (e: any) {
      setStatus('error')
      setErrorMsg(e?.message ?? 'No se pudo iniciar el escaneo NFC')
    }
  }

  async function saveTag() {
    if (!user || !scannedUid) return
    setSaving(true)
    setErrorMsg('')
    const { error } = await supabase.from('nfc_tags').insert({
      uid: scannedUid,
      athlete_id: user.id,
      label: label || `Casco ${tags.length + 1}`,
      is_active: true,
      registered_by: user.id,
    })
    if (error) {
      setErrorMsg(error.message)
    } else {
      setStatus('idle')
      setScannedUid('')
      setLabel('')
      await fetchTags()
    }
    setSaving(false)
  }

  async function deleteTag(id: string) {
    await supabase.from('nfc_tags').delete().eq('id', id)
    setTags(t => t.filter(x => x.id !== id))
  }

  async function toggleTag(id: string, current: boolean) {
    await supabase.from('nfc_tags').update({ is_active: !current }).eq('id', id)
    setTags(t => t.map(x => x.id === id ? { ...x, is_active: !current } : x))
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Arial Black', sans-serif" }}>
          Configurar NFC
        </h1>
        <p className="text-[#4A6888] text-sm mt-1">
          Registra el tag NFC de tu casco para iniciar sesiones automáticamente
        </p>
      </div>

      {/* Scanner card */}
      <div className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-6">
        {status === 'unsupported' ? (
          <div className="text-center py-4">
            <XCircle className="mx-auto mb-3 text-[#E84A5F]" size={40} />
            <div className="text-white font-semibold mb-1">NFC no disponible</div>
            <div className="text-[#4A6888] text-sm">
              Tu dispositivo o navegador no soporta Web NFC.<br />
              Usa Chrome en Android con NFC activado.
            </div>
          </div>
        ) : status === 'scanning' ? (
          <div className="text-center py-6">
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute w-20 h-20 rounded-full border-2 border-[#00C6EF]/30 animate-ping" />
              <div className="w-16 h-16 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/30 flex items-center justify-center">
                <Radio className="text-[#00C6EF] animate-pulse" size={28} />
              </div>
            </div>
            <div className="text-white font-semibold mb-1">Esperando tag NFC...</div>
            <div className="text-[#4A6888] text-sm">Acerca el casco al teléfono</div>
            <button
              onClick={() => setStatus('idle')}
              className="mt-4 text-xs text-[#4A6888] hover:text-white underline"
            >
              Cancelar
            </button>
          </div>
        ) : status === 'success' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-[#00C48C]/10 border border-[#00C48C]/20 rounded-xl p-3">
              <CheckCircle className="text-[#00C48C] flex-shrink-0" size={20} />
              <div>
                <div className="text-sm font-semibold text-white">Tag detectado</div>
                <div className="text-xs text-[#4A6888] font-mono">{scannedUid}</div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-2 block">
                Nombre del casco
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="Ej: Casco azul, Casco competencia..."
                className="w-full bg-[#060D1A] border border-[#152038] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#00C6EF]/50 placeholder-[#2A3A55]"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveTag}
                disabled={saving}
                className="flex-1 bg-[#00C6EF] hover:bg-[#00B5D8] disabled:opacity-60 text-[#060D1A] font-bold text-sm py-2.5 rounded-xl transition-all"
              >
                {saving ? 'Guardando...' : 'Registrar tag'}
              </button>
              <button
                onClick={() => { setStatus('idle'); setScannedUid('') }}
                className="px-4 bg-[#152038] text-[#5A76A0] font-semibold text-sm py-2.5 rounded-xl hover:bg-[#1E3050] transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#00C6EF]/10 border border-[#00C6EF]/20 flex items-center justify-center mx-auto mb-4">
              <Radio className="text-[#00C6EF]" size={28} />
            </div>
            <div className="text-white font-semibold mb-1">Registrar nuevo tag</div>
            <div className="text-[#4A6888] text-sm mb-4">
              Presiona el botón y acerca el casco con el tag NFC
            </div>
            <button
              onClick={startScan}
              className="bg-[#00C6EF] hover:bg-[#00B5D8] text-[#060D1A] font-bold text-sm px-6 py-2.5 rounded-xl transition-all active:scale-95 shadow-lg shadow-[#00C6EF]/20"
            >
              Escanear tag NFC
            </button>
          </div>
        )}

        {(status === 'error' || errorMsg) && (
          <div className="mt-3 flex items-center gap-2 bg-[#E84A5F]/10 border border-[#E84A5F]/20 text-[#E84A5F] text-xs px-3 py-2.5 rounded-lg">
            <XCircle size={14} />
            {errorMsg || 'Error desconocido'}
          </div>
        )}
      </div>

      {/* Registered tags */}
      {tags.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#3A5070] mb-3">
            Tags registrados
          </h2>
          <div className="space-y-2">
            {tags.map(tag => (
              <div key={tag.id} className="bg-[#0D1A2E] border border-[#152038] rounded-xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tag.is_active ? 'bg-[#00C6EF]/10 border border-[#00C6EF]/20' : 'bg-[#152038]'}`}>
                  <Tag size={16} className={tag.is_active ? 'text-[#00C6EF]' : 'text-[#3A5070]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white">{tag.label ?? 'Sin nombre'}</div>
                  <div className="text-[10px] text-[#3A5070] font-mono truncate">{tag.uid}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleTag(tag.id, tag.is_active)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all ${
                      tag.is_active
                        ? 'bg-[#00C48C]/10 border-[#00C48C]/30 text-[#00C48C]'
                        : 'bg-[#152038] border-[#1E3050] text-[#3A5070]'
                    }`}
                  >
                    {tag.is_active ? 'Activo' : 'Inactivo'}
                  </button>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="text-[#3A5070] hover:text-[#E84A5F] transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-[#00C6EF]/5 border border-[#00C6EF]/15 rounded-xl p-4 text-xs text-[#4A6888] space-y-1">
        <div className="font-semibold text-[#00C6EF] mb-1">¿Cómo funciona?</div>
        <div>1. Pega un tag NFC en el casco de patinaje</div>
        <div>2. Regístralo aquí con el nombre del casco</div>
        <div>3. Cada vez que toques el teléfono con el casco, se inicia una sesión automáticamente</div>
        <div className="pt-1 text-[10px] text-[#2A3A55]">Requiere Chrome en Android con NFC activado</div>
      </div>

    </div>
  )
}
