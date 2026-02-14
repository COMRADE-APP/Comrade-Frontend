import React from 'react';
import { Search, Filter, ArrowUpDown, X, Grid, List } from 'lucide-react';

const SearchFilterBar = ({
    onSearch,
    searchQuery,
    placeholder = "Search...",
    filters = [],
    activeFilters = {},
    onFilterChange,
    sortOptions = [],
    sortBy,
    onSortChange,
    viewMode,
    onViewModeChange
}) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => onSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            {/* Actions Group */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {/* Filters */}
                {filters.length > 0 && (
                    <div className="flex items-center gap-2 border-r border-gray-200 pr-3 mr-1">
                        <Filter size={18} className="text-gray-400" />
                        {filters.map(filter => (
                            <select
                                key={filter.key}
                                value={activeFilters[filter.key] || 'all'}
                                onChange={(e) => onFilterChange(filter.key, e.target.value)}
                                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                            >
                                <option value="all">{filter.label}</option>
                                {filter.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        ))}
                    </div>
                )}

                {/* Sort */}
                {sortOptions.length > 0 && (
                    <div className="flex items-center gap-2">
                        <ArrowUpDown size={18} className="text-gray-400" />
                        <select
                            value={sortBy}
                            onChange={(e) => onSortChange(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 outline-none"
                        >
                            {sortOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* View Toggle */}
                {onViewModeChange && (
                    <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchFilterBar;
