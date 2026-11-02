import { isIos, isStandalone } from '@/lib/pwa';

/**
 * Tells the teen how to keep their pass on the home screen.
 * (Phase 8 adds the one-tap install button for browsers that support it.)
 */
export function PWAInstallPrompt() {
  if (isStandalone()) return null;

  return (
    <details className="rounded-lg border bg-background px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium">Keep this pass on your home screen</summary>
      <p className="mt-2 text-muted-foreground">
        {isIos()
          ? 'Tap the Share button in Safari, then choose "Add to Home Screen".'
          : 'Open your browser menu (the three dots), then choose "Add to Home screen".'}
      </p>
    </details>
  );
}
