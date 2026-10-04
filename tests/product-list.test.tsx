// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductList } from '@/components/ProductList';
import type { PublicTrackedProduct } from '@core/types';

const product: PublicTrackedProduct = {
  id: 'p1',
  url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
  chat_id: '123456789',
  etiqueta: 'Silvery Moon',
  tienda: 'Lush',
  estado_actual: 'out_of_stock',
  estado_anterior: 'out_of_stock',
  ultima_verificacion: null,
  creado_en: '2026-01-01T00:00:00.000Z',
};

describe('ProductList', () => {
  it('renders label, store, state, and last-check placeholder', () => {
    render(<ProductList products={[product]} onDelete={() => undefined} />);

    expect(screen.getByText('Silvery Moon')).toBeInTheDocument();
    expect(screen.getByText(/Lush/)).toBeInTheDocument();
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(screen.getByText(/Avisará al chat 123456789/)).toBeInTheDocument();
    expect(screen.getByText(/Sin comprobar/i)).toBeInTheDocument();
  });

  it('falls back to the URL when there is no label', () => {
    render(
      <ProductList products={[{ ...product, etiqueta: undefined }]} onDelete={() => undefined} />,
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
    const empty = screen.getByText(/no vigilas ningún producto/i);
    expect(empty).toBeInTheDocument();
    expect(empty.tagName).toBe('OUTPUT');
    expect(screen.getByRole('status')).toBe(empty);
  });

  it('announces removals through a live region', () => {
    const { rerender } = render(<ProductList products={[product]} onDelete={() => undefined} />);
    expect(screen.queryByText(/producto eliminado/i)).not.toBeInTheDocument();

    rerender(<ProductList products={[]} onDelete={() => undefined} />);
    const emptyState = screen.getByText(/no vigilas ningún producto/i);
    expect(emptyState.tagName).toBe('OUTPUT');
    expect(screen.getByRole('status')).toBe(emptyState);
  });

  it('announces removals when the list shrinks but is not empty', async () => {
    const second: PublicTrackedProduct = {
      ...product,
      id: 'p2',
      etiqueta: 'Segundo',
    };
    const { rerender } = render(
      <ProductList products={[product, second]} onDelete={() => undefined} />,
    );
    rerender(<ProductList products={[second]} onDelete={() => undefined} />);

    const notice = await screen.findByText(/producto eliminado/i);
    expect(notice.tagName).toBe('OUTPUT');
    expect(screen.getByRole('status')).toBe(notice);
    expect(screen.queryByText('Silvery Moon')).not.toBeInTheDocument();
  });

  it('keeps an accessible name on every delete button', async () => {
    const onDelete = vi.fn();
    render(<ProductList products={[product]} onDelete={onDelete} />);

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar Silvery Moon' }));
    expect(onDelete).toHaveBeenCalledWith('p1');
  });
});
