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
});
