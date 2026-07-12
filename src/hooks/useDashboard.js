import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const [salesToday, salesMonth, products, expensesMonth, saleItemsMonth] = await Promise.all([
        supabase.from('sales').select('total, created_at').gte('created_at', startOfToday.toISOString()).neq('status', 'annulee'),
        supabase.from('sales').select('total, created_at').gte('created_at', startOfMonth.toISOString()).neq('status', 'annulee'),
        supabase.from('products').select('id, name, stock, alert_threshold, sale_price'),
        supabase.from('expenses').select('amount, created_at').gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('sale_items')
          .select('product_name, quantity, unit_price, purchase_price, line_total, sales!inner(id, created_at, discount, status)')
          .gte('sales.created_at', startOfMonth.toISOString())
          .neq('sales.status', 'annulee'),
      ])

      if (salesToday.error) throw salesToday.error
      if (salesMonth.error) throw salesMonth.error
      if (products.error) throw products.error
      if (expensesMonth.error) throw expensesMonth.error
      if (saleItemsMonth.error) throw saleItemsMonth.error

      const totalToday = salesToday.data.reduce((sum, s) => sum + Number(s.total), 0)
      const totalMonth = salesMonth.data.reduce((sum, s) => sum + Number(s.total), 0)
      const totalExpensesMonth = expensesMonth.data.reduce((sum, e) => sum + Number(e.amount), 0)
      const lowStock = products.data.filter((p) => p.stock <= p.alert_threshold)
      const discountBySale = new Map()
      const grossMarginMonth = saleItemsMonth.data.reduce((sum, item) => {
        const saleId = item.sales?.id
        const discount = Number(item.sales?.discount || 0)
        if (saleId && !discountBySale.has(saleId)) discountBySale.set(saleId, discount)
        return sum + (Number(item.unit_price || 0) - Number(item.purchase_price || 0)) * Number(item.quantity || 0)
      }, 0)
      const totalDiscountMonth = Array.from(discountBySale.values()).reduce((sum, discount) => sum + discount, 0)

      const productTotals = {}
      saleItemsMonth.data.forEach((item) => {
        if (!productTotals[item.product_name]) {
          productTotals[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 }
        }
        productTotals[item.product_name].quantity += item.quantity
        productTotals[item.product_name].revenue += Number(item.line_total)
      })
      const topProducts = Object.values(productTotals)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5)

      return {
        salesTodayCount: salesToday.data.length,
        totalToday,
        salesMonthCount: salesMonth.data.length,
        totalMonth,
        totalExpensesMonth,
        grossMarginMonth: grossMarginMonth - totalDiscountMonth,
        profitMonth: grossMarginMonth - totalDiscountMonth - totalExpensesMonth,
        lowStock,
        topProducts,
        totalProducts: products.data.length,
      }
    },
    refetchInterval: 60000,
  })
}
