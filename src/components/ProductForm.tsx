'use client';

import { useEffect, useRef, useState } from 'react';
import { validateRegistration } from '@core/validation';

export interface ProductFormValues {
  url: string;
  chat_id: string;
  etiqueta?: string;
}

export interface SupportedStoreInfo {
  domain: string;
  name: string;
}

export interface ProductFormProps {
  onSubmit: (values: ProductFormValues) => Promise<void> | void;
  /**
   * User-facing store catalog (from GET /api/stores). While it is loading
   * (`undefined` or empty) no unsupported-store warning is shown.
   */
  supportedStores?: SupportedStoreInfo[];
}

/**
 * Return true when the URL belongs to a supported store, false when it is
 * parseable but matches no catalog entry, and null when support cannot be
 * determined (empty catalog or unparseable URL).
 */
export function checkStoreSupport(
  rawUrl: string,
  supportedStores: SupportedStoreInfo[],
): boolean | null {
  if (supportedStores.length === 0) return null;
  let host: string;
  try {
    host = new URL(rawUrl.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  if (!host) return null;
  const supported = supportedStores.some(
    (store) => host === store.domain || host.endsWith(`.${store.domain}`),
  );
  return supported;
}

function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined ? joined : undefined;
}

/**
 * Registration form. Validates locally with the same rules as the API so the
 * user gets immediate field-level feedback.
 */
export function ProductForm({ onSubmit, supportedStores = [] }: ProductFormProps) {
  const [url, setUrl] = useState('');
  const [chatId, setChatId] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [storeWarning, setStoreWarning] = useState<string | null>(null);

  const urlRef = useRef<HTMLInputElement>(null);
  const chatIdRef = useRef<HTMLInputElement>(null);
  const etiquetaRef = useRef<HTMLInputElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);

  // Move focus to the outcome message so keyboard and screen-reader users
  // are notified of the registration result.
  useEffect(() => {
    if (status) statusRef.current?.focus();
  }, [status]);

  function updateStoreWarning(rawUrl: string): boolean | null {
    const support = checkStoreSupport(rawUrl, supportedStores);
    setStoreWarning(
      support === false
        ? 'Esta tienda aún no está soportada: el producto se guardará, pero quedará como «Desconocido» y no recibirás avisos hasta que se añada soporte.'
        : null,
    );
    return support;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateRegistration({ url, chat_id: chatId, etiqueta });
    if (!result.ok) {
      setErrors(result.errors);
      setStatus(null);
      // Focus the first invalid field.
      if (result.errors.url) urlRef.current?.focus();
      else if (result.errors.chat_id) chatIdRef.current?.focus();
      else if (result.errors.etiqueta) etiquetaRef.current?.focus();
      return;
    }

    setErrors({});
    const support = updateStoreWarning(result.value.url);
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
      setStatus(
        support === false
          ? 'Producto añadido. Ten en cuenta que su tienda aún no está soportada: quedará como «Desconocido» hasta que se añada soporte.'
          : 'Producto añadido. Se vigilará en la próxima ejecución.',
      );
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
          ref={urlRef}
          placeholder="https://www.lush.com/es/es/p/silvery-moon-soap"
          value={url}
          aria-invalid={errors.url ? true : undefined}
          aria-describedby={describedBy(errors.url && 'url-error', storeWarning && 'store-warning')}
          onChange={(event) => {
            setUrl(event.target.value);
            if (storeWarning) updateStoreWarning(event.target.value);
          }}
          onBlur={(event) => updateStoreWarning(event.target.value)}
        />
        {errors.url ? (
          <span className="error" id="url-error" role="alert">
            {errors.url}
          </span>
        ) : null}
        {storeWarning && !errors.url ? (
          <span className="warning" id="store-warning" role="alert">
            {storeWarning}
          </span>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="chat_id">chat_id de Telegram</label>
        <input
          id="chat_id"
          name="chat_id"
          ref={chatIdRef}
          inputMode="numeric"
          placeholder="123456789"
          value={chatId}
          aria-invalid={errors.chat_id ? true : undefined}
          aria-describedby={describedBy('chat-id-help', errors.chat_id && 'chat-id-error')}
          onChange={(event) => setChatId(event.target.value)}
        />
        <div className="help" id="chat-id-help">
          <p>¿Cómo consigo mi chat_id?</p>
          <ol>
            <li>Abre tu bot en Telegram y envíale cualquier mensaje.</li>
            <li>El bot te responde con tu chat_id (un número).</li>
            <li>Copia ese número y pégalo en este campo.</li>
          </ol>
        </div>
        {errors.chat_id ? (
          <span className="error" id="chat-id-error" role="alert">
            {errors.chat_id}
          </span>
        ) : null}
      </div>

      <div className="field">
        <label htmlFor="etiqueta">Etiqueta (opcional)</label>
        <input
          id="etiqueta"
          name="etiqueta"
          ref={etiquetaRef}
          placeholder="Jabón Silvery Moon"
          value={etiqueta}
          aria-invalid={errors.etiqueta ? true : undefined}
          aria-describedby={describedBy(errors.etiqueta && 'etiqueta-error')}
          onChange={(event) => setEtiqueta(event.target.value)}
        />
        {errors.etiqueta ? (
          <span className="error" id="etiqueta-error" role="alert">
            {errors.etiqueta}
          </span>
        ) : null}
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Añadiendo…' : 'Añadir producto'}
      </button>
      {status ? (
        <p className="status" role="status" ref={statusRef} tabIndex={-1}>
          {status}
        </p>
      ) : null}
    </form>
  );
}
