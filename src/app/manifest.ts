import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockAlert',
    short_name: 'StockAlert',
    description:
      'Vigila la disponibilidad de productos online y recibe un aviso por Telegram cuando vuelven a estar disponibles.',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6f7f9',
    theme_color: '#1f7a4d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
