import { useState, useEffect, useRef } from 'react';
import type { CartItem } from './types';
import axios from 'axios';

// Debounce helper
const useDebounce = (value: any, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
};

export const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Failed to load cart', e);
            return [];
        }
    });

    const [cartId, setCartId] = useState<string | null>(() => localStorage.getItem('cartId'));
    const debouncedCart = useDebounce(cart, 2000); // Sync after 2 seconds of inactivity

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    // Sync Cart to Backend
    useEffect(() => {
        const syncCart = async () => {
            if (debouncedCart.length === 0 && !cartId) return;

            try {
                const storeId = debouncedCart[0]?.storeId || 'default-store'; // Should come from config
                const res = await axios.post('http://localhost:5000/api/public/v1/cart/sync', {
                    cartId,
                    storeId,
                    items: debouncedCart,
                    // In a real app, we'd capture email from a context or input
                    email: localStorage.getItem('customer_email')
                });

                if (res.data.cartId && res.data.cartId !== cartId) {
                    setCartId(res.data.cartId);
                    localStorage.setItem('cartId', res.data.cartId);
                }
            } catch (error) {
                console.error('Failed to sync cart', error);
            }
        };

        syncCart();
    }, [debouncedCart]);

    const addToCart = (product: any, quantity: number) => {
        setCart(prev => {
            const existing = prev.find(item => item.productId === product.id);
            if (existing) {
                return prev.map(item =>
                    item.productId === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }
            return [...prev, {
                productId: product.id,
                storeId: product.storeId,
                name: product.name,
                price: parseFloat(product.price),
                quantity,
                imageUrl: product.imageUrl
            }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCart([]);
        // Optional: Call backend to mark as converted or cleared
    };

    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount
    };
};
