export interface CartItem {
    productId: string;
    storeId?: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

export interface Customer {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    province?: string;
}

export interface Order {
    storeId: string;
    items: CartItem[];
    customer: Customer;
    paymentMethod: string;
    shippingMethod?: string;
    notes?: string;
}

export interface CheckoutState {
    loading: boolean;
    error: string | null;
    success: boolean;
    orderId?: string;
}
