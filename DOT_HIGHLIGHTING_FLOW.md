# How Relationship Dots Get Highlighted - Complete Flow

## Overview
When you hover over LTO-1, the visual dots/connections between LTO-1 and its related elements (like AO-1) **change opacity and glow** to show the connection is "active".

---

## Data Structure: Relationship Dot

### Visual Representation
```
LTO-1 ─────●───── AO-1
          dot
       (colored circle)
```

The dot is an SVG `<circle>` element placed at the intersection of:
- **Row:** LTO-1 (horizontal)
- **Column:** AO-1 (vertical)

### Relationship Data
```typescript
interface Relationship {
  sourceId: 'lto-001',
  sourceType: 'lto',
  targetId: 'ao-001',
  targetType: 'ao',
  strength: 'primary'  // or 'secondary'
}
```

---

## Complete Flow: Hovering Over LTO-1

### Visual Layout (Matrix)
```
                     AO-1        AO-2        AO-3
                     ↓           ↓           ↓
    ┌─────────────┬─────────┬─────────┬─────────┐
    │   LTO-1     │    ●    │         │         │  ← LTO row
    │             │ (dot)   │         │         │
    ├─────────────┼─────────┼─────────┼─────────┤
    │   LTO-2     │         │    ●    │         │
    │             │         │ (dot)   │         │
    ├─────────────┼─────────┼─────────┼─────────┤
    │   LTO-3     │         │         │    ●    │
    │             │         │         │ (dot)   │
    └─────────────┴─────────┴─────────┴─────────┘
```

When you hover over LTO-1:
- The dot at (LTO-1, AO-1) should highlight
- The dot at (LTO-1, AO-3) should highlight
- The dot at (LTO-2, AO-1) should **NOT** highlight (LTO-2 not hovered)

---

## Step-by-Step: The Highlighting Process

### Step 1: User Hovers Over LTO-1
**File:** `src/components/x-matrix/XMatrix.tsx` (line 265)

```typescript
<HorizCard
  key={lto.id}           // 'lto-001'
  title={lto.title}
  // ...
  onHover={(h) => setHoveredElement(h ? { id: 'lto-001', type: 'lto' } : null)}
  //                                      ↑ Updates store
/>
```

**Result:** Store updates:
```javascript
viewState.hoveredElement = { id: 'lto-001', type: 'lto' }
```

↓

### Step 2: Component Re-renders with New Highlight Set

**File:** `src/lib/store.ts` (line 974-981)

```typescript
getHighlightedElements: () => {
  const { viewState } = get();
  const activeElement = viewState.hoveredElement || viewState.selectedElement;
  // activeElement = { id: 'lto-001', type: 'lto' }

  if (!activeElement) return new Set<string>();

  // BFS traversal finds all related elements
  return get().getRelatedElements('lto-001', 'lto');
}

// Returns: Set(['lto-001', 'ao-001', 'ao-003', 'init-001', ...])
```

**Component re-renders** with:
```javascript
const highlightedElements = getHighlightedElements();
// = Set(['lto-001', 'ao-001', 'ao-003', 'init-001', ...])
```

↓

### Step 3: RelGrid Component Renders Relationship Dots

**File:** `src/components/x-matrix/XMatrix.tsx` (lines 415-455)

This is the **KEY SECTION** where dots are rendered and highlighted:

```typescript
function RelGrid({
  rows,        // [{ id: 'lto-001' }, { id: 'lto-002' }, { id: 'lto-003' }]
  cols,        // [{ id: 'ao-001' }, { id: 'ao-002' }, { id: 'ao-003' }]
  rowType,     // 'lto'
  colType,     // 'ao'
  ox, oy,      // Origin (top-left) coordinates
  // ... other props
  findRel,     // Function to find relationship between two elements
  isHighlighted, // Function: (id: string) => boolean
  isEditMode,
}: RelGridProps) {
  // ...

  return (
    <g className="rel-grid">
      {/* Grid background and lines omitted for clarity */}

      {/* RENDER ALL CELLS + DOTS */}
      {rows.map((row, ri) =>
        cols.map((col, ci) => {
          // row = { id: 'lto-001' }
          // col = { id: 'ao-001' }
          // ri = 0, ci = 0

          // ──────────────────────────────────────────────────
          // STEP 3a: Calculate dot position
          // ──────────────────────────────────────────────────
          const cx = ox + (colOffset + ci) * CELL + CELL / 2;
          const cy = oy + (rowOffset + ri) * CELL + CELL / 2;
          // cx, cy = center of grid cell for (LTO-1, AO-1) intersection

          // ──────────────────────────────────────────────────
          // STEP 3b: Find relationship between row and col
          // ──────────────────────────────────────────────────
          const rel = findRel(row.id, col.id);
          // rel = {
          //   sourceId: 'lto-001',
          //   targetId: 'ao-001',
          //   strength: 'primary'
          // }

          // ──────────────────────────────────────────────────
          // STEP 3c: Check if relationship exists
          // ──────────────────────────────────────────────────
          const hasRel = rel && rel.strength !== 'none';
          // hasRel = true (relationship exists and strength is 'primary')

          // ──────────────────────────────────────────────────
          // STEP 3d: Determine if DOT should be highlighted
          // ──────────────────────────────────────────────────
          // This is the MAGIC LINE:
          const lit = isHighlighted(row.id) && isHighlighted(col.id);
          //           isHighlighted('lto-001') && isHighlighted('ao-001')
          //           true                     && true
          //           = true ← Dot is highlighted!

          // A dot only lights up if BOTH its row AND column are highlighted

          return (
            <g key={`${row.id}-${col.id}`}>
              {/* Clickable cell background (transparent) */}
              <rect
                x={ox + (colOffset + ci) * CELL}
                y={oy + (rowOffset + ri) * CELL}
                width={CELL}
                height={CELL}
                fill="transparent"
                style={{ cursor: isEditMode ? 'pointer' : 'default' }}
                onClick={isEditMode ? () => onCellClick(...) : undefined}
              />

              {/* RELATIONSHIP DOT */}
              {hasRel && (
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={getRelationshipDotSize(rel.strength) / 2}
                  // For 'primary': r = 10 / 2 = 5
                  // For 'secondary': r = 7 / 2 = 3.5
                  
                  fill={getRelationshipColor(rel.strength)}
                  // For 'primary': 'rgb(236, 72, 153)' (pink/magenta)
                  // For 'secondary': 'rgb(139, 92, 246)' (purple)

                  opacity={lit ? 1 : 0.35}
                  //        true   1    (bright when both row & col highlighted)
                  //        false  0.35 (dim otherwise)

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
```

---

## The Critical Logic: `lit = isHighlighted(row.id) && isHighlighted(col.id)`

This is the **gate** that determines if a dot highlights:

### Example Scenario
When hovering over LTO-1, `highlightedElements = Set(['lto-001', 'ao-001', 'ao-003', ...])`

For each cell in the RelGrid:

| Row ID | Col ID | isHighlighted(row) | isHighlighted(col) | lit | Opacity |
|--------|--------|-------------------|-------------------|-----|---------|
| lto-001 | ao-001 | true | true | **true** | **1.0** (bright) |
| lto-001 | ao-002 | true | false | **false** | **0.35** (dim) |
| lto-001 | ao-003 | true | true | **true** | **1.0** (bright) |
| lto-002 | ao-001 | false | true | **false** | **0.35** (dim) |
| lto-002 | ao-002 | false | false | **false** | **0.35** (dim) |
| lto-002 | ao-003 | false | true | **false** | **0.35** (dim) |

**Result:**
- Dots at (LTO-1, AO-1) and (LTO-1, AO-3) are bright (opacity = 1)
- All other dots are dimmed (opacity = 0.35)

---

## Complete Visual Flow Diagram

```
USER ACTION: Hover over LTO-1
     ↓
setHoveredElement({ id: 'lto-001', type: 'lto' })
     ↓
viewState.hoveredElement updated
     ↓
Component re-renders → getHighlightedElements() called
     ↓
getRelatedElements('lto-001', 'lto') runs BFS
     ↓
Returns: Set(['lto-001', 'ao-001', 'ao-003', ...])
     ↓
RelGrid component re-renders
     ↓
FOR EACH CELL (row, col):
  ├─ hasRel = findRel(row.id, col.id) ? true : false
  │
  └─ lit = isHighlighted(row.id) && isHighlighted(col.id)
           │                       └─ AND logic (both must be true)
           │
           ├─ If lit = true:
           │    ├─ opacity = 1    (BRIGHT)
           │    ├─ circle appears at full strength
           │    └─ shows strong connection
           │
           └─ If lit = false:
                ├─ opacity = 0.35 (DIM)
                ├─ circle appears faded
                └─ shows weak/no connection
     ↓
SVG re-renders with new opacity values
     ↓
VISUAL RESULT: Connected dots glow bright, others fade
```

---

## Key Code Locations

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Hover detection | XMatrix.tsx | 265 | Triggers `setHoveredElement` |
| Get highlighted elements | store.ts | 974-981 | Returns set of related IDs |
| Compute related elements | store.ts | 856-970 | BFS traversal (builds the set) |
| Render relationship grid | XMatrix.tsx | 345-455 | Renders dots with opacity |
| Relationship color function | utils.ts | 38-46 | Returns color based on strength |
| Relationship size function | utils.ts | 47-54 | Returns radius based on strength |

---

## Visual Comparison: Before vs After Hover

### Before Hover (No Element Selected)
```
LTO-1 ─────○───── AO-1    (dim dot, opacity = 0.35)
LTO-1 ─────○───── AO-2    (dim dot, opacity = 0.35)
LTO-1 ─────○───── AO-3    (dim dot, opacity = 0.35)
LTO-2 ─────○───── AO-1    (dim dot, opacity = 0.35)
(All dots faded)
```

### After Hovering Over LTO-1
```
LTO-1 ─────●───── AO-1    (BRIGHT dot, opacity = 1.0) ✨
LTO-1 ─────○───── AO-2    (dim dot, opacity = 0.35)
LTO-1 ─────●───── AO-3    (BRIGHT dot, opacity = 1.0) ✨
LTO-2 ─────○───── AO-1    (dim dot, opacity = 0.35)
           ↑ Only dots connecting hovered elements glow
```

---

## Why This Design?

1. **Two-way Validation:** A dot only lights up if BOTH elements are related
   - Prevents showing connections that don't exist
   - Ensures logical consistency

2. **Visual Clarity:** Users see exactly which relationships are active
   - Related dots = bright (opacity 1.0)
   - Unrelated dots = dim (opacity 0.35)
   - Easy to trace connections at a glance

3. **Relationship Strength Coding:**
   - **Primary (pink, size 10):** Strong/direct relationship
   - **Secondary (purple, size 7):** Supporting relationship
   - **None (invisible):** No relationship exists

4. **Smooth Animation:**
   ```typescript
   <motion.circle
     initial={{ scale: 0 }}
     animate={{ scale: 1 }}
     transition={{ duration: 0.2 }}
   />
   ```
   Dots smoothly scale in/out during hover transitions

---

## Example: Hover Over LTO-1, See Connected Dots

**Starting State:**
- Database has 3 LTOs and 3 AOs
- Relationships exist: (LTO-1 ↔ AO-1), (LTO-1 ↔ AO-3)
- No element hovered

**After Hovering LTO-1:**

1. **BFS finds:** { 'lto-001', 'ao-001', 'ao-003' }

2. **RelGrid checks each cell:**
   - (LTO-1, AO-1): lit = true && true = **true** → opacity = **1.0** ✨
   - (LTO-1, AO-2): lit = true && false = **false** → opacity = **0.35**
   - (LTO-1, AO-3): lit = true && true = **true** → opacity = **1.0** ✨
   - (LTO-2, AO-1): lit = false && true = **false** → opacity = **0.35**
   - etc.

3. **Visual Result:**
   - Bright dots appear at (LTO-1, AO-1) and (LTO-1, AO-3)
   - All other dots fade
   - User clearly sees: "LTO-1 is related to AO-1 and AO-3"

