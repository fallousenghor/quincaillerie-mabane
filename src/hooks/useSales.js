import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useSales() {
  return useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, clients(id, name, phone), sale_items(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useSale(saleId) {
  return useQuery({
    queryKey: ['sales', saleId],
    enabled: !!saleId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select('*, clients(id, name, phone), sale_items(*)')
        .eq('id', saleId)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ clientId, userId, discount, items, amountPaid }) => {
      const { data, error } = await supabase.rpc('create_sale', {
        p_client_id: clientId || null,
        p_user_id: userId || null,
        p_discount: discount || 0,
        p_items: items,
        p_amount_paid: amountPaid === undefined || amountPaid === null ? null : amountPaid,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useAddSalePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, amount }) => {
      const { data, error } = await supabase.rpc('add_sale_payment', {
        p_sale_id: saleId,
        p_amount: amount,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ saleId, userId }) => {
      const { error } = await supabase.rpc('cancel_sale', {
        p_sale_id: saleId,
        p_user_id: userId || null,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*, products(id, name)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (error) throw error
      return data
    },
  })
}

export function useAddStockEntry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, quantity, reason, userId }) => {
      const { error } = await supabase.rpc('add_stock_entry', {
        p_product_id: productId,
        p_quantity: quantity,
        p_reason: reason,
        p_user_id: userId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}
