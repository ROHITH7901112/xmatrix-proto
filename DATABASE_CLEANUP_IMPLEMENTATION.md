# Database Cleanup Implementation: Orphaned Relationships

## Problem Statement

The relationships table in your database contained 44 entries, many referencing entities (initiatives, objectives, KPIs, owners) that no longer existed in the matrix. This happened because:

1. **No cascade deletion**: When an entity was deleted, its relationships were left behind
2. **No cleanup mechanism**: There was no way to identify or remove orphaned data
3. **Data accumulation**: Over time, the relationships table grew with stale references

## Root Cause Analysis

### Why Orphaned Relationships Were Created

When you deleted an entity (e.g., an initiative with id `init-1773042716214-bvtud6vlg`), the following happened:

```
DELETE FROM initiatives WHERE id = 'init-1773042716214-bvtud6vlg'
```

However, the relationships table still contained rows like:

```sql
INSERT INTO relationships VALUES (
  NULL, 'xmatrix-main', 'init-1773042716214-bvtud6vlg', 'initiative', 'kpi-1', 'kpi', 'primary'
)
```

This orphaned relationship became "dead data" — pointing to an entity that no longer exists, but still consuming database space and potentially causing issues with relationship highlighting logic.

### Why the Database Allowed This

The database schema had `FOREIGN KEY (xmatrix_id) REFERENCES xmatrix(id) ON DELETE CASCADE`, which means:
- Relationships are only deleted if the entire X-Matrix is deleted
- Individual entity deletions were NOT cascaded to the relationships table
- No foreign keys directly linked source_id/target_id to entity tables

## Solution Implemented

### 1. **Cascade Deletion in Individual Delete Functions**

All entity delete functions were updated to explicitly remove related relationships:

```typescript
export function deleteOwner(id: string): boolean {
  const db = getDatabase();
  // Delete all relationships referencing this owner (both source and target)
  db.prepare('DELETE FROM relationships WHERE source_id = ? OR target_id = ?').run(id, id);
  const result = db.prepare('DELETE FROM owners WHERE id = ?').run(id);
  return result.changes > 0;
}
```

**Applied to:**
- `deleteOwner()`
- `deleteLongTermObjective()`
- `deleteAnnualObjective()`
- `deleteInitiative()`
- `deleteKPI()`

### 2. **Cascade Deletion in Bulk Sync (Edit Mode)**

The `bulkSyncEntities()` function (used when saving in edit mode) was updated to cascade delete relationships for deleted entities:

```typescript
// For each deleted objective, remove its relationships first
for (const e of ltoDiff.deleted) {
  ltoRelDelete.run(e.id, e.id);  // Delete relationships
  ltoDelete.run(e.id);            // Then delete the objective
}
```

**Applied to all entity types:**
- Long-Term Objectives
- Annual Objectives
- Initiatives
- KPIs
- Owners

### 3. **Orphaned Relationship Detection**

Added `findOrphanedRelationships()` function to identify existing orphaned data:

```typescript
export function findOrphanedRelationships(xmatrixId: string): Array<{
  id: number;
  sourceId: string;
  sourceMissing: boolean;
  targetId: string;
  targetMissing: boolean;
}> {
  // Checks each relationship to see if its source/target entities exist
  // Returns list of orphaned relationship IDs
}
```

This function:
- Queries all relationships for a given xmatrix
- Checks if the source entity exists in its corresponding table
- Checks if the target entity exists in its corresponding table
- Returns details about which entities are missing

### 4. **Orphaned Relationship Cleanup**

Added `cleanupOrphanedRelationships()` function to remove orphaned data:

```typescript
export function cleanupOrphanedRelationships(xmatrixId: string): number {
  const orphaned = findOrphanedRelationships(xmatrixId);
  // Deletes all orphaned relationships
  // Returns count of deleted rows
}
```

### 5. **API Endpoint for Cleanup Operations**

Created `/api/cleanup` endpoint with two operations:

**GET /api/cleanup?xmatrixId=xxx**
- Returns list of orphaned relationships
- Returns count of orphaned entries
- No data modification

**DELETE /api/cleanup?xmatrixId=xxx**
- Permanently removes all orphaned relationships
- Returns count of deleted relationships
- Requires confirmation in UI

### 6. **UI for Database Management**

Added "Database Cleanup" section on the Manage page:

- **Check Button**: Scans database for orphaned relationships
- **Shows Result**: Displays count of found orphaned relationships
- **Cleanup Button**: Appears only when orphaned relationships are found
- **Confirmation**: Requires user confirmation before deletion
- **Feedback**: Shows success message with count of deleted relationships

## Files Modified

### 1. **src/lib/db.ts**
- Updated 5 delete functions with cascade deletion
- Updated `bulkSyncEntities()` with cascade deletion in entity deletion loops
- Added `findOrphanedRelationships()` utility function
- Added `cleanupOrphanedRelationships()` utility function

### 2. **src/app/api/cleanup/route.ts** (NEW)
- GET endpoint to find orphaned relationships
- DELETE endpoint to remove orphaned relationships
- Error handling and validation

### 3. **src/app/manage/page.tsx**
- Added cleanup state variables (`cleanupLoading`, `cleanupResult`)
- Added `handleCheckOrphaned()` function
- Added `handleCleanupOrphaned()` function
- Added "Database Cleanup" UI section with Check and Cleanup buttons

## How the System Now Works

### When Deleting an Entity (e.g., Initiative)

**Before:**
```
DELETE FROM initiatives WHERE id = 'init-xxx'
→ Initiative deleted
→ Relationships still point to init-xxx (ORPHANED)
```

**After:**
```
DELETE FROM relationships WHERE source_id = 'init-xxx' OR target_id = 'init-xxx'
DELETE FROM initiatives WHERE id = 'init-xxx'
→ Initiative deleted
→ All related relationships also deleted (CLEAN)
```

### When Using Manage Page Edit Mode

When you click "Save" after making changes:
- The system compares draft vs. original data
- For each deleted entity, it:
  1. Removes all relationships pointing to/from it
  2. Deletes the entity itself
  3. No orphaned data is created

### Cleaning Up Existing Orphaned Data

1. Go to Manage page
2. Scroll to "Database Cleanup" section
3. Click "Check" button
4. System scans relationships table and identifies orphans
5. If orphaned relationships are found, "Cleanup" button appears
6. Click "Cleanup" and confirm
7. All orphaned relationships are removed

## Why Long IDs (like init-1773042716214-bvtud6vlg)

The long ID format is intentional:
- **Prefix** (init-, ao-, lto-, kpi-, owner-): Identifies entity type at a glance
- **Timestamp**: Ensures chronological ordering and reduces collision likelihood
- **Random string**: Provides additional uniqueness guarantee across distributed systems

This approach is common in modern applications and is superior to simple sequential IDs for:
- Offline-first architectures
- Distributed systems
- Avoiding ID collisions
- Type safety (you know what kind of entity it is)

## Prevention Going Forward

Now that cascade deletion is implemented:
- **No orphaned relationships will be created** when you delete entities
- The cleanup API and UI are available if you want to check for any stale data
- The system is self-cleaning on every delete operation

## Testing

To verify the fix works:

1. **Create test data:**
   - Create an initiative with relationships
   - Link it to objectives and KPIs

2. **Delete the entity:**
   - Delete the initiative from Manage page
   - No orphaned relationships should remain

3. **Check for orphaned data:**
   - Go to Manage > Database Cleanup
   - Click "Check"
   - Should show 0 orphaned relationships (if all previous data was already cleaned up)

4. **Manual cleanup (if needed):**
   - If you had stale data before this fix
   - Click "Check" to identify orphans
   - Click "Cleanup" to remove them
   - Confirm the action

## Summary of Changes

| Item | Before | After |
|------|--------|-------|
| **Orphaned Relationships on Delete** | Created (no cascade) | Prevented (cascade delete) |
| **Bulk Delete (Edit Mode)** | Created orphans | Cleaned up (cascade delete) |
| **Data Accumulation** | Uncontrolled | Prevented |
| **Orphan Detection** | Manual database inspection | API + UI "Check" button |
| **Orphan Cleanup** | Manual SQL queries | API + UI "Cleanup" button |
| **Database Size** | Growing over time | Stable (self-cleaning) |

## Code Changes Summary

**Lines Added:** ~270  
**Files Modified:** 3 (db.ts, manage/page.tsx, cleanup/route.ts)  
**Commit:** `ead248f` - "Fix: Add cascade deletion for orphaned relationships and cleanup utilities"

All changes have been tested with TypeScript strict mode and compile successfully.
