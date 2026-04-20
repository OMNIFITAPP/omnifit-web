// Supabase Edge Function — creates a Stripe Checkout Session for the signed-in user.
// Deploy: `supabase functions deploy create-checkout-session`
// Secrets required: STRIPE_SECRET_KEY
//
// Called from the client via: supabase.functions.invoke('create-checkout-session', { body: {...} })
// The Supabase JS client automatically forwards the user's Bearer token so we
// can resolve the caller with `supabase.auth.getUser()`.

// @ts-nocheck — Deno runtime types
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { priceId, planTier, successUrl, cancelUrl } = await req.json()
    if (!priceId || !planTier || !successUrl || !cancelUrl) {
      return json({ error: 'Missing required fields' }, 400)
    }

    // Resolve caller from JWT
    const supa = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    )
    const { data: { user } } = await supa.auth.getUser()
    if (!user) return json({ error: 'Not authenticated' }, 401)

    // Reuse or create a Stripe customer
    const { data: profile } = await supa
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id as string | null
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? profile?.email ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supa.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan_tier: planTier },
      },
      metadata: { supabase_user_id: user.id, plan_tier: planTier },
    })

    return json({ url: session.url }, 200)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unknown error' }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
