import type { ChurchGroup } from '@/types';

export interface ChurchStyle {
  label: string;
  /** Pill / badge classes */
  badge: string;
  /** Solid background (buttons, big result cards) */
  solid: string;
  /** Soft tinted background (cards) */
  soft: string;
  /** Text colour */
  text: string;
  /** Hex colour for charts */
  chart: string;
}

/** Church 1 = emerald, Church 2 = amber. Keep full class names so Tailwind can see them. */
export const CHURCHES: Record<ChurchGroup, ChurchStyle> = {
  'Church 1': {
    label: 'Church 1',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    solid: 'bg-emerald-600 text-white',
    soft: 'bg-emerald-50',
    text: 'text-emerald-700',
    chart: '#059669',
  },
  'Church 2': {
    label: 'Church 2',
    badge: 'border-amber-200 bg-amber-50 text-amber-800',
    solid: 'bg-amber-500 text-amber-950',
    soft: 'bg-amber-50',
    text: 'text-amber-700',
    chart: '#d97706',
  },
};

export const CHURCH_GROUPS = Object.keys(CHURCHES) as ChurchGroup[];
