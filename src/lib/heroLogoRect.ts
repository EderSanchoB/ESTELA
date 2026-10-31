/**
 * Maps the ESTELA wordmark baked into the hero video's last frame to the
 * exact pixel box the real `<img>` logo in Nav.tsx must occupy, for
 * *any* viewport size — replacing an earlier fixed-height guess that only
 * ever lined up at one specific window width.
 *
 * Why this is necessary: the hero video is full-bleed and scaled with
 * CSS object-fit (`contain` below the `sm` breakpoint, `cover`+`top`
 * at `sm` and up — see HeroVideo.tsx), so the on-screen size and position
 * of its baked-in logo changes with the viewport, not just with a
 * breakpoint. A static Tailwind height/padding value can only coincide
 * with the video's logo at one accidental window size. Reproducing the
 * same object-fit math here — driven by the *same* viewport dimensions —
 * keeps the two in lockstep at every size.
 *
 * All the pixel constants below were measured directly (not guessed) by
 * extracting the video's last frame at full source resolution and the
 * logo PNG's own opaque bounding box; see the measurement commands in
 * the project history if the source video or logo asset is ever
 * re-exported and these need to be redone.
 */

// Intrinsic resolution of the hero video source (confirmed via ffprobe on
// both estela-hero-alpha.webm and estela-hero-fallback.mp4).
const SOURCE_W = 2400;
const SOURCE_H = 1350;

// Tight bounding box (in source-frame pixels) of the "ESTELA" ink in the
// video's last frame, measured on the extracted frame.
const VIDEO_INK = { left: 29, top: 30, width: 190, height: 44 };

// The nav logo asset's own canvas size and the tight bounding box of its
// opaque ("ink") pixels within that canvas — the PNG has ~14px of
// transparent padding on every side, which has to be subtracted out or
// the padding would throw off the match.
const PNG_CANVAS = { width: 661, height: 178 };
const PNG_INK = { left: 14, top: 14, width: 633, height: 150 };

// Tailwind's `sm` breakpoint — this is what flips the video from
// object-contain to object-cover (see HeroVideo.tsx's className).
const SM_BREAKPOINT = 640;

export type PixelBox = { left: number; top: number; width: number; height: number };

/** Where the video's baked-in ink sits on screen, in viewport pixels. */
function getHeroInkRect(viewportW: number, viewportH: number): PixelBox {
  const isCover = viewportW >= SM_BREAKPOINT;
  const scale = isCover
    ? Math.max(viewportW / SOURCE_W, viewportH / SOURCE_H)
    : Math.min(viewportW / SOURCE_W, viewportH / SOURCE_H);

  const renderedW = SOURCE_W * scale;
  const renderedH = SOURCE_H * scale;

  // object-contain: centered on both axes. object-cover + object-top:
  // centered horizontally, pinned to the top edge (see HeroVideo.tsx).
  const offsetX = (viewportW - renderedW) / 2;
  const offsetY = isCover ? 0 : (viewportH - renderedH) / 2;

  return {
    left: offsetX + (VIDEO_INK.left / SOURCE_W) * renderedW,
    top: offsetY + (VIDEO_INK.top / SOURCE_H) * renderedH,
    width: (VIDEO_INK.width / SOURCE_W) * renderedW,
    height: (VIDEO_INK.height / SOURCE_H) * renderedH,
  };
}

/**
 * The `<img>` element's own box (its full canvas, padding included) so
 * that its ink lands exactly on top of the video's ink at the given
 * viewport size. Height drives the scale (matching the old `h-*` pattern);
 * width follows the PNG's own intrinsic aspect ratio via `w-auto`, so it
 * is left off the returned style on purpose — see Nav.tsx.
 */
export function getNavLogoBox(viewportW: number, viewportH: number): PixelBox {
  const inkRect = getHeroInkRect(viewportW, viewportH);
  const scaleFactor = inkRect.height / PNG_INK.height;

  return {
    left: inkRect.left - PNG_INK.left * scaleFactor,
    top: inkRect.top - PNG_INK.top * scaleFactor,
    width: PNG_CANVAS.width * scaleFactor,
    height: PNG_CANVAS.height * scaleFactor,
  };
}
