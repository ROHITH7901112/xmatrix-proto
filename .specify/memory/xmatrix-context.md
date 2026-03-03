# X-Matrix Application - AI Context Memory

## Project Identity
- **Name**: X-Matrix (xmatrix-proto)
- **Type**: Enterprise Strategic Planning Application
- **Methodology**: Hoshin Kanri X-Matrix
- **Created**: February 15, 2026
- **Current Status**: Baseline Implementation Complete

## What This Application Does

The X-Matrix application is a web-based strategic planning tool that helps organizations align their strategic objectives using the Hoshin Kanri methodology. It visualizes the relationships between:
- Long-Term Objectives (3-5 year goals)
- Annual Objectives (yearly targets)
- Initiatives (projects to achieve objectives)
- KPIs (measurable outcomes)
- Owners (responsible people)

## Key Architectural Patterns

### View/Edit Mode Separation
- **View Mode**: Read-only display of live data
- **Edit Mode**: Creates a draft copy for safe editing
- Changes in edit mode don't affect live data until explicitly saved
- Users can save or discard draft changes

### Relationship Visualization
- Relationships shown as colored dots in intersection cells
- Blue dots = Primary (strong) relationships
- Gray dots = Secondary (supporting) relationships
- Hover over any element highlights all related elements

### Data Integrity
- SQLite database with foreign key constraints
- CASCADE DELETE ensures orphaned data is automatically removed
- All relationships deleted when an element is deleted

## Core User Workflows

1. **Strategic Planning**: View complete X-Matrix with all quadrants aligned
2. **Relationship Discovery**: Hover to see which initiatives support which objectives
3. **Safe Editing**: Enter edit mode → make changes → save or discard
4. **KPI Tracking**: Monthly target vs. actual with variance and trends
5. **CRUD Operations**: Create/edit/delete any strategic element

## Technology Stack

- **Framework**: Next.js 16.x with App Router
- **Language**: TypeScript 5.x
- **UI**: React 18.x + Tailwind CSS 4.x
- **State**: Zustand 5.x
- **Database**: SQLite (better-sqlite3)
- **Animations**: Framer Motion 12.x

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/components/x-matrix/XMatrix.tsx` | Main matrix visualization (1348 lines) |
| `src/lib/store.ts` | Zustand state management (912 lines) |
| `src/lib/types.ts` | Complete TypeScript type system (143 lines) |
| `src/lib/schema.sql` | SQLite database schema (114 lines) |
| `src/hooks/useXMatrixCRUD.ts` | CRUD operations hook |
| `src/components/bowling-chart/BowlingChart.tsx` | KPI tracking (385 lines) |

## Important Design Decisions

### Why Draft-Based Editing?
Users need confidence they can experiment with changes without permanently affecting the strategic plan. Draft mode provides a safe sandbox.

### Why Uniform Cell Size?
All matrix cells are exactly 32px for perfect visual alignment across all quadrants and relationship intersections.

### Why Relationship Strength Levels?
Organizations need to distinguish between strong strategic alignment (primary) and supporting connections (secondary).

### Why SQLite?
Simple deployment for single-user or small team usage. No server infrastructure required.

## Data Model Summary

### Entities (5 types)
1. **Long-Term Objective**: 3-5 year goals with code, title, health status
2. **Annual Objective**: Yearly targets with progress tracking
3. **Initiative**: Projects with priority, dates, health status
4. **KPI**: Metrics with current/target values, monthly data, trends
5. **Owner**: People with roles and responsibility types (RACI)

### Relationships
- Directional connections between any two elements
- Strength: none, primary, secondary
- Auto-deleted when either element is deleted

## Known Limitations (Out of Scope)

- No user authentication/permissions
- No multi-user real-time collaboration
- No data export (PDF, Excel)
- No automated KPI imports
- No email notifications
- No version history
- No mobile phone support (desktop/tablet only)
- Dark mode only (no theme customization)

## Future Enhancement Opportunities

Refer to `specs/001-xmatrix-baseline/README.md` for comprehensive list of potential features.

## How AI Should Use This Context

### When Adding Features
1. Read baseline spec first: `specs/001-xmatrix-baseline/spec.md`
2. Understand existing patterns (view/edit mode, relationship management)
3. Maintain consistency with current UX
4. Use TypeScript types from `types.ts`
5. Follow Zustand state patterns from `store.ts`

### When Debugging
1. Check if issue relates to draft vs. live data confusion
2. Verify relationship cascade deletion working properly
3. Ensure edit mode state transitions correctly
4. Validate SQLite foreign key constraints

### When Planning
1. Consider impact on view/edit mode pattern
2. Ensure backward compatibility with existing data model
3. Maintain visual alignment of matrix cells
4. Preserve relationship visualization clarity

## Quick Reference Commands

```bash
# Development
npm run dev          # Start development server

# Database
# Located at: xmatrix.db (SQLite file in root)

# Key API Routes
/api/xmatrix         # X-Matrix CRUD
/api/objectives      # LTO and AO CRUD
/api/initiatives     # Initiative CRUD
/api/kpis           # KPI CRUD
/api/owners         # Owner CRUD
/api/relationships  # Relationship CRUD
```

## Specification Location

**Baseline Spec**: `specs/001-xmatrix-baseline/`
- Full specification in `spec.md`
- Quality checklist in `checklists/requirements.md`
- Overview in `README.md`

## Last Updated
February 15, 2026 - Baseline documentation created
