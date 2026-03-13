import React, { useState, useEffect } from 'react';
import authService from '../../services/auth.service';
import api from '../../services/api';
import {
    Users, Building, Briefcase, Lock, ChevronDown, ChevronUp,
    Globe, Heart, UserCheck, MessageSquare, Calendar, BookOpen,
    CreditCard, Network, Search, X
} from 'lucide-react';

const VISIBILITY_OPTIONS = [
    {
        id: 'public',
        label: 'Public',
        description: 'Visible to everyone on Qomrade',
        icon: Globe,
        color: 'emerald',
    },
    {
        id: 'followers',
        label: 'Followers Only',
        description: 'Only your followers can see this',
        icon: Heart,
        color: 'pink',
    },
    {
        id: 'custom',
        label: 'Specific Audience',
        description: 'Limit to institutions, organizations, rooms, or users',
        icon: Users,
        color: 'blue',
    },
    {
        id: 'only_me',
        label: 'Only Me',
        description: 'Private — only visible to you',
        icon: Lock,
        color: 'gray',
    },
];

const VisibilitySelector = ({ onChange, initialValue = 'public' }) => {
    const [visibilityType, setVisibilityType] = useState(initialValue === 'private' || initialValue === 'only_me' ? 'only_me' : initialValue);
    const [affiliations, setAffiliations] = useState({ institutions: [], organisations: [] });
    const [selectedEntities, setSelectedEntities] = useState({
        institutions: [],
        organisations: [],
        branches: [],
        rooms: [],
        events: [],
        specializations: [],
        payment_groups: [],
        users: [],
        // Unit-level
        faculties: [],
        departments: [],
        programmes: [],
    });
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState({});

    // Rooms, events, etc.
    const [rooms, setRooms] = useState([]);
    const [events, setEvents] = useState([]);
    const [userSearch, setUserSearch] = useState('');
    const [userResults, setUserResults] = useState([]);
    const [searchingUsers, setSearchingUsers] = useState(false);

    useEffect(() => {
        loadAffiliations();
    }, []);

    useEffect(() => {
        if (visibilityType === 'public' || visibilityType === 'only_me') {
            onChange(visibilityType === 'only_me' ? 'only_me' : 'public');
        } else if (visibilityType === 'followers') {
            onChange('followers');
        } else {
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
            // Load rooms
            try {
                const roomsRes = await api.get('/api/rooms/');
                setRooms(Array.isArray(roomsRes.data) ? roomsRes.data : roomsRes.data?.results || []);
            } catch (e) { /* no rooms */ }

            // Load events
            try {
                const eventsRes = await api.get('/api/events/');
                setEvents(Array.isArray(eventsRes.data) ? eventsRes.data : eventsRes.data?.results || []);
            } catch (e) { /* no events */ }
        } catch (error) {
            console.error("Failed to load affiliations", error);
        } finally {
            setLoading(false);
        }
    };

    const handleEntityToggle = (type, id) => {
        setSelectedEntities(prev => {
            const list = prev[type] || [];
            const newList = list.includes(id)
                ? list.filter(item => item !== id)
                : [...list, id];
            return { ...prev, [type]: newList };
        });
    };

    const toggleSection = (section) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const searchUsers = async (query) => {
        setUserSearch(query);
        if (query.length < 2) {
            setUserResults([]);
            return;
        }
        setSearchingUsers(true);
        try {
            const res = await api.get('/api/auth/users/', { params: { search: query } });
            setUserResults(Array.isArray(res.data) ? res.data.slice(0, 10) : (res.data?.results || []).slice(0, 10));
        } catch (e) {
            setUserResults([]);
        } finally {
            setSearchingUsers(false);
        }
    };

    const addUser = (user) => {
        if (!selectedEntities.users.find(u => u.id === user.id)) {
            setSelectedEntities(prev => ({
                ...prev,
                users: [...prev.users, { id: user.id, name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email }]
            }));
        }
        setUserSearch('');
        setUserResults([]);
    };

    const removeUser = (userId) => {
        setSelectedEntities(prev => ({
            ...prev,
            users: prev.users.filter(u => u.id !== userId)
        }));
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                <div className="h-12 bg-secondary/20 rounded-lg"></div>
                <div className="h-12 bg-secondary/20 rounded-lg"></div>
                <div className="h-12 bg-secondary/20 rounded-lg"></div>
            </div>
        );
    }

    const hasAffiliations = affiliations.institutions?.length > 0 || affiliations.organisations?.length > 0;
    const totalSelected = Object.values(selectedEntities).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

    const SectionHeader = ({ icon: Icon, label, section, count }) => (
        <button
            type="button"
            onClick={() => toggleSection(section)}
            className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/10 transition-colors"
        >
            <div className="flex items-center gap-2">
                <Icon size={14} className="text-secondary" />
                <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{label}</span>
                {count > 0 && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{count}</span>
                )}
            </div>
            {expandedSections[section] ? <ChevronUp size={14} className="text-secondary" /> : <ChevronDown size={14} className="text-secondary" />}
        </button>
    );

    const Checkbox = ({ checked, onChange, label, sublabel }) => (
        <label className="flex items-center gap-3 py-1.5 px-2 rounded-md hover:bg-secondary/5 cursor-pointer transition-colors">
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                checked ? 'bg-primary border-primary' : 'border-gray-400 hover:border-primary/50'
            }`}>
                {checked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            </div>
            <div className="flex-1 min-w-0">
                <span className="text-sm text-primary block truncate">{label}</span>
                {sublabel && <span className="text-xs text-secondary">{sublabel}</span>}
            </div>
        </label>
    );

    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-primary flex items-center gap-2 mb-1">
                <Users size={18} /> Who can see this?
            </h3>

            {/* Main visibility options */}
            <div className="grid grid-cols-2 gap-3">
                {VISIBILITY_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const isSelected = visibilityType === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setVisibilityType(opt.id)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${
                                isSelected
                                    ? `border-${opt.color}-500 bg-${opt.color}-500/10 shadow-sm`
                                    : 'border-theme hover:border-primary/30 bg-secondary/5'
                            }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <div className={`p-1.5 rounded-lg ${isSelected ? `bg-${opt.color}-500/20` : 'bg-secondary/10'}`}>
                                    <Icon size={16} className={isSelected ? `text-${opt.color}-500` : 'text-secondary'} />
                                </div>
                                <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-secondary'}`}>{opt.label}</span>
                            </div>
                            <p className="text-xs text-tertiary ml-9">{opt.description}</p>
                        </button>
                    );
                })}
            </div>

            {/* Custom audience detail panel */}
            {visibilityType === 'custom' && (
                <div className="border border-theme rounded-xl bg-elevated overflow-hidden mt-2">
                    <div className="px-4 py-3 bg-primary/5 border-b border-theme flex items-center justify-between">
                        <span className="text-sm font-medium text-primary">Select Audience</span>
                        {totalSelected > 0 && (
                            <span className="text-xs bg-primary text-white px-2 py-0.5 rounded-full">{totalSelected} selected</span>
                        )}
                    </div>

                    <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                        {/* Specific Users */}
                        <div>
                            <SectionHeader icon={UserCheck} label="Specific Users" section="users" count={selectedEntities.users.length} />
                            {expandedSections.users && (
                                <div className="ml-4 mt-2 space-y-2">
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                                        <input
                                            type="text"
                                            value={userSearch}
                                            onChange={(e) => searchUsers(e.target.value)}
                                            placeholder="Search users by name or email..."
                                            className="w-full pl-9 pr-4 py-2 bg-background border border-theme rounded-lg text-sm text-primary outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                    {searchingUsers && <div className="text-xs text-secondary">Searching...</div>}
                                    {userResults.length > 0 && (
                                        <div className="border border-theme rounded-lg overflow-hidden bg-elevated">
                                            {userResults.map(u => (
                                                <button
                                                    key={u.id}
                                                    type="button"
                                                    onClick={() => addUser(u)}
                                                    className="w-full text-left px-3 py-2 text-sm text-primary hover:bg-secondary/10 border-b border-theme last:border-b-0 flex items-center gap-2"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                                        {(u.first_name || u.email)?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span>{`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {selectedEntities.users.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedEntities.users.map(u => (
                                                <span key={u.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs">
                                                    {u.name}
                                                    <button type="button" onClick={() => removeUser(u.id)} className="hover:opacity-70"><X size={12} /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Institutions */}
                        {affiliations.institutions?.length > 0 && (
                            <div>
                                <SectionHeader icon={Building} label="Institutions" section="institutions" count={selectedEntities.institutions.length} />
                                {expandedSections.institutions && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {affiliations.institutions.map(inst => (
                                            <div key={inst.id}>
                                                <Checkbox
                                                    checked={selectedEntities.institutions.includes(inst.id)}
                                                    onChange={() => handleEntityToggle('institutions', inst.id)}
                                                    label={inst.name}
                                                    sublabel={inst.role || inst.type}
                                                />
                                                {/* Sub-units: faculties, departments, programmes */}
                                                {inst.faculties && inst.faculties.length > 0 && (
                                                    <div className="ml-6 border-l-2 border-theme pl-2">
                                                        {inst.faculties.map(f => (
                                                            <Checkbox
                                                                key={f.id}
                                                                checked={selectedEntities.faculties.includes(f.id)}
                                                                onChange={() => handleEntityToggle('faculties', f.id)}
                                                                label={f.name}
                                                                sublabel="Faculty"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                {inst.departments && inst.departments.length > 0 && (
                                                    <div className="ml-6 border-l-2 border-theme pl-2">
                                                        {inst.departments.map(d => (
                                                            <Checkbox
                                                                key={d.id}
                                                                checked={selectedEntities.departments.includes(d.id)}
                                                                onChange={() => handleEntityToggle('departments', d.id)}
                                                                label={d.name}
                                                                sublabel="Department"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                                {inst.branches && inst.branches.length > 0 && (
                                                    <div className="ml-6 border-l-2 border-theme pl-2">
                                                        {inst.branches.map(b => (
                                                            <Checkbox
                                                                key={b.id}
                                                                checked={selectedEntities.branches.includes(b.id)}
                                                                onChange={() => handleEntityToggle('branches', b.id)}
                                                                label={b.name}
                                                                sublabel="Branch"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Organizations */}
                        {affiliations.organisations?.length > 0 && (
                            <div>
                                <SectionHeader icon={Briefcase} label="Organizations" section="organisations" count={selectedEntities.organisations.length} />
                                {expandedSections.organisations && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {affiliations.organisations.map(org => (
                                            <div key={org.id}>
                                                <Checkbox
                                                    checked={selectedEntities.organisations.includes(org.id)}
                                                    onChange={() => handleEntityToggle('organisations', org.id)}
                                                    label={org.name}
                                                    sublabel={org.role || org.type}
                                                />
                                                {org.branches && org.branches.length > 0 && (
                                                    <div className="ml-6 border-l-2 border-theme pl-2">
                                                        {org.branches.map(b => (
                                                            <Checkbox
                                                                key={b.id}
                                                                checked={selectedEntities.branches.includes(b.id)}
                                                                onChange={() => handleEntityToggle('branches', b.id)}
                                                                label={b.name}
                                                                sublabel="Branch"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Rooms */}
                        {rooms.length > 0 && (
                            <div>
                                <SectionHeader icon={MessageSquare} label="Rooms" section="rooms" count={selectedEntities.rooms.length} />
                                {expandedSections.rooms && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {rooms.map(room => (
                                            <Checkbox
                                                key={room.id}
                                                checked={selectedEntities.rooms.includes(room.id)}
                                                onChange={() => handleEntityToggle('rooms', room.id)}
                                                label={room.name || room.title}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Events */}
                        {events.length > 0 && (
                            <div>
                                <SectionHeader icon={Calendar} label="Events" section="events" count={selectedEntities.events.length} />
                                {expandedSections.events && (
                                    <div className="ml-4 mt-1 space-y-1">
                                        {events.map(event => (
                                            <Checkbox
                                                key={event.id}
                                                checked={selectedEntities.events.includes(event.id)}
                                                onChange={() => handleEntityToggle('events', event.id)}
                                                label={event.title || event.name}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {!hasAffiliations && rooms.length === 0 && events.length === 0 && (
                            <div className="text-center py-6 text-secondary text-sm">
                                <Network className="w-8 h-8 mx-auto mb-2 text-tertiary" />
                                <p>No affiliations found.</p>
                                <p className="text-xs text-tertiary mt-1">Join institutions or organizations to use audience targeting.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default VisibilitySelector;
