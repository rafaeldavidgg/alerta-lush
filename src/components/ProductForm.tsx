'use client';

import { useState } from 'react';
import { validateRegistration } from '@core/validation';

export interface ProductFormValues {
  url: string;
  chat_id: string;
  etiqueta?: string;
}

export interface ProductFormProps {
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
}

/**
 * Registration form. Validates locally with the same rules as the API so the
 * user gets immediate field-level feedback.
 */
export function ProductForm({ onSubmit }: ProductFormProps) {
  const [url, setUrl] = useState('');
  const [chatId, setChatId] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateRegistration({ url, chat_id: chatId, etiqueta });
    if (!result.ok) {
      setErrors(result.errors);
      setStatus(null);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit({
        url: result.value.url,
        chat_id: result.value.chat_id,
        ...(result.value.etiqueta !== undefined ? { etiqueta: result.value.etiqueta } : {}),
      });
      setUrl('');
      setChatId('');
      setEtiqueta('');
      setStatus('Producto añadido. Se vigilará en la próxima ejecución.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="url">URL del producto</label>
        <input
          id="url"
          name="url"
          type="url"
          placeholder="https://www.lush.com/es/es/p/silvery-moon-soap"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
        {errors.url ? <span className="error">{errors.url}</span> : null}
      </div>

      <div className="field">
        <label htmlFor="chat_id">chat_id de Telegram</label>
        <input
          id="chat_id"
          name="chat_id"
          inputMode="numeric"
          placeholder="123456789"
          value={chatId}
          onChange={(event) => setChatId(event.target.value)}
        />
        {errors.chat_id ? <span className="error">{errors.chat_id}</span> : null}
      </div>

      <div className="field">
        <label htmlFor="etiqueta">Etiqueta (opcional)</label>
        <input
          id="etiqueta"
          name="etiqueta"
          placeholder="Jabón Silvery Moon"
          value={etiqueta}
          onChange={(event) => setEtiqueta(event.target.value)}
        />
        {errors.etiqueta ? <span className="error">{errors.etiqueta}</span> : null}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Añadiendo…' : 'Añadir producto'}
      </button>
      {status ? <p className="status">{status}</p> : null}
    </form>
  );
}
