import { useState, useEffect, useRef } from 'react'

// Preset palette — 12 curated colors
const PALETTE = [
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#22c55e', // green
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#64748b', // slate
]

/**
 * @param {{
 *   open: boolean,
 *   onClose: () => void,
 *   onAdd: (payload: {name:string,color:string}) => Promise<any>,
 *   categories: Array<{id:string,name:string,color:string}>
 * }} props
 */
export default function CategoryModal({ open, onClose, onAdd, categories }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PALETTE[0])
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    await onAdd({ name: name.trim(), color })
    setSaving(false)
    setName('')
    setColor(PALETTE[0])
  }

  if (!open) return null

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 animate-[fadeSlide_0.18s_ease-out]">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-800">Categorías</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-lg p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Existing categories */}
        {categories.length > 0 && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Existentes</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full text-white font-medium"
                  style={{ backgroundColor: cat.color }}
                >
                  {cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Add form */}
        <form onSubmit={handleSubmit}>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-2">Nueva categoría</p>

          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Trabajo, Personal, Salud…"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-4"
          />

          {/* Color palette */}
          <div className="flex flex-wrap gap-2 mb-5">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`
                  w-7 h-7 rounded-full transition-transform active:scale-90
                  ${color === c ? 'ring-2 ring-offset-2 ring-gray-600 scale-110' : 'hover:scale-110'}
                `}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>

          {/* Preview + Submit */}
          <div className="flex items-center gap-3">
            {name.trim() && (
              <span
                className="text-xs px-3 py-1 rounded-full text-white font-medium"
                style={{ backgroundColor: color }}
              >
                {name.trim()}
              </span>
            )}
            <div className="flex-1" />
            <button
              type="submit"
              disabled={!name.trim() || saving}
              className="px-5 py-2 bg-indigo-500 text-white text-sm font-semibold rounded-xl hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {saving ? 'Guardando…' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
