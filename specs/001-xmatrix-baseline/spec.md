# Feature Specification: Enterprise Hoshin Kanri X-Matrix Application

**Feature Branch**: `001-xmatrix-baseline`  
**Created**: February 15, 2026  
**Status**: Baseline Documentation  
**Input**: User description: "analyze my codebase and store everything what i have done so far for future use"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Strategic Planning Visualization (Priority: P1)

Strategic planners need to visualize their organization's strategic plan using the Hoshin Kanri X-Matrix methodology to align long-term objectives, annual objectives, initiatives, and KPIs in a single interactive view.

**Why this priority**: This is the core value proposition of the application - the X-Matrix visualization is the primary tool for strategic alignment and the foundation for all other features.

**Independent Test**: Can be fully tested by loading sample strategic planning data and verifying all four quadrants (Long-Term Objectives, Annual Objectives, Initiatives, KPIs) display correctly with their relationships indicated by colored dots in the intersection areas.

**Acceptance Scenarios**:

1. **Given** strategic planning data exists, **When** user navigates to the main page, **Then** the X-Matrix displays with all four quadrants properly aligned around a center diamond showing vision and True North
2. **Given** the X-Matrix is displayed, **When** user hovers over any element (objective, initiative, or KPI), **Then** all related elements are highlighted and unrelated elements are dimmed
3. **Given** the X-Matrix is displayed, **When** user clicks on any element, **Then** a detail panel opens showing complete information about that element
4. **Given** the X-Matrix is being viewed, **When** user clicks the rotation control, **Then** the matrix rotates 90 degrees clockwise maintaining all relationships

---

### User Story 2 - Relationship Management (Priority: P1)

Strategic planners need to define and visualize relationships between strategic elements (how initiatives support objectives, how KPIs measure initiatives, etc.) to ensure alignment and avoid strategic gaps.

**Why this priority**: Relationships are essential to the X-Matrix methodology - they show strategic alignment and are as important as the elements themselves.

**Independent Test**: Can be fully tested by entering edit mode, clicking on intersection cells to toggle relationships, and verifying that relationship strength (primary/secondary) is displayed with different colored dots.

**Acceptance Scenarios**:

1. **Given** user is in edit mode, **When** user clicks an intersection cell between an initiative and annual objective, **Then** relationship strength cycles through: none → primary (large blue dot) → secondary (small gray dot) → none
2. **Given** relationships exist, **When** user hovers over an element, **Then** only elements with direct relationships are highlighted
3. **Given** relationships exist between elements, **When** user views the matrix, **Then** relationship dots appear in the correct intersection cells with size and color indicating strength
4. **Given** multiple relationships exist, **When** user deletes an element, **Then** all relationships involving that element are automatically removed

---

### User Story 3 - Edit Mode with Draft Management (Priority: P2)

Users need to make changes to their strategic plan without immediately committing those changes, allowing them to experiment and review before saving.

**Why this priority**: Essential for safe editing - users need confidence they can make changes without permanently affecting the live strategic plan until they're ready.

**Independent Test**: Can be fully tested by entering edit mode, making changes to elements or relationships, toggling between view/edit modes, and verifying that view mode shows original data while edit mode shows draft data.

**Acceptance Scenarios**:

1. **Given** user is in view mode, **When** user clicks "Enter Edit Mode" button, **Then** system creates a draft copy of data and switches to edit mode
2. **Given** user is in edit mode with unsaved changes, **When** user attempts to exit edit mode, **Then** system prompts to save or discard changes
3. **Given** user is in edit mode, **When** user makes changes to elements or relationships, **Then** changes are reflected immediately in the UI but not saved to database
4. **Given** user is in edit mode with changes, **When** user clicks "Save Changes", **Then** draft data is committed to database and edit mode exits
5. **Given** user is in edit mode with changes, **When** user clicks "Discard Changes", **Then** draft data is discarded and view mode displays original data

---

### User Story 4 - KPI Tracking with Bowling Chart (Priority: P2)

Users need to track KPI performance over time with monthly targets and actuals, displayed in a "bowling chart" format that clearly shows progress, variance, and trends.

**Why this priority**: KPIs are the measurable outcomes that prove strategic plan effectiveness - tracking them over time is critical for reviews and adjustments.

**Independent Test**: Can be fully tested by navigating to the Bowling Chart page and verifying that KPIs display with 12-month data showing targets, actuals, variance, and trend indicators.

**Acceptance Scenarios**:

1. **Given** KPIs exist with monthly data, **When** user navigates to Bowling Chart page, **Then** all KPIs display in rows with 12 months of data columns
2. **Given** KPI monthly data exists, **When** user views a KPI row, **Then** each month shows target value, actual value (if entered), and variance with color coding
3. **Given** KPI has actual values, **When** system calculates trend, **Then** trend icon (up/down/stable arrow) appears based on recent performance
4. **Given** user clicks on a KPI row, **When** row expands, **Then** detailed monthly breakdown with variance analysis is displayed
5. **Given** multiple KPIs exist, **When** user applies health status filter, **Then** only KPIs matching selected health status are shown

---

### User Story 5 - CRUD Operations for Strategic Elements (Priority: P2)

Users need to create, update, and delete all strategic planning elements (Long-Term Objectives, Annual Objectives, Initiatives, KPIs, and Owners) to maintain their strategic plan.

**Why this priority**: Core data management functionality - users must be able to maintain their strategic plan as conditions change.

**Independent Test**: Can be fully tested by entering edit mode and using the "Add" buttons to create new elements, clicking elements to edit them, and using delete buttons to remove elements.

**Acceptance Scenarios**:

1. **Given** user is in edit mode, **When** user clicks "Add Long-Term Objective" button, **Then** modal form opens with required fields (code, title, description, timeframe, health status)
2. **Given** user has filled required fields in add form, **When** user clicks "Create", **Then** new element appears in appropriate matrix quadrant
3. **Given** user clicks on an existing element, **When** detail panel opens, **Then** user can click "Edit" button to open edit form
4. **Given** user has made changes in edit form, **When** user clicks "Save", **Then** changes are reflected in the matrix display
5. **Given** user is viewing element details, **When** user clicks "Delete" button and confirms, **Then** element is removed from matrix and all its relationships are deleted
6. **Given** user creates or edits a KPI, **When** user assigns owners, **Then** selected owners appear in the Owners column aligned with that KPI

---

### User Story 6 - Responsive Layout with Zoom and Rotation (Priority: P3)

Users need to view the X-Matrix at different zoom levels and rotate it to focus on different relationship types (e.g., rotate to see KPI-to-Initiative relationships more clearly).

**Why this priority**: Enhances usability for large strategic plans and different viewing preferences, but not essential for core functionality.

**Independent Test**: Can be fully tested by using zoom controls to scale the matrix and rotation controls to rotate it 90 degrees at a time.

**Acceptance Scenarios**:

1. **Given** user is viewing the X-Matrix, **When** user adjusts zoom slider, **Then** matrix scales smoothly from 50% to 200%
2. **Given** user has zoomed the matrix, **When** zoom exceeds viewport, **Then** scroll bars appear for panning
3. **Given** user clicks rotate clockwise button, **When** matrix rotates, **Then** all elements maintain their positions relative to the center diamond
4. **Given** matrix is rotated 270 degrees, **When** user clicks rotate again, **Then** matrix returns to 0 degrees (original orientation)

---

### Edge Cases

- What happens when user tries to create a relationship between incompatible element types (e.g., Owner to Owner)?
- How does system handle deletion of an element that has many relationships?
- What happens if user has unsaved draft changes and browser crashes?
- How does system handle concurrent edits (multiple users editing same matrix)?
- What happens when KPI monthly data is incomplete (some months missing actuals)?
- How does system handle very large matrices (100+ elements)?
- What happens if user tries to exit edit mode without saving and has made many changes?

## Requirements *(mandatory)*

### Functional Requirements

**Data Model & Entities**

- **FR-001**: System MUST support five entity types: Long-Term Objectives (LTO), Annual Objectives (AO), Initiatives, KPIs, and Owners
- **FR-002**: System MUST persist data in SQLite database with proper foreign key relationships
- **FR-003**: Each entity MUST have a unique ID, code, title, description, and health status (on-track, at-risk, off-track)
- **FR-004**: KPIs MUST include current value, target value, unit, trend (up/down/stable), and monthly data (12 months)
- **FR-005**: Owners MUST include name, role, avatar/initials, and responsibility type (accountable, responsible, consulted, informed)
- **FR-006**: Each X-Matrix MUST have a vision statement, True North statement, period (start/end years), and strategic themes

**Relationship Management**

- **FR-007**: System MUST support directional relationships between any two elements
- **FR-008**: Relationships MUST have strength values: none, primary (strong), or secondary (supporting)
- **FR-009**: System MUST display relationships as colored dots in intersection cells (blue for primary, gray for secondary)
- **FR-010**: System MUST automatically delete all relationships when an element is deleted
- **FR-011**: Users MUST be able to toggle relationship strength by clicking intersection cells in edit mode

**X-Matrix Visualization**

- **FR-012**: System MUST display X-Matrix with four quadrants: Long-Term Objectives (bottom), Annual Objectives (left), Initiatives (top), KPIs (right)
- **FR-013**: Center diamond MUST display vision and True North
- **FR-014**: System MUST display Owners in a fifth column on the far right, aligned with Initiatives
- **FR-015**: All quadrants MUST use uniform cell size (32px) for perfect alignment
- **FR-016**: System MUST highlight related elements when user hovers over any element
- **FR-017**: System MUST support rotation in 90-degree increments (0°, 90°, 180°, 270°)
- **FR-018**: System MUST support zoom from 50% to 200%
- **FR-019**: System MUST render relationship dots with different sizes based on strength

**Edit Mode & Draft Management**

- **FR-020**: System MUST support two modes: view mode (read-only) and edit mode (editable)
- **FR-021**: System MUST create a draft copy of data when entering edit mode
- **FR-022**: Changes in edit mode MUST only affect draft data, not live data
- **FR-023**: System MUST track if draft has unsaved changes
- **FR-024**: Users MUST be able to save draft changes to commit them to database
- **FR-025**: Users MUST be able to discard draft changes to revert to live data
- **FR-026**: System MUST prompt user if attempting to exit edit mode with unsaved changes

**CRUD Operations**

- **FR-027**: Users MUST be able to create new entities through modal forms in edit mode
- **FR-028**: Users MUST be able to edit existing entities through modal forms
- **FR-029**: Users MUST be able to delete entities with confirmation prompts
- **FR-030**: Modal forms MUST validate required fields before allowing save
- **FR-031**: System MUST provide "Add" buttons for each entity type in edit mode
- **FR-032**: System MUST update UI immediately when entities are created, updated, or deleted in draft

**KPI Bowling Chart**

- **FR-033**: System MUST display KPIs in a table with rows for KPIs and columns for 12 months
- **FR-034**: Each month cell MUST show target, actual (if entered), and variance
- **FR-035**: System MUST calculate variance as (actual - target) and color-code based on health
- **FR-036**: System MUST display trend indicators (up/down/stable arrows) for each KPI
- **FR-037**: Users MUST be able to expand/collapse KPI rows for detailed monthly view
- **FR-038**: Users MUST be able to filter KPIs by health status, owner, or search term

**Detail Panel**

- **FR-039**: System MUST display detail panel when user clicks on any element
- **FR-040**: Detail panel MUST show all attributes of selected element
- **FR-041**: Detail panel MUST show list of all relationships for selected element
- **FR-042**: Detail panel MUST provide Edit and Delete buttons in edit mode
- **FR-043**: Users MUST be able to close detail panel by clicking close button or clicking elsewhere

**Navigation & Layout**

- **FR-044**: System MUST provide sidebar navigation to different pages (X-Matrix, Bowling Chart, Teams, Reviews, etc.)
- **FR-045**: System MUST display current page title in top bar
- **FR-046**: System MUST show edit mode toggle in top bar
- **FR-047**: System MUST show zoom and rotation controls when viewing X-Matrix
- **FR-048**: System MUST use dark mode as default theme

### Key Entities

- **X-Matrix**: Represents a complete strategic plan with vision, True North, period, themes, and collections of all strategic elements
- **Long-Term Objective (LTO)**: 3-5 year strategic objectives with code, title, description, timeframe, and health status
- **Annual Objective (AO)**: Yearly objectives that support LTOs, with code, title, description, year, progress percentage, and health status
- **Initiative**: Specific projects or programs that execute on objectives, with code, title, description, priority level, health status, and start/end dates
- **KPI (Key Performance Indicator)**: Measurable metrics with code, title, unit, current value, target value, health status, trend, assigned owners, and 12 months of historical data
- **Owner**: Person responsible for elements with name, role, avatar, initials, and responsibility type (RACI: accountable, responsible, consulted, informed)
- **Relationship**: Directional connection between two elements with source, target, and strength (none/primary/secondary)
- **Monthly KPI Data**: Historical tracking data for a KPI with month, target value, actual value, and calculated variance

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view a complete X-Matrix with all four quadrants and relationships displayed in under 2 seconds for matrices with up to 50 total elements
- **SC-002**: Users can identify strategic alignment gaps by hovering over objectives and immediately seeing which initiatives and KPIs support them (within 100ms response time)
- **SC-003**: Users can make changes to strategic plan in edit mode and save them with zero data loss
- **SC-004**: Users can track KPI performance across 12 months with variance calculations automatically computed and displayed
- **SC-005**: Users can complete basic CRUD operations (create, edit, delete any element) in under 30 seconds each
- **SC-006**: System maintains data integrity with proper cascade deletion - when an element is deleted, all its relationships are automatically removed
- **SC-007**: Users can zoom from 50% to 200% and rotate the matrix without losing any visual clarity or relationship information
- **SC-008**: System prevents accidental data loss by prompting users before discarding unsaved changes in edit mode
- **SC-009**: Users can filter and search through KPIs in bowling chart and find specific metrics in under 5 seconds
- **SC-010**: System supports strategic plans with up to 100 total elements (combining all types) without performance degradation

## Assumptions *(mandatory)*

### Technical Assumptions

- Application runs as a web application accessible through modern browsers (Chrome, Firefox, Safari, Edge)
- Data persistence is handled by SQLite database (single-user or small team deployment)
- Front-end framework is Next.js with React for UI components
- State management uses Zustand for global application state
- UI animations and interactions use Framer Motion library
- Styling uses Tailwind CSS with dark mode as default
- Application is deployed as a server-side rendered (SSR) or static site

### Business Assumptions

- Users are familiar with Hoshin Kanri strategic planning methodology
- Users understand the concept of strategic alignment between objectives, initiatives, and KPIs
- Strategic plans typically contain 20-50 elements total across all types
- Users need to update their strategic plans quarterly or monthly
- Single user or small team (< 10 people) will use the application concurrently
- Users have authority to create, modify, and delete strategic planning elements

### Data Assumptions

- Each X-Matrix represents a single strategic planning period (typically 1-5 years)
- Long-Term Objectives span 3-5 years
- Annual Objectives are yearly (12-month duration)
- Initiatives have defined start and end dates within the planning period
- KPIs are tracked monthly with both target and actual values
- Relationships are binary (they exist or don't) with optional strength indicator
- Health status is manually set by users based on their assessment (not auto-calculated)
- Trends for KPIs are calculated based on recent actual values vs. targets

### User Assumptions

- Users can interpret relationship strength (primary vs. secondary) in the context of their organization
- Users will enter data in edit mode and explicitly save when ready
- Users understand that view mode is read-only and changes require edit mode
- Users will use rotation and zoom features to explore different relationship patterns
- Users can interpret bowling chart variance data (green = good, red = at risk)

## Out of Scope *(mandatory)*

### Not Included in Current Implementation

- Multi-user collaboration with real-time updates
- User authentication and authorization (login/permissions system)
- Data export to PDF, Excel, or PowerPoint
- Automated KPI data import from external systems
- Email notifications for KPI targets missed or objectives at risk
- Historical versioning of X-Matrix changes over time
- Comments or notes on elements
- File attachments to objectives or initiatives
- Budget or resource allocation tracking
- Integration with project management tools (Jira, Asana, etc.)
- Mobile-responsive design for phone screens (tablet and desktop only)
- Printing optimized views of X-Matrix
- Custom themes or color schemes (dark mode only)
- Multi-language support (English only)
- Advanced analytics or AI-powered insights
- Approval workflows for changes to strategic plan
- Custom fields for entities
- Template library for different industries or use cases

## Technical Context *(for reference only)*

### Current Implementation Stack

- **Framework**: Next.js 16.x (App Router)
- **Language**: TypeScript 5.x
- **UI Library**: React 18.x
- **Styling**: Tailwind CSS 4.x
- **State Management**: Zustand 5.x
- **Database**: SQLite with better-sqlite3
- **Animations**: Framer Motion 12.x
- **Icons**: Lucide React
- **Development**: Node.js 20+, npm

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # X-Matrix main page
│   ├── bowling-chart/     # KPI Bowling Chart page
│   ├── api/               # API routes for CRUD operations
│   │   ├── initiatives/
│   │   ├── kpis/
│   │   ├── objectives/
│   │   ├── owners/
│   │   └── relationships/
├── components/
│   ├── x-matrix/          # X-Matrix visualization components
│   ├── bowling-chart/     # Bowling Chart components
│   ├── layout/            # Dashboard layout, sidebar, topbar
│   └── shared/            # Reusable modals, panels, controls
├── hooks/
│   └── useXMatrixCRUD.ts  # CRUD operations hook
├── lib/
│   ├── types.ts           # TypeScript type definitions
│   ├── schema.sql         # SQLite database schema
│   ├── db.ts              # Database connection and queries
│   ├── store.ts           # Zustand state management
│   ├── utils.ts           # Utility functions
│   └── mock-data.ts       # Sample data for development
```

### Key Files

- **XMatrix.tsx**: Main visualization component with unified grid layout, relationship rendering, hover/click interactions
- **store.ts**: Zustand store with data loading, edit mode management, CRUD operations, relationship toggling
- **types.ts**: Complete TypeScript type system for all entities and state
- **schema.sql**: SQLite schema with proper foreign keys and constraints
- **useXMatrixCRUD.ts**: Custom hook managing modal state and CRUD operations
- **BowlingChart.tsx**: KPI tracking table with filtering, sorting, trend display

### Database Schema

Tables: `xmatrix`, `owners`, `long_term_objectives`, `annual_objectives`, `initiatives`, `kpis`, `monthly_kpi_data`, `relationships`

All tables have proper foreign key constraints with CASCADE DELETE to maintain referential integrity.

## Notes

This specification documents the current baseline implementation of the X-Matrix application. It captures all existing functionality as of February 15, 2026, to serve as a reference for future enhancements and to provide context for AI-assisted development.

The application successfully implements the core Hoshin Kanri X-Matrix methodology in a web-based format with modern UI/UX patterns including draft-based editing, relationship visualization, and KPI tracking.

Future enhancements should build upon this foundation while maintaining the core user experience patterns established here: view/edit mode separation, hover-based relationship discovery, and draft-based change management.
