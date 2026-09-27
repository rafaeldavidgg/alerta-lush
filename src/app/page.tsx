'use client';

import { useCallback, useEffect, useState } from 'react';
import type { PublicTrackedProduct } from '@core/types';
import { ProductForm, type ProductFormValues } from '@/components/ProductForm';
import { ProductList } from '@/components/ProductList';

export default function HomePage() {
  const [products, setProducts] = useState<PublicTrackedProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/products', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as { products?: PublicTrackedProduct[] };
      setProducts(data.products ?? []);
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los productos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = useCallback(
    async (values: ProductFormValues) => {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as { errors?: Record<string, string> };
        const message = data.errors
          ? Object.values(data.errors).join(', ')
          : `No se pudo guardar (HTTP ${response.status}).`;
        throw new Error(message);
      }
      await load();
    },
    [load],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      await load();
    },
    [load],
  );

  return (
    <main>
      <h1>StockAlert</h1>
      <p className="subtitle">
        Pega la URL de un producto agotado y te avisamos por Telegram cuando vuelva a estar
        disponible.
      </p>

      <ProductForm onSubmit={handleCreate} />

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Productos vigilados</h2>
        {loading ? <p className="meta">Cargando…</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {!loading && !error ? <ProductList products={products} onDelete={handleDelete} /> : null}
      </section>
    </main>
  );
}
