import { useState, useCallback, useEffect } from 'react'
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
import { isPast, parseISO, isToday } from 'date-fns'

import { missingEnvVars } from './lib/supabase'
import { useTodos } from './hooks/useTodos'
import { useCategories } from './hooks/useCategories'
import TodoItem from './components/TodoItem'
import AddTodoForm from './components/AddTodoForm'
import CategoryFilter from './components/CategoryFilter'
import CategoryModal from './components/CategoryModal'
import Auth from './components/Auth'
import { supabase } from './lib/supabase'

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

// ─── Todo App ────────────────────────────────────────────────────────────────

function TodoApp() {

  // ── Dark mode ──
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('theme') === 'dark' || 
          (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
  )

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

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

  const { categories, addCategory, deleteCategory } = useCategories()

  const [activeCategory, setActiveCategory] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'pending' | 'completed'
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)

  // ── Editable title ──
  const [pageTitle, setPageTitle] = useState(
    () => localStorage.getItem('app-title') || 'Tareas'
  )
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(pageTitle)

  const commitTitle = () => {
    const val = titleDraft.trim() || 'Tareas'
    setPageTitle(val)
    localStorage.setItem('app-title', val)
    setEditingTitle(false)
  }

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Derived: filtered todos
  const filteredTodos = todos.filter((t) => {
    if (activeCategory && t.category_id !== activeCategory) return false
    
    if (statusFilter === 'pending' && t.completed) return false
    if (statusFilter === 'completed' && !t.completed) return false
    if (statusFilter === 'overdue') {
      if (t.completed) return false
      if (!t.due_date) return false
      const parsedDate = parseISO(t.due_date)
      if (!isPast(parsedDate) || isToday(parsedDate)) return false
    }
    
    return true
  })

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
        onDelete={deleteCategory}
        categories={categories}
      />

      {/* ─── Main layout ──────────────────────────────────────────── */}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 transition-colors duration-300">
        <div className="max-w-xl mx-auto relative">
          
          {/* Header */}
          <header className="mb-8 flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-2">Mi espacio</p>
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitle}
                  onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') { setTitleDraft(pageTitle); setEditingTitle(false) } }}
                  className="text-3xl font-bold text-gray-900 tracking-tight bg-indigo-50 border border-indigo-300 rounded-xl px-3 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                />
              ) : (
                <h1
                  className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group inline-flex items-center gap-2"
                  onClick={() => { setTitleDraft(pageTitle); setEditingTitle(true) }}
                  title="Hacé click para editar"
                >
                  {pageTitle}
                  <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </h1>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 text-gray-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-yellow-400 focus:outline-none transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
                title={darkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20"
                title="Cerrar sesión"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Salir</span>
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

          {/* Status filter */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'pending', label: 'Pendientes' },
              { id: 'completed', label: 'Completadas' },
              { id: 'overdue', label: 'Vencidas' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === status.id
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Stats */}
          <StatsBar todos={todos} />

          {/* Error banner */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}

          {/* Todo list */}
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-16 text-gray-300 dark:text-gray-600">
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

// ─── Main App Wrapper ────────────────────────────────────────────────────────

export default function App() {
  if (missingEnvVars) return <MissingEnvScreen />

  const [session, setSession] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoadingSession(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900 transition-colors duration-300">
        <svg className="w-8 h-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
        </svg>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return <TodoApp />
}
