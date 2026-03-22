import { useState, useRef } from 'react'

/**
 * @param {{ categories: Array<{id:string,name:string,color:string}>, onAdd: (payload:any)=>void }} props
 */
export default function AddTodoForm({ categories, onAdd }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [focused, setFocused] = useState(false)
  
  const dateInputRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onAdd({
      title: title.trim(),
      due_date: dueDate || null,
      category_id: categoryId || null,
    })
    setTitle('')
    setDueDate('')
    setCategoryId('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`
        bg-white rounded-2xl border transition-all duration-200 mb-6 overflow-hidden shadow-sm
        ${focused ? 'border-indigo-300 shadow-md ring-2 ring-indigo-100' : 'border-gray-200'}
      `}
    >
      {/* Title input */}
      <div className="px-4 pt-4 pb-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="¿Qué necesitás hacer?"
          className="w-full text-sm text-gray-800 placeholder-gray-300 bg-transparent focus:outline-none"
        />
      </div>

      {/* Controls row */}
      <div className="flex items-center gap-2 px-3 pb-3 flex-wrap">
        {/* Date picker — Botón que dispara el calendario nativo */}
        <button
          type="button"
          onClick={() => dateInputRef.current?.showPicker()}
          className="relative flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-500 cursor-pointer transition-colors group focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-lg px-1 py-0.5"
        >
          <svg className="w-3.5 h-3.5 group-hover:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <span>
            {dueDate
              ? <span className="text-indigo-600 font-medium">{dueDate}</span>
              : 'Fecha'}
          </span>
          <input
            ref={dateInputRef}
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            // Visible lo mínimo posible para que showPicker() funcione sin afectar el layout
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
        </button>

        {/* Category select */}
        <div className="flex items-center gap-1">
          {categoryId && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: categories.find(c => c.id === categoryId)?.color ?? '#ccc',
              }}
            />
          )}
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="text-xs text-gray-400 bg-transparent focus:outline-none cursor-pointer hover:text-indigo-500 transition-colors appearance-none"
          >
            <option value="">Categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Submit */}
        <button
          type="submit"
          disabled={!title.trim()}
          className="text-xs font-semibold px-4 py-1.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95"
        >
          Agregar
        </button>
      </div>
    </form>
  )
}
