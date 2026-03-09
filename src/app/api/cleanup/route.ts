import { NextRequest, NextResponse } from 'next/server';
import { cleanupOrphanedRelationships, findOrphanedRelationships } from '@/lib/db';

/**
 * GET /api/cleanup - Find orphaned relationships
 * Returns list of orphaned relationships that reference deleted entities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const xmatrixId = searchParams.get('xmatrixId');

    if (!xmatrixId) {
      return NextResponse.json(
        { error: 'xmatrixId is required' },
        { status: 400 }
      );
    }

    const orphaned = findOrphanedRelationships(xmatrixId);

    return NextResponse.json({
      success: true,
      orphanedCount: orphaned.length,
      orphaned,
    });
  } catch (error) {
    console.error('Error finding orphaned relationships:', error);
    return NextResponse.json(
      { error: 'Failed to find orphaned relationships' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cleanup - Remove orphaned relationships
 * Deletes all relationships referencing deleted entities
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const xmatrixId = searchParams.get('xmatrixId');

    if (!xmatrixId) {
      return NextResponse.json(
        { error: 'xmatrixId is required' },
        { status: 400 }
      );
    }

    const deletedCount = cleanupOrphanedRelationships(xmatrixId);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `Cleaned up ${deletedCount} orphaned relationships`,
    });
  } catch (error) {
    console.error('Error cleaning up orphaned relationships:', error);
    return NextResponse.json(
      { error: 'Failed to clean up orphaned relationships' },
      { status: 500 }
    );
  }
}
