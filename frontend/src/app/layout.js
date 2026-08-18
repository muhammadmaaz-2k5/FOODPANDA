import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { CartProvider } from '@/context/CartContext';

export const metadata = {
  title: 'FoodPanda - Food & Grocery Delivery',
  description: 'Order your favorite food and daily essentials with lightning-fast delivery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased selection:bg-[#d70f64] selection:text-white">
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
