import { Check } from 'lucide-react';
import { formatDayTime } from '@/lib/dates';
import type { ContactChannel } from '../services/followupService';

const WORDS: Record<ContactChannel, string> = {
  whatsapp: 'on WhatsApp',
  sms: 'by SMS',
  call: 'by phone',
  other: '',
};

/** "Contacted on WhatsApp · Mon, 9:15 am". Words as well as the tick, so it never relies on colour. */
export function ContactedBadge({ contactedAt, channel }: { contactedAt: string; channel: ContactChannel | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
      <Check className="size-3.5" aria-hidden="true" />
      Contacted {channel ? WORDS[channel] : ''} · {formatDayTime(contactedAt)}
    </span>
  );
}
