import { useState, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format, isPast, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

// ─── Icons (inline SVG for zero deps) ────────────────────────────────────────
const DragIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
    <path d="M7 4a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 10a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2zM7 16a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
)
const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
)
const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
)
const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDueDateStatus(due_date, completed) {
  if (!due_date) return null
  const parsed = parseISO(due_date)
  if (completed) return { label: format(parsed, "d MMM yyyy", { locale: es }), className: 'text-gray-400' }
  if (isToday(parsed)) return { label: 'Hoy', className: 'text-amber-500 font-semibold' }
  if (isPast(parsed)) return { label: `Vencido · ${format(parsed, "d MMM", { locale: es })}`, className: 'text-red-500 font-semibold', overdue: true }
  return { label: format(parsed, "d MMM yyyy", { locale: es }), className: 'text-gray-400' }
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * @param {{
 *   todo: import('../hooks/useTodos').Todo,
 *   onToggle: (todo: any) => void,
 *   onDelete: (id: string) => void,
 *   onUpdate: (id: string, updates: any) => void,
 * }} props
 */
export default function TodoItem({ todo, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const inputRef = useRef(null)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  const dueDateStatus = getDueDateStatus(todo.due_date, todo.completed)

  // Focus input when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commitEdit = () => {
    const trimmed = editTitle.trim()
    if (trimmed && trimmed !== todo.title) {
      onUpdate(todo.id, { title: trimmed })
    } else {
      setEditTitle(todo.title)
    }
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') { setEditTitle(todo.title); setEditing(false) }
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 rounded-2xl px-4 py-3 border transition-shadow group
        ${isDragging
          ? 'bg-indigo-50 border-indigo-200 shadow-xl ring-2 ring-indigo-300'
          : 'bg-white border-gray-100 shadow-sm hover:shadow-md'
        }
        ${todo.completed ? 'opacity-60' : ''}
      `}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="text-gray-300 hover:text-indigo-400 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors"
        aria-label="Arrastrar para reordenar"
        onClick={(e) => e.stopPropagation()}
      >
        <DragIcon />
      </button>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo)}
        className={`
          flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
          ${todo.completed
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : 'border-gray-300 hover:border-indigo-400'
          }
        `}
        aria-label={todo.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
      >
        {todo.completed && <CheckIcon />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="w-full text-sm font-medium text-gray-800 bg-indigo-50 border border-indigo-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        ) : (
          <p
            className={`text-sm font-medium truncate leading-snug ${
              todo.completed ? 'line-through text-gray-400' : 'text-gray-800'
            }`}
            onDoubleClick={() => !todo.completed && setEditing(true)}
          >
            {todo.title}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {todo.categories && (
            <span
              className="text-xs px-2 py-0.5 rounded-full text-white font-medium leading-none"
              style={{ backgroundColor: todo.categories.color }}
            >
              {todo.categories.name}
            </span>
          )}

          {dueDateStatus && (
            <span className={`text-xs flex items-center gap-0.5 ${dueDateStatus.className}`}>
              {dueDateStatus.overdue && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              )}
              {!dueDateStatus.overdue && !todo.completed && (
                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
              )}
              {dueDateStatus.label}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {!todo.completed && (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
            aria-label="Editar tarea"
          >
            <PencilIcon />
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Eliminar tarea"
        >
          <TrashIcon />
        </button>
      </div>
    </li>
  )
}
