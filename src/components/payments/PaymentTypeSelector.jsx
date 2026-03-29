import React, { useEffect, useState } from 'react';
import { User, Users, SplitSquareHorizontal } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { paymentsService } from '../../services/payments.service';

export default function PaymentTypeSelector({ 
    purchaseType, setPurchaseType, 
    selectedGroupId, setSelectedGroupId,
    multiDestination, setMultiDestination // Optional props for Multi-Account support
}) {
    const { paymentGroups: cartGroups } = useCart();
    const [localGroups, setLocalGroups] = useState(cartGroups || []);

    // Ensure groups are always loaded when switching to group purchase
    useEffect(() => {
        if (purchaseType === 'group') {
            (async () => {
                try {
                    const data = await paymentsService.getMyGroups();
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    setLocalGroups(list);
                } catch (e) {
                    console.error('Failed to load groups natively:', e);
                }
            })();
        }
    }, [purchaseType]);

    // Use Context groups if available, otherwise fallback to local fetch
    const displayGroups = localGroups.length > 0 ? localGroups : (cartGroups || []);

    return (
        <div className="space-y-3 mb-4">
            <label className="text-sm font-bold text-primary block">Purchase Type</label>
            <div className="flex gap-2">
                <button
                    onClick={() => setPurchaseType('individual')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all ${
                        purchaseType === 'individual'
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-500'
                            : 'border-theme text-secondary hover:bg-secondary/20'
                    }`}
                >
                    <User size={16} /> Individual
                </button>
                <button
                    onClick={() => setPurchaseType('group')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium border transition-all ${
                        purchaseType === 'group'
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                            : 'border-theme text-secondary hover:bg-secondary/20'
                    }`}
                >
                    <Users size={16} /> Group Purchase
                </button>
            </div>
            
            {purchaseType === 'group' && (
                <div className="space-y-4 mt-3 animate-in fade-in slide-in-from-top-2 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                    <div>
                        <label className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 block">Select Group to Fund From</label>
                        <select
                            value={selectedGroupId || ''}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full px-4 py-3 bg-elevated border border-theme rounded-xl text-sm text-primary outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">Select a group...</option>
                            {displayGroups.map(g => (
                                <option key={g.id} value={g.id}>{g.name} ({g.member_count || 0} members)</option>
                            ))}
                        </select>
                    </div>

                    {/* Render Multi-Destination Toggle only if parent supports it */}
                    {setMultiDestination !== undefined && (
                        <div>
                            <label className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 block">Delivery Mode</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMultiDestination(false)}
                                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                                        !multiDestination
                                            ? 'bg-blue-500/10 border-blue-500/40 text-blue-500'
                                            : 'border-theme text-secondary hover:bg-secondary/20'
                                    }`}
                                >
                                    Single Common Account
                                </button>
                                <button
                                    onClick={() => setMultiDestination(true)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                                        multiDestination
                                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                                            : 'border-theme text-secondary hover:bg-secondary/20'
                                    }`}
                                >
                                    <SplitSquareHorizontal size={14} /> Multi-Account (Split)
                                </button>
                            </div>
                            {multiDestination && (
                                <p className="text-[11px] text-tertiary mt-2">
                                    Each group member will enter their own delivery account (e.g., phone number) and amount when approving this checkout request.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
