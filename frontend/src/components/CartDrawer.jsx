'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';

export default function CartDrawer() {
  const { cart, isOpen, setIsOpen, updateQuantity, removeItem, clearCart, subtotal } = useCart();

  if (!isOpen) return null;

  const deliveryFee = 2.99;
  const total = (parseFloat(subtotal) + deliveryFee).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#d70f64]" />
            <h2 className="text-lg font-bold text-slate-900">Your Basket</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {!cart?.items || cart.items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <p className="font-bold text-slate-800 text-lg">Your cart is empty</p>
              <p className="text-sm mt-1 text-slate-500">Add delicious food from nearby restaurants to start an order.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2">
                <span>Restaurant: <strong className="text-slate-800">{cart.restaurant?.name || 'Selected Vendor'}</strong></span>
                <button
                  onClick={clearCart}
                  className="text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </div>

              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-slate-900">{item.foodItem?.name}</h4>
                    {item.variation && (
                      <p className="text-xs text-slate-500 mt-0.5">Size: {item.variation.name}</p>
                    )}
                    {item.addons?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Addons: {item.addons.map((a) => a.addon?.name).join(', ')}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-[#d70f64] mt-2">
                      ${((item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition cursor-pointer p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2 py-1 shadow-xs">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="text-slate-600 hover:text-rose-600 cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="text-slate-600 hover:text-emerald-600 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {cart?.items?.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>${parseFloat(subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Standard Delivery</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-[#d70f64]">${total}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={() => setIsOpen(false)}
              className="foodpanda-btn w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-white shadow-md text-base"
            >
              Proceed to Checkout <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
