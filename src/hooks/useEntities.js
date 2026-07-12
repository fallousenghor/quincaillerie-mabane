import { useSupabaseTable } from './useSupabaseTable'

export function useCategories() {
  return useSupabaseTable('categories', '*', { orderBy: 'name', ascending: true })
}

export function useClients() {
  return useSupabaseTable('clients', '*', { orderBy: 'name', ascending: true })
}

export function useSuppliers() {
  return useSupabaseTable(
    'suppliers',
    '*,supplier_products(product_id,products(id,name,category_id,purchase_price,sale_price,stock,unit))',
    { orderBy: 'name', ascending: true }
  )
}

export function useExpenses() {
  return useSupabaseTable('expenses', '*', { orderBy: 'created_at', ascending: false })
}
