import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

export const Success: React.FC = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <div className="flex justify-center mb-6">
                <CheckCircle className="h-24 w-24 text-green-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
            <p className="text-xl text-gray-600 mb-8">Thank you for your purchase. We have received your order.</p>
            <div className="space-x-4">
                <Link
                    to="/"
                    className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-md font-medium hover:bg-indigo-700 transition-colors"
                >
                    Continue Shopping
                </Link>
            </div>
        </div>
    );
};
