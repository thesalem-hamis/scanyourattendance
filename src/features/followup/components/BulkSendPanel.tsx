import { useState } from 'react';
import { CircleCheck, MessageCircle } from 'lucide-react';
import { ChurchBadge } from '@/components/common/ChurchBadge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { buildWhatsAppLink } from '@/lib/messaging';
import { formatPhoneDisplay } from '@/lib/phone';
import type { Absentee } from '../services/followupService';

interface BulkSendPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who to go through, fixed when the panel was opened (so the list does not shift as people are marked). */
  queue: Absentee[];
  buildMessage: (absentee: Absentee) => string;
  /** Called when the WhatsApp link for someone is opened. */
  onSent: (absentee: Absentee) => void;
}

/**
 * WhatsApp opens one chat at a time, so "message everyone" means going down the list:
 * tap the big button, send in WhatsApp, come back, and the next person is ready.
 */
export function BulkSendPanel({ open, onOpenChange, queue, buildMessage, onSent }: BulkSendPanelProps) {
  const [index, setIndex] = useState(0);
  const [sent, setSent] = useState(0);

  const current = queue[index];
  const finished = index >= queue.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{finished ? 'All done' : 'Message everyone, one by one'}</DialogTitle>
          <DialogDescription>
            {finished
              ? `You opened WhatsApp for ${sent} of ${queue.length} ${queue.length === 1 ? 'person' : 'people'}.`
              : `Person ${index + 1} of ${queue.length}. After sending in WhatsApp, come back here for the next one.`}
          </DialogDescription>
        </DialogHeader>

        {finished ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CircleCheck className="size-12 text-green-600" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">Everyone you opened is marked as contacted.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-lg font-semibold">{current.fullName}</p>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <ChurchBadge church={current.churchGroup} />
                <span className="tabular-nums">{formatPhoneDisplay(current.phone)}</span>
              </div>
              <p className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">{buildMessage(current)}</p>
            </div>

            <progress className="h-2 w-full accent-primary" max={queue.length} value={index} aria-label="Progress" />

            <a
              href={buildWhatsAppLink(current.phone, buildMessage(current))}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ size: 'lg', className: 'w-full' })}
              onClick={() => {
                onSent(current);
                setSent((n) => n + 1);
                setIndex((i) => i + 1);
              }}
            >
              <MessageCircle className="mr-2 size-5" aria-hidden="true" />
              Open WhatsApp for {current.fullName.split(/\s+/)[0]}
            </a>
          </div>
        )}

        <DialogFooter>
          {!finished && (
            <Button variant="outline" onClick={() => setIndex((i) => i + 1)}>
              Skip this person
            </Button>
          )}
          <Button variant={finished ? 'default' : 'ghost'} onClick={() => onOpenChange(false)}>
            {finished ? 'Done' : 'Stop here'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
