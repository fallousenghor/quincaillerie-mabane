import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const openaiKey = Deno.env.get('OPENAI_API_KEY')

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function searchKnowledgeBase(query, limit = 5) {
  // Simple semantic search using text similarity in Supabase
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, category, title, content')
    .textSearch('fts', query, { config: 'french' })
    .limit(limit)

  if (error) {
    console.error('KB search error:', error)
    return []
  }

  return data || []
}

async function callOpenAI(systemPrompt, userMessage) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${data.error?.message || 'Unknown error'}`)
  }

  return data.choices[0].message.content
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()

    if (!query || !query.trim()) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Search knowledge base for relevant documents
    const relevantDocs = await searchKnowledgeBase(query, 5)

    // Build context from relevant documents
    let context = 'Vous êtes un assistant expert pour Quincaillerie Mabane.\n\n'
    if (relevantDocs.length > 0) {
      context += 'Voici les informations pertinentes de notre base de connaissances :\n'
      relevantDocs.forEach((doc, index) => {
        context += `\n[${index + 1}] ${doc.title} (${doc.category})\n${doc.content}`
      })
      context += '\n\nUtilise ces informations pour répondre à la question de l\'utilisateur.'
    } else {
      context += 'Tu es l\'assistant de Quincaillerie Mabane à Diouroup, Sénégal. '
      context += 'Réponds uniquement aux questions concernant notre quincaillerie, nos produits, nos services et nos processus. '
      context += 'Si tu ne sais pas, dis-le poliment et suggère de contacter Momo Faye directement.'
    }

    const systemPrompt = context + '\n\nRéponds en français, de manière utile et professionnelle.'

    // Call OpenAI with RAG context
    const answer = await callOpenAI(systemPrompt, query)

    return new Response(
      JSON.stringify({
        answer,
        sources: relevantDocs.map((doc) => ({ title: doc.title, category: doc.category })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    console.error('Error:', err)
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
