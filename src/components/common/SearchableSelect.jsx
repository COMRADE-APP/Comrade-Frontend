import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = 'Select an option', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);

    const filteredOptions = options.filter(opt => 
        (opt.label || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (opt.searchKey || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <div 
                className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-xl px-4 py-2.5 cursor-pointer hover:border-primary-400 transition-colors"
                onClick={() => { setIsOpen(!isOpen); setSearchTerm(''); }}
            >
                <span className={`text-sm truncate ${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-2 border-b border-gray-100">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500/20"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, i) => (
                                <div
                                    key={i}
                                    className={`flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors ${
                                        value === opt.value ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                        onChange({ target: { name: opt.name || 'field', value: opt.value } });
                                        setIsOpen(false);
                                    }}
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {value === opt.value && <Check size={14} className="text-primary-600 ml-2 shrink-0" />}
                                </div>
                            ))
                        ) : (
                            <div className="px-3 py-4 text-center text-sm text-gray-400">
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSelect;
