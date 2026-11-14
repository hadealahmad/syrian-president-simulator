import type { Syria2DGovernorate } from '../../spatial3d/syria-2d-paths';
import type { ShellLayout } from '../shell/viewport';

export const VIEW_W = 1000;
export const VIEW_H = 880;

/** Actual bounding box of the 14 governorate SVG paths inside the 1000×880 frame. */
export const SYRIA_BOUNDS = {
  minX: 58,
  minY: 40,
  maxX: 942,
  maxY: 840,
  width: 884,
  height: 800,
  cx: 500,
  cy: 440,
} as const;

export interface PlayfieldInsets {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface FitTransform {
  baseScale: number;
  fitZoom: number;
  fitPanX: number;
  fitPanY: number;
  playCx: number;
  playCy: number;
  playW: number;
  playH: number;
}

/**
 * Compute inset padding (in px inside `mapBoxEl`) reserved by in-map overlays
 * (the ruled mode strip, legend bar, token overhangs, and an open portrait
 * province sheet) so Syria auto-fits with ≥ 16px breathing room on every side.
 *
 * Note: `.map-viewport` in `App.svelte` already insets by `--shell-top-h`,
 * `--shell-bottom-h`, `--shell-rail-w`, and `--shell-map-end`.
 */
export function computePlayfieldInsets(
  layout: ShellLayout,
  sheetOverlapInBox: number,
  modeBarH: number,
  legendH = 0,
  landscapeSheetLeft = 0,
  landscapeSheetRight = 0
): PlayfieldInsets {
  if (layout === 'phone-p') {
    const top = Math.max(60, (modeBarH > 0 ? modeBarH : 44) + 16);
    const bottom =
      sheetOverlapInBox > 0
        ? sheetOverlapInBox + 16
        : Math.max(48, legendH > 0 ? legendH + 20 : 48);
    // Quneitra's center sits close to SYRIA_BOUNDS.minX, so 28px on the physical
    // left keeps its square token ≥ 16px clear of the viewport edge.
    return { left: 28, right: 20, top, bottom };
  }
  if (layout === 'phone-l') {
    const top = Math.max(60, (modeBarH > 0 ? modeBarH : 44) + 16);
    const left = landscapeSheetLeft > 0 ? landscapeSheetLeft + 24 : 28;
    const right = landscapeSheetRight > 0 ? landscapeSheetRight + 24 : 20;
    const hasSheet = landscapeSheetLeft > 0 || landscapeSheetRight > 0;
    const bottom = hasSheet
      ? Math.max(44, legendH > 0 ? legendH + 16 : 44)
      : 20;
    return { left, right, top, bottom };
  }
  // Desktop: leave room at the top for the mode bar and at the bottom for the legend bar.
  const top = Math.max(54, (modeBarH > 0 ? modeBarH : 38) + 16);
  const bottom = Math.max(56, legendH > 0 ? legendH + 28 : 56);
  return { left: 28, right: 24, top, bottom };
}

/** Compute the zoom & pan that fits and centres Syria inside the available playfield. */
export function computeFitTransform(
  boxW: number,
  boxH: number,
  insets: PlayfieldInsets
): FitTransform {
  if (boxW <= 0 || boxH <= 0) {
    return {
      baseScale: 0,
      fitZoom: 1,
      fitPanX: 0,
      fitPanY: 0,
      playCx: 0,
      playCy: 0,
      playW: 0,
      playH: 0,
    };
  }
  const baseScale = Math.min(boxW / VIEW_W, boxH / VIEW_H);
  const playW = Math.max(100, boxW - insets.left - insets.right);
  const playH = Math.max(100, boxH - insets.top - insets.bottom);
  const playCx = insets.left + playW / 2;
  const playCy = insets.top + playH / 2;

  const targetScale = Math.min(playW / SYRIA_BOUNDS.width, playH / SYRIA_BOUNDS.height);
  const fitZoom = Math.max(0.3, targetScale / baseScale);

  const fitPanX = playCx - boxW / 2;
  const fitPanY = playCy - boxH / 2;

  return {
    baseScale,
    fitZoom,
    fitPanX,
    fitPanY,
    playCx,
    playCy,
    playW,
    playH,
  };
}

/**
 * Compute (panX, panY) that places SVG point `(svgX, svgY)` at screen position
 * `(screenX, screenY)` inside `mapBoxEl` at `targetZoom`.
 */
export function computeCenterOnPoint(
  boxW: number,
  boxH: number,
  baseScale: number,
  svgX: number,
  svgY: number,
  targetZoom: number,
  screenX: number,
  screenY: number
): { panX: number; panY: number } {
  const offsetX = (boxW - VIEW_W * baseScale) / 2;
  const offsetY = (boxH - VIEW_H * baseScale) / 2;
  const cx = boxW / 2;
  const cy = boxH / 2;
  const baseX = offsetX + svgX * baseScale;
  const baseY = offsetY + svgY * baseScale;
  return {
    panX: screenX - cx - (baseX - cx) * targetZoom,
    panY: screenY - cy - (baseY - cy) * targetZoom,
  };
}

function governorateBBox(path: string): { width: number; height: number } {
  const nums = path.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (nums.length < 4) return { width: 160, height: 160 };
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  return {
    width: Math.max(48, Math.max(...xs) - Math.min(...xs)),
    height: Math.max(48, Math.max(...ys) - Math.min(...ys)),
  };
}

function clampFocusPan(
  boxW: number,
  boxH: number,
  fit: FitTransform,
  zoom: number,
  panX: number,
  panY: number
): { panX: number; panY: number } {
  const slack = 28;
  const leftEdge = computeCenterOnPoint(
    boxW,
    boxH,
    fit.baseScale,
    SYRIA_BOUNDS.minX,
    SYRIA_BOUNDS.cy,
    zoom,
    fit.playCx,
    fit.playCy
  );
  const rightEdge = computeCenterOnPoint(
    boxW,
    boxH,
    fit.baseScale,
    SYRIA_BOUNDS.maxX,
    SYRIA_BOUNDS.cy,
    zoom,
    fit.playCx,
    fit.playCy
  );
  const topEdge = computeCenterOnPoint(
    boxW,
    boxH,
    fit.baseScale,
    SYRIA_BOUNDS.cx,
    SYRIA_BOUNDS.minY,
    zoom,
    fit.playCx,
    fit.playCy
  );
  const bottomEdge = computeCenterOnPoint(
    boxW,
    boxH,
    fit.baseScale,
    SYRIA_BOUNDS.cx,
    SYRIA_BOUNDS.maxY,
    zoom,
    fit.playCx,
    fit.playCy
  );

  const minX = Math.min(leftEdge.panX, rightEdge.panX) - slack;
  const maxX = Math.max(leftEdge.panX, rightEdge.panX) + slack;
  const minY = Math.min(topEdge.panY, bottomEdge.panY) - slack;
  const maxY = Math.max(topEdge.panY, bottomEdge.panY) + slack;
  return {
    panX: Math.max(minX, Math.min(maxX, panX)),
    panY: Math.max(minY, Math.min(maxY, panY)),
  };
}

/**
 * Compute zoom & pan for event focus so the target governorate fills roughly
 * the middle third of the visible map (kept clear of the bottom focus banner on
 * portrait phones).
 */
export function computeFocusTransform(
  boxW: number,
  boxH: number,
  fit: FitTransform,
  gov: Syria2DGovernorate,
  layout: ShellLayout
): { zoom: number; panX: number; panY: number } {
  if (boxW <= 0 || boxH <= 0 || fit.baseScale <= 0) {
    return { zoom: 1, panX: 0, panY: 0 };
  }
  const bbox = governorateBBox(gov.path);
  const bannerReserve = layout === 'phone-p' ? 128 : 28;
  const usableH = Math.max(120, fit.playH - bannerReserve);
  const targetSpanW = fit.playW * 0.36;
  const targetSpanH = usableH * 0.38;
  const desiredScale = Math.min(
    targetSpanW / Math.max(90, bbox.width),
    targetSpanH / Math.max(90, bbox.height)
  );
  const rawZoom = desiredScale / fit.baseScale;
  const targetZoom = Math.max(
    fit.fitZoom * 1.55,
    Math.min(fit.fitZoom * 3.0, rawZoom)
  );
  const focusScreenX = fit.playCx;
  const focusScreenY =
    layout === 'phone-p'
      ? fit.playCy - bannerReserve * 0.42
      : fit.playCy;
  const target = computeCenterOnPoint(
    boxW,
    boxH,
    fit.baseScale,
    gov.center[0],
    gov.center[1],
    targetZoom,
    focusScreenX,
    focusScreenY
  );
  const clamped = clampFocusPan(boxW, boxH, fit, targetZoom, target.panX, target.panY);
  return { zoom: targetZoom, panX: clamped.panX, panY: clamped.panY };
}
