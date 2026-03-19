import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/** @typedef {{ id: string, title: string, completed: boolean, due_date: string|null, category_id: string|null, position: number, created_at: string }} Todo */

/**
 * Hook to manage all TODO operations against Supabase.
 * Todos are always returned sorted by `position` ascending.
 */
export function useTodos() {
  /** @type {[Todo[], Function]} */
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─── GET ────────────────────────────────────────────────────────────────────

  const getTodos = useCallback(async (categoryId = null) => {
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('todos')
        .select('*, categories(id, name, color)')
        .order('position', { ascending: true })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error: sbError } = await query
      if (sbError) throw sbError
      setTodos(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getTodos()
  }, [getTodos])

  // ─── ADD ────────────────────────────────────────────────────────────────────

  /**
   * @param {{ title: string, due_date?: string|null, category_id?: string|null }} payload
   */
  const addTodo = useCallback(async (payload) => {
    setError(null)
    try {
      // Determine next position value
      const maxPosition = todos.length > 0
        ? Math.max(...todos.map((t) => t.position))
        : -1

      const { data, error: sbError } = await supabase
        .from('todos')
        .insert({
          title: payload.title,
          completed: false,
          due_date: payload.due_date ?? null,
          category_id: payload.category_id ?? null,
          position: maxPosition + 1,
        })
        .select('*, categories(id, name, color)')
        .single()

      if (sbError) throw sbError
      setTodos((prev) => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [todos])

  // ─── UPDATE ─────────────────────────────────────────────────────────────────

  /**
   * @param {string} id
   * @param {Partial<Todo>} updates
   */
  const updateTodo = useCallback(async (id, updates) => {
    setError(null)
    try {
      const { data, error: sbError } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id)
        .select('*, categories(id, name, color)')
        .single()

      if (sbError) throw sbError
      setTodos((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  // ─── DELETE ─────────────────────────────────────────────────────────────────

  /**
   * @param {string} id
   */
  const deleteTodo = useCallback(async (id) => {
    setError(null)
    try {
      const { error: sbError } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (sbError) throw sbError
      setTodos((prev) => prev.filter((t) => t.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  // ─── REORDER ────────────────────────────────────────────────────────────────

  /**
   * Reorder todos after a drag-and-drop.
   * Accepts the new ordered array, optimistically updates local state,
   * then batch-updates `position` in Supabase.
   *
   * @param {Todo[]} reordered - The full array in the new desired order.
   */
  const reorderTodos = useCallback(async (reordered) => {
    // Optimistic update
    setTodos(reordered)

    try {
      // Build an array of upsert rows with updated positions
      const updates = reordered.map((todo, index) => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        due_date: todo.due_date,
        category_id: todo.category_id,
        position: index,
      }))

      const { error: sbError } = await supabase
        .from('todos')
        .upsert(updates, { onConflict: 'id' })

      if (sbError) throw sbError
    } catch (err) {
      setError(err.message)
      // Rollback: re-fetch from DB
      getTodos()
    }
  }, [getTodos])

  return {
    todos,
    loading,
    error,
    getTodos,
    addTodo,
    updateTodo,
    deleteTodo,
    reorderTodos,
  }
}
