# X-Matrix Meeting Q&A README

This file captures your meeting questions and answers in one place.
I will keep adding new Q&A entries below as you ask more questions.

---

## Q1) What is the new relationship logic for hover/highlight of related entities?

### Short answer
When you hover (or select) any entity, the app computes all logically related entities through the relationship graph, then highlights those entities and dims everything else.

### Detailed logic flow

1. **Active element source**
   - The active element is resolved as:
     - `hoveredElement` (if present), else
     - `selectedElement`.
   - If neither exists, no highlight set is applied.

2. **Relationship source of truth**
   - Relationships are read from `getActiveData().relationships`.
   - In view mode, this is persisted data.
   - In edit mode, this is draft data, so highlighting reflects unsaved edits too.

3. **Stale relationship protection (new safety behavior)**
   - Before graph traversal, the code builds a valid ID set from current entities (`lto`, `ao`, `initiative`, `kpi`, `owner`).
   - Any relationship whose `sourceId` or `targetId` no longer exists is ignored.
   - This prevents ghost highlights from dangling/deleted entities.

4. **Graph traversal by business path (not only direct links)**
   - The logic is intentionally directional by matrix semantics:
     - If active is `lto`: find connected `ao` → then `initiative` → then `kpi` and `owner`.
     - If active is `ao`: find connected `lto` and `initiative` → then `kpi` and `owner` via initiatives.
     - If active is `initiative`: find connected `ao`, then `lto`; also direct `kpi` and `owner`.
     - If active is `kpi`: find connected `initiative` → then `ao` → then `lto`; also `owner` via initiatives.
     - If active is `owner`: find connected `initiative` → then `ao` → then `lto`; also `kpi` via initiatives.
   - The active element itself is always included in the highlighted set.
   - If an unknown type is passed, fallback is direct-neighbor highlight only.

5. **UI highlight application**
   - Entity cards/labels:
     - highlighted entities render at full opacity (`1`)
     - non-highlighted entities are dimmed (typically `0.15` when any highlight is active)
   - Relationship dots in cells:
     - if both row and column entities are highlighted, dot opacity is full (`1`)
     - otherwise the dot is dimmed (`0.35`)

6. **Edit interactions + relationship toggling**
   - Cell clicks are enabled in edit mode.
   - Relationship state cycles as:
     - none → primary → secondary → none
   - Because highlights use active draft data, hover/selection highlight updates immediately after toggling.

7. **Debug support**
   - Highlight debugging can be enabled with:
     - localStorage flag `xmatrix-highlight-debug=1`, or
     - `window.__XMATRIX_HIGHLIGHT_DEBUG__ = true`
   - Debug logs show active element, highlighted IDs, and bucketed section outputs.

### Why this is better than old/simple direct hover

- It reflects **strategy chain impact** (multi-hop relations), not just immediate adjacency.
- It avoids stale relationship artifacts with ID validation.
- It stays consistent between view mode and edit draft mode.
- It gives clean visual focus by dimming unrelated nodes and intersections.

---

## Next Questions (to keep appending)

Use this same file for all upcoming meeting questions.

### Q2) _Pending_
### A2) _Pending_

---

## Q2) How did relationship propagation highlighting work previously, and how is it now?

### Previous behaviour (before the new changes)
- Highlighting was essentially direct-only: when you hovered or selected an entity the UI would highlight entities that had an explicit relationship row referencing that entity (direct neighbors). This is equivalent to filtering relationships with `rel.sourceId === id || rel.targetId === id` and returning those immediate peers.
- No structured traversal by matrix semantics — chains like LTO → AO → Initiative → KPI/Owner were not traversed; only explicit, single-hop links were considered.
- Dangling/stale relationships could cause ghost highlights because there was no explicit validation to ensure both ends still existed in the current dataset.
- Highlight behavior was less deterministic across draft vs persisted state (could mismatch until saved).

### Current behaviour (new logic)
- Active element resolution: hover wins, otherwise selection. (See `getHighlightedElements`.)
- Valid-ID filtering: relationships are pre-filtered to ignore any entries whose `sourceId` or `targetId` are not present in the current entity sets (LTO / AO / Initiative / KPI / Owner). This prevents ghost highlights from deleted items.
- Semantically-aware traversal: highlighting follows business paths by entity type rather than just direct neighbors. Examples:
   - `lto` → finds connected `ao` → then `initiative` → then `kpi` and `owner`.
   - `kpi` → finds `initiative` → then `ao` → then `lto` (and owners via initiatives).
   - `initiative` → highlights its `ao` and `lto` and also direct `kpi` and `owner` links.
- UI rules: the active element + all discovered related entities are shown at full opacity; unrelated entities are dimmed. Relationship dots are shown at full opacity only when both intersecting entities are highlighted.
- Draft-awareness: in Edit Mode the logic reads `editModeState.draftData.relationships` so highlight reflects in-progress toggles immediately.
- Toggle cycle preserved: none → primary → secondary → none (toggle implemented in store). Because highlights use draft data, toggling immediately updates highlight state.

### Why this is an evolution
- More accurate user mental model: users see the strategy chain impact, not just immediate neighbors.
- Safer: removes ghost highlights from stale relationships.
- Immediate feedback during editing: draft changes are reflected in highlights before persisting.

### Code locations to review (quick links)
- Relationship type + strengths: [src/lib/types.ts](src/lib/types.ts#L1-L40)
- Color & dot sizes for strengths: [src/lib/utils.ts](src/lib/utils.ts#L36-L54)
- Toggle relationship & draft mutation: [src/lib/store.ts](src/lib/store.ts#L331)
- Graph traversal & highlight computation: `getRelatedElements` / `getHighlightedElements`: [src/lib/store.ts](src/lib/store.ts#L876) and [src/lib/store.ts](src/lib/store.ts#L981)
- Where dots are anchored and drawn (RelGrid): [src/components/x-matrix/layout.ts](src/components/x-matrix/layout.ts#L214) and [src/components/x-matrix/XMatrix.tsx](src/components/x-matrix/XMatrix.tsx#L400-L440)
- Relationship lookup helper used by UI: `findRelationship` in [src/components/x-matrix/XMatrix.tsx](src/components/x-matrix/XMatrix.tsx#L236)
- Draft commit / persistence: `exitEditMode` (bulk PATCH): [src/lib/store.ts](src/lib/store.ts#L223)

---

### Q3) _Pending_
### A3) _Pending_

---

## Q3) Where in code do we do the graph traversal for highlighting?

### Answer
Graph traversal happens inside the `getRelatedElements` function in the Zustand store. This function builds a neighbor set by type and walks the graph across multiple hops (e.g., LTO → AO → Initiative → KPI/Owner). The traversal is implemented in the series of `getNeighborsByType(...)` calls inside `getRelatedElements`.

### Exact code location
- `getRelatedElements` implementation: [src/lib/store.ts](src/lib/store.ts#L876)
- `getHighlightedElements` calls it: [src/lib/store.ts](src/lib/store.ts#L981)
- UI uses the highlight set: [src/components/x-matrix/XMatrix.tsx](src/components/x-matrix/XMatrix.tsx#L50)

---

## Q4) What is the purpose of EntityModals file and why is it in the shared folder?

### Answer
**EntityModals** is a reusable component library for creating and editing all matrix entities (LTO, AO, Initiative, KPI, Owner). It contains:
- **Modal wrapper** — generic backdrop + overlay dialog for any content.
- **Form input/select/textarea helpers** — themed input components.
- **Entity form components** — `LTOForm`, `AOForm`, `InitiativeForm`, `KPIForm`, `OwnerForm` each with validation, submit handlers, and delete buttons.
- **Sequential code generation** — auto-increments codes like `LTO-1`, `AO-2`, etc.

### Why "shared"?
It's in `src/components/shared/` because:
1. **Reusable across pages** — the forms are used not just by XMatrix but potentially by future pages/modals (manage page, settings, etc.).
2. **Single source of truth** — one file manages all entity creation/edit UI, ensuring consistent styling, validation, and behavior.
3. **Decoupled from specific views** — Modal & form logic are independent; any page can trigger the same modals via store actions.

### How it's used
- XMatrix component calls `openAddModal('lto')` or `openEditModal('initiative', item)` from the store.
- This opens the appropriate form (LTOForm, InitiativeForm, etc.) inside a Modal.
- Form submits call store methods like `createLongTermObjective()` or `updateInitiative()`.

### Code location
- File: [src/components/shared/EntityModals.tsx](src/components/shared/EntityModals.tsx)
- Imported/used in XMatrix: [src/components/x-matrix/XMatrix.tsx](src/components/x-matrix/XMatrix.tsx#L10-L12)
- Modal display logic: [src/components/x-matrix/XMatrix.tsx](src/components/x-matrix/XMatrix.tsx#L360-L376)

---

### Q5) What does "modal" mean?

### Answer
A **modal** is a dialog box or popup window that appears on top of your main content and blocks interaction with everything behind it until you close it.

### Real-world analogy
Think of it like a popup alert on your phone — you can't click anything on the screen underneath until you dismiss the popup (close it or click OK).

### In your X-Matrix app
When you're in Edit Mode and want to create a new initiative:
1. You click the **"+ Initiative"** button.
2. A modal window appears in the center of the screen.
3. The area behind it becomes slightly dimmed/blurred (backdrop blur).
4. You fill in the form (title, description, etc.) inside the modal.
5. You click **Create** or **Cancel** to close the modal.
6. Only then can you interact with the X-Matrix again.

### Visual structure
```
┌─────────────────────────────────────────────────────┐
│  X-Matrix (dimmed/blurred in background)            │
│                                                      │
│    ┌──────────────────────────────────────────┐    │
│    │ Modal Dialog (New Initiative)             │    │
│    ├──────────────────────────────────────────┤    │
│    │ Code:         [INI-1         ]            │    │
│    │ Title:        [Enter title   ]            │    │
│    │ Description:  [Enter desc... ]            │    │
│    │                                           │    │
│    │           [Cancel]  [Create]              │    │
│    └──────────────────────────────────────────┘    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Code location in your app
- Modal component definition: [src/components/shared/EntityModals.tsx](src/components/shared/EntityModals.tsx#L35-L60)
- Modal display in XMatrix (LTO example): [src/components/x-matrix/XMatrix.tsx](src/components/x-matrix/XMatrix.tsx#L360)
- Modal properties: `isOpen` (show/hide), `onClose` (close handler), `title` (header text), `children` (form content inside)

### Key modal properties in your code
- **isOpen** — boolean that controls if modal is visible or hidden.
- **onClose** — function called when user clicks X button or outside the modal.
- **title** — header text (e.g., "New Initiative", "Edit KPI").
- **children** — the content inside (e.g., the form inputs).
- **backdrop blur** — the dimmed background effect that prevents clicking outside.

---

### Q6) _Pending_
### A6) _Pending_

