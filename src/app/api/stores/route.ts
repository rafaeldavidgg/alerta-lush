import { NextResponse } from 'next/server';
import { listVisibleStores } from '@stores/index';

export const dynamic = 'force-dynamic';

/** List the user-facing supported stores (demo/fixture entries excluded). */
export async function GET() {
  return NextResponse.json({ stores: listVisibleStores() });
}
