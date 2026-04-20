import { supabase } from './supabase'
import type { PlanTier } from '../store/userStore'

// Stripe price IDs — wire in from env at build time.
// Fill in the dashboard price IDs via Vite env vars.
export const PRICE_IDS: Record<PlanTier, string> = {
  monthly:  import.meta.env.VITE_STRIPE_PRICE_MONTHLY  ?? '',
  annual:   import.meta.env.VITE_STRIPE_PRICE_ANNUAL   ?? '',
  founding: import.meta.env.VITE_STRIPE_PRICE_FOUNDING ?? '',
}

export const FOUNDING_LIMIT = 100

export interface PlanDef {
  tier: PlanTier
  label: string
  priceLabel: string
  cadence: string
  note?: string
}

export const PLANS: PlanDef[] = [
  { tier: 'monthly',  label: 'Monthly',         priceLabel: '$29',  cadence: 'per month', note: 'Cancel anytime.' },
  { tier: 'annual',   label: 'Annual',          priceLabel: '$199', cadence: 'per year',  note: 'Best value — 43% off monthly.' },
  { tier: 'founding', label: 'Founding member', priceLabel: '$149', cadence: 'per year',  note: 'Limited to 100 members. Founding badge, locked-in rate.' },
]

/**
 * Calls the `create-checkout-session` edge function which holds the Stripe
 * secret key server-side and returns a Checkout URL.
 * See supabase/functions/create-checkout-session/index.ts
 */
export async function startCheckout(tier: PlanTier): Promise<void> {
  const priceId = PRICE_IDS[tier]
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for ${tier}. Set VITE_STRIPE_PRICE_${tier.toUpperCase()}.`)
  }

  const { data, error } = await supabase.functions.invoke<{ url: string }>(
    'create-checkout-session',
    {
      body: {
        priceId,
        planTier: tier,
        successUrl: `${window.location.origin}/?checkout=success`,
        cancelUrl:  `${window.location.origin}/?checkout=cancelled`,
      },
    }
  )
  if (error) throw error
  if (!data?.url) throw new Error('Checkout session did not return a URL.')
  window.location.href = data.url
}

/** Counts active founding memberships so we can hide the tier when full. */
export async function fetchFoundingCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('plan_tier', 'founding')
      .eq('subscription_status', 'active')
    if (error) return 0
    return count ?? 0
  } catch {
    return 0
  }
}
