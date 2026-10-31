/**
 * Whether this browser reliably composites VP9 alpha-channel WebM video
 * in a <video> element. `<source>`/`canPlayType` fallback can't detect
 * this: a browser can fully support "video/webm; codecs=vp9" while still
 * rendering the alpha channel as opaque black, which is exactly the
 * failure mode we need to avoid. Chromium-based browsers are the only
 * ones that currently handle it correctly, so we detect those and let
 * everyone else (Safari, Firefox, …) get the pre-rendered MP4 fallback.
 *
 * `HeroVideo` also swaps to the fallback on a real playback error, as a
 * safety net for whatever this check gets wrong.
 */
export function supportsAlphaWebm(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // Chrome, Edge, Opera, Brave, and other Chromium-based browsers all use
  // the same underlying VP9 decoder and handle the alpha channel correctly.
  return /Chrome|Chromium|CriOS|Edg\//.test(ua);
}
