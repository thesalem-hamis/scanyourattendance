import { MessageCircle, MessageSquare, Phone, Undo2 } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import { formatShortDate } from '@/lib/dates';
import { buildSmsLink, buildWhatsAppLink } from '@/lib/messaging';
import { formatPhoneDisplay } from '@/lib/phone';
import type { Absentee, ContactChannel } from '../services/followupService';
import { ContactedBadge } from './ContactedBadge';

interface AbsenteeRowProps {
  absentee: Absentee;
  /** The finished message for this person. */
  message: string;
  onContact: (channel: ContactChannel) => void;
  onUndo: () => void;
}

export function AbsenteeRow({ absentee, message, onContact, onUndo }: AbsenteeRowProps) {
  const contacted = absentee.contactedAt !== null;

  return (
    <li className="space-y-3 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:space-y-0">
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium">{absentee.fullName}</p>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <ChurchBadge church={absentee.churchGroup} />
          <span className="tabular-nums">{formatPhoneDisplay(absentee.phone)}</span>
          <span>
            {absentee.lastAttended ? `Last came ${formatShortDate(absentee.lastAttended)}` : 'Has never checked in'}
          </span>
        </div>
        {contacted && absentee.contactedAt && (
          <ContactedBadge contactedAt={absentee.contactedAt} channel={absentee.contactedChannel} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Plain links, so they open the real apps. Tapping one also marks the person as contacted. */}
        <a
          href={buildWhatsAppLink(absentee.phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          onClick={() => onContact('whatsapp')}
        >
          <MessageCircle className="mr-2 size-4" aria-hidden="true" />
          WhatsApp
        </a>
        <a
          href={buildSmsLink(absentee.phone, message)}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
          onClick={() => onContact('sms')}
        >
          <MessageSquare className="mr-2 size-4" aria-hidden="true" />
          SMS
        </a>
        <Button variant="ghost" size="sm" onClick={() => onContact('call')}>
          <Phone className="mr-2 size-4" aria-hidden="true" />
          Called
        </Button>
        {contacted && (
          <Button variant="ghost" size="sm" onClick={onUndo} aria-label={`Undo contacted for ${absentee.fullName}`}>
            <Undo2 className="mr-2 size-4" aria-hidden="true" />
            Undo
          </Button>
        )}
      </div>
    </li>
  );
}
