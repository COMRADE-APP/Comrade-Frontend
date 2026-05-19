import React, { useState } from 'react';
import { Building2, Link2, Users, Search, Plus, ExternalLink, ShieldCheck } from 'lucide-react';
import Card, { CardBody } from '../../../components/common/Card';
import Button from '../../../components/common/Button';

const ConnectionsTab = ({ provider }) => {
    const [search, setSearch] = useState('');
    
    // Mock data for the UI since the backend model for connections is a future phase
    const mockConnections = [
        { id: 1, name: 'TechShop Hub', type: 'Shop', status: 'connected', since: '2026-03-15' },
        { id: 2, name: 'Nairobi Tech Ventures', type: 'Venture', status: 'connected', since: '2026-04-01' },
        { id: 3, name: 'DevConf Organizers', type: 'Event Organizer', status: 'pending', since: '2026-05-10' },
    ];

    return (
        <div className="space-y-6">
            {/* Header / Intro */}
            <Card className="border-theme bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent">
                <CardBody className="p-8 md:p-12 text-center max-w-2xl mx-auto">
                    <div className="w-16 h-16 bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-theme">
                        <Link2 size={32} className="text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-4">Ecosystem Connections</h2>
                    <p className="text-secondary mb-8 leading-relaxed">
                        Partner with other businesses, shops, ventures, and event organizers within the Qomrade ecosystem. 
                        Share resources, bundle products, and manage B2B payments seamlessly.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="primary">
                            <Search size={18} className="mr-2" /> Discover Partners
                        </Button>
                        <Button variant="outline">
                            <Plus size={18} className="mr-2" /> Invite a Business
                        </Button>
                    </div>
                </CardBody>
            </Card>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 items-center justify-between">
                <h3 className="font-bold text-primary text-lg">My Connections</h3>
                <div className="relative max-w-xs flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search connections..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-theme bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            </div>

            {/* Connections Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockConnections.map(conn => (
                    <Card key={conn.id} className="border-theme hover:shadow-md transition-shadow">
                        <CardBody className="p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                                        {conn.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-primary text-sm flex items-center gap-1">
                                            {conn.name}
                                            {conn.status === 'connected' && <ShieldCheck size={14} className="text-emerald-500" />}
                                        </h4>
                                        <p className="text-xs text-secondary">{conn.type}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-6">
                                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                                    conn.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {conn.status}
                                </span>
                                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                    Manage <ExternalLink size={14} />
                                </button>
                            </div>
                        </CardBody>
                    </Card>
                ))}
            </div>
            
            <p className="text-center text-xs text-secondary mt-8 italic">
                Note: Full B2B connection management and automated commission splitting between partnered providers is arriving in the next platform update.
            </p>
        </div>
    );
};

export default ConnectionsTab;
