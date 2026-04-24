'use client';

import { useXMatrixStore } from '@/lib/store';
import { useTheme } from '@/components/providers/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { getHealthColor, getRelationshipColor, getRelationshipDotSize, cn } from '@/lib/utils';
import { KPI, Owner, Relationship, EntityType } from '@/lib/types';
import { useCallback, useMemo, useEffect } from 'react';
import { useXMatrixCRUD } from '@/hooks/useXMatrixCRUD';
import { Modal, LTOForm, AOForm, InitiativeForm, KPIForm, OwnerForm } from '@/components/shared/EntityModals';
import {
  CELL, DIAMOND, PAD, OWNER_GAP, OWNER_HEADER_H, MIN_CELLS,
  GRID_STROKE, GRID_STROKE_LIGHT, BG_DARK, BG_CARD, BG_OWNER,
  computeDimensions,
  type MatrixDimensions,
} from './layout';

// ============================================================================
// X-MATRIX — Complete rewrite using deterministic shared layout
// ============================================================================
export function XMatrix() {
  const {
    viewState,
    setHoveredElement,
    setSelectedElement,
    getHighlightedElements,
    toggleRelationship,
    fetchData,
    editModeState,
    getActiveData,
    isLoading,
  } = useXMatrixStore();

  const data = getActiveData();
  const isEditMode = editModeState.mode === 'edit';

  useEffect(() => { fetchData(); }, [fetchData]);

  const {
    modalType, editingItem, isSaving,
    openAddModal, openEditModal, closeModal,
    handleCreateLTO, handleUpdateLTO, handleDeleteLTO,
    handleCreateAO, handleUpdateAO, handleDeleteAO,
    handleCreateInitiative, handleUpdateInitiative, handleDeleteInitiative,
    handleCreateKPI, handleUpdateKPI, handleDeleteKPI,
    handleCreateOwner, handleUpdateOwner, handleDeleteOwner,
  } = useXMatrixCRUD();

  const { rotation, zoom } = viewState;
  const highlightedElements = getHighlightedElements();
  const hasHighlight = highlightedElements.size > 0;

  // ── Dimensions derived from data counts ──────────────────────────────
  const dim = useMemo(() => computeDimensions(
    data.initiatives.length,
    data.annualObjectives.length,
    data.kpis.length,
    data.longTermObjectives.length,
    data.owners.length,
  ), [data.initiatives.length, data.annualObjectives.length, data.kpis.length, data.longTermObjectives.length, data.owners.length]);

  // ── Reversed arrays for grid alignment (nearest-center first) ────────
  const reversedInitiatives = useMemo(() => [...data.initiatives].reverse(), [data.initiatives]);
  const reversedAOs = useMemo(() => [...data.annualObjectives].reverse(), [data.annualObjectives]);

  // ── Highlight helpers ────────────────────────────────────────────────
  const isHighlighted = useCallback((id: string) => { 
    if (!hasHighlight) return true;
    return highlightedElements.has(id);
  }, [hasHighlight, highlightedElements]);

  const getOpacity = useCallback((id: string) => {
    if (!hasHighlight) return 1;
    return highlightedElements.has(id) ? 1 : 0.15;
  }, [hasHighlight, highlightedElements]);

  const findRelationship = useCallback((a: string, b: string): Relationship | undefined => {
    return data.relationships.find(
      (r) => (r.sourceId === a && r.targetId === b) || (r.sourceId === b && r.targetId === a)
    );
  }, [data.relationships]);

  // Show loading screen while fetching data
  if (isLoading && data.id === '') {
    return (
      <div className="w-full h-full flex items-center justify-center p-2">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-slate-400">Loading X-Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto p-2">
      <div className="min-w-max min-h-max flex items-center justify-center">
      <motion.svg
        width={dim.totalW * zoom}
        height={dim.totalH * zoom}
        viewBox={`0 0 ${dim.totalW} ${dim.totalH}`}
        className="block"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background */}
        <rect width="100%" height="100%" fill={BG_DARK} />

        {/* ============================================================= */}
        {/* OWNER SECTION BACKGROUND                                       */}
        {/* ============================================================= */}
        <rect
          x={dim.ownerGridX}
          y={dim.ownerGridY - OWNER_HEADER_H}
          width={dim.ownerW}
          height={dim.topH + OWNER_HEADER_H + DIAMOND + dim.bottomH}
          fill={BG_OWNER}
          stroke={GRID_STROKE}
          strokeWidth={1}
        />

        {/* ============================================================= */}
        {/* RELATIONSHIP GRIDS — four corner quadrants + owner grid        */}
        {/* ============================================================= */}

        {/* Top-Left: Init(rows) x AO(cols) */}
        <RelGrid
          rows={reversedInitiatives} cols={reversedAOs}
          rowType="initiative" colType="ao"
          ox={dim.topLeftX} oy={dim.topLeftY}
          bandW={dim.leftW} bandH={dim.topH}
          actualRows={dim.initCount} actualCols={dim.aoCount}
          colOffset={dim.displayAo - dim.aoCount}
          rowOffset={dim.displayInit - dim.initCount}
          findRel={findRelationship} onCellClick={toggleRelationship}
          isHighlighted={isHighlighted} isEditMode={isEditMode}
          onCellHover={setHoveredElement}
        />
        {/* Top-Right: Init(rows) x KPI(cols) */}
        <RelGrid
          rows={reversedInitiatives} cols={data.kpis}
          rowType="initiative" colType="kpi"
          ox={dim.topRightX} oy={dim.topRightY}
          bandW={dim.rightW} bandH={dim.topH}
          actualRows={dim.initCount} actualCols={dim.kpiCount}
          rowOffset={dim.displayInit - dim.initCount}
          findRel={findRelationship} onCellClick={toggleRelationship}
          isHighlighted={isHighlighted} isEditMode={isEditMode}
          onCellHover={setHoveredElement}
        />
        {/* Owner grid: Init(rows) x Owner(cols) */}
        <RelGrid
          rows={reversedInitiatives} cols={data.owners}
          rowType="initiative" colType="owner"
          ox={dim.ownerGridX} oy={dim.ownerGridY}
          bandW={dim.ownerW} bandH={dim.topH}
          actualRows={dim.initCount} actualCols={dim.ownerCount}
          rowOffset={dim.displayInit - dim.initCount}
          findRel={findRelationship} onCellClick={toggleRelationship}
          isHighlighted={isHighlighted} isEditMode={isEditMode}
          onCellHover={setHoveredElement}
        />
        {/* Bottom-Left: LTO(rows) x AO(cols) */}
        <RelGrid
          rows={data.longTermObjectives} cols={reversedAOs}
          rowType="lto" colType="ao"
          ox={dim.bottomLeftX} oy={dim.bottomLeftY}
          bandW={dim.leftW} bandH={dim.bottomH}
          actualRows={dim.ltoCount} actualCols={dim.aoCount}
          colOffset={dim.displayAo - dim.aoCount}
          findRel={findRelationship} onCellClick={toggleRelationship}
          isHighlighted={isHighlighted} isEditMode={isEditMode}
          onCellHover={setHoveredElement}
        />

        {/* ============================================================= */}
        {/* CENTER DIAMOND                                                 */}
        {/* ============================================================= */}
        <CenterSquare cx={dim.centerX} cy={dim.centerY} size={DIAMOND} rotation={rotation} />

        {/* ============================================================= */}
        {/* ENTITY CARDS                                                   */}
        {/* ============================================================= */}

        {/* INITIATIVES — horizontal cards in the top band */}
        {[...data.initiatives].reverse().map((init, idx) => {
          const row = (dim.displayInit - dim.initCount) + idx;
          const cy = dim.topLeftY + row * CELL + CELL / 2;
          return (
            <HorizCard
              key={init.id}
              title={init.title}
              health={init.health}
              cy={cy}
              dim={dim}
              rotation={rotation}
              opacity={getOpacity(init.id)}
              highlighted={isHighlighted(init.id)}
              onHover={(h) => setHoveredElement(h ? { id: init.id, type: 'initiative' } : null)}
              onClick={() => setSelectedElement({ id: init.id, type: 'initiative' })}
              onDoubleClick={isEditMode ? () => openEditModal('initiative', init) : undefined}
              isEditMode={isEditMode}
            />
          );
        })}

        {/* ANNUAL OBJECTIVES — vertical cards in the left band */}
        {data.annualObjectives.map((ao, idx) => {
          const col = dim.displayAo - 1 - idx;
          const cx = dim.topLeftX + col * CELL + CELL / 2;
          return (
            <VertCard
              key={ao.id}
              title={ao.title}
              health={ao.health}
              cx={cx}
              dim={dim}
              rotation={rotation}
              opacity={getOpacity(ao.id)}
              highlighted={isHighlighted(ao.id)}
              onHover={(h) => setHoveredElement(h ? { id: ao.id, type: 'ao' } : null)}
              onClick={() => setSelectedElement({ id: ao.id, type: 'ao' })}
              onDoubleClick={isEditMode ? () => openEditModal('ao', ao) : undefined}
              isEditMode={isEditMode}
            />
          );
        })}

        {/* KPIs — vertical cards in the right band */}
        {data.kpis.map((kpi, idx) => {
          const cx = dim.topRightX + idx * CELL + CELL / 2;
          return (
            <VertCard
              key={kpi.id}
              title={kpi.title}
              health={kpi.health}
              cx={cx}
              dim={dim}
              rotation={rotation}
              opacity={getOpacity(kpi.id)}
              highlighted={isHighlighted(kpi.id)}
              onHover={(h) => setHoveredElement(h ? { id: kpi.id, type: 'kpi' } : null)}
              onClick={() => setSelectedElement({ id: kpi.id, type: 'kpi' })}
              onDoubleClick={isEditMode ? () => openEditModal('kpi', kpi) : undefined}
              isEditMode={isEditMode}
            />
          );
        })}

        {/* LONG-TERM OBJECTIVES — horizontal cards in the bottom band */}
        {data.longTermObjectives.map((lto, idx) => {
          const cy = dim.bottomLeftY + idx * CELL + CELL / 2;
          return (
            <HorizCard
              key={lto.id}
              title={lto.title}
              health={lto.health}
              cy={cy}
              dim={dim}
              rotation={rotation}
              opacity={getOpacity(lto.id)}
              highlighted={isHighlighted(lto.id)}
              onHover={(h) => setHoveredElement(h ? { id: lto.id, type: 'lto' } : null)}
              onClick={() => setSelectedElement({ id: lto.id, type: 'lto' })}
              onDoubleClick={isEditMode ? () => openEditModal('lto', lto) : undefined}
              isEditMode={isEditMode}
            />
          );
        })}

        {/* OWNERS — header + column labels */}
        <OwnerSection
          owners={data.owners}
          dim={dim}
          rotation={rotation}
          isHighlighted={isHighlighted}
          getOpacity={getOpacity}
          setHoveredElement={setHoveredElement}
          setSelectedElement={setSelectedElement}
          openEditModal={openEditModal}
          isEditMode={isEditMode}
        />

        {/* ============================================================= */}
        {/* EMPTY STATE PLACEHOLDERS                                       */}
        {/* ============================================================= */}
        <EmptyStatePlaceholders dim={dim} data={data} rotation={rotation} />

        {/* ============================================================= */}
        {/* ADD BUTTONS — only in edit mode                                */}
        {/* ============================================================= */}
        {isEditMode && (
          <AddButtons dim={dim} rotation={rotation} openAddModal={openAddModal} />
        )}
      </motion.svg>
      </div>

      {/* ── Edit Modals ─────────────────────────────────────────────── */}
      <Modal isOpen={modalType === 'lto'} onClose={closeModal} title={editingItem ? 'Edit Long-Term Objective' : 'New Long-Term Objective'}>
        <LTOForm initialData={editingItem as any} existingItems={data.longTermObjectives} onSubmit={editingItem ? handleUpdateLTO : handleCreateLTO} onDelete={editingItem ? () => handleDeleteLTO(editingItem.id) : undefined} onCancel={closeModal} isLoading={isSaving} />
      </Modal>
      <Modal isOpen={modalType === 'ao'} onClose={closeModal} title={editingItem ? 'Edit Annual Objective' : 'New Annual Objective'}>
        <AOForm initialData={editingItem as any} existingItems={data.annualObjectives} onSubmit={editingItem ? handleUpdateAO : handleCreateAO} onDelete={editingItem ? () => handleDeleteAO(editingItem.id) : undefined} onCancel={closeModal} isLoading={isSaving} />
      </Modal>
      <Modal isOpen={modalType === 'initiative'} onClose={closeModal} title={editingItem ? 'Edit Initiative' : 'New Initiative'}>
        <InitiativeForm initialData={editingItem as any} existingItems={data.initiatives} onSubmit={editingItem ? handleUpdateInitiative : handleCreateInitiative} onDelete={editingItem ? () => handleDeleteInitiative(editingItem.id) : undefined} onCancel={closeModal} isLoading={isSaving} />
      </Modal>
      <Modal isOpen={modalType === 'kpi'} onClose={closeModal} title={editingItem ? 'Edit KPI' : 'New KPI'}>
        <KPIForm initialData={editingItem as any} existingItems={data.kpis} availableOwners={data.owners} onSubmit={editingItem ? handleUpdateKPI : handleCreateKPI} onDelete={editingItem ? () => handleDeleteKPI(editingItem.id) : undefined} onCancel={closeModal} isLoading={isSaving} />
      </Modal>
      <Modal isOpen={modalType === 'owner'} onClose={closeModal} title={editingItem ? 'Edit Owner' : 'New Owner'}>
        <OwnerForm initialData={editingItem as any} onSubmit={editingItem ? handleUpdateOwner : handleCreateOwner} onDelete={editingItem ? () => handleDeleteOwner(editingItem.id) : undefined} onCancel={closeModal} isLoading={isSaving} />
      </Modal>
    </div>
  );
}

// ============================================================================
// CENTER SQUARE
// ============================================================================
function CenterSquare({ cx, cy, size, rotation }: { cx: number; cy: number; size: number; rotation: number }) {
  const h = size / 2;
  return (
    <g>
      <rect x={cx - h} y={cy - h} width={size} height={size} fill={BG_CARD} stroke={GRID_STROKE} strokeWidth={2} />
      <line x1={cx - h} y1={cy - h} x2={cx + h} y2={cy + h} stroke={GRID_STROKE} strokeWidth={1.5} />
      <line x1={cx + h} y1={cy - h} x2={cx - h} y2={cy + h} stroke={GRID_STROKE} strokeWidth={1.5} />
      <g transform={`rotate(${-rotation}, ${cx}, ${cy})`}>
        <text x={cx} y={cy - h / 2 - 10} textAnchor="middle" fill="rgb(59,130,246)" fontSize="11" fontWeight="500" fontStyle="italic">Top Level</text>
        <text x={cx} y={cy - h / 2 + 5} textAnchor="middle" fill="rgb(59,130,246)" fontSize="11" fontWeight="500" fontStyle="italic">Improvement</text>
        <text x={cx} y={cy - h / 2 + 20} textAnchor="middle" fill="rgb(59,130,246)" fontSize="11" fontWeight="500" fontStyle="italic">Priorities</text>
        <text x={cx - h / 2} y={cy - 5} textAnchor="middle" fill="rgb(34,197,94)" fontSize="11" fontWeight="500" fontStyle="italic">Annual</text>
        <text x={cx - h / 2} y={cy + 10} textAnchor="middle" fill="rgb(34,197,94)" fontSize="11" fontWeight="500" fontStyle="italic">Objectives</text>
        <text x={cx + h / 2} y={cy - 5} textAnchor="middle" fill="rgb(249,115,22)" fontSize="11" fontWeight="500" fontStyle="italic">Metrics to</text>
        <text x={cx + h / 2} y={cy + 10} textAnchor="middle" fill="rgb(249,115,22)" fontSize="11" fontWeight="500" fontStyle="italic">Improve</text>
        <text x={cx} y={cy + h / 2 - 5} textAnchor="middle" fill="rgb(239,68,68)" fontSize="11" fontWeight="500" fontStyle="italic">Long-Term</text>
        <text x={cx} y={cy + h / 2 + 10} textAnchor="middle" fill="rgb(239,68,68)" fontSize="11" fontWeight="500" fontStyle="italic">Objectives</text>
      </g>
    </g>
  );
}

// ============================================================================
// RELATIONSHIP GRID — deterministic dot positioning
// Grid origin (ox, oy) is always the top-left corner. Cells are placed at
// ox + col * CELL, oy + row * CELL. No centering offset — cards use the
// same math so dots land exactly at card/row intersections.
// ============================================================================
interface RelGridProps {
  rows: { id: string }[];
  cols: { id: string }[];
  rowType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  colType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  ox: number;
  oy: number;
  bandW: number;
  bandH: number;
  actualRows: number;
  actualCols: number;
  /** Columns of empty padding before actual data (for reversed bands like AO) */
  colOffset?: number;
  /** Rows of empty padding before actual data (for reversed bands like Initiative) */
  rowOffset?: number;
  findRel: (a: string, b: string) => Relationship | undefined;
  onCellClick: (rId: string, rType: any, cId: string, cType: any) => void;
  isHighlighted: (id: string) => boolean;
  isEditMode: boolean;
  onCellHover?: (hoveredElement: null) => void;
}

function RelGrid({ 
  rows, cols, rowType, colType,
  ox, oy, bandW, bandH,
  actualRows, actualCols,
  colOffset = 0, rowOffset = 0,
  findRel, onCellClick, isHighlighted, isEditMode, onCellHover,
}: RelGridProps) {
  const displayCols = Math.max(actualCols, MIN_CELLS);
  const displayRows = Math.max(actualRows, MIN_CELLS);

  return (
    <g className="rel-grid">
      {/* Background */}
      <rect x={ox} y={oy} width={bandW} height={bandH} fill={BG_CARD} stroke={GRID_STROKE} strokeWidth={1} />

      {/* Faint dashed grid lines covering the full band (placeholder cells) */}
      <g stroke={GRID_STROKE_LIGHT} strokeWidth={0.5} shapeRendering="crispEdges" strokeDasharray="2,3">
        {Array.from({ length: displayCols + 1 }).map((_, i) => (
          <line key={`fv${i}`} x1={ox + i * CELL} y1={oy} x2={ox + i * CELL} y2={oy + bandH} />
        ))}
        {Array.from({ length: displayRows + 1 }).map((_, i) => (
          <line key={`fh${i}`} x1={ox} y1={oy + i * CELL} x2={ox + bandW} y2={oy + i * CELL} />
        ))}
      </g>

      {/* Solid grid lines — only over the actual data area, aligned with cards */}
      <g stroke={GRID_STROKE} strokeWidth={1} shapeRendering="crispEdges">
        {Array.from({ length: actualCols + 1 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={ox + (colOffset + i) * CELL} y1={oy + rowOffset * CELL}
            x2={ox + (colOffset + i) * CELL} y2={oy + (rowOffset + actualRows) * CELL}
          />
        ))}
        {Array.from({ length: actualRows + 1 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1={ox + colOffset * CELL} y1={oy + (rowOffset + i) * CELL}
            x2={ox + (colOffset + actualCols) * CELL} y2={oy + (rowOffset + i) * CELL}
          />
        ))}
      </g>

      {/* Clickable cells + relationship dots — offset to match card visual positions */}
      {rows.map((row, ri) =>
        cols.map((col, ci) => {
          const cx = ox + (colOffset + ci) * CELL + CELL / 2;
          const cy = oy + (rowOffset + ri) * CELL + CELL / 2;
          const rel = findRel(row.id, col.id);
          const hasRel = rel && rel.strength !== 'none';
          const lit = isHighlighted(row.id) && isHighlighted(col.id);

          return (
            <g key={`${row.id}-${col.id}`}>
              <rect
                x={ox + (colOffset + ci) * CELL} y={oy + (rowOffset + ri) * CELL}
                width={CELL} height={CELL}
                fill="transparent"
                style={{ cursor: isEditMode ? 'pointer' : 'default' }}
                onMouseEnter={() => onCellHover?.(null)}
                onMouseLeave={() => onCellHover?.(null)}
                onClick={isEditMode ? () => onCellClick(row.id, rowType, col.id, colType) : undefined}
              />
              {hasRel && (
                <motion.circle
                  cx={cx} cy={cy}
                  r={getRelationshipDotSize(rel.strength) / 2}
                  fill={getRelationshipColor(rel.strength)}
                  opacity={lit ? 1 : 0.35}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })
      )}
    </g>
  );
}

// ============================================================================
// HORIZONTAL CARD — Initiatives (top) & LTOs (bottom)
// The interactive hitbox is ONLY the label rect over the diamond, not the
// full-width row. This prevents accidental hover overlap with vertical cards.
// ============================================================================
interface HorizCardProps {
  title: string;
  health: 'on-track' | 'at-risk' | 'off-track';
  cy: number;
  dim: MatrixDimensions;
  rotation: number;
  opacity: number;
  highlighted: boolean;
  onHover: (h: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
  isEditMode: boolean;
}

function HorizCard({ title, health, cy, dim, rotation, opacity, highlighted, onHover, onClick, onDoubleClick, isEditMode }: HorizCardProps) {
  const color = getHealthColor(health);
  const lw = DIAMOND;
  const lx = dim.centerX - lw / 2;
  const ly = cy - CELL / 2 + 2;
  const lh = CELL - 4;

  const lineX1 = dim.topLeftX;
  const lineX2 = dim.topRightX + dim.rightW;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Decorative guide line — no pointer events */}
      <line x1={lineX1} y1={cy} x2={lineX2} y2={cy} stroke={GRID_STROKE} strokeWidth={1} strokeDasharray="2,2" opacity={0.3} />

      {/* Interactive label box — pointer events ONLY on this rect */}
      <motion.g
        animate={{ opacity }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={onClick}
        onDoubleClick={isEditMode ? onDoubleClick : undefined}
        style={{ cursor: isEditMode ? 'pointer' : 'default', pointerEvents: 'auto' }}
      >
        <rect x={lx} y={ly} width={lw} height={lh} fill={BG_CARD} stroke={highlighted ? color : GRID_STROKE} strokeWidth={highlighted ? 2 : 1} rx={3} />
        <rect x={lx} y={ly} width={3} height={lh} fill={color} rx={1} />
        <g transform={`rotate(${-rotation}, ${dim.centerX}, ${dim.centerY})`}>
          <foreignObject x={lx + 6} y={ly} width={lw - 12} height={lh}>
            <div className="flex items-center justify-center w-full h-full text-white text-[10px] font-medium">
              <span className="truncate text-center w-full">{title}</span>
            </div>
          </foreignObject>
        </g>
      </motion.g>
    </g>
  );
}

// ============================================================================
// VERTICAL CARD — AOs (left) & KPIs (right)
// Interactive hitbox is ONLY the label rect over the diamond.
// ============================================================================
interface VertCardProps {
  title: string;
  health: 'on-track' | 'at-risk' | 'off-track';
  cx: number;
  dim: MatrixDimensions;
  rotation: number;
  opacity: number;
  highlighted: boolean;
  onHover: (h: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
  isEditMode: boolean;
}

function VertCard({ title, health, cx, dim, rotation, opacity, highlighted, onHover, onClick, onDoubleClick, isEditMode }: VertCardProps) {
  const color = getHealthColor(health);
  const lh = DIAMOND;
  const lx = cx - CELL / 2 + 2;
  const ly = dim.centerY - lh / 2;
  const lw = CELL - 4;

  const lineY1 = dim.topLeftY;
  const lineY2 = dim.bottomLeftY + dim.bottomH;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Decorative guide line */}
      <line x1={cx} y1={lineY1} x2={cx} y2={lineY2} stroke={GRID_STROKE} strokeWidth={1} strokeDasharray="2,2" opacity={0.3} />

      {/* Interactive label box */}
      <motion.g
        animate={{ opacity }}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onClick={onClick}
        onDoubleClick={isEditMode ? onDoubleClick : undefined}
        style={{ cursor: isEditMode ? 'pointer' : 'default', pointerEvents: 'auto' }}
      >
        <rect x={lx} y={ly} width={lw} height={lh} fill={BG_CARD} stroke={highlighted ? color : GRID_STROKE} strokeWidth={highlighted ? 2 : 1} rx={3} />
        <rect x={lx} y={ly} width={lw} height={3} fill={color} rx={1} />
        <g transform={`rotate(${-rotation}, ${dim.centerX}, ${dim.centerY})`}>
          <g transform={`rotate(-90, ${cx}, ${dim.centerY})`}>
            <foreignObject x={cx - (lh - 10) / 2} y={dim.centerY - lw / 2} width={lh - 10} height={lw}>
              <div className="flex items-center justify-center w-full h-full text-white text-[10px] font-medium">
                <span className="truncate text-center w-full">{title}</span>
              </div>
            </foreignObject>
          </g>
        </g>
      </motion.g>
    </g>
  );
}

// ============================================================================
// OWNER SECTION — header bar + vertical name labels + grid lines
// ============================================================================
function OwnerSection({
  owners, dim, rotation, isHighlighted, getOpacity,
  setHoveredElement, setSelectedElement, openEditModal, isEditMode,
}: {
  owners: Owner[];
  dim: MatrixDimensions;
  rotation: number;
  isHighlighted: (id: string) => boolean;
  getOpacity: (id: string) => number;
  setHoveredElement: (e: any) => void;
  setSelectedElement: (e: any) => void;
  openEditModal: (type: EntityType, item: any) => void;
  isEditMode: boolean;
}) {
  const { ownerGridX, ownerGridY, ownerW, topH, centerX, centerY, half, bottomH } = dim;

  return (
    <g className="owners-section">
      {/* Header */}
      <g transform={`rotate(${-rotation}, ${centerX}, ${centerY})`}>
        <rect x={ownerGridX} y={ownerGridY - OWNER_HEADER_H} width={ownerW} height={OWNER_HEADER_H} fill="rgb(51,65,85)" />
        <text x={ownerGridX + ownerW / 2} y={ownerGridY - OWNER_HEADER_H / 2 + 4} textAnchor="middle" fill="rgb(148,163,184)" fontSize="10" fontWeight="600">Owners</text>
      </g>

      {/* Column grid lines */}
      {Array.from({ length: owners.length + 1 }).map((_, i) => (
        <line key={`oc${i}`} x1={ownerGridX + i * CELL} y1={ownerGridY} x2={ownerGridX + i * CELL} y2={ownerGridY + topH + DIAMOND + bottomH} stroke="rgb(71,85,105)" strokeWidth={1} shapeRendering="crispEdges" />
      ))}
      {/* Row grid lines aligned with initiatives */}
      {Array.from({ length: dim.initCount + 1 }).map((_, i) => (
        <line key={`or${i}`} x1={ownerGridX} y1={ownerGridY + i * CELL} x2={ownerGridX + ownerW} y2={ownerGridY + i * CELL} stroke="rgb(71,85,105)" strokeWidth={1} shapeRendering="crispEdges" />
      ))}

      {/* Owner name labels */}
      {owners.map((owner, idx) => {
        const cx = ownerGridX + idx * CELL + CELL / 2;
        return (
          <motion.g
            key={owner.id}
            animate={{ opacity: getOpacity(owner.id) }}
            onMouseEnter={() => setHoveredElement({ id: owner.id, type: 'owner' })}
            onMouseLeave={() => setHoveredElement(null)}
            onClick={() => setSelectedElement({ id: owner.id, type: 'owner' })}
            onDoubleClick={isEditMode ? () => openEditModal('owner', owner) : undefined}
            style={{ cursor: isEditMode ? 'pointer' : 'default' }}
          >
            <g transform={`rotate(${-rotation}, ${centerX}, ${centerY})`}>
              <g transform={`rotate(-90, ${cx}, ${centerY})`}>
                <foreignObject x={cx - 40} y={centerY - 12} width={80} height={24}>
                  <div className="flex items-center justify-center w-full h-full text-[9px] font-medium">
                    <span className={cn('truncate text-center w-full', isHighlighted(owner.id) ? 'text-blue-300' : 'text-slate-400')}>
                      {owner.name}
                    </span>
                  </div>
                </foreignObject>
              </g>
            </g>
          </motion.g>
        );
      })}
    </g>
  );
}

// ============================================================================
// EMPTY STATE PLACEHOLDERS — polished, enterprise-grade empty band messages
// ============================================================================
function EmptyStatePlaceholders({ dim, data, rotation }: { dim: MatrixDimensions; data: any; rotation: number }) {
  const { centerX, centerY, topLeftX, topLeftY, topRightX, bottomLeftY, ownerGridX, leftW, rightW, topH, bottomH, ownerW } = dim;

  const placeholders: { show: boolean; x: number; y: number; label: string; sub: string }[] = [
    { show: data.initiatives.length === 0, x: centerX, y: topLeftY + topH / 2, label: 'No Initiatives', sub: 'Switch to Edit mode to add initiatives' },
    { show: data.annualObjectives.length === 0, x: topLeftX + leftW / 2, y: centerY, label: 'No Annual Objectives', sub: 'Switch to Edit mode to add' },
    { show: data.kpis.length === 0, x: topRightX + rightW / 2, y: centerY, label: 'No KPIs', sub: 'Switch to Edit mode to add KPIs' },
    { show: data.longTermObjectives.length === 0, x: centerX, y: bottomLeftY + bottomH / 2, label: 'No Long-Term Objectives', sub: 'Switch to Edit mode to add' },
    { show: data.owners.length === 0, x: ownerGridX + ownerW / 2, y: centerY, label: 'No Owners', sub: 'Add owners' },
  ];

  return (
    <g>
      {placeholders.filter(p => p.show).map((p, i) => (
        <g key={i} transform={`rotate(${-rotation}, ${centerX}, ${centerY})`}>
          <text x={p.x} y={p.y - 6} textAnchor="middle" fill="rgb(100,116,139)" fontSize="11" fontWeight="500">{p.label}</text>
          <text x={p.x} y={p.y + 10} textAnchor="middle" fill="rgb(71,85,105)" fontSize="9">{p.sub}</text>
        </g>
      ))}
    </g>
  );
}

// ============================================================================
// ADD BUTTONS — positions driven by layout.ts dimensions
// ============================================================================
function AddButtons({ dim, rotation, openAddModal }: { dim: MatrixDimensions; rotation: number; openAddModal: (type: EntityType) => void }) {
  const { centerX, centerY, topLeftX, topLeftY, topRightX, bottomLeftY, ownerGridX, rightW, bottomH, ownerW } = dim;
  const sz = 20;
  const buttonOffset = 14;
  const labelOffset = 10;

  const buttons: { x: number; y: number; label: string; type: EntityType; vertical?: boolean }[] = [
    { x: centerX, y: topLeftY - 25, label: '+ Initiative', type: 'initiative' },
    { x: topLeftX - buttonOffset, y: centerY, label: '+ AO', type: 'ao', vertical: true },
    { x: topRightX + rightW + OWNER_GAP / 2, y: centerY, label: '+ KPI', type: 'kpi', vertical: true },
    { x: ownerGridX + ownerW + buttonOffset, y: centerY, label: '+ Owner', type: 'owner', vertical: true },
    { x: centerX, y: bottomLeftY + bottomH + buttonOffset, label: '+ LTO', type: 'lto' },
  ];

  return (
    <g>
      {buttons.map((btn) => (
        <motion.g
          key={btn.type}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1, scale: 1.1 }}
          onClick={() => openAddModal(btn.type)}
          style={{ cursor: 'pointer' }}
        >
          <rect x={btn.x - sz / 2} y={btn.y - sz / 2} width={sz} height={sz} rx={3} fill="rgb(30,58,138)" stroke="rgb(59,130,246)" strokeWidth={1} />
          <g transform={`rotate(${-rotation}, ${centerX}, ${centerY})`}>
            <line x1={btn.x - 5} y1={btn.y} x2={btn.x + 5} y2={btn.y} stroke="rgb(147,197,253)" strokeWidth={1.5} strokeLinecap="round" />
            <line x1={btn.x} y1={btn.y - 5} x2={btn.x} y2={btn.y + 5} stroke="rgb(147,197,253)" strokeWidth={1.5} strokeLinecap="round" />
            {btn.vertical ? (
              <g transform={`rotate(-90, ${btn.x}, ${btn.y + sz / 2 + labelOffset})`}>
                <text x={btn.x} y={btn.y + sz / 2 + labelOffset} textAnchor="middle" fill="rgb(147,197,253)" fontSize="8" fontWeight="500">{btn.label}</text>
              </g>
            ) : (
              <text x={btn.x} y={btn.y + sz / 2 + labelOffset} textAnchor="middle" fill="rgb(147,197,253)" fontSize="8" fontWeight="500">{btn.label}</text>
            )}
          </g>
        </motion.g>
      ))}
    </g>
  );
}
