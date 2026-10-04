import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alerta Lush',
    short_name: 'Alerta Lush',
    description:
      'Vigila la disponibilidad de productos de Lush y recibe un aviso por Telegram cuando vuelven a estar disponibles.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf7f0',
    theme_color: '#1f7a4d',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
