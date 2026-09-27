'use client';

import type { PublicTrackedProduct } from '@core/types';
import { formatLastCheck, stateLabel } from '@/lib/labels';

export interface ProductListProps {
  products: PublicTrackedProduct[];
  onDelete: (id: string) => Promise<void> | void;
}

/** List of tracked products with their store, state, and last verification. */
export function ProductList({ products, onDelete }: ProductListProps) {
  if (products.length === 0) {
    return <p className="meta">Todavía no vigilas ningún producto.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {products.map((product) => (
        <li key={product.id} className="product">
          <div>
            <a href={product.url} target="_blank" rel="noreferrer">
              {product.etiqueta?.trim() ? product.etiqueta : product.url}
            </a>
            <div className="meta">
              {product.tienda} ·{' '}
              <span className={`badge ${product.estado_actual}`}>
                {stateLabel(product.estado_actual)}
              </span>{' '}
              · {formatLastCheck(product.ultima_verificacion)}
            </div>
          </div>
          <button
            type="button"
            className="secondary"
            aria-label={`Eliminar ${product.etiqueta?.trim() ? product.etiqueta : product.url}`}
            onClick={() => void onDelete(product.id)}
          >
            Eliminar
          </button>
        </li>
      ))}
    </ul>
  );
}
