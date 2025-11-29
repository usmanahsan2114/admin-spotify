import React, { createContext, useContext } from 'react';
import { useCart } from './useCart';
import { useCheckout } from './useCheckout';
import type { CartItem } from './types';

interface CheckoutContextType {
    cart: CartItem[];
    addToCart: (product: any, quantity: number) => void;
    removeFromCart: (productId: string) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    checkout: ReturnType<typeof useCheckout>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const cartLogic = useCart();
    const checkoutLogic = useCheckout();

    return (
        <CheckoutContext.Provider value={{ ...cartLogic, checkout: checkoutLogic }}>
            {children}
        </CheckoutContext.Provider>
    );
};

export const useSDK = () => {
    const context = useContext(CheckoutContext);
    if (!context) throw new Error('useSDK must be used within a CheckoutProvider');
    return context;
};
