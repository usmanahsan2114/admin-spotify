import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Store } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export const Navbar: React.FC = () => {
    const { cartCount } = useShop();

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <Link to="/" className="flex items-center space-x-2">
                        <Store className="h-8 w-8 text-indigo-600" />
                        <span className="text-xl font-bold text-gray-900">ModernShop</span>
                    </Link>

                    <div className="flex items-center space-x-8">
                        <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium">Shop</Link>
                        <Link to="/cart" className="relative text-gray-700 hover:text-indigo-600">
                            <ShoppingCart className="h-6 w-6" />
                            {cartCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};
