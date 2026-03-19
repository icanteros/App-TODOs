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
      const { data, error: sbError } = await supabase
        .from('categories')
        .select('*')
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
      const { data, error: sbError } = await supabase
        .from('categories')
        .insert({
          name: payload.name,
          color: payload.color ?? '#6366f1',
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

  return {
    categories,
    loading,
    error,
    getCategories,
    addCategory,
  }
}
