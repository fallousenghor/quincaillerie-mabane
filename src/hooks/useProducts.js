import { useSupabaseTable } from './useSupabaseTable'
import { supabase } from '../lib/supabase'

export function useProducts() {
  return useSupabaseTable(
    'products',
    '*, categories(id, name), supplier_products(supplier_id, suppliers(id, name, phone, contact_person))',
    { orderBy: 'name', ascending: true }
  )
}

export async function uploadProductImage(file) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('product-images').upload(fileName, file)
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
  return data.publicUrl
}
