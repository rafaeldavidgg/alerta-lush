import { NextResponse } from 'next/server';
import { getProductStore } from '@core/storage';

export const dynamic = 'force-dynamic';

/** Remove a tracked product by id. */
export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const store = getProductStore();
  const deleted = await store.delete(id);
  if (!deleted) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
