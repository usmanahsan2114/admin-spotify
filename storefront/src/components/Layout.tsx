import React from 'react';
import Navbar from './Navbar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-secondary-50">
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <footer className="bg-white border-t border-secondary-200 mt-auto">
                <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <span className="text-2xl font-display font-bold text-primary-600">LuxeStore</span>
                            <p className="mt-4 text-secondary-500 text-sm max-w-xs">
                                Premium quality products for your lifestyle. Experience the best in class service and curated collections.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-secondary-900 tracking-wider uppercase">Shop</h3>
                            <ul className="mt-4 space-y-4">
                                <li><a href="#" className="text-base text-secondary-500 hover:text-primary-600">New Arrivals</a></li>
                                <li><a href="#" className="text-base text-secondary-500 hover:text-primary-600">Best Sellers</a></li>
                                <li><a href="#" className="text-base text-secondary-500 hover:text-primary-600">Sale</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-secondary-900 tracking-wider uppercase">Support</h3>
                            <ul className="mt-4 space-y-4">
                                <li><a href="#" className="text-base text-secondary-500 hover:text-primary-600">Contact Us</a></li>
                                <li><a href="#" className="text-base text-secondary-500 hover:text-primary-600">FAQs</a></li>
                                <li><a href="#" className="text-base text-secondary-500 hover:text-primary-600">Shipping & Returns</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 border-t border-secondary-200 pt-8 flex justify-between items-center">
                        <p className="text-base text-secondary-400">&copy; 2025 LuxeStore. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
