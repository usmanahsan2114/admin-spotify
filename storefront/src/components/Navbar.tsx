import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, Search, User } from 'lucide-react';
import { useShop } from '../context/ShopContext';

const Navbar = () => {
    const { cart } = useShop();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-secondary-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="text-2xl font-display font-bold text-primary-600">
                            LuxeStore
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link to="/" className="text-secondary-600 hover:text-primary-600 font-medium transition-colors">
                            Home
                        </Link>
                        <Link to="/products" className="text-secondary-600 hover:text-primary-600 font-medium transition-colors">
                            Shop
                        </Link>
                        <Link to="/about" className="text-secondary-600 hover:text-primary-600 font-medium transition-colors">
                            About
                        </Link>
                    </div>

                    {/* Icons */}
                    <div className="hidden md:flex items-center space-x-6">
                        <button className="text-secondary-500 hover:text-primary-600 transition-colors">
                            <Search className="h-5 w-5" />
                        </button>
                        <button className="text-secondary-500 hover:text-primary-600 transition-colors">
                            <User className="h-5 w-5" />
                        </button>
                        <Link to="/cart" className="relative text-secondary-500 hover:text-primary-600 transition-colors">
                            <ShoppingCart className="h-5 w-5" />
                            {cartItemCount > 0 && (
                                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                    {cartItemCount}
                                </span>
                            )}
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-secondary-500 hover:text-primary-600 focus:outline-none"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-t border-secondary-100">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            to="/"
                            className="block px-3 py-2 rounded-md text-base font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Home
                        </Link>
                        <Link
                            to="/products"
                            className="block px-3 py-2 rounded-md text-base font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            Shop
                        </Link>
                        <Link
                            to="/cart"
                            className="block px-3 py-2 rounded-md text-base font-medium text-secondary-700 hover:text-primary-600 hover:bg-secondary-50 flex items-center"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <ShoppingCart className="h-5 w-5 mr-2" />
                            Cart ({cartItemCount})
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
