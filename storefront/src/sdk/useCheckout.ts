import { useState } from 'react';
import axios from 'axios';
import type { CartItem, Order, CheckoutState } from './types';

// Configure this or pass it in
const API_BASE_URL = 'http://localhost:5000/api/public/v1';

export const useCheckout = () => {
    const [state, setState] = useState<CheckoutState>({
        loading: false,
        error: null,
        success: false
    });

    const validateCart = async (items: CartItem[], storeId?: string, discountCode?: string) => {
        try {
            const res = await axios.post(`${API_BASE_URL}/checkout/validate`, {
                items,
                storeId,
                discountCode
            });
            return res.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Cart validation failed');
        }
    };

    const submitOrder = async (order: Order & { discountCode?: string }) => {
        setState({ loading: true, error: null, success: false });
        try {
            // 1. Validate first
            await validateCart(order.items, order.storeId, order.discountCode);

            // 2. Submit
            const res = await axios.post(`${API_BASE_URL}/orders`, order);

            setState({
                loading: false,
                error: null,
                success: true,
                orderId: res.data.orderNumber
            });

            return res.data;
        } catch (error: any) {
            const msg = error.response?.data?.message || error.message || 'Checkout failed';
            setState({ loading: false, error: msg, success: false });
            throw error;
        }
    };

    return {
        ...state,
        submitOrder,
        validateCart
    };
};
