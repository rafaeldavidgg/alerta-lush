import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'StockAlert',
  description:
    'Vigila la disponibilidad de productos online y recibe un aviso por Telegram cuando vuelven a estar disponibles.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
