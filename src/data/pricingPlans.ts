import { PricingPlan } from '../types';

export const CREDIT_UNIT_PRICE_USD = 0.99;
export const MAX_TOP_UP_CREDITS = 50;
export const MIN_TOP_UP_CREDITS = 1;

export const PRESET_TOP_UP_TIERS: PricingPlan[] = [
  {
    id: 'pack-1',
    name: 'Single Lead',
    credits: 1,
    priceUsd: 0.99,
    unitPrice: '$0.99 / lead',
  },
  {
    id: 'pack-5',
    name: 'Starter 5',
    credits: 5,
    priceUsd: 4.95,
    unitPrice: '$0.99 / lead',
  },
  {
    id: 'pack-10',
    name: 'Popular 10',
    credits: 10,
    priceUsd: 9.90,
    badge: 'Popular',
    popular: true,
    unitPrice: '$0.99 / lead',
  },
  {
    id: 'pack-25',
    name: 'Pro 25',
    credits: 25,
    priceUsd: 24.75,
    badge: 'Recommended',
    unitPrice: '$0.99 / lead',
  },
  {
    id: 'pack-50',
    name: 'Max Allocation',
    credits: 50,
    priceUsd: 49.50,
    badge: 'Max (50 Cr)',
    unitPrice: '$0.99 / lead',
  }
];

export const PRICING_PLANS = PRESET_TOP_UP_TIERS;
