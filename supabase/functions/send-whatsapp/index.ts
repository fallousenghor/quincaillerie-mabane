// supabase/functions/send-whatsapp/index.ts
//
// FONCTION EDGE OPTIONNELLE — Envoi WhatsApp 100% automatique côté serveur
// via l'API Meta WhatsApp Cloud (sans clic utilisateur, sans exposer de clé API au navigateur).
//
// Déploiement :
//   supabase functions deploy send-whatsapp
//   supabase secrets set WHATSAPP_TOKEN=xxxx WHATSAPP_PHONE_ID=xxxx
//
// Appel depuis le frontend :
//   await supabase.functions.invoke('send-whatsapp', { body: { phone, message } })
//
// Prérequis : un compte Meta for Developers avec un numéro WhatsApp Business configuré.
// Documentation : https://developers.facebook.com/docs/whatsapp/cloud-api

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts'

const WHATSAPP_TOKEN = Deno.env.get('WHATSAPP_TOKEN')
const WHATSAPP_PHONE_ID = Deno.env.get('WHATSAPP_PHONE_ID')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message } = await req.json()

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: 'phone et message requis' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_ID) {
      return new Response(
        JSON.stringify({ error: 'WHATSAPP_TOKEN / WHATSAPP_PHONE_ID non configurés côté serveur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const response = await fetch(`https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone,
        type: 'text',
        text: { body: message },
      }),
    })

    const result = await response.json()

    return new Response(JSON.stringify(result), {
      status: response.ok ? 200 : 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
