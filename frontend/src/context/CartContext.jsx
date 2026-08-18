'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCart(res.data.data);
      }
    } catch (err) {
      console.error('Fetch cart error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      fetchCart();
    }
  }, []);

  const addToCart = async (foodItemId, restaurantId, quantity = 1, variationId = null, addonIds = [], specialInstructions = '') => {
    try {
      const res = await api.post('/cart/items', {
        foodItemId,
        restaurantId,
        quantity,
        variationId,
        addonIds,
        specialInstructions,
      });
      if (res.data.success) {
        await fetchCart();
        setIsOpen(true);
        return res.data.data;
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding to cart');
      throw err;
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const res = await api.put(`/cart/items/${cartItemId}`, { quantity });
      if (res.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Update quantity error:', err.message);
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const res = await api.delete(`/cart/items/${cartItemId}`);
      if (res.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Remove item error:', err.message);
    }
  };

  const clearCart = async () => {
    try {
      const res = await api.delete('/cart/clear');
      if (res.data.success) {
        setCart(null);
      }
    } catch (err) {
      console.error('Clear cart error:', err.message);
    }
  };

  const itemCount = cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  const subtotal = cart?.subtotal || 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        isOpen,
        setIsOpen,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        fetchCart,
        itemCount,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
