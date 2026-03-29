import React from 'react';
import { Menu, ShoppingCart } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

const Header = ({ onMenuToggle }) => {
    const cart = useCart();
    
    return (
        <header className="md:hidden border-b border-theme p-4 flex justify-between items-center sticky top-0 z-50" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <button
                onClick={onMenuToggle}
                className="p-1 text-secondary hover:text-primary transition-colors"
                aria-label="Open navigation menu"
            >
                <Menu className="w-6 h-6" />
            </button>
            <div className="font-bold text-lg text-primary-600">Qomrade</div>
            <button onClick={() => cart.setCartOpen(true)} className="relative p-1 text-secondary hover:text-primary transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cart.count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {cart.count}
                    </span>
                )}
            </button>
        </header>
    );
};

export default Header;
