/**
 * Platform helpers for install / home-screen features.
 * Service-worker registration and the install event are added in Phase 8.
 */

export function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  const iPhoneOrPod = /iPhone|iPad|iPod/.test(navigator.userAgent);
  // iPadOS reports itself as a Mac, but has a touch screen
  const iPadOs = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return iPhoneOrPod || iPadOs;
}

/** True when the app was opened from the home screen rather than a browser tab. */
export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia('(display-mode: standalone)').matches;
}
