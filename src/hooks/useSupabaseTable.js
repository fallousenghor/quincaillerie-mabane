import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Generic hook factory to read/write a Supabase table with React Query.
 * @param {string} table - table name
 * @param {string} selectQuery - columns / relations to select
 * @param {object} options - { orderBy, ascending, filters }
 */
export function useSupabaseTable(table, selectQuery = '*', options = {}) {
  const queryClient = useQueryClient()
  const { orderBy = 'created_at', ascending = false } = options

  const listQuery = useQuery({
    queryKey: [table, selectQuery, orderBy, ascending],
    queryFn: async () => {
      let query = supabase.from(table).select(selectQuery).order(orderBy, { ascending })
      const { data, error } = await query
      if (error) throw error
      return data
    },
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [table] })

  const createItem = useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.from(table).insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const updateItem = useMutation({
    mutationFn: async ({ id, ...payload }) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single()
      if (error) throw error
      return data
    },
    onSuccess: invalidate,
  })

  const deleteItem = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: invalidate,
  })

  return { ...listQuery, createItem, updateItem, deleteItem, invalidate }
}
