// Supabase Edge Function — receives Stripe webhooks and updates profile billing state.
// Deploy: `supabase functions deploy stripe-webhook --no-verify-jwt`
// Secrets required: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY
//
// Point Stripe dashboard webhook at: https://<project>.functions.supabase.co/stripe-webhook
// Subscribe to:
//   - checkout.session.completed
//   - customer.subscription.updated
//   - customer.subscription.deleted

// @ts-nocheck — Deno runtime types
import Stripe from 'https://esm.sh/stripe@14?target=denonext'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// Service-role client — bypasses RLS so we can update any user's profile.
const supa = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature') ?? ''
  const raw = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, webhookSecret)
  } catch (err) {
    return new Response(`Webhook signature failed: ${err instanceof Error ? err.message : err}`, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session
        const userId = s.metadata?.supabase_user_id
        const planTier = s.metadata?.plan_tier
        if (userId) {
          await supa.from('profiles').update({
            subscription_status: 'active',
            plan_tier: planTier ?? null,
            stripe_customer_id: typeof s.customer === 'string' ? s.customer : null,
            stripe_subscription_id: typeof s.subscription === 'string' ? s.subscription : null,
          }).eq('id', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const status =
          sub.status === 'active' || sub.status === 'trialing' ? 'active'
          : sub.status === 'canceled' ? 'cancelled'
          : sub.status === 'past_due' || sub.status === 'unpaid' || sub.status === 'incomplete_expired' ? 'expired'
          : 'active'
        await supa.from('profiles')
          .update({ subscription_status: status })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supa.from('profiles')
          .update({ subscription_status: 'expired' })
          .eq('stripe_subscription_id', sub.id)
        break
      }
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(`Handler error: ${err instanceof Error ? err.message : err}`, { status: 500 })
  }
})
