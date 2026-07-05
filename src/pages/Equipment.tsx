import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useWheels, Wheel } from '@/hooks/useWheels'
import { Plus, AlertTriangle, CheckCircle, X, Package } from 'lucide-react'
import { toast } from 'sonner'

const SIZES = [80, 84, 90, 100, 110, 125]
const HARDNESS = ['76A','80A','82A','84A','86A','88A','90A']

function WheelCard({ wheel, onToggle, onDelete }: {
  wheel: Wheel
  onToggle: () => void
  onDelete: () => void
}) {
  const pct = Math.min(100, Math.round((wheel.km_used / wheel.km_limit) * 100))
  const worn = pct >= 90
  const warning = pct >= 70 && pct < 90

  return (
    <div className={`bg-[#0D1A2E] border rounded-2xl p-5 transition-all ${
      worn ? 'border-[#E84A5F]/40' : warning ? 'border-[#F59E0B]/40' : 'border-[#152038]'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">🛞</div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{wheel.brand}</span>
              {wheel.model && <span className="text-xs text-[#4A6888]">{wheel.model}</span>}
              {!wheel.is_active && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#152038] text-[#4A6888]">Inactiva</span>
              )}
            </div>
            <div className="flex gap-2 mt-0.5 text-[11px] text-[#4A6888]">
              {wheel.size_mm && <span>⌀{wheel.size_mm}mm</span>}
              {wheel.hardness && <span>{wheel.hardness}</span>}
              {wheel.color && <span>● {wheel.color}</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {worn && <AlertTriangle size={16} className="text-[#E84A5F]" />}
          {warning && <AlertTriangle size={16} className="text-[#F59E0B]" />}
          {!worn && !warning && wheel.is_active && <CheckCircle size={16} className="text-[#8FCF00]" />}
          <button onClick={onDelete} className="text-[#3A5070] hover:text-[#E84A5F] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[11px] mb-1.5">
          <span className="text-[#4A6888]">{wheel.km_used.toFixed(0)} km usados</span>
          <span style={{ color: worn ? '#E84A5F' : warning ? '#F59E0B' : '#4A6888' }}>
            {pct}% · {(wheel.km_limit - wheel.km_used).toFixed(0)} km restantes
          </span>
        </div>
        <div className="h-2 rounded-full bg-[#060D1A] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              background: worn ? '#E84A5F' : warning ? '#F59E0B' : '#8FCF00',
            }}
          />
        </div>
        <div className="text-[10px] text-[#3A5070] mt-1">Límite: {wheel.km_limit} km</div>
      </div>

      {worn && (
        <div className="mt-3 flex items-center gap-2 bg-[#E84A5F]/10 border border-[#E84A5F]/20 rounded-xl px-3 py-2">
          <AlertTriangle size={12} className="text-[#E84A5F]" />
          <span className="text-xs text-[#E84A5F] font-semibold">¡Rueda al límite! Recomendamos cambiarla.</span>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={onToggle}
          className="flex-1 py-2 rounded-xl border text-xs font-semibold transition-all border-[#152038] text-[#4A6888] hover:text-white hover:border-[#4A6888]"
        >
          {wheel.is_active ? 'Desactivar' : 'Activar'}
        </button>
        {wheel.purchased_at && (
          <div className="flex items-center px-3 text-[10px] text-[#3A5070]">
            Comprada: {new Date(wheel.purchased_at).toLocaleDateString('es', { month: 'short', year: 'numeric' })}
          </div>
        )}
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  brand: '', model: '', hardness: '84A', size_mm: 110, color: '',
  km_limit: 500, km_used: 0, is_active: true, notes: '', purchased_at: '',
}

export default function Equipment() {
  const { user } = useAuth()
  const { wheels, loading, addWheel, toggleActive, deleteWheel } = useWheels(user?.id)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function handleAdd() {
    if (!form.brand) return
    setSaving(true)
    const { error } = await addWheel({
      ...form,
      model: form.model || null,
      color: form.color || null,
      notes: form.notes || null,
      purchased_at: form.purchased_at || null,
    })
    setSaving(false)
    if (error) toast.error('Error al guardar')
    else { toast.success('Rueda registrada ✓'); setForm({ ...EMPTY_FORM }); setShowForm(false) }
  }

  const activeWheels  = wheels.filter(w => w.is_active)
  const wornCount     = wheels.filter(w => (w.km_used / w.km_limit) >= 0.9).length

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Equipamiento</h1>
          <p className="text-sm text-[#4A6888] mt-0.5">Gestiona tus ruedas y sigue su desgaste</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 transition-colors"
        >
          <Plus size={16} /> Nueva rueda
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total ruedas', value: wheels.length, color: '#00C6EF' },
          { label: 'Activas', value: activeWheels.length, color: '#8FCF00' },
          { label: 'Al límite', value: wornCount, color: wornCount > 0 ? '#E84A5F' : '#3A5070' },
        ].map(k => (
          <div key={k.label} className="bg-[#0D1A2E] border border-[#152038] rounded-2xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[10px] text-[#4A6888] uppercase tracking-wider mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-[#0D1A2E] border border-[#00C6EF]/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Nueva rueda</h3>
            <button onClick={() => setShowForm(false)} className="text-[#4A6888] hover:text-white">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Marca *</label>
              <input
                value={form.brand} onChange={e => set('brand', e.target.value)}
                placeholder="Powerslide, Bont, Roll-Line..."
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Modelo</label>
              <input
                value={form.model} onChange={e => set('model', e.target.value)}
                placeholder="Ej: Hurricane"
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Tamaño</label>
              <select
                value={form.size_mm} onChange={e => set('size_mm', Number(e.target.value))}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              >
                {SIZES.map(s => <option key={s} value={s}>{s}mm</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Dureza</label>
              <select
                value={form.hardness} onChange={e => set('hardness', e.target.value)}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              >
                {HARDNESS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Color</label>
              <input
                value={form.color} onChange={e => set('color', e.target.value)}
                placeholder="Negro"
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#3A5070] focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Límite km</label>
              <input
                type="number" value={form.km_limit} onChange={e => set('km_limit', Number(e.target.value))}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Km iniciales</label>
              <input
                type="number" value={form.km_used} onChange={e => set('km_used', Number(e.target.value))}
                className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#4A6888] uppercase tracking-wider">Fecha de compra</label>
            <input
              type="date" value={form.purchased_at} onChange={e => set('purchased_at', e.target.value)}
              className="mt-1.5 w-full bg-[#060D1A] border border-[#152038] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#00C6EF]/50"
            />
          </div>

          <button
            onClick={handleAdd} disabled={!form.brand || saving}
            className="w-full py-3 rounded-xl bg-[#00C6EF] text-black font-bold text-sm hover:bg-[#00C6EF]/90 transition-colors disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Registrar rueda'}
          </button>
        </div>
      )}

      {/* Wheels list */}
      {loading ? (
        <div className="text-center py-12 text-[#4A6888]">Cargando equipamiento...</div>
      ) : wheels.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Package size={40} className="mx-auto text-[#152038]" />
          <p className="text-[#4A6888]">No tienes ruedas registradas.</p>
          <button onClick={() => setShowForm(true)} className="text-[#00C6EF] text-sm hover:underline">
            Registrar primera rueda →
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {wheels.map(w => (
            <WheelCard
              key={w.id}
              wheel={w}
              onToggle={() => toggleActive(w.id)}
              onDelete={() => { if (confirm('¿Eliminar rueda?')) deleteWheel(w.id) }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
