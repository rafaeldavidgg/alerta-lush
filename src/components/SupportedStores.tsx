'use client';

export interface SupportedStore {
  domain: string;
  name: string;
}

export interface SupportedStoresProps {
  /** Null while the catalog is loading, array once loaded. */
  stores: SupportedStore[] | null;
  loadError: string | null;
}

/** User-facing list of currently supported stores, driven by GET /api/stores. */
export function SupportedStores({ stores, loadError }: SupportedStoresProps) {
  return (
    <section className="card" aria-labelledby="supported-stores-heading">
      <h2 id="supported-stores-heading" style={{ marginTop: 0 }}>
        Tiendas soportadas
      </h2>
      {stores === null && !loadError ? <p className="meta">Cargando tiendas soportadas…</p> : null}
      {loadError ? (
        <p className="error" role="status">
          {loadError}
        </p>
      ) : null}
      {stores && stores.length > 0 ? (
        <ul>
          {stores.map((store) => (
            <li key={store.domain}>
              {store.name} <span className="meta">({store.domain})</span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="meta">
        ¿Tu tienda no está en la lista? Puedes registrar sus productos igualmente, pero quedarán
        como «Desconocido» y no recibirás avisos hasta que se añada soporte.
      </p>
    </section>
  );
}
