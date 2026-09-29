// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from '@/components/ProductForm';

describe('ProductForm', () => {
  it('submits valid input', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(/URL del producto/i),
      'https://www.lush.com/es/es/p/silvery-moon-soap',
    );
    await userEvent.type(screen.getByLabelText(/chat_id/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0]![0]).toMatchObject({
      url: 'https://www.lush.com/es/es/p/silvery-moon-soap',
      chat_id: '123456',
    });
  });

  it('surfaces an invalid URL error and does not submit', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await userEvent.type(screen.getByLabelText(/URL del producto/i), 'not-a-url');
    await userEvent.type(screen.getByLabelText(/chat_id/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    expect(await screen.findByText(/absolute http/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('surfaces an empty chat_id error and does not submit', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(/URL del producto/i),
      'https://www.lush.com/es/es/p/x',
    );
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    expect(await screen.findByText(/chat_id is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows permanent chat_id help linked to the input', () => {
    render(<ProductForm onSubmit={() => undefined} />);

    expect(screen.getByText(/¿Cómo consigo mi chat_id\?/i)).toBeInTheDocument();
    expect(screen.getByRole('list')).toBeInTheDocument();
    const input = screen.getByLabelText(/chat_id/i);
    expect(input.getAttribute('aria-describedby')).toMatch(/chat-id-help/);
  });

  it('exposes field errors as alerts linked to invalid inputs', async () => {
    render(<ProductForm onSubmit={() => undefined} />);

    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    const input = screen.getByLabelText(/chat_id/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby') ?? '';
    expect(describedBy).toMatch(/chat-id-help/);
    expect(describedBy).toMatch(/chat-id-error/);
    const error = await screen.findByText(/chat_id is required/i);
    expect(error).toHaveAttribute('role', 'alert');
  });

  it('moves focus to the success status after submitting', async () => {
    render(<ProductForm onSubmit={() => undefined} />);

    await userEvent.type(
      screen.getByLabelText(/URL del producto/i),
      'https://www.lush.com/es/es/p/silvery-moon-soap',
    );
    await userEvent.type(screen.getByLabelText(/chat_id/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent(/Producto añadido/i);
    await waitFor(() => expect(document.activeElement).toBe(status));
  });

  it('warns about unsupported stores without blocking submission', async () => {
    const onSubmit = vi.fn();
    render(
      <ProductForm onSubmit={onSubmit} supportedStores={[{ domain: 'lush.com', name: 'Lush' }]} />,
    );

    await userEvent.type(
      screen.getByLabelText(/URL del producto/i),
      'https://tienda-desconocida.example/p/1',
    );
    await userEvent.type(screen.getByLabelText(/chat_id/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    expect(await screen.findAllByText(/aún no está soportada/i)).not.toHaveLength(0);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(await screen.findAllByText(/quedará como «Desconocido»/i)).not.toHaveLength(0);
  });

  it('shows no store warning while the catalog is still loading', async () => {
    const onSubmit = vi.fn();
    render(<ProductForm onSubmit={onSubmit} supportedStores={[]} />);

    await userEvent.type(
      screen.getByLabelText(/URL del producto/i),
      'https://tienda-desconocida.example/p/1',
    );
    await userEvent.type(screen.getByLabelText(/chat_id/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /añadir producto/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/aún no está soportada/i)).not.toBeInTheDocument();
  });
});
