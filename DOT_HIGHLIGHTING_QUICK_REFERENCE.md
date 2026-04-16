# Dot Highlighting - Quick Visual Reference

## The ONE Critical Line (Everything Happens Here)

```typescript
// src/components/x-matrix/XMatrix.tsx, line 425
const lit = isHighlighted(row.id) && isHighlighted(col.id);

// lit = true  → opacity = 1.0   (BRIGHT, shows connection)
// lit = false → opacity = 0.35  (DIM, hides connection)
```

---

## Visualization: Before & After

### Matrix Layout
```
                 AO-1      AO-2      AO-3
                  ↓         ↓         ↓
         ┌─────────┬─────────┬─────────┐
LTO-1 ── │    ●    │         │    ●    │ ← Hover over me!
         ├─────────┼─────────┼─────────┤
LTO-2 ── │         │         │         │
         ├─────────┼─────────┼─────────┤
LTO-3 ── │         │         │         │
         └─────────┴─────────┴─────────┘
```

### BEFORE: No Hover
```
Status: No element hovered
Result: All dots have opacity = 0.35 (DIM)

         AO-1      AO-2      AO-3
         ◦(0.35)   ◦(0.35)   ◦(0.35)   ← Faded
         ◦(0.35)   ◦(0.35)   ◦(0.35)   ← Faded
         ◦(0.35)   ◦(0.35)   ◦(0.35)   ← Faded

All dots are equally dim (hard to see relationships)
```

### AFTER: Hover Over LTO-1
```
Status: LTO-1 hovered
Highlighted set: {LTO-1, AO-1, AO-3}

         AO-1      AO-2      AO-3
LTO-1 ── ●(1.0)    ◦(0.35)   ●(1.0)    ← BRIGHT where both are highlighted
LTO-2 ── ◦(0.35)   ◦(0.35)   ◦(0.35)   ← DIM because LTO-2 not hovered
LTO-3 ── ◦(0.35)   ◦(0.35)   ◦(0.35)   ← DIM because LTO-3 not hovered

Bright dots show: LTO-1 is related to AO-1 and AO-3
```

---

## Step-by-Step: How It Works

```
1. USER HOVERS OVER LTO-1
   └─ onHover={(h) => setHoveredElement({ id: 'lto-001', type: 'lto' })}

2. STORE UPDATES
   └─ viewState.hoveredElement = { id: 'lto-001', type: 'lto' }

3. COMPONENT RE-RENDERS
   └─ Call getHighlightedElements()
      └─ Call getRelatedElements('lto-001', 'lto')
         └─ BFS traversal finds all connected elements
            └─ Return Set(['lto-001', 'ao-001', 'ao-003', ...])

4. FOR EACH DOT IN MATRIX
   ├─ Check if dot exists: hasRel = findRel(row.id, col.id)
   │
   └─ Calculate opacity:
      lit = isHighlighted(row.id) && isHighlighted(col.id)
      
      Example: Dot at (LTO-1, AO-1)
      ├─ isHighlighted('lto-001') = true  ✓
      ├─ isHighlighted('ao-001') = true   ✓
      └─ lit = true && true = true
         └─ opacity = 1.0 (BRIGHT) 🌟

      Example: Dot at (LTO-1, AO-2)
      ├─ isHighlighted('lto-001') = true  ✓
      ├─ isHighlighted('ao-002') = false  ✗
      └─ lit = true && false = false
         └─ opacity = 0.35 (DIM) 🔌

5. SVG RENDERS WITH NEW OPACITY
   └─ User sees bright dots where connections exist
```

---

## The Boolean Logic (AND Gate)

```
     ┌────────────────────────────────┐
     │  Dot Highlight Logic           │
     │  (AND Gate)                    │
     │                                │
     │  isHighlighted(row) ──┐        │
     │                       ├──AND──→ lit (true/false)
     │  isHighlighted(col) ──┘        │
     │                                │
     │  if lit:                       │
     │    opacity = 1.0 (BRIGHT ●)    │
     │  else:                         │
     │    opacity = 0.35 (DIM ◦)      │
     └────────────────────────────────┘

Truth Table:
┌─────────────────────────────────────────────┐
│ Row Highlighted | Col Highlighted | Opacity │
├─────────────────┼─────────────────┼─────────┤
│ YES             │ YES             │ 1.0 (●) │ ✨ Shows connection
│ YES             │ NO              │ 0.35(◦) │
│ NO              │ YES             │ 0.35(◦) │
│ NO              │ NO              │ 0.35(◦) │
└─────────────────────────────────────────────┘

KEY INSIGHT: Both row AND column must be 
in the highlighted set for the dot to glow!
```

---

## Code References

### 1. Hover Handler (XMatrix.tsx, line 265)
```typescript
onHover={(h) => setHoveredElement(h ? { id: lto.id, type: 'lto' } : null)}
```

### 2. Calculate Highlighted Set (store.ts, line 974)
```typescript
getHighlightedElements: () => {
  const activeElement = viewState.hoveredElement || viewState.selectedElement;
  return get().getRelatedElements(activeElement.id, activeElement.type);
}
```

### 3. Render Dot with Highlight (XMatrix.tsx, line 425)
```typescript
const lit = isHighlighted(row.id) && isHighlighted(col.id);

{hasRel && (
  <motion.circle
    cx={cx} cy={cy}
    r={getRelationshipDotSize(rel.strength) / 2}
    fill={getRelationshipColor(rel.strength)}
    opacity={lit ? 1 : 0.35}  // ← THE MAGIC
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ duration: 0.2 }}
  />
)}
```

### 4. Determine Colors (utils.ts, line 38)
```typescript
export function getRelationshipColor(strength): string {
  return {
    'primary': 'rgb(236, 72, 153)',    // Pink (strong)
    'secondary': 'rgb(139, 92, 246)',  // Purple (weak)
  }[strength];
}
```

### 5. Determine Dot Size (utils.ts, line 47)
```typescript
export function getRelationshipDotSize(strength): number {
  return {
    'primary': 10,      // Larger
    'secondary': 7,     // Smaller
  }[strength];
}
```

---

## Real Example

### Database State
```
Relationships:
- LTO-1 → AO-1 (primary, strength = 'primary')
- LTO-1 → AO-3 (primary, strength = 'primary')
- LTO-2 → AO-2 (primary, strength = 'primary')
```

### User Hovers Over LTO-1

**Step 1:** 
```
hoveredElement = { id: 'lto-001', type: 'lto' }
```

**Step 2:** BFS finds related elements
```
highlighted = Set(['lto-001', 'ao-001', 'ao-003', 'init-001', ...])
//              (depending on how the relationships connect down the chain)
```

**Step 3:** For each grid cell in LTO ↔ AO section:
```
Cell (LTO-1, AO-1):
  ├─ hasRel = true (relationship exists)
  ├─ lit = true && true = true
  ├─ Render: <circle opacity={1} fill="rgb(236,72,153)" r="5" />
  └─ Result: ● BRIGHT PINK DOT

Cell (LTO-1, AO-2):
  ├─ hasRel = true (relationship exists, but AO-2 not in highlighted)
  ├─ lit = true && false = false
  ├─ Render: <circle opacity={0.35} fill="rgb(236,72,153)" r="5" />
  └─ Result: ◦ DIM PINK DOT

Cell (LTO-1, AO-3):
  ├─ hasRel = true (relationship exists)
  ├─ lit = true && true = true
  ├─ Render: <circle opacity={1} fill="rgb(236,72,153)" r="5" />
  └─ Result: ● BRIGHT PINK DOT

Cell (LTO-2, AO-1):
  ├─ hasRel = true (relationship exists)
  ├─ lit = false && true = false
  ├─ Render: <circle opacity={0.35} fill="rgb(236,72,153)" r="5" />
  └─ Result: ◦ DIM PINK DOT
```

**Visual Result:**
```
         AO-1          AO-2          AO-3
LTO-1 ── ● (1.0)      ◦ (0.35)       ● (1.0)  ← GLOWING
LTO-2 ── ◦ (0.35)     ◦ (0.35)       ◦ (0.35)
         (related)    (unrelated)    (related)
```

---

## Animation

When the dot's opacity changes:
```typescript
<motion.circle
  opacity={lit ? 1 : 0.35}
  initial={{ scale: 0 }}      // Starts at scale 0
  animate={{ scale: 1 }}      // Animates to scale 1
  transition={{ duration: 0.2 }} // Over 200ms
/>
```

Result: Dots **smoothly fade in/out** as you hover, not instant snap.

---

## Summary

**Single Golden Rule:**
```
A dot glows (opacity = 1) if and only if:
1. A relationship exists between row and column
   AND
2. BOTH the row element AND column element 
   are in the highlighted set
```

Everything else (color, size, animation) is secondary styling.

