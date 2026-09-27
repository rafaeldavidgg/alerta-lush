// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/components/ProductList';
import type { TrackedProduct } from '@core/types';

const product: TrackedProduct = {
  id: 'p1',
  url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
  chat_id: '123',
  etiqueta: 'Silvery Moon',
  tienda: 'lush.com',
  estado_actual: 'out_of_stock',
  estado_anterior: 'out_of_stock',
  ultima_verificacion: null,
  creado_en: '2026-01-01T00:00:00.000Z',
};

describe('ProductList', () => {
  it('renders label, store, state, and last-check placeholder', () => {
    render(<ProductList products={[product]} onDelete={() => undefined} />);

    expect(screen.getByText('Silvery Moon')).toBeInTheDocument();
    expect(screen.getByText(/lush\.com/)).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.getByText(/Sin comprobar/i)).toBeInTheDocument();
  });

  it('falls back to the URL when there is no label', () => {
    render(
      <ProductList
        products={[{ ...product, etiqueta: undefined }]}
        onDelete={() => undefined}
      />,
    );
    expect(
      screen.getByRole('link', { name: 'https://www.lush.com/es/es/p/silvery-moon-soap' }),
    ).toBeInTheDocument();
  });

  it('calls onDelete with the product id', async () => {
    const onDelete = vi.fn();
    render(<ProductList products={[product]} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: /eliminar/i }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });

  it('shows an empty state', () => {
    render(<ProductList products={[]} onDelete={() => undefined} />);
    expect(screen.getByText(/no vigilas ningún producto/i)).toBeInTheDocument();
  });
});
