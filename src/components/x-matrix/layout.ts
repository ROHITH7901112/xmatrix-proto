/**
 * X-Matrix Shared Layout Configuration
 * =====================================
 * Single source of truth for ALL positioning, sizing, and coordinate math
 * in the X-Matrix SVG. Every component reads from this module so that
 * cards, grids, dots, add-buttons, and empty-state placeholders all share
 * one deterministic coordinate system.
 *
 * Coordinate system:
 *   Origin (0,0) is the top-left of the SVG viewBox.
 *   X increases rightward, Y increases downward.
 *   The center diamond sits at (centerX, centerY).
 *   Four bands radiate outward: top (initiatives), left (AO), right (KPI), bottom (LTO).
 *   An optional owner column sits to the far right of the KPI band.
 */

// ============================================================================
// TOKENS — Tweak these values to adjust the entire matrix proportionally
// ============================================================================

/** Uniform cell size (px in SVG user-space) for every grid cell */
export const CELL = 34;

/** Side length of the center diamond / square */
export const DIAMOND = 180;

/** Outer padding around the entire SVG content */
export const PAD = 40;

/** Gap between KPI band and Owner band */
export const OWNER_GAP = 16;

/** Height of the "Owners" header label */
export const OWNER_HEADER_H = 24;

/** Minimum cells to display per band so the matrix never fully collapses */
export const MIN_CELLS = 3;

/** Colors for grid lines */
export const GRID_STROKE = 'rgb(51, 65, 85)';
export const GRID_STROKE_LIGHT = 'rgba(51, 65, 85, 0.5)';
export const BG_DARK = 'rgb(15, 23, 42)';     // slate-950
export const BG_CARD = 'rgb(30, 41, 59)';      // slate-800
export const BG_OWNER = 'rgb(30, 41, 59)';

// ============================================================================
// DERIVED DIMENSIONS — Computed from data counts + tokens above
// ============================================================================

export interface MatrixDimensions {
  // Raw entity counts
  initCount: number;
  aoCount: number;
  kpiCount: number;
  ltoCount: number;
  ownerCount: number;

  // Display counts (at least MIN_CELLS)
  displayInit: number;
  displayAo: number;
  displayKpi: number;
  displayLto: number;
  displayOwner: number;

  // Band pixel sizes
  topH: number;   // initiative band height
  bottomH: number; // LTO band height
  leftW: number;  // AO band width
  rightW: number; // KPI band width
  ownerW: number; // owner band width

  // Center coords
  centerX: number;
  centerY: number;
  half: number; // DIAMOND / 2

  // SVG viewBox
  totalW: number;
  totalH: number;

  // Anchor edges of each band (absolute coords)
  /** Top-left corner of the top-left quadrant (init × AO grid) */
  topLeftX: number;
  topLeftY: number;

  /** Top-left of the top-right quadrant (init × KPI grid) */
  topRightX: number;
  topRightY: number;

  /** Top-left of the bottom-left quadrant (LTO × AO grid) */
  bottomLeftX: number;
  bottomLeftY: number;

  /** Top-left of the owner grid */
  ownerGridX: number;
  ownerGridY: number;
}

export function computeDimensions(
  initCount: number,
  aoCount: number,
  kpiCount: number,
  ltoCount: number,
  ownerCount: number,
): MatrixDimensions {
  const displayInit = Math.max(initCount, MIN_CELLS);
  const displayAo = Math.max(aoCount, MIN_CELLS);
  const displayKpi = Math.max(kpiCount, MIN_CELLS);
  const displayLto = Math.max(ltoCount, MIN_CELLS);
  const displayOwner = Math.max(ownerCount, MIN_CELLS);

  const topH = displayInit * CELL;
  const bottomH = displayLto * CELL;
  const leftW = displayAo * CELL;
  const rightW = displayKpi * CELL;
  const ownerW = displayOwner * CELL;

  const half = DIAMOND / 2;

  const ownerGapVal = OWNER_GAP;

  const totalW = PAD + leftW + DIAMOND + rightW + ownerGapVal + ownerW + PAD;
  const totalH = PAD + topH + DIAMOND + bottomH + PAD;

  const centerX = PAD + leftW + half;
  const centerY = PAD + topH + half;

  // Top-left quadrant origin
  const topLeftX = centerX - half - leftW;
  const topLeftY = centerY - half - topH;

  // Top-right quadrant origin (right of diamond)
  const topRightX = centerX + half;
  const topRightY = topLeftY;

  // Bottom-left quadrant origin
  const bottomLeftX = topLeftX;
  const bottomLeftY = centerY + half;

  // Owner grid origin
  const ownerGridX = centerX + half + rightW + ownerGapVal;
  const ownerGridY = topLeftY;

  return {
    initCount, aoCount, kpiCount, ltoCount, ownerCount,
    displayInit, displayAo, displayKpi, displayLto, displayOwner,
    topH, bottomH, leftW, rightW, ownerW,
    centerX, centerY, half,
    totalW, totalH,
    topLeftX, topLeftY,
    topRightX, topRightY,
    bottomLeftX, bottomLeftY,
    ownerGridX, ownerGridY,
  };
}

// ============================================================================
// CELL POSITION HELPERS
// Given a band origin and an index, return the top-left corner of that cell.
// These are deterministic — no measurement needed.
// ============================================================================

/** Top-left (x,y) of cell at (col, row) inside a grid starting at (ox, oy) */
export function cellOrigin(ox: number, oy: number, col: number, row: number) {
  return { x: ox + col * CELL, y: oy + row * CELL };
}

/** Center of a cell at (col, row) inside a grid starting at (ox, oy) */
export function cellCenter(ox: number, oy: number, col: number, row: number) {
  return { x: ox + col * CELL + CELL / 2, y: oy + row * CELL + CELL / 2 };
}

// ============================================================================
// CARD ANCHOR HELPERS
// For initiative/LTO horizontal cards and AO/KPI vertical cards,
// compute the label rectangle position.
// ============================================================================

/** Initiative card: horizontal bar centered on the diamond, in the initiative row */
export function initCardRect(dim: MatrixDimensions, index: number) {
  // index 0 = first initiative nearest center (bottom of top band)
  // Items are displayed reversed: last index is nearest center
  const row = dim.displayInit - 1 - index; // reversed so index 0 is nearest center
  const y = dim.topLeftY + row * CELL;
  const x = dim.centerX - DIAMOND / 2;
  return { x, y, w: DIAMOND, h: CELL };
}

/** LTO card: horizontal bar centered on the diamond, in the LTO row */
export function ltoCardRect(dim: MatrixDimensions, index: number) {
  const y = dim.centerY + dim.half + index * CELL;
  const x = dim.centerX - DIAMOND / 2;
  return { x, y, w: DIAMOND, h: CELL };
}

/** AO card: vertical bar centered on the diamond, in the AO column */
export function aoCardRect(dim: MatrixDimensions, index: number) {
  // Items are displayed reversed: last index is nearest center
  const col = dim.displayAo - 1 - index;
  const x = dim.topLeftX + col * CELL;
  const y = dim.centerY - DIAMOND / 2;
  return { x, y, w: CELL, h: DIAMOND };
}

/** KPI card: vertical bar centered on the diamond, in the KPI column */
export function kpiCardRect(dim: MatrixDimensions, index: number) {
  const x = dim.centerX + dim.half + index * CELL;
  const y = dim.centerY - DIAMOND / 2;
  return { x, y, w: CELL, h: DIAMOND };
}

// ============================================================================
// RELATIONSHIP DOT ANCHOR
// For a given (rowEntity, colEntity) in a relationship grid,
// compute the exact center where the dot should be placed.
// ============================================================================

/**
 * Compute the center of a relationship dot in a grid quadrant.
 * @param gridOriginX  top-left X of the grid area
 * @param gridOriginY  top-left Y of the grid area
 * @param rowIndex     index of the row entity in the grid
 * @param colIndex     index of the column entity in the grid
 */
export function dotCenter(
  gridOriginX: number,
  gridOriginY: number,
  rowIndex: number,
  colIndex: number,
) {
  return {
    x: gridOriginX + colIndex * CELL + CELL / 2,
    y: gridOriginY + rowIndex * CELL + CELL / 2,
  };
}
