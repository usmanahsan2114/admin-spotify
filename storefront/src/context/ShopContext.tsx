import React from 'react';
import { CheckoutProvider, useSDK } from '../sdk';

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <CheckoutProvider>
            {children}
        </CheckoutProvider>
    );
};

export const useShop = () => {
    return useSDK();
};
