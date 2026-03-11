// Cleanup API removed — kept as a stub to return 404 for safety.
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
