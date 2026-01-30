'use client';

import { useXMatrixStore } from '@/lib/store';
import { motion } from 'framer-motion';
import { getHealthColor, getRelationshipColor, getRelationshipDotSize } from '@/lib/utils';
import { KPI, Owner, Relationship, EntityType } from '@/lib/types';
import { useCallback, useMemo, useEffect } from 'react';
import { useXMatrixCRUD } from '@/hooks/useXMatrixCRUD';
import { Modal, LTOForm, AOForm, InitiativeForm, KPIForm, OwnerForm } from '@/components/shared/EntityModals';

// ============================================================================
// X-MATRIX UNIFIED GRID LAYOUT - Hoshin Kanri Standard
// All sections share the same cell size for perfect alignment
// ============================================================================
const GRID = {
  // Uniform cell size for ALL grid cells (reduced for better fit at 100% zoom)
  cellSize: 32,

  // Center diamond size (fixed, never changes)
  diamondSize: 180,

  // Padding around entire matrix (reduced for compact layout)
  padding: 40,

  // Gap between KPI section and Owner section
  ownerGap: 8,

  // Owner section header height
  ownerHeaderHeight: 24,

  // Grid line styling
  gridLineColor: 'rgba(0, 0, 0, 0.15)',
  gridLineWidth: 1,
};

export function XMatrix() {
  const {
    data,
    viewState,
    setHoveredElement,
    setSelectedElement,
    getHighlightedElements,
    toggleRelationship,
    addLongTermObjective,
    addAnnualObjective,
    addInitiative,
    addKPI,
    addOwner,
    fetchData,
  } = useXMatrixStore();

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const {
    modalType,
    editingItem,
    isSaving,
    openAddModal,
    openEditModal,
    closeModal,
    handleCreateLTO,
    handleUpdateLTO,
    handleDeleteLTO,
    handleCreateAO,
    handleUpdateAO,
    handleDeleteAO,
    handleCreateInitiative,
    handleUpdateInitiative,
    handleDeleteInitiative,
    handleCreateKPI,
    handleUpdateKPI,
    handleDeleteKPI,
    handleCreateOwner,
    handleUpdateOwner,
    handleDeleteOwner,
  } = useXMatrixCRUD();

  const { rotation } = viewState;
  const highlightedElements = getHighlightedElements();
  const hasHighlight = highlightedElements.size > 0;

  /* Reversed arrays for correct visual alignment in Grids */
  const reversedInitiatives = useMemo(() => [...data.initiatives].reverse(), [data.initiatives]);
  const reversedAnnualObjectives = useMemo(() => [...data.annualObjectives].reverse(), [data.annualObjectives]);

  // Calculate grid dimensions based on data counts
  const gridDimensions = useMemo(() => {
    const initCount = data.initiatives.length;
    const aoCount = data.annualObjectives.length;
    const kpiCount = data.kpis.length;
    const ltoCount = data.longTermObjectives.length;
    const ownerCount = data.owners.length;

    // Band sizes based on actual content (uniform cell size)
    const topBandHeight = initCount * GRID.cellSize;
    const bottomBandHeight = ltoCount * GRID.cellSize;
    const leftBandWidth = aoCount * GRID.cellSize;
    const rightBandWidth = kpiCount * GRID.cellSize;
    // Owners appear on FAR RIGHT, aligned with initiative rows
    const ownerBandWidth = ownerCount * GRID.cellSize;

    // Center offset
    const centerOffset = GRID.diamondSize / 2;

    // Total dimensions - owners are on the far right
    const totalWidth = GRID.padding + leftBandWidth + GRID.diamondSize + rightBandWidth + GRID.ownerGap + ownerBandWidth + GRID.padding;
    const totalHeight = GRID.padding + topBandHeight + GRID.diamondSize + bottomBandHeight + GRID.padding;

    // Center point of the matrix
    const centerX = GRID.padding + leftBandWidth + centerOffset;
    const centerY = GRID.padding + topBandHeight + centerOffset;

    return {
      initCount,
      aoCount,
      kpiCount,
      ltoCount,
      ownerCount,
      topBandHeight,
      bottomBandHeight,
      leftBandWidth,
      rightBandWidth,
      ownerBandWidth,
      centerX,
      centerY,
      centerOffset,
      totalWidth,
      totalHeight,
    };
  }, [data]);

  const { centerX, centerY, centerOffset } = gridDimensions;

  // Find relationship between two elements
  const findRelationship = useCallback((sourceId: string, targetId: string): Relationship | undefined => {
    return data.relationships.find(
      (r) => (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
    );
  }, [data.relationships]);

  const isHighlighted = useCallback((id: string) => {
    if (!hasHighlight) return true;
    return highlightedElements.has(id);
  }, [hasHighlight, highlightedElements]);

  const getOpacity = useCallback((id: string) => {
    if (!hasHighlight) return 1;
    return highlightedElements.has(id) ? 1 : 0.15;
  }, [hasHighlight, highlightedElements]);

  // ViewBox calculation
  const viewBoxWidth = gridDimensions.totalWidth;
  const viewBoxHeight = gridDimensions.totalHeight;

  return (
    <div className="w-full h-full flex items-center justify-center p-2 overflow-auto">
      <motion.svg
        viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
        className="max-w-full max-h-full"
        style={{ width: '100%', height: '100%', maxWidth: `${viewBoxWidth}px`, maxHeight: `${viewBoxHeight}px` }}
        initial={{ rotate: 0 }}
        animate={{ rotate: rotation }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="subtleGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* White Background */}
        <rect width="100%" height="100%" fill="rgb(15, 23, 42)" />

        {/* ================================================================== */}
        {/* BACKGROUNDS */}
        {/* ================================================================== */}

        {/* Owner section background - Rendered early to be behind the grid */}
        <rect
          x={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap}
          y={centerY - centerOffset - gridDimensions.topBandHeight - GRID.ownerHeaderHeight}
          width={gridDimensions.ownerBandWidth}
          height={gridDimensions.topBandHeight + GRID.ownerHeaderHeight + GRID.diamondSize + gridDimensions.bottomBandHeight}
          fill="rgb(30, 41, 59)"
          stroke="rgb(51, 65, 85)"
          strokeWidth="1"
        />

        {/* ================================================================== */}
        {/* RELATIONSHIP GRIDS - Four corner quadrants */}
        {/* ================================================================== */}

        {/* Top-Left: Initiatives (rows) × AO (columns) */}
        <RelationshipGrid
          rows={reversedInitiatives}
          cols={reversedAnnualObjectives}
          rowType="initiative"
          colType="ao"
          startX={centerX - centerOffset - gridDimensions.leftBandWidth}
          startY={centerY - centerOffset - gridDimensions.topBandHeight}
          gridWidth={gridDimensions.leftBandWidth}
          gridHeight={gridDimensions.topBandHeight}
          findRelationship={findRelationship}
          onCellClick={toggleRelationship}
          isHighlighted={isHighlighted}
        />

        {/* Top-Right: Initiatives (rows) × KPIs (columns) */}
        <RelationshipGrid
          rows={reversedInitiatives}
          cols={data.kpis}
          rowType="initiative"
          colType="kpi"
          startX={centerX + centerOffset}
          startY={centerY - centerOffset - gridDimensions.topBandHeight}
          gridWidth={gridDimensions.rightBandWidth}
          gridHeight={gridDimensions.topBandHeight}
          findRelationship={findRelationship}
          onCellClick={toggleRelationship}
          isHighlighted={isHighlighted}
        />

        {/* Far Right: Initiatives (rows) × Owners (columns) - WHO section */}
        <RelationshipGrid
          rows={reversedInitiatives}
          cols={data.owners}
          rowType="initiative"
          colType="owner"
          startX={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap}
          startY={centerY - centerOffset - gridDimensions.topBandHeight}
          gridWidth={gridDimensions.ownerBandWidth}
          gridHeight={gridDimensions.topBandHeight}
          findRelationship={findRelationship}
          onCellClick={toggleRelationship}
          isHighlighted={isHighlighted}
        />

        {/* Bottom-Left: LTO (rows) × AO (columns) */}
        <RelationshipGrid
          rows={data.longTermObjectives}
          cols={reversedAnnualObjectives}
          rowType="lto"
          colType="ao"
          startX={centerX - centerOffset - gridDimensions.leftBandWidth}
          startY={centerY + centerOffset}
          gridWidth={gridDimensions.leftBandWidth}
          gridHeight={gridDimensions.bottomBandHeight}
          findRelationship={findRelationship}
          onCellClick={toggleRelationship}
          isHighlighted={isHighlighted}
        />

        {/* Bottom-Right: LTO (rows) × KPIs (columns) */}
        <RelationshipGrid
          rows={data.longTermObjectives}
          cols={data.kpis}
          rowType="lto"
          colType="kpi"
          startX={centerX + centerOffset}
          startY={centerY + centerOffset}
          gridWidth={gridDimensions.rightBandWidth}
          gridHeight={gridDimensions.bottomBandHeight}
          findRelationship={findRelationship}
          onCellClick={toggleRelationship}
          isHighlighted={isHighlighted}
        />

        {/* ================================================================== */}
        {/* CENTER SQUARE - Fixed anchor with four sections */}
        {/* ================================================================== */}
        <CenterSquare
          cx={centerX}
          cy={centerY}
          size={GRID.diamondSize}
          rotation={rotation}
        />

        {/* ================================================================== */}
        {/* INITIATIVES (Top) - Horizontal rows spanning full width */}
        {/* Cells span from left AO grid to right KPI grid (like Image 2) */}
        {/* ================================================================== */}
        <g className="initiatives-section">
          {data.initiatives.map((init, index) => {
            // Items expand AWAY from center: last item nearest center, first item furthest up
            // Reversed index: newest items at the edge (furthest from center)
            const reversedIndex = data.initiatives.length - 1 - index;
            const cellY = centerY - centerOffset - gridDimensions.topBandHeight + (reversedIndex + 0.5) * GRID.cellSize;
            // Cell spans full width: from left of AO grid to right of KPI grid
            const fullWidth = gridDimensions.leftBandWidth + GRID.diamondSize + gridDimensions.rightBandWidth;
            const cellX = centerX - centerOffset - gridDimensions.leftBandWidth + fullWidth / 2;

            return (
              <InitiativeCell
                key={init.id}
                title={init.title}
                health={init.health}
                x={cellX}
                y={cellY}
                width={fullWidth}
                height={GRID.cellSize}
                rotation={rotation}
                center={{ x: centerX, y: centerY }}
                opacity={getOpacity(init.id)}
                isHighlighted={isHighlighted(init.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: init.id, type: 'initiative' } : null)}
                onClick={() => setSelectedElement({ id: init.id, type: 'initiative' })}
                onDoubleClick={() => openEditModal('initiative', init)}
              />
            );
          })}
        </g>

        {/* ================================================================== */}
        {/* ANNUAL OBJECTIVES (Left) - Vertical columns spanning full height */}
        {/* Cells span from top initiative grid to bottom LTO grid (like Image 2) */}
        {/* ================================================================== */}
        <g className="annual-objectives-section">
          {data.annualObjectives.map((ao, index) => {
            // Items expand AWAY from center: last item nearest center, first item furthest left
            // Reversed index: newest items at the edge (furthest from center)
            const reversedIndex = data.annualObjectives.length - 1 - index;
            const cellX = centerX - centerOffset - gridDimensions.leftBandWidth + (reversedIndex + 0.5) * GRID.cellSize;
            // Cell spans full height: from top of initiative grid to bottom of LTO grid
            const fullHeight = gridDimensions.topBandHeight + GRID.diamondSize + gridDimensions.bottomBandHeight;
            const cellY = centerY - centerOffset - gridDimensions.topBandHeight + fullHeight / 2;

            return (
              <VerticalCell
                key={ao.id}
                title={ao.title}
                health={ao.health}
                x={cellX}
                y={cellY}
                width={GRID.cellSize}
                height={fullHeight}
                rotation={rotation}
                center={{ x: centerX, y: centerY }}
                opacity={getOpacity(ao.id)}
                isHighlighted={isHighlighted(ao.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: ao.id, type: 'ao' } : null)}
                onClick={() => setSelectedElement({ id: ao.id, type: 'ao' })}
                onDoubleClick={() => openEditModal('ao', ao)}
              />
            );
          })}
        </g>

        {/* ================================================================== */}
        {/* KPIs / METRICS (Right) - Vertical columns spanning full height */}
        {/* Cells span from top initiative grid to bottom LTO grid (like Image 2) */}
        {/* ================================================================== */}
        <g className="kpis-section">
          {data.kpis.map((kpi, index) => {
            // Items expand AWAY from center: first item nearest center, last item furthest right
            const cellX = centerX + centerOffset + (index + 0.5) * GRID.cellSize;
            // Cell spans full height: from top of initiative grid to bottom of LTO grid
            const fullHeight = gridDimensions.topBandHeight + GRID.diamondSize + gridDimensions.bottomBandHeight;
            const cellY = centerY - centerOffset - gridDimensions.topBandHeight + fullHeight / 2;

            return (
              <KPICell
                key={kpi.id}
                kpi={kpi}
                x={cellX}
                y={cellY}
                width={GRID.cellSize}
                height={fullHeight}
                rotation={rotation}
                center={{ x: centerX, y: centerY }}
                opacity={getOpacity(kpi.id)}
                isHighlighted={isHighlighted(kpi.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: kpi.id, type: 'kpi' } : null)}
                onClick={() => setSelectedElement({ id: kpi.id, type: 'kpi' })}
                onDoubleClick={() => openEditModal('kpi', kpi)}
              />
            );
          })}
        </g>

        {/* ================================================================== */}
        {/* LONG-TERM OBJECTIVES (Bottom) - Horizontal rows spanning full width */}
        {/* Cells span from left AO grid to right KPI grid (like Image 2) */}
        {/* ================================================================== */}
        <g className="long-term-objectives-section">
          {data.longTermObjectives.map((lto, index) => {
            // Items expand AWAY from center: first item nearest center, last item furthest down
            const cellY = centerY + centerOffset + (index + 0.5) * GRID.cellSize;
            // Cell spans full width: from left of AO grid to right of KPI grid
            const fullWidth = gridDimensions.leftBandWidth + GRID.diamondSize + gridDimensions.rightBandWidth;
            const cellX = centerX - centerOffset - gridDimensions.leftBandWidth + fullWidth / 2;

            return (
              <HorizontalCell
                key={lto.id}
                title={lto.title}
                health={lto.health}
                x={cellX}
                y={cellY}
                width={fullWidth}
                height={GRID.cellSize}
                rotation={rotation}
                center={{ x: centerX, y: centerY }}
                opacity={getOpacity(lto.id)}
                isHighlighted={isHighlighted(lto.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: lto.id, type: 'lto' } : null)}
                onClick={() => setSelectedElement({ id: lto.id, type: 'lto' })}
                onDoubleClick={() => openEditModal('lto', lto)}
              />
            );
          })}
        </g>

        {/* ================================================================== */}
        {/* OWNERS (Far Right) - WHO section with header and background */}
        {/* Like reference image: light background column with "Owners" header */}
        {/* ================================================================== */}
        <g className="owners-section">
          {/* Owner section background moved to top of SVG for correct layering */}

          {/* "Owners" header label */}
          <g transform={`rotate(${-rotation}, ${centerX}, ${centerY})`}>
            <rect
              x={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap}
              y={centerY - centerOffset - gridDimensions.topBandHeight - GRID.ownerHeaderHeight}
              width={gridDimensions.ownerBandWidth}
              height={GRID.ownerHeaderHeight}
              fill="rgb(51, 65, 85)"
            />
            <text
              x={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap + gridDimensions.ownerBandWidth / 2}
              y={centerY - centerOffset - gridDimensions.topBandHeight - GRID.ownerHeaderHeight / 2 + 4}
              textAnchor="middle"
              fill="rgb(148, 163, 184)"
              fontSize="10"
              fontWeight="600"
            >
              Owners
            </text>
          </g>

          {/* Owner column headers with vertical text */}
          {data.owners.map((owner, index) => {
            const cellX = centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap + (index + 0.5) * GRID.cellSize;
            // Position below the "Owners" header, spanning the full height
            const cellY = centerY;

            return (
              <OwnerHeaderCell
                key={owner.id}
                owner={owner}
                x={cellX}
                y={cellY}
                rotation={rotation}
                center={{ x: centerX, y: centerY }}
                opacity={getOpacity(owner.id)}
                isHighlighted={isHighlighted(owner.id)}
                onHover={(hover) => setHoveredElement(hover ? { id: owner.id, type: 'owner' } : null)}
                onClick={() => setSelectedElement({ id: owner.id, type: 'owner' })}
                onDoubleClick={() => openEditModal('owner', owner)}
              />
            );
          })}

          {/* Grid lines for owner columns */}
          {Array.from({ length: gridDimensions.ownerCount + 1 }).map((_, i) => (
            <line
              key={`owner-col-${i}`}
              x1={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap + i * GRID.cellSize}
              y1={centerY - centerOffset - gridDimensions.topBandHeight}
              x2={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap + i * GRID.cellSize}
              y2={centerY + centerOffset + gridDimensions.bottomBandHeight}
              stroke="rgb(71, 85, 105)"
              strokeWidth="1"
            />
          ))}

          {/* Grid lines for owner rows (aligned with initiatives + LTOs) */}
          {Array.from({ length: gridDimensions.initCount + 1 }).map((_, i) => (
            <line
              key={`owner-init-row-${i}`}
              x1={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap}
              y1={centerY - centerOffset - gridDimensions.topBandHeight + i * GRID.cellSize}
              x2={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap + gridDimensions.ownerBandWidth}
              y2={centerY - centerOffset - gridDimensions.topBandHeight + i * GRID.cellSize}
              stroke="rgb(71, 85, 105)"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* ================================================================== */}
        {/* ADD BUTTONS */}
        {/* ================================================================== */}
        <AddButton
          x={centerX}
          y={centerY - centerOffset - gridDimensions.topBandHeight - 25}
          label="+ Initiative"
          onClick={() => openAddModal('initiative')}
          rotation={rotation}
          center={{ x: centerX, y: centerY }}
        />
        <AddButton
          x={centerX - centerOffset - gridDimensions.leftBandWidth - 25}
          y={centerY}
          label="+ AO"
          onClick={() => openAddModal('ao')}
          rotation={rotation}
          center={{ x: centerX, y: centerY }}
          vertical
        />
        <AddButton
          x={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap / 2}
          y={centerY}
          label="+ KPI"
          onClick={() => openAddModal('kpi')}
          rotation={rotation}
          center={{ x: centerX, y: centerY }}
          vertical
        />
        <AddButton
          x={centerX + centerOffset + gridDimensions.rightBandWidth + GRID.ownerGap + gridDimensions.ownerBandWidth + 25}
          y={centerY}
          label="+ Owner"
          onClick={() => openAddModal('owner')}
          rotation={rotation}
          center={{ x: centerX, y: centerY }}
          vertical
        />
        <AddButton
          x={centerX}
          y={centerY + centerOffset + gridDimensions.bottomBandHeight + 25}
          label="+ LTO"
          onClick={() => openAddModal('lto')}
          rotation={rotation}
          center={{ x: centerX, y: centerY }}
        />
      </motion.svg>

      {/* Edit Modals */}
      <Modal
        isOpen={modalType === 'lto'}
        onClose={closeModal}
        title={editingItem ? 'Edit Long-Term Objective' : 'New Long-Term Objective'}
      >
        <LTOForm
          initialData={editingItem as any}
          onSubmit={editingItem ? handleUpdateLTO : handleCreateLTO}
          onDelete={editingItem ? () => handleDeleteLTO(editingItem.id) : undefined}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'ao'}
        onClose={closeModal}
        title={editingItem ? 'Edit Annual Objective' : 'New Annual Objective'}
      >
        <AOForm
          initialData={editingItem as any}
          onSubmit={editingItem ? handleUpdateAO : handleCreateAO}
          onDelete={editingItem ? () => handleDeleteAO(editingItem.id) : undefined}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'initiative'}
        onClose={closeModal}
        title={editingItem ? 'Edit Initiative' : 'New Initiative'}
      >
        <InitiativeForm
          initialData={editingItem as any}
          onSubmit={editingItem ? handleUpdateInitiative : handleCreateInitiative}
          onDelete={editingItem ? () => handleDeleteInitiative(editingItem.id) : undefined}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'kpi'}
        onClose={closeModal}
        title={editingItem ? 'Edit KPI' : 'New KPI'}
      >
        <KPIForm
          initialData={editingItem as any}
          onSubmit={editingItem ? handleUpdateKPI : handleCreateKPI}
          onDelete={editingItem ? () => handleDeleteKPI(editingItem.id) : undefined}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>

      <Modal
        isOpen={modalType === 'owner'}
        onClose={closeModal}
        title={editingItem ? 'Edit Owner' : 'New Owner'}
      >
        <OwnerForm
          initialData={editingItem as any}
          onSubmit={editingItem ? handleUpdateOwner : handleCreateOwner}
          onDelete={editingItem ? () => handleDeleteOwner(editingItem.id) : undefined}
          onCancel={closeModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}

// ============================================================================
// CENTER SQUARE COMPONENT (Hoshin Kanri Standard)
// ============================================================================
interface CenterSquareProps {
  cx: number;
  cy: number;
  size: number;
  rotation: number;
}

function CenterSquare({ cx, cy, size, rotation }: CenterSquareProps) {
  const half = size / 2;

  return (
    <g className="center-square">
      {/* Square outline */}
      <rect
        x={cx - half}
        y={cy - half}
        width={size}
        height={size}
        fill="rgb(30, 41, 59)"
        stroke="rgb(51, 65, 85)"
        strokeWidth="2"
      />

      {/* X lines through center */}
      <line x1={cx - half} y1={cy - half} x2={cx + half} y2={cy + half} stroke="rgb(51, 65, 85)" strokeWidth="1.5" />
      <line x1={cx + half} y1={cy - half} x2={cx - half} y2={cy + half} stroke="rgb(51, 65, 85)" strokeWidth="1.5" />

      {/* Section labels - counter-rotated to stay readable */}
      <g transform={`rotate(${-rotation}, ${cx}, ${cy})`}>
        {/* Top - Improvement Priorities */}
        <text x={cx} y={cy - half / 2 - 10} textAnchor="middle" fill="rgb(59, 130, 246)" fontSize="11" fontWeight="500" fontStyle="italic">
          Top Level
        </text>
        <text x={cx} y={cy - half / 2 + 5} textAnchor="middle" fill="rgb(59, 130, 246)" fontSize="11" fontWeight="500" fontStyle="italic">
          Improvement
        </text>
        <text x={cx} y={cy - half / 2 + 20} textAnchor="middle" fill="rgb(59, 130, 246)" fontSize="11" fontWeight="500" fontStyle="italic">
          Priorities
        </text>

        {/* Left - Annual Objectives */}
        <text x={cx - half / 2} y={cy - 5} textAnchor="middle" fill="rgb(34, 197, 94)" fontSize="11" fontWeight="500" fontStyle="italic">
          Annual
        </text>
        <text x={cx - half / 2} y={cy + 10} textAnchor="middle" fill="rgb(34, 197, 94)" fontSize="11" fontWeight="500" fontStyle="italic">
          Objectives
        </text>

        {/* Right - Metrics to Improve */}
        <text x={cx + half / 2} y={cy - 5} textAnchor="middle" fill="rgb(249, 115, 22)" fontSize="11" fontWeight="500" fontStyle="italic">
          Metrics to
        </text>
        <text x={cx + half / 2} y={cy + 10} textAnchor="middle" fill="rgb(249, 115, 22)" fontSize="11" fontWeight="500" fontStyle="italic">
          Improve
        </text>

        {/* Bottom - Long-Term Objectives */}
        <text x={cx} y={cy + half / 2 - 5} textAnchor="middle" fill="rgb(239, 68, 68)" fontSize="11" fontWeight="500" fontStyle="italic">
          Long-Term
        </text>
        <text x={cx} y={cy + half / 2 + 10} textAnchor="middle" fill="rgb(239, 68, 68)" fontSize="11" fontWeight="500" fontStyle="italic">
          Objectives
        </text>
      </g>
    </g>
  );
}

// ============================================================================
// RELATIONSHIP GRID COMPONENT
// ============================================================================
interface RelationshipGridProps {
  rows: { id: string }[];
  cols: { id: string }[];
  rowType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  colType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  startX: number;
  startY: number;
  gridWidth: number;
  gridHeight: number;
  findRelationship: (a: string, b: string) => Relationship | undefined;
  onCellClick: (rowId: string, rowType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner', colId: string, colType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner') => void;
  isHighlighted: (id: string) => boolean;
}

function RelationshipGrid({
  rows,
  cols,
  rowType,
  colType,
  startX,
  startY,
  gridWidth,
  gridHeight,
  findRelationship,
  onCellClick,
  isHighlighted,
}: RelationshipGridProps) {
  const rowCount = rows.length;
  const colCount = cols.length;
  const cellWidth = colCount > 0 ? gridWidth / colCount : GRID.cellSize;
  const cellHeight = rowCount > 0 ? gridHeight / rowCount : GRID.cellSize;

  return (
    <g className="relationship-grid">
      {/* Grid background */}
      <rect
        x={startX}
        y={startY}
        width={gridWidth}
        height={gridHeight}
        fill="rgb(30, 41, 59)"
        stroke="rgb(51, 65, 85)"
        strokeWidth="1"
      />

      {/* Grid lines */}
      <g stroke={GRID.gridLineColor} strokeWidth={GRID.gridLineWidth}>
        {/* Vertical lines */}
        {Array.from({ length: colCount + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={startX + i * cellWidth}
            y1={startY}
            x2={startX + i * cellWidth}
            y2={startY + gridHeight}
            stroke="rgb(51, 65, 85)"
            shapeRendering="crispEdges"
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: rowCount + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={startX}
            y1={startY + i * cellHeight}
            x2={startX + gridWidth}
            y2={startY + i * cellHeight}
            stroke="rgb(51, 65, 85)"
            shapeRendering="crispEdges"
          />
        ))}
      </g>

      {/* Clickable cells and relationship dots */}
      {rows.map((row, rowIdx) => (
        cols.map((col, colIdx) => {
          const cellX = startX + colIdx * cellWidth;
          const cellY = startY + rowIdx * cellHeight;
          const dotX = cellX + cellWidth / 2;
          const dotY = cellY + cellHeight / 2;

          const relationship = findRelationship(row.id, col.id);
          const hasRelationship = relationship && relationship.strength !== 'none';
          const shouldHighlight = isHighlighted(row.id) && isHighlighted(col.id);

          return (
            <g key={`cell-${row.id}-${col.id}`}>
              {/* Clickable area - works for all grids including owner grids */}
              <rect
                x={cellX}
                y={cellY}
                width={cellWidth}
                height={cellHeight}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onClick={() => onCellClick(row.id, rowType, col.id, colType)}
              />

              {/* Relationship dot */}
              {hasRelationship && (
                <motion.circle
                  cx={dotX}
                  cy={dotY}
                  r={getRelationshipDotSize(relationship.strength) / 2}
                  fill={getRelationshipColor(relationship.strength)}
                  opacity={shouldHighlight ? 1 : 0.4}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2 }}
                  style={{ pointerEvents: 'none' }}
                />
              )}
            </g>
          );
        })
      ))}
    </g>
  );
}

// ============================================================================
// INITIATIVE CELL - Horizontal row (text reads left to right)
// ============================================================================
interface InitiativeCellProps {
  title: string;
  health: 'on-track' | 'at-risk' | 'off-track';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  center: { x: number; y: number };
  opacity: number;
  isHighlighted: boolean;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function InitiativeCell({
  title,
  health,
  x,
  y,
  width,
  height,
  rotation,
  center,
  opacity,
  isHighlighted,
  onHover,
  onClick,
  onDoubleClick,
}: InitiativeCellProps) {
  const healthColor = getHealthColor(health);
  const displayTitle = title.length > 40 ? title.substring(0, 40) + '...' : title;
  // Label box is centered over the diamond area (not full width)
  const labelWidth = GRID.diamondSize; // Match diamond size

  return (
    <motion.g
      animate={{ opacity }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Row line spanning full width (subtle) */}
      <line
        x1={x - width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y}
        stroke="rgb(51, 65, 85)"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity={0.3}
      />
      {/* Label box in center (over diamond) */}
      <rect
        x={center.x - labelWidth / 2}
        y={y - height / 2 + 2}
        width={labelWidth}
        height={height - 4}
        fill="rgb(30, 41, 59)"
        stroke={isHighlighted ? healthColor : 'rgb(51, 65, 85)'}
        strokeWidth={isHighlighted ? 2 : 1}
        rx="2"
      />
      {/* Health indicator bar on left of label */}
      <rect
        x={center.x - labelWidth / 2}
        y={y - height / 2 + 2}
        width="3"
        height={height - 4}
        fill={healthColor}
        rx="1"
      />
      {/* Text - counter-rotated, reads left to right */}
      <g transform={`rotate(${-rotation}, ${center.x}, ${center.y})`}>
        <text
          x={center.x}
          y={y + 4}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="500"
        >
          {displayTitle}
        </text>
      </g>
    </motion.g>
  );
}

// ============================================================================
// VERTICAL CELL - For Annual Objectives (text rotated 90° bottom to top)
// ============================================================================
interface VerticalCellProps {
  title: string;
  health: 'on-track' | 'at-risk' | 'off-track';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  center: { x: number; y: number };
  opacity: number;
  isHighlighted: boolean;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function VerticalCell({
  title,
  health,
  x,
  y,
  width,
  height,
  rotation,
  center,
  opacity,
  isHighlighted,
  onHover,
  onClick,
  onDoubleClick,
}: VerticalCellProps) {
  const healthColor = getHealthColor(health);
  const displayTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
  // Label box is centered over the diamond area (not full height)
  const labelHeight = GRID.diamondSize; // Match diamond size

  return (
    <motion.g
      animate={{ opacity }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Column line spanning full height (subtle) */}
      <line
        x1={x}
        y1={y - height / 2}
        x2={x}
        y2={y + height / 2}
        stroke="rgb(51, 65, 85)"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity={0.3}
      />
      {/* Label box in center (over diamond) */}
      <rect
        x={x - width / 2 + 2}
        y={center.y - labelHeight / 2}
        width={width - 4}
        height={labelHeight}
        fill="rgb(30, 41, 59)"
        stroke={isHighlighted ? healthColor : 'rgb(51, 65, 85)'}
        strokeWidth={isHighlighted ? 2 : 1}
        rx="2"
      />
      {/* Health indicator bar on top of label */}
      <rect
        x={x - width / 2 + 2}
        y={center.y - labelHeight / 2}
        width={width - 4}
        height="3"
        fill={healthColor}
        rx="1"
      />
      {/* Text - counter-rotated, then rotated -90 to read bottom to top */}
      <g transform={`rotate(${-rotation}, ${center.x}, ${center.y})`}>
        <g transform={`rotate(-90, ${x}, ${center.y})`}>
          <text
            x={x}
            y={center.y + 4}
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="500"
          >
            {displayTitle}
          </text>
        </g>
      </g>
    </motion.g>
  );
}

// ============================================================================
// HORIZONTAL CELL - For Long-Term Objectives (text reads left to right)
// ============================================================================
interface HorizontalCellProps {
  title: string;
  health: 'on-track' | 'at-risk' | 'off-track';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  center: { x: number; y: number };
  opacity: number;
  isHighlighted: boolean;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function HorizontalCell({
  title,
  health,
  x,
  y,
  width,
  height,
  rotation,
  center,
  opacity,
  isHighlighted,
  onHover,
  onClick,
  onDoubleClick,
}: HorizontalCellProps) {
  const healthColor = getHealthColor(health);
  const displayTitle = title.length > 45 ? title.substring(0, 45) + '...' : title;
  // Label box is centered over the diamond area (not full width)
  const labelWidth = GRID.diamondSize; // Match diamond size

  return (
    <motion.g
      animate={{ opacity }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Row line spanning full width (subtle) */}
      <line
        x1={x - width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y}
        stroke="rgb(51, 65, 85)"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity={0.3}
      />
      {/* Label box in center (over diamond) */}
      <rect
        x={center.x - labelWidth / 2}
        y={y - height / 2 + 2}
        width={labelWidth}
        height={height - 4}
        fill="rgb(30, 41, 59)"
        stroke={isHighlighted ? healthColor : 'rgb(51, 65, 85)'}
        strokeWidth={isHighlighted ? 2 : 1}
        rx="2"
      />
      {/* Health indicator bar on left of label */}
      <rect
        x={center.x - labelWidth / 2}
        y={y - height / 2 + 2}
        width="3"
        height={height - 4}
        fill={healthColor}
        rx="1"
      />
      {/* Text - counter-rotated, reads left to right */}
      <g transform={`rotate(${-rotation}, ${center.x}, ${center.y})`}>
        <text
          x={center.x}
          y={y + 4}
          textAnchor="middle"
          fill="white"
          fontSize="10"
          fontWeight="500"
        >
          {displayTitle}
        </text>
      </g>
    </motion.g>
  );
}

// ============================================================================
// KPI CELL - Vertical column (text rotated 90° bottom to top)
// ============================================================================
interface KPICellProps {
  kpi: KPI;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  center: { x: number; y: number };
  opacity: number;
  isHighlighted: boolean;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function KPICell({
  kpi,
  x,
  y,
  width,
  height,
  rotation,
  center,
  opacity,
  isHighlighted,
  onHover,
  onClick,
  onDoubleClick,
}: KPICellProps) {
  const healthColor = getHealthColor(kpi.health);
  const displayTitle = kpi.title.length > 25 ? kpi.title.substring(0, 25) + '...' : kpi.title;
  // Label box is centered over the diamond area (not full height)
  const labelHeight = GRID.diamondSize; // Match diamond size

  return (
    <motion.g
      animate={{ opacity }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Column line spanning full height (subtle) */}
      <line
        x1={x}
        y1={y - height / 2}
        x2={x}
        y2={y + height / 2}
        stroke="rgb(51, 65, 85)"
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity={0.3}
      />
      {/* Label box in center (over diamond) */}
      <rect
        x={x - width / 2 + 2}
        y={center.y - labelHeight / 2}
        width={width - 4}
        height={labelHeight}
        fill="rgb(30, 41, 59)"
        stroke={isHighlighted ? healthColor : 'rgb(51, 65, 85)'}
        strokeWidth={isHighlighted ? 2 : 1}
        rx="2"
      />
      {/* Health indicator bar on top of label */}
      <rect
        x={x - width / 2 + 2}
        y={center.y - labelHeight / 2}
        width={width - 4}
        height="3"
        fill={healthColor}
        rx="1"
      />
      {/* Text - counter-rotated, then rotated -90 to read bottom to top */}
      <g transform={`rotate(${-rotation}, ${center.x}, ${center.y})`}>
        <g transform={`rotate(-90, ${x}, ${center.y})`}>
          <text
            x={x}
            y={center.y + 4}
            textAnchor="middle"
            fill="white"
            fontSize="9"
            fontWeight="500"
          >
            {displayTitle}
          </text>
        </g>
      </g>
    </motion.g>
  );
}

// ============================================================================
// OWNER HEADER CELL - Vertical text at bottom of owner column (like reference)
// ============================================================================
interface OwnerHeaderCellProps {
  owner: Owner;
  x: number;
  y: number;
  rotation: number;
  center: { x: number; y: number };
  opacity: number;
  isHighlighted: boolean;
  onHover: (hover: boolean) => void;
  onClick: () => void;
  onDoubleClick?: () => void;
}

function OwnerHeaderCell({
  owner,
  x,
  y,
  rotation,
  center,
  opacity,
  isHighlighted,
  onHover,
  onClick,
  onDoubleClick,
}: OwnerHeaderCellProps) {
  const displayName = owner.name.length > 14 ? owner.name.substring(0, 14) + '...' : owner.name;

  return (
    <motion.g
      animate={{ opacity }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Counter-rotate to stay readable, then rotate -90 for vertical text */}
      {/* Position at the bottom of the owner section */}
      <g transform={`rotate(${-rotation}, ${center.x}, ${center.y})`}>
        <g transform={`rotate(-90, ${x}, ${y})`}>
          <text
            x={x}
            y={y + 3}
            textAnchor="middle"
            fill={isHighlighted ? 'rgb(147, 197, 253)' : 'rgb(148, 163, 184)'}
            fontSize="8"
            fontWeight="500"
          >
            {displayName}
          </text>
        </g>
      </g>
    </motion.g>
  );
}

// ============================================================================
// ADD BUTTON COMPONENT
// ============================================================================
interface AddButtonProps {
  x: number;
  y: number;
  label: string;
  onClick: () => void;
  rotation: number;
  center: { x: number; y: number };
  vertical?: boolean;
}

function AddButton({ x, y, label, onClick, rotation, center, vertical }: AddButtonProps) {
  const size = 20;

  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      whileHover={{ opacity: 1, scale: 1.1 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x - size / 2}
        y={y - size / 2}
        width={size}
        height={size}
        rx="3"
        fill="rgb(30, 58, 138)"
        stroke="rgb(59, 130, 246)"
        strokeWidth="1"
      />
      <g transform={`rotate(${-rotation}, ${center.x}, ${center.y})`}>
        <line
          x1={x - 5}
          y1={y}
          x2={x + 5}
          y2={y}
          stroke="rgb(147, 197, 253)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1={x}
          y1={y - 5}
          x2={x}
          y2={y + 5}
          stroke="rgb(147, 197, 253)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {vertical ? (
          <g transform={`rotate(-90, ${x}, ${y + size / 2 + 15})`}>
            <text
              x={x}
              y={y + size / 2 + 15}
              textAnchor="middle"
              fill="rgb(147, 197, 253)"
              fontSize="8"
              fontWeight="500"
            >
              {label}
            </text>
          </g>
        ) : (
          <text
            x={x}
            y={y + size / 2 + 12}
            textAnchor="middle"
            fill="rgb(147, 197, 253)"
            fontSize="8"
            fontWeight="500"
          >
            {label}
          </text>
        )}
      </g>
    </motion.g>
  );
}
