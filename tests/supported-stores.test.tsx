// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SupportedStores } from '@/components/SupportedStores';

describe('SupportedStores', () => {
  it('lists supported stores and never demo stores', () => {
    render(<SupportedStores stores={[{ domain: 'lush.com', name: 'Lush' }]} loadError={null} />);

    expect(screen.getByRole('heading', { name: /tiendas soportadas/i })).toBeInTheDocument();
    expect(screen.getByText('Lush')).toBeInTheDocument();
    expect(screen.getByText(/lush\.com/)).toBeInTheDocument();
    expect(screen.queryByText(/example-shop\.test/)).not.toBeInTheDocument();
  });

  it('shows a loading state while the catalog loads', () => {
    render(<SupportedStores stores={null} loadError={null} />);
    expect(screen.getByText(/cargando tiendas soportadas/i)).toBeInTheDocument();
  });

  it('shows load errors without crashing', () => {
    render(<SupportedStores stores={[]} loadError="No se pudieron cargar." />);
    expect(screen.getByText(/no se pudieron cargar/i)).toBeInTheDocument();
  });
});
