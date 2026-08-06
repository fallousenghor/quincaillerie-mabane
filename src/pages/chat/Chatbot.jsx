import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MessageCircle, Send, Loader, ExternalLink } from 'lucide-react'

const initialAssistantMessage =
  "Bonjour ! 👋 Je suis l'assistant AI de Quincaillerie Mabane. Pose-moi une question sur nos produits, services, stock, facturation, clients, ou toute autre information sur notre boutique. Je utilise une base de connaissances complète et OpenAI pour te répondre avec précision."

async function answerQuestion(query) {
  const { data, error } = await supabase.functions.invoke('chat-with-rag', {
    body: { query },
  })

  if (error) {
    throw new Error(error.message || 'Erreur lors de l\'appel à l\'assistant.')
  }

  return {
    answer: data.answer,
    sources: data.sources || [],
  }
}

function formatProductAnswer(products) {
  if (!products.length) return null

  const rows = products.map((product) => {
    const category = product.categories?.name || 'Sans catégorie'
    return `- ${product.name} (${category}) : stock ${product.stock}, prix ${product.sale_price} FCFA`
  })

  return `Voici les produits correspondant à votre question :\n${rows.join('\n')}`
}

function formatTopProducts(products) {
  if (!products.length) return null

  const rows = products.map((product, index) => {
    return `#${index + 1} ${product.product_name} — ${product.total_quantity} vendus`
  })

  return `Voici les produits les plus vendus :\n${rows.join('\n')}`
}

function formatMostExpensive(products) {
  if (!products.length) return null

  const rows = products.map((product, index) => {
    return `#${index + 1} ${product.name} — ${product.sale_price} FCFA` 
  })

  return `Voici les produits les plus chers :\n${rows.join('\n')}`
}

function formatLowStock(products) {
  if (!products.length) return null

  const rows = products.map((product) => {
    return `- ${product.name} : stock ${product.stock} (seuil ${product.alert_threshold})`
  })

  return `Produits en stock bas ou en rupture :\n${rows.join('\n')}`
}

function formatClientAnswer(clients) {
  if (!clients.length) return null

  const rows = clients.map((client) => `- ${client.name} (${client.phone || 'pas de téléphone'})`)
  return `Clients trouvés :\n${rows.join('\n')}`
}

function formatSupplierAnswer(suppliers) {
  if (!suppliers.length) return null

  const rows = suppliers.map((supplier) => `- ${supplier.name} (${supplier.phone || 'pas de téléphone'})`)
  return `Fournisseurs trouvés :\n${rows.join('\n')}`
}

async function getBestSellingProducts() {
  const { data, error } = await supabase
    .from('sale_items')
    .select('product_name,quantity')
    .limit(1000)

  if (error) throw new Error(error.message)

  const totals = data.reduce((acc, item) => {
    const name = item.product_name
    acc[name] = (acc[name] || 0) + item.quantity
    return acc
  }, {})

  return Object.entries(totals)
    .map(([product_name, total_quantity]) => ({ product_name, total_quantity }))
    .sort((a, b) => b.total_quantity - a.total_quantity)
    .slice(0, 5)
}

async function getMostExpensiveProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,sale_price')
    .order('sale_price', { ascending: false })
    .limit(5)

  if (error) throw new Error(error.message)
  return data
}

async function getLowStockProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('id,name,stock,alert_threshold')
    .order('stock', { ascending: true })
    .limit(20)

  if (error) throw new Error(error.message)

  return data.filter((product) => product.stock <= product.alert_threshold)
}

async function answerQuestion(query) {
  const normalized = query.trim().toLowerCase()

  if (!normalized) {
    return 'Merci de poser une question pour que je puisse vous aider.'
  }

  const isProductQuestion = /produit|article|stock|rupture|quantité|prix|disponible/.test(normalized)
  const isMostExpensiveQuestion = /plus cher|cher|prix.*élevé|coûte le plus/.test(normalized)
  const isBestSellerQuestion = /plus vendu|top produit|meilleur vendeur|meilleur produit|meilleur article/.test(normalized)
  const isLowStockQuestion = /rupture|en rupture|faible stock|stock faible|manque|épuisé/.test(normalized)
  const isClientQuestion = /client|clientèle|clients|acheteur/.test(normalized)
  const isSupplierQuestion = /fournisseur|fournisseurs|approvisionnement|commande fournisseur/.test(normalized)
  const isSalesQuestion = /vente|facture|recette|chiffre|montant|total|bénéfice|revenu/.test(normalized)

  if (isProductQuestion) {
    if (isBestSellerQuestion) {
      const products = await getBestSellingProducts()
      const answer = formatTopProducts(products)
      return answer || 'Je n’ai pas encore assez de ventes pour déterminer les produits les plus vendus.'
    }

    if (isMostExpensiveQuestion) {
      const products = await getMostExpensiveProducts()
      const answer = formatMostExpensive(products)
      return answer || 'Je n’ai pas trouvé de produits chers pour le moment.'
    }

    if (isLowStockQuestion) {
      const products = await getLowStockProducts()
      const answer = formatLowStock(products)
      return answer || 'Aucun produit n’est actuellement en dessous de son seuil d’alerte.'
    }

    const { data, error } = await supabase
      .from('products')
      .select('id,name,stock,sale_price,categories(name)')
      .ilike('name', `%${query}%`)
      .limit(8)

    if (error) throw new Error(error.message)
    const answer = formatProductAnswer(data)
    if (answer) return answer

    return 'Je n’ai pas trouvé de produit correspondant exactement à votre question. Essayez un nom de produit ou demandez "produits en rupture".'
  }

  if (isClientQuestion) {
    const { data, error } = await supabase
      .from('clients')
      .select('id,name,phone,email')
      .ilike('name', `%${query}%`)
      .limit(8)

    if (error) throw new Error(error.message)
    const answer = formatClientAnswer(data)
    if (answer) return answer

    return 'Je n’ai pas trouvé de client correspondant. Vous pouvez me demander par exemple "clients récents".'
  }

  if (isSupplierQuestion) {
    const { data, error } = await supabase
      .from('suppliers')
      .select('id,name,phone,email')
      .ilike('name', `%${query}%`)
      .limit(8)

    if (error) throw new Error(error.message)
    const answer = formatSupplierAnswer(data)
    if (answer) return answer

    return 'Je n’ai pas trouvé de fournisseur correspondant. Essayez un nom de fournisseur ou demandez "fournisseurs".'
  }

  if (isSalesQuestion) {
    const { data, error } = await supabase
      .from('sales')
      .select('id,invoice_number,total,status,created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw new Error(error.message)

    if (!data.length) {
      return 'Je n’ai pas de ventes enregistrées pour le moment.'
    }

    const rows = data.map((sale) => {
      const date = new Date(sale.created_at).toLocaleDateString('fr-FR')
      return `- Facture ${sale.invoice_number} : ${sale.total} FCFA (${sale.status}) le ${date}`
    })

    return `Voici les dernières ventes :\n${rows.join('\n')}`
  }

  return `Je peux répondre aux questions suivantes :\n` +
    '- Produits et stock\n' +
    '- Disponibilité et ruptures\n' +
    '- Clients et fournisseurs\n' +
    '- Ventes et factures\n' +
    'Essayez par exemple : "Quels produits sont en rupture ?" ou "Donne-moi les clients récents."'
}

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: initialAssistantMessage },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const answer = await answerQuestion(trimmed)
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }])
    } catch (err) {
      setError(err.message || 'Erreur lors de la génération de la réponse.')
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Désolé, je n’ai pas pu répondre. Réessayez.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm dark:border-gray-700/80 dark:bg-darkcard">
        <div className="flex items-center gap-3 text-brand-600 dark:text-brand-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-900/30">
            <MessageCircle size={24} />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Assistant AI Quincaillerie</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Powered by OpenAI + RAG. Pose une question sur n\'importe quel aspect de la quincaillerie.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <div className="max-h-[600px] space-y-4 overflow-y-auto rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm dark:border-gray-700/80 dark:bg-darkcard">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="space-y-2">
              <div
                className={`rounded-3xl px-4 py-3 text-sm shadow-sm ${
                  message.role === 'assistant'
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'ml-auto max-w-[90%] bg-brand-600 text-white dark:bg-brand-500'
                }`}
              >
                {message.content.split('\n').map((line, lineIndex) => (
                  <p key={lineIndex} className="mb-1 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>

              {message.sources && message.sources.length > 0 && (
                <div className="mx-4 space-y-2 border-l-2 border-brand-300 bg-brand-50 px-3 py-2 text-xs text-gray-600 dark:border-brand-700 dark:bg-brand-900/20 dark:text-gray-300">
                  <p className="font-semibold">📚 Sources:</p>
                  {message.sources.map((source, srcIndex) => (
                    <p key={srcIndex} className="flex items-center gap-1">
                      <ExternalLink size={12} />
                      <span>
                        {source.title} <span className="text-gray-500">({source.category})</span>
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader size={16} className="animate-spin" />
              <span>L\'assistant réfléchit...</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex items-center gap-3 rounded-3xl border border-gray-200/80 bg-white p-3 shadow-sm dark:border-gray-700/80 dark:bg-darkcard">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Pose ta question ici..."
            className="flex-1 rounded-2xl border border-transparent bg-gray-100 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-300 focus:bg-white dark:bg-gray-900 dark:text-gray-100 dark:focus:bg-gray-800"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Envoi...' : 'Envoyer'}
            <Send size={16} />
          </button>
        </form>
        {error && <p className="rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}
      </div>
    </div>
  )
}
