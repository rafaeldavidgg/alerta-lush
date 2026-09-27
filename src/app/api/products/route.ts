import { NextResponse } from 'next/server';
import { getProductStore } from '@core/storage';
import { toPublicProduct } from '@core/types';
import { validateRegistration } from '@core/validation';

export const dynamic = 'force-dynamic';

/** List every tracked product (without the private chat_id). */
export async function GET() {
  const store = getProductStore();
  const products = await store.list();
  return NextResponse.json({ products: products.map(toPublicProduct) });
}

/** Register a new tracked product. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ errors: { _: 'invalid JSON body' } }, { status: 400 });
  }

  const result = validateRegistration((body ?? {}) as Record<string, unknown>);
  if (!result.ok) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  const store = getProductStore();
  const product = await store.create({
    url: result.value.url,
    chat_id: result.value.chat_id,
    etiqueta: result.value.etiqueta,
    tienda: result.value.tienda,
  });
  return NextResponse.json({ product: toPublicProduct(product) }, { status: 201 });
}
