import { toBlob } from 'html-to-image';
import { AppError } from '@/lib/error';

export type SaveOutcome = 'shared' | 'downloaded' | 'cancelled';

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'member';

/**
 * Turns the pass card into a PNG and hands it to the person.
 * On phones this opens the share sheet (which has "Save Image" / WhatsApp / Photos);
 * on desktop it downloads the file.
 */
export async function savePassImage(node: HTMLElement, name: string): Promise<SaveOutcome> {
  const blob = await toBlob(node, { pixelRatio: 3, cacheBust: true, backgroundColor: '#ffffff' });
  if (!blob) throw new AppError('Could not create the image. Please try again.', 'unknown');

  const fileName = `${slugify(name)}-pass.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'My attendance pass' });
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // any other sharing failure: fall back to a normal download
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}