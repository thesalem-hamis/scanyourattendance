import { useMemo } from 'react';
import { MessageCircle, MessageSquare } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { CHURCHES } from '@/config/churches';
import { DEFAULT_MESSAGE_TEMPLATES } from '@/config/messageTemplates';
import { buildSmsLink, buildWhatsAppLink, renderTemplate } from '@/lib/messaging';
import { buildPassUrl } from '@/lib/qr';
import type { Pass } from '../services/passService';

interface SendPassButtonsProps {
  pass: Pick<Pass, 'fullName' | 'churchGroup' | 'qrToken'>;
  /** E.164 number. Leave out to let the person pick who to send it to. */
  phone?: string | null;
}

/** Click-to-send links: the message is sent from the sender's own WhatsApp / SMS app. */
export function SendPassButtons({ pass, phone }: SendPassButtonsProps) {
  const { whatsappLink, smsLink } = useMemo(() => {
    const text = renderTemplate(DEFAULT_MESSAGE_TEMPLATES.passShare, {
      name: pass.fullName.split(/\s+/)[0] ?? pass.fullName,
      church: CHURCHES[pass.churchGroup].label,
      link: buildPassUrl(pass.qrToken),
    });
    return { whatsappLink: buildWhatsAppLink(phone, text), smsLink: buildSmsLink(phone, text) };
  }, [pass.fullName, pass.churchGroup, pass.qrToken, phone]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <a
        href={whatsappLink}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonVariants({ variant: 'outline' })}
      >
        <MessageCircle className="mr-2 size-4" />
        WhatsApp
      </a>
      <a href={smsLink} className={buttonVariants({ variant: 'outline' })}>
        <MessageSquare className="mr-2 size-4" />
        SMS
      </a>
    </div>
  );
}
