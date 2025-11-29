import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { ProductCard } from '../components/ProductCard';
import { ArrowRight } from 'lucide-react';

export const Home: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await api.get('/products');
                setProducts(res.data.products || []);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Failed to fetch products');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
    );

    return (
        <div>
            {/* Hero Section */}
            <div className="relative bg-secondary-900 overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1950&q=80"
                        alt="Hero background"
                        className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-secondary-900 via-secondary-900/80 to-transparent"></div>
                </div>
                <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-display font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Elevate Your Lifestyle
                    </h1>
                    <p className="mt-6 text-xl text-secondary-300 max-w-3xl">
                        Discover our curated collection of premium products designed to enhance your everyday life. Quality, style, and innovation in every item.
                    </p>
                    <div className="mt-10">
                        <Link
                            to="/products"
                            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-secondary-900 bg-white hover:bg-secondary-100 transition-colors md:py-4 md:text-lg md:px-10"
                        >
                            Shop Now
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="flex justify-between items-end mb-8">
                    <h2 className="text-3xl font-display font-bold text-secondary-900">Latest Arrivals</h2>
                    <Link to="/products" className="text-primary-600 hover:text-primary-700 font-medium flex items-center">
                        View All <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-8">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
};
