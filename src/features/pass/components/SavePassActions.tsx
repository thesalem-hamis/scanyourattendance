import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { getErrorMessage } from '@/lib/error';
import { savePassImage } from '../utils/exportPassImage';

interface SavePassActionsProps {
  /** Returns the pass card element to turn into an image. */
  getNode: () => HTMLElement | null;
  name: string;
}

export function SavePassActions({ getNode, name }: SavePassActionsProps) {
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const node = getNode();
    if (!node) return;
    setSaving(true);
    try {
      const outcome = await savePassImage(node, name);
      if (outcome === 'downloaded') toast.success('Pass saved to your downloads');
      if (outcome === 'shared') toast.success('Pass shared');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button className="w-full" size="lg" onClick={onSave} disabled={saving}>
      {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
      Save image
    </Button>
  );
}