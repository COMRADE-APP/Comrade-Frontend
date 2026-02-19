import React, { useState, useEffect } from 'react';
import authService from '../../services/auth.service';
import { Users, Building, Briefcase, Lock, ChevronDown, ChevronUp, Check } from 'lucide-react';

const VisibilitySelector = ({ onChange, initialValue = 'public' }) => {
    const [visibilityType, setVisibilityType] = useState(initialValue); // 'public', 'private', 'custom'
    const [affiliations, setAffiliations] = useState({ institutions: [], organisations: [] });
    const [selectedEntities, setSelectedEntities] = useState({
        institutions: [],
        organisations: [],
        branches: [] // Store IDs of selected branches
    });
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        loadAffiliations();
    }, []);

    useEffect(() => {
        // Propagate changes to parent
        if (visibilityType === 'public' || visibilityType === 'private') {
            onChange(visibilityType);
        } else {
            // Construct complex object for 'custom'
            onChange({
                type: 'custom',
                settings: selectedEntities
            });
        }
    }, [visibilityType, selectedEntities]);

    const loadAffiliations = async () => {
        try {
            const user = await authService.getCurrentUser();
            if (user && user.affiliations) {
                setAffiliations(user.affiliations);
            }
        } catch (error) {
            console.error("Failed to load affiliations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEntityToggle = (type, id) => {
        setSelectedEntities(prev => {
            const list = prev[type];
            const newList = list.includes(id)
                ? list.filter(item => item !== id)
                : [...list, id];
            return { ...prev, [type]: newList };
        });
    };

    const handleBranchToggle = (branchId) => {
        setSelectedEntities(prev => {
            const list = prev.branches;
            const newList = list.includes(branchId)
                ? list.filter(item => item !== branchId)
                : [...list, branchId];
            return { ...prev, branches: newList };
        });
    }

    if (loading) return <div className="animate-pulse h-10 bg-gray-100 rounded"></div>;

    const hasAffiliations = affiliations.institutions.length > 0 || affiliations.organisations.length > 0;

    return (
        <div className="space-y-4 border border-theme rounded-lg p-4 bg-secondary/5">
            <h3 className="font-semibold text-primary flex items-center gap-2">
                <Users size={18} /> Visibility
            </h3>

            <div className="flex flex-col space-y-2">
                {/* Public Option */}
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${visibilityType === 'public' ? 'border-primary bg-primary/5' : 'border-theme hover:border-gray-500/50'}`}>
                    <input
                        type="radio"
                        name="visibility"
                        value="public"
                        checked={visibilityType === 'public'}
                        onChange={() => setVisibilityType('public')}
                        className="w-4 h-4 text-primary"
                    />
                    <div className="ml-3">
                        <span className="block font-medium text-primary">Public</span>
                        <span className="block text-xs text-secondary">Visible to everyone on Qomrade</span>
                    </div>
                </label>

                {/* Specific Audience Option - Only if user has affiliations */}
                {hasAffiliations && (
                    <div className={`rounded-lg border transition-all ${visibilityType === 'custom' ? 'border-primary bg-primary/5' : 'border-theme'}`}>
                        <label className="flex items-center p-3 cursor-pointer">
                            <input
                                type="radio"
                                name="visibility"
                                value="custom"
                                checked={visibilityType === 'custom'}
                                onChange={() => setVisibilityType('custom')}
                                className="w-4 h-4 text-primary"
                            />
                            <div className="ml-3 flex-1">
                                <span className="block font-medium text-primary">Specific Audience</span>
                                <span className="block text-xs text-secondary">Limit to specific institutions or organizations</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => visibilityType === 'custom' && setExpanded(!expanded)}
                                className="text-secondary hover:text-primary"
                            >
                                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                        </label>

                        {/* Expandable Selection Area */}
                        {visibilityType === 'custom' && (
                            <div className="p-3 pt-0 border-t border-theme/50 mt-2">
                                <div className="space-y-4 mt-2">
                                    {/* Institutions */}
                                    {affiliations.institutions.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <Building size={12} /> Institutions
                                            </h4>
                                            <div className="space-y-2 ml-1">
                                                {affiliations.institutions.map(inst => (
                                                    <div key={inst.id} className="space-y-1">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEntities.institutions.includes(inst.id)}
                                                                onChange={() => handleEntityToggle('institutions', inst.id)}
                                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-sm text-primary">{inst.name}</span>
                                                            <span className="text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">{inst.role || inst.type}</span>
                                                        </label>

                                                        {/* Branches */}
                                                        {inst.branches && inst.branches.length > 0 && (
                                                            <div className="ml-6 space-y-1 border-l-2 border-theme pl-2">
                                                                {inst.branches.map(branch => (
                                                                    <label key={branch.id} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedEntities.branches.includes(branch.id)}
                                                                            onChange={() => handleBranchToggle(branch.id)}
                                                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                        />
                                                                        <span className="text-sm text-secondary">{branch.name}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Organisations */}
                                    {affiliations.organisations.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2 flex items-center gap-1">
                                                <Briefcase size={12} /> Organizations
                                            </h4>
                                            <div className="space-y-2 ml-1">
                                                {affiliations.organisations.map(org => (
                                                    <div key={org.id} className="space-y-1">
                                                        <label className="flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedEntities.organisations.includes(org.id)}
                                                                onChange={() => handleEntityToggle('organisations', org.id)}
                                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <span className="text-sm text-primary">{org.name}</span>
                                                            <span className="text-xs bg-secondary/10 text-secondary px-1.5 py-0.5 rounded">{org.role || org.type}</span>
                                                        </label>

                                                        {/* Branches */}
                                                        {org.branches && org.branches.length > 0 && (
                                                            <div className="ml-6 space-y-1 border-l-2 border-theme pl-2">
                                                                {org.branches.map(branch => (
                                                                    <label key={branch.id} className="flex items-center gap-2 cursor-pointer">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={selectedEntities.branches.includes(branch.id)}
                                                                            onChange={() => handleBranchToggle(branch.id)}
                                                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                        />
                                                                        <span className="text-sm text-secondary">{branch.name}</span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Private Option */}
                <label className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${visibilityType === 'private' ? 'border-primary bg-primary/5' : 'border-theme hover:border-gray-500/50'}`}>
                    <input
                        type="radio"
                        name="visibility"
                        value="private"
                        checked={visibilityType === 'private'}
                        onChange={() => setVisibilityType('private')}
                        className="w-4 h-4 text-primary"
                    />
                    <div className="ml-3">
                        <span className="block font-medium text-primary">Private</span>
                        <span className="block text-xs text-secondary">Only visible to you</span>
                    </div>
                </label>
            </div>
        </div>
    );
};

export default VisibilitySelector;
