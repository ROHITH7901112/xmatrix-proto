# How Relationships Work in X-Matrix Codebase

## Overview
When you hover over an element (LTO, AO, Initiative, KPI, Owner) in the X-Matrix, the app automatically highlights all **related elements** by tracing connection paths through relationships. This creates a visual "chain of impact" showing which elements are connected.

---

## Data Structure

### 1. Relationship Object (types.ts)
```typescript
export interface Relationship {
  sourceId: string;              // ID of source element
  sourceType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  targetId: string;              // ID of target element
  targetType: 'lto' | 'ao' | 'initiative' | 'kpi' | 'owner';
  strength: 'none' | 'primary' | 'secondary';  // Relationship strength
}
```

### 2. Two Types of Relationships

**Explicit Relationships** (stored in `relationships[]` array):
```
LTO (id: lto-001) --primary--> AO (id: ao-001)
AO (id: ao-001) --primary--> Initiative (id: init-001)
Initiative (id: init-001) --primary--> KPI (id: kpi-001)
```

**Implicit Relationships** (from KPI.ownerIds):
```
KPI (id: kpi-001) has ownerIds: ['owner-001', 'owner-002']
// This creates implicit links:
KPI (kpi-001) <---> Owner (owner-001)
KPI (kpi-001) <---> Owner (owner-002)
```

---

## Complete Flow: Hovering Over an Element

### Step 1: User Hovers Over Element (UI Event)
**File:** `src/components/x-matrix/XMatrix.tsx` (lines 200-265)

```typescript
// When user hovers over a Long-Term Objective
<HorizCard
  key={lto.id}
  title={lto.title}
  health={lto.health}
  // ... other props
  onHover={(h) => setHoveredElement(h ? { id: lto.id, type: 'lto' } : null)}
  // ↑ This sets hoveredElement in store
/>
```

**User Action:** Mouse enters LTO card with `id: "lto-001"` and `type: "lto"`

↓

### Step 2: Update Store's hoveredElement

**File:** `src/lib/store.ts` (line 286)

```typescript
setHoveredElement: (element) =>
  set((state) => ({ 
    viewState: { 
      ...state.viewState, 
      hoveredElement: element  // Now set to { id: 'lto-001', type: 'lto' }
    } 
  })),
```

Store state changes:
```
viewState.hoveredElement = { id: 'lto-001', type: 'lto' }
```

↓

### Step 3: Compute Highlighted Elements

**File:** `src/lib/store.ts` (lines 974-981)

```typescript 
getHighlightedElements: () => {
  const { viewState } = get();
  const activeElement = viewState.hoveredElement || viewState.selectedElement;
  // activeElement = { id: 'lto-001', type: 'lto' }

  if (!activeElement) return new Set<string>();

  // Call getRelatedElements with the hovered element
  return get().getRelatedElements(activeElement.id, activeElement.type);
},
```

This function calls `getRelatedElements('lto-001', 'lto')`

↓

### Step 4: Find All Related Elements (BFS Traversal)

**File:** `src/lib/store.ts` (lines 856-970)

This is the **CORE ALGORITHM** that finds all related elements:

#### 4a. Build Adjacency Map
```typescript
// Step 1: Create a map of which elements are connected
const adjacency = new Map<string, Set<string>>();

// Index explicit relationships
for (const rel of relationships) {
  addEdge(rel.sourceId, rel.targetId);  // Bidirectional
}

// Index implicit KPI ↔ Owner links
for (const kpi of kpis) {
  for (const ownerId of kpi.ownerIds) {
    addEdge(kpi.id, ownerId);
  }
}

// Result: adjacency map looks like:
// {
//   'lto-001': Set(['ao-001']),
//   'ao-001': Set(['lto-001', 'init-001']),
//   'init-001': Set(['ao-001', 'kpi-001']),
//   'kpi-001': Set(['init-001', 'owner-001', 'owner-002']),
//   'owner-001': Set(['kpi-001']),
//   'owner-002': Set(['kpi-001'])
// }
```

#### 4b. Create Entity Type Lookup Map
```typescript
const entityTypeById = new Map<string, string>();
for (const e of longTermObjectives) entityTypeById.set(e.id, 'lto');
for (const e of annualObjectives) entityTypeById.set(e.id, 'ao');
for (const e of initiatives) entityTypeById.set(e.id, 'initiative');
for (const e of kpis) entityTypeById.set(e.id, 'kpi');
for (const e of owners) entityTypeById.set(e.id, 'owner');

// Result:
// {
//   'lto-001': 'lto',
//   'ao-001': 'ao',
//   'init-001': 'initiative',
//   'kpi-001': 'kpi',
//   'owner-001': 'owner',
//   ...
// }
```

#### 4c. Define Rank System
```typescript
const getRank = (type: string): number => {
  case 'lto': return 0;      // Highest level
  case 'ao': return 1;
  case 'initiative': return 2;
  case 'kpi': return 3;
  case 'owner': return 4;    // Lowest level
};

// This creates a hierarchy:
// Level 0: LTO (top strategy)
// Level 1: AO (annual goal)
// Level 2: Initiative (action)
// Level 3: KPI (metric)
// Level 4: Owner (person)
```

#### 4d. BFS Traversal (Both Directions)
```typescript
// Starting from hovered LTO with id 'lto-001'

// TRAVERSE UP (higher-level elements)
// From lto-001 (rank 0), traverse UP = there's nothing higher → empty

// TRAVERSE DOWN (lower-level elements)
// From lto-001 (rank 0):
//   → Find neighbors: ['ao-001']
//   → ao-001 has rank 1 > 0 (down)? YES → Add to related
//   → Queue: ['ao-001']
//
// From ao-001 (rank 1):
//   → Find neighbors: ['lto-001', 'init-001']
//   → 'lto-001' already visited, skip
//   → 'init-001' has rank 2 > 1 (down)? YES → Add to related
//   → Queue: ['init-001']
//
// From init-001 (rank 2):
//   → Find neighbors: ['ao-001', 'kpi-001']
//   → 'ao-001' already visited, skip
//   → 'kpi-001' has rank 3 > 2 (down)? YES → Add to related
//   → Queue: ['kpi-001']
//
// From kpi-001 (rank 3):
//   → Find neighbors: ['init-001', 'owner-001', 'owner-002']
//   → 'init-001' already visited, skip
//   → 'owner-001' has rank 4 > 3 (down)? 
//       YES (special KPI→Owner rule) → Add to related
//   → 'owner-002' has rank 4 > 3 (down)?
//       YES (special KPI→Owner rule) → Add to related
//   → Queue: ['owner-001', 'owner-002']
//
// From owner-001 (rank 4):
//   → Find neighbors: ['kpi-001']
//   → No more new neighbors to traverse
//
// From owner-002 (rank 4):
//   → Find neighbors: ['kpi-001']
//   → No more new neighbors to traverse

// RESULT: related = Set([
//   'lto-001',     // The hovered element itself
//   'ao-001',      // Connected AO
//   'init-001',    // Connected Initiative
//   'kpi-001',     // Connected KPI
//   'owner-001',   // Connected Owner
//   'owner-002'    // Connected Owner
// ])
```

#### 4e. Special Traversal Rules (Prevent Over-highlighting)
```typescript
// These rules prevent unrelated elements from being highlighted:

// Rule 1: KPI-specific (elementType === 'kpi')
if (elementType === 'kpi') {
  // Never traverse KPI → other KPI (only KPI itself)
  if (neighborType === 'kpi' && neighborId !== startId) continue;
  
  // Only include owners if we're directly on the KPI
  if (neighborType === 'owner' && !(current.id === startId && current.type === 'kpi')) continue;
}

// Rule 2: Owner-specific (elementType === 'owner')
if (elementType === 'owner') {
  // Never traverse Owner → Owner (avoid jumping between owners)
  if (neighborType === 'owner') continue;
  
  // Block KPI → Owner traversal (only allow Owner → KPI)
  if (current.type === 'kpi' && neighborType === 'owner') continue;
}

// Rule 3: KPI ↔ Owner controlled traversal
const isKpiToOwner = current.type === 'kpi' && neighborType === 'owner';
const isOwnerToKpiFromStartOwner = 
  current.type === 'owner' && neighborType === 'kpi' && current.id === startId;

// Allow these specific paths, block others
```

↓

### Step 5: Component Re-renders with Highlight

**File:** `src/components/x-matrix/XMatrix.tsx` (lines 54-65)

```typescript
// Component computes:
const highlightedElements = getHighlightedElements();  
// = Set(['lto-001', 'ao-001', 'init-001', 'kpi-001', 'owner-001', 'owner-002'])

const hasHighlight = highlightedElements.size > 0;  // true

// For each element on the matrix:
const getOpacity = useCallback((id: string) => {
  if (!hasHighlight) return 1;  // No hover = full opacity
  return highlightedElements.has(id) ? 1 : 0.15;  // Highlighted = full, others = dimmed
}, [hasHighlight, highlightedElements]);

// For each element:
const isHighlighted = useCallback((id: string) => {
  if (!hasHighlight) return true;  // No hover = all visible
  return highlightedElements.has(id);
}, [hasHighlight, highlightedElements]);
```

Then when rendering each element:
```typescript
<HorizCard
  // ... props
  opacity={getOpacity('lto-001')}        // 1 (highlighted)
  opacity={getOpacity('ao-001')}         // 1 (highlighted)
  opacity={getOpacity('init-001')}       // 1 (highlighted)
  opacity={getOpacity('kpi-001')}        // 1 (highlighted)
  opacity={getOpacity('owner-001')}      // 1 (highlighted)
  opacity={getOpacity('owner-002')}      // 1 (highlighted)
  opacity={getOpacity('other-lto')}      // 0.15 (dimmed/faded)
  highlighted={isHighlighted('lto-001')} // true (bright border)
  highlighted={isHighlighted('other-lto')} // false (dim border)
/>
```

↓

### Step 6: Visual Feedback

Elements are rendered with:
- **Highlighted elements:** Full opacity (opacity = 1), bright colors, prominent borders
- **Non-highlighted elements:** Reduced opacity (opacity = 0.15), faded, less prominent

This creates a visual "chain of impact" showing the connection path.

---

## Complete Example Walkthrough

### Scenario: Hover over Annual Objective "AO-001: Achieve 40% Market Share"

**Starting Point:**
```
Relationships in database:
- lto-001 (LTO) --primary--> ao-001 (AO)
- ao-001 (AO) --primary--> init-001 (Initiative)
- ao-001 (AO) --primary--> init-002 (Initiative)
- init-001 (Initiative) --primary--> kpi-001 (KPI)
- init-002 (Initiative) --primary--> kpi-002 (KPI)
- kpi-001 has ownerIds: ['owner-001', 'owner-003']
- kpi-002 has ownerIds: ['owner-002']

Other unrelated elements:
- lto-002, lto-003
- ao-002, ao-003
- init-003, init-004
- kpi-003, kpi-004
- owner-004, owner-005
```

**Step 1:** User hovers over ao-001

**Step 2:** Store updates: `hoveredElement = { id: 'ao-001', type: 'ao' }`

**Step 3:** Call `getRelatedElements('ao-001', 'ao')`

**Step 4a:** Build adjacency map:
```
{
  'lto-001': Set(['ao-001']),
  'ao-001': Set(['lto-001', 'init-001', 'init-002']),
  'init-001': Set(['ao-001', 'kpi-001']),
  'init-002': Set(['ao-001', 'kpi-002']),
  'kpi-001': Set(['init-001', 'owner-001', 'owner-003']),
  'kpi-002': Set(['init-002', 'owner-002']),
  'owner-001': Set(['kpi-001']),
  'owner-003': Set(['kpi-001']),
  'owner-002': Set(['kpi-002']),
  'lto-002': Set([]),
  'lto-003': Set([]),
  ... (other unrelated)
}
```

**Step 4b-d:** BFS Traversal:

```
Starting: ao-001 (rank 1)
Direction: UP (rank < 1)
  - Check neighbor lto-001 (rank 0) → 0 < 1? YES
  - Add lto-001 to related
  
Direction: DOWN (rank > 1)
  - Check neighbor init-001 (rank 2) → 2 > 1? YES
  - Check neighbor init-002 (rank 2) → 2 > 1? YES
  
From init-001 (rank 2):
  - Check neighbor kpi-001 (rank 3) → 3 > 2? YES
  
From init-002 (rank 2):
  - Check neighbor kpi-002 (rank 3) → 3 > 2? YES
  
From kpi-001 (rank 3):
  - Check owner-001 (rank 4) → KPI→Owner allowed? YES
  - Check owner-003 (rank 4) → KPI→Owner allowed? YES
  
From kpi-002 (rank 3):
  - Check owner-002 (rank 4) → KPI→Owner allowed? YES

FINAL related = Set([
  'ao-001',      // Starting element
  'lto-001',     // Parent LTO
  'init-001',    // Child Initiative
  'init-002',    // Child Initiative
  'kpi-001',     // Child KPI (from init-001)
  'kpi-002',     // Child KPI (from init-002)
  'owner-001',   // Owner of kpi-001
  'owner-003',   // Owner of kpi-001
  'owner-002'    // Owner of kpi-002
])
```

**Step 5:** Render:
- **Highlighted (bright):** ao-001, lto-001, init-001, init-002, kpi-001, kpi-002, owner-001, owner-003, owner-002
- **Dimmed (faded):** lto-002, lto-003, ao-002, ao-003, init-003, init-004, kpi-003, kpi-004, owner-004, owner-005

**Result:** User sees a clear visual chain:
```
    lto-001
       ↓
    ao-001 ← USER HOVERS HERE
    /    \
 init-001 init-002
   ↓        ↓
 kpi-001  kpi-002
  / \      |
owner-001  owner-002
owner-003
```

All other elements fade to 0.15 opacity (very dim).

---

## Code Location Summary

| Part | File | Lines |
|------|------|-------|
| Hover Event Handler | XMatrix.tsx | 200-265 |
| Store Actions | store.ts | 286 |
| Highlighted Elements Computation | store.ts | 974-981 |
| Related Elements Traversal (BFS) | store.ts | 856-970 |
| UI Opacity Application | XMatrix.tsx | 54-65 |
| Relationship Data Type | types.ts | 126-133 |
| API Endpoints | api/relationships/route.ts | 1-50 |

---

## Key Insights

1. **Two-way Relationships:** Every relationship is bidirectional (can traverse both directions)
2. **Rank-based Hierarchy:** LTO(0) → AO(1) → Initiative(2) → KPI(3) → Owner(4)
3. **Smart Traversal:** Only moves up (to lower-ranked) or down (to higher-ranked), preventing circular highlighting
4. **KPI↔Owner Safety:** Special rules prevent unrelated KPIs/Owners from lighting up
5. **Implicit Links:** KPI.ownerIds creates hidden relationships without explicit relationship records
6. **BFS Algorithm:** Breadth-first search ensures all connected paths are found
7. **Real-time Updates:** Uses Zustand store for instant reactive UI updates

