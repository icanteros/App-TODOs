import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

import { missingEnvVars } from './lib/supabase'
import { useTodos } from './hooks/useTodos'
import { useCategories } from './hooks/useCategories'
import TodoItem from './components/TodoItem'
import AddTodoForm from './components/AddTodoForm'
import CategoryFilter from './components/CategoryFilter'
import CategoryModal from './components/CategoryModal'

// ─── Env vars guard ───────────────────────────────────────────────────────────

function MissingEnvScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚙️</div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Variables de entorno faltantes</h1>
        <p className="text-sm text-gray-500 mb-5">
          La app no puede conectarse a Supabase. Configurá las siguientes variables en{' '}
          <strong>Netlify → Site configuration → Environment variables</strong>:
        </p>
        <div className="bg-gray-50 rounded-xl p-4 text-left font-mono text-xs text-gray-700 space-y-1">
          <p>VITE_SUPABASE_URL=https://xxxx.supabase.co</p>
          <p>VITE_SUPABASE_ANON_KEY=eyJh...</p>
        </div>
        <p className="text-xs text-gray-400 mt-4">Después de agregar las variables, hacé un redeploy.</p>
      </div>
    </div>
  )
}

// ─── Stats bar ────────────────────────────────────────────────────────────────


function StatsBar({ todos }) {
  const total = todos.length
  const done = todos.filter((t) => t.completed).length
  const overdue = todos.filter((t) => {
    if (!t.due_date || t.completed) return false
    return new Date(t.due_date) < new Date(new Date().toDateString())
  }).length

  if (total === 0) return null

  return (
    <div className="flex items-center gap-5 text-xs text-gray-400 mb-5">
      <span><strong className="text-gray-700">{done}</strong>/{total} completadas</span>
      {overdue > 0 && (
        <span className="text-red-500 font-medium flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
          </svg>
          {overdue} vencida{overdue !== 1 ? 's' : ''}
        </span>
      )}
      {done === total && total > 0 && (
        <span className="text-emerald-500 font-medium">🎉 ¡Todo listo!</span>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ filtered }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-3">{filtered ? '🔍' : '✅'}</div>
      <p className="text-gray-400 text-sm">
        {filtered
          ? 'No hay tareas en esta categoría'
          : 'No hay tareas. ¡Agregá una arriba!'
        }
      </p>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  if (missingEnvVars) return <MissingEnvScreen />

  const {
    todos,
    loading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
    getTodos,
  } = useTodos()

  const { categories, addCategory } = useCategories()

  const [activeCategory, setActiveCategory] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Derived: filtered todos
  const filteredTodos = activeCategory
    ? todos.filter((t) => t.category_id === activeCategory)
    : todos

  // ── Handlers ──

  const handleCategoryChange = useCallback((id) => {
    setActiveCategory(id)
    getTodos(id)
  }, [getTodos])

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return

    // We always reorder the full `todos` list to keep positions consistent
    const oldIdx = todos.findIndex((t) => t.id === active.id)
    const newIdx = todos.findIndex((t) => t.id === over.id)
    reorderTodos(arrayMove(todos, oldIdx, newIdx))
  }

  const handleToggle = (todo) => updateTodo(todo.id, { completed: !todo.completed })

  return (
    <>
      {/* ─── Category Modal ───────────────────────────────────────── */}
      <CategoryModal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onAdd={addCategory}
        categories={categories}
      />

      {/* ─── Main layout ──────────────────────────────────────────── */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 py-10 px-4">
        <div className="max-w-xl mx-auto">

          {/* Header */}
          <header className="mb-8">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-1">Mi espacio</p>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tareas</h1>
              </div>
              {/* Settings / category button */}
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-indigo-600 transition-colors px-3 py-2 rounded-xl hover:bg-indigo-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z"/>
                </svg>
                Etiquetas
              </button>
            </div>
          </header>

          {/* Add form */}
          <AddTodoForm categories={categories} onAdd={addTodo} />

          {/* Category filter */}
          <CategoryFilter
            categories={categories}
            active={activeCategory}
            onChange={handleCategoryChange}
            onManage={() => setCategoryModalOpen(true)}
          />

          {/* Stats */}
          <StatsBar todos={todos} />

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {/* Todo list */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-300">
              <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              <span className="text-sm">Cargando…</span>
            </div>
          ) : filteredTodos.length === 0 ? (
            <EmptyState filtered={activeCategory !== null} />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredTodos.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="flex flex-col gap-2">
                  {filteredTodos.map((todo) => (
                    <TodoItem
                      key={todo.id}
                      todo={todo}
                      onToggle={handleToggle}
                      onDelete={deleteTodo}
                      onUpdate={updateTodo}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </>
  )
}
