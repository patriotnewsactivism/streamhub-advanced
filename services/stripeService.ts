/**
 * Stripe Integration Service for ChatScreamer™
 *
 * Handles payment processing for donation alerts
 *
 * SETUP REQUIRED:
 * 1. Create Stripe account at https://stripe.com
 * 2. Get publishable key from Dashboard > Developers > API keys
 * 3. Set VITE_STRIPE_PUBLISHABLE_KEY in environment
 * 4. Set up webhook endpoint for payment confirmations
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';

// Stripe publishable key (client-side safe)
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';
const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

// Singleton Stripe instance
let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Get or initialize Stripe instance
 */
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && STRIPE_PUBLISHABLE_KEY) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise || Promise.resolve(null);
};

/**
 * ChatScreamer tier configuration
 * Higher tiers = more obnoxious + longer duration
 */
export const CHATSCREAMER_TIERS = {
  // $5-9: Basic tier - simple alert
  basic: {
    minAmount: 5,
    maxAmount: 9.99,
    label: 'Shout',
    duration: 5000, // 5 seconds
    voiceSpeed: 1.0,
    voiceVolume: 0.7,
    animation: 'fade',
    soundEffect: 'chime',
    fontSize: 'text-lg',
    particles: 0,
    color: 'from-blue-600 to-blue-800',
    border: 'border-blue-500',
    allowEmoji: false,
    repeatMessage: 1,
  },
  // $10-24: Louder, longer
  loud: {
    minAmount: 10,
    maxAmount: 24.99,
    label: 'LOUD Shout',
    duration: 8000, // 8 seconds
    voiceSpeed: 1.1,
    voiceVolume: 0.85,
    animation: 'bounce',
    soundEffect: 'airhorn',
    fontSize: 'text-xl',
    particles: 5,
    color: 'from-green-500 to-emerald-700',
    border: 'border-green-400',
    allowEmoji: true,
    repeatMessage: 1,
  },
  // $25-49: Very obnoxious
  mega: {
    minAmount: 25,
    maxAmount: 49.99,
    label: 'MEGA Scream',
    duration: 12000, // 12 seconds
    voiceSpeed: 1.2,
    voiceVolume: 0.95,
    animation: 'explosion',
    soundEffect: 'airhorn_long',
    fontSize: 'text-2xl',
    particles: 15,
    color: 'from-yellow-400 to-orange-600',
    border: 'border-yellow-400',
    allowEmoji: true,
    repeatMessage: 2, // Says it twice!
  },
  // $50-99: Maximum chaos
  ultra: {
    minAmount: 50,
    maxAmount: 99.99,
    label: 'ULTRA SCREAM',
    duration: 18000, // 18 seconds
    voiceSpeed: 0.8, // Slower for dramatic effect
    voiceVolume: 1.0,
    animation: 'earthquake',
    soundEffect: 'siren',
    fontSize: 'text-3xl',
    particles: 30,
    color: 'from-red-500 to-pink-600',
    border: 'border-red-400',
    allowEmoji: true,
    repeatMessage: 2,
    screenShake: true,
  },
  // $100+: LEGENDARY - Full screen takeover
  legendary: {
    minAmount: 100,
    maxAmount: Infinity,
    label: '🔥 LEGENDARY 🔥',
    duration: 25000, // 25 seconds - they paid for it!
    voiceSpeed: 0.7, // Super dramatic
    voiceVolume: 1.0,
    animation: 'legendary',
    soundEffect: 'legendary_fanfare',
    fontSize: 'text-4xl',
    particles: 50,
    color: 'from-purple-500 via-pink-500 to-red-500',
    border: 'border-purple-400',
    allowEmoji: true,
    repeatMessage: 3, // Says it THREE times!
    screenShake: true,
    fullScreenTakeover: true,
    confetti: true,
  },
};

export type ChatScreamerTier = keyof typeof CHATSCREAMER_TIERS;

/**
 * Get tier based on donation amount
 */
export const getTierForAmount = (amount: number): ChatScreamerTier => {
  if (amount >= 100) return 'legendary';
  if (amount >= 50) return 'ultra';
  if (amount >= 25) return 'mega';
  if (amount >= 10) return 'loud';
  return 'basic';
};

/**
 * Get tier configuration for amount
 */
export const getTierConfig = (amount: number) => {
  const tierName = getTierForAmount(amount);
  return { ...CHATSCREAMER_TIERS[tierName], tierName };
};

/**
 * Create a payment intent for ChatScreamer donation
 */
export interface CreatePaymentIntentParams {
  amount: number; // In dollars
  currency?: string;
  donorName: string;
  message: string;
  streamerId: string;
  streamerEmail?: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  tier: ChatScreamerTier;
  tierConfig: typeof CHATSCREAMER_TIERS[ChatScreamerTier];
}

export const createPaymentIntent = async (
  params: CreatePaymentIntentParams
): Promise<PaymentIntentResponse> => {
  const response = await fetch(`${API_BASE}/api/chatscreamer/create-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(params.amount * 100), // Convert to cents
      currency: params.currency || 'usd',
      donorName: params.donorName,
      message: params.message,
      streamerId: params.streamerId,
      streamerEmail: params.streamerEmail,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create payment');
  }

  const data = await response.json();
  const tierName = getTierForAmount(params.amount);

  return {
    clientSecret: data.clientSecret,
    paymentIntentId: data.paymentIntentId,
    tier: tierName,
    tierConfig: CHATSCREAMER_TIERS[tierName],
  };
};

/**
 * Confirm payment with Stripe
 */
export const confirmPayment = async (
  clientSecret: string,
  paymentMethod: any
): Promise<{ success: boolean; error?: string }> => {
  const stripe = await getStripe();
  if (!stripe) {
    return { success: false, error: 'Stripe not initialized' };
  }

  const result = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod,
  });

  if (result.error) {
    return { success: false, error: result.error.message };
  }

  return { success: true };
};

/**
 * Get streamer's ChatScreamer earnings
 */
export interface EarningsData {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  recentDonations: Array<{
    id: string;
    donorName: string;
    amount: number;
    message: string;
    timestamp: string;
    tier: ChatScreamerTier;
  }>;
}

export const getEarnings = async (streamerId: string): Promise<EarningsData> => {
  const response = await fetch(`${API_BASE}/api/chatscreamer/earnings/${streamerId}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch earnings');
  }

  return response.json();
};

/**
 * Webhook event types from Stripe
 */
export type StripeWebhookEvent =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'charge.refunded';

/**
 * Process webhook event (called by backend)
 */
export interface WebhookPayload {
  type: StripeWebhookEvent;
  data: {
    object: {
      id: string;
      amount: number;
      metadata: {
        donorName: string;
        message: string;
        streamerId: string;
      };
    };
  };
}

export default {
  getStripe,
  createPaymentIntent,
  confirmPayment,
  getEarnings,
  getTierForAmount,
  getTierConfig,
  CHATSCREAMER_TIERS,
};
