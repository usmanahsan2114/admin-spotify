import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { useShop } from '../context/ShopContext';

interface ProductCardProps {
    product: any;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
    const { addToCart } = useShop();

    return (
        <div className="group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-secondary-100">
            <div className="aspect-square w-full overflow-hidden bg-secondary-100 relative">
                <img
                    src={product.imageUrl || 'https://via.placeholder.com/400'}
                    alt={product.name}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Quick Add Button (Visible on Hover) */}
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        addToCart(product, 1);
                    }}
                    className="absolute bottom-4 right-4 bg-white text-primary-600 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-primary-600 hover:text-white"
                    title="Add to Cart"
                >
                    <ShoppingCart className="h-5 w-5" />
                </button>
            </div>

            <div className="p-5">
                <div className="mb-2">
                    <p className="text-xs font-medium text-primary-600 uppercase tracking-wider">{product.category}</p>
                </div>
                <h3 className="text-lg font-display font-semibold text-secondary-900 mb-1 truncate">
                    <Link to={`/products/${product.id}`}>
                        <span aria-hidden="true" className="absolute inset-0" />
                        {product.name}
                    </Link>
                </h3>
                <div className="flex justify-between items-end mt-4">
                    <p className="text-xl font-bold text-secondary-900">PKR {product.price}</p>
                </div>
            </div>
        </div>
    );
};
