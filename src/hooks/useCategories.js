import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/** @typedef {{ id: string, name: string, color: string, created_at: string }} Category */

/**
 * Hook to manage categories.
 */
export function useCategories() {
  /** @type {[Category[], Function]} */
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─── GET ────────────────────────────────────────────────────────────────────

  const getCategories = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setCategories([])
        return
      }

      const { data, error: sbError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (sbError) throw sbError
      setCategories(data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getCategories()
  }, [getCategories])

  // ─── ADD ────────────────────────────────────────────────────────────────────

  /**
   * @param {{ name: string, color: string }} payload
   */
  const addCategory = useCallback(async (payload) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { data, error: sbError } = await supabase
        .from('categories')
        .insert({
          name: payload.name,
          color: payload.color ?? '#6366f1',
          user_id: user.id
        })
        .select()
        .single()

      if (sbError) throw sbError
      setCategories((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
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
  const deleteCategory = useCallback(async (id) => {
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No user logged in')

      const { error: sbError } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (sbError) throw sbError
      setCategories((prev) => prev.filter((c) => c.id !== id))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  return {
    categories,
    loading,
    error,
    getCategories,
    addCategory,
    deleteCategory,
  }
}
