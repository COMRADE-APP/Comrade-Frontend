/**
 * InvestModal — Universal invest/donate modal
 * Used across all funding categories (charity, MMF, stocks, bonds, agencies, businesses).
 * 
 * Flow:
 * 1. Check if user has investor profile → if not, show one-time profile form
 * 2. If profile exists → show quick invest form: amount, individual/group, proceed to checkout
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, DollarSign, Users, User, ChevronRight, Shield,
    Loader2, CheckCircle, UserCheck, Edit3
} from 'lucide-react';
import fundingService from '../../services/funding.service';
import { paymentsService } from '../../services/payments.service';
import Button from '../common/Button';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const PRESET_AMOUNTS = [500, 1000, 5000, 10000, 25000];

const InvestModal = ({
    isOpen,
    onClose,
    item,           // { id, name, type, category, min_investment, ... }
    isDonation = false,
    categoryColor = 'from-primary-600 to-indigo-600',
}) => {
    const navigate = useNavigate();

    // Profile state
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [showProfileForm, setShowProfileForm] = useState(false);
    const [profileData, setProfileData] = useState({
        full_name: '', id_number: '', id_type: 'national_id',
        nationality: '', date_of_birth: '', address: '',
        tax_pin: '', source_of_funds: '',
    });
    const [savingProfile, setSavingProfile] = useState(false);

    // Investment state
    const [amount, setAmount] = useState('');
    const [purchaseType, setPurchaseType] = useState('individual');
    const [paymentGroups, setPaymentGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Fetch investor profile on mount
    useEffect(() => {
        if (!isOpen) return;
        (async () => {
            setProfileLoading(true);
            try {
                const p = await fundingService.getInvestorProfile();
                setProfile(p);
                setProfileData({
                    full_name: p.full_name || '',
                    id_number: p.id_number || '',
                    id_type: p.id_type || 'national_id',
                    nationality: p.nationality || '',
                    date_of_birth: p.date_of_birth || '',
                    address: p.address || '',
                    tax_pin: p.tax_pin || '',
                    source_of_funds: p.source_of_funds || '',
                });
            } catch {
                setProfile(null);
                setShowProfileForm(true);
            } finally {
                setProfileLoading(false);
            }
        })();
    }, [isOpen]);

    // Fetch groups when switching to group
    useEffect(() => {
        if (purchaseType === 'group' && paymentGroups.length === 0) {
            (async () => {
                setLoadingGroups(true);
                try {
                    const data = await paymentsService.getMyGroups();
                    const list = Array.isArray(data?.results) ? data.results : Array.isArray(data) ? data : [];
                    setPaymentGroups(list);
                } catch (e) { console.error('Failed to load groups:', e); }
                finally { setLoadingGroups(false); }
            })();
        }
    }, [purchaseType]);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            let result;
            if (profile) {
                result = await fundingService.updateInvestorProfile(profileData);
            } else {
                result = await fundingService.createInvestorProfile(profileData);
            }
            setProfile(result);
            setShowProfileForm(false);
        } catch (err) {
            console.error('Profile save error:', err);
        } finally {
            setSavingProfile(false);
        }
    };

    const handleProceedToCheckout = () => {
        if (!amount || Number(amount) <= 0) return;

        const selectedGroup = purchaseType === 'group'
            ? paymentGroups.find(g => String(g.id) === String(selectedGroupId))
            : null;

        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: item.id,
                    name: isDonation ? `Donation: ${item.name}` : `Investment: ${item.name}`,
                    type: 'funding',
                    price: amount,
                    qty: 1,
                    payload: {
                        target_id: item.id,
                        target_name: item.name,
                        amount: parseFloat(amount),
                        investment_type: isDonation ? 'donation' : (item.investment_type || 'equity'),
                        is_donation: isDonation,
                        category: item.category,
                    }
                }],
                purchaseType,
                selectedGroupId: purchaseType === 'group' ? selectedGroupId : null,
                selectedGroup: selectedGroup || null,
                totalAmount: parseFloat(amount),
            }
        });
        onClose();
    };

    const canProceed = amount && Number(amount) > 0 &&
        (purchaseType === 'individual' || (purchaseType === 'group' && selectedGroupId));

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                    className="bg-elevated rounded-2xl border border-theme w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                >
                    {/* Header */}
                    <div className={`p-6 rounded-t-2xl bg-gradient-to-r ${categoryColor} text-white`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{isDonation ? 'Make a Donation' : 'Invest Now'}</h2>
                                <p className="text-sm opacity-80 mt-1">{item?.name}</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 space-y-5">
                        {/* Loading */}
                        {profileLoading ? (
                            <div className="flex flex-col items-center py-8 gap-3">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <p className="text-secondary text-sm">Loading your investor profile...</p>
                            </div>
                        ) : showProfileForm ? (
                            /* Investor Profile Form */
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <UserCheck className="w-5 h-5" />
                                    <h3 className="font-semibold">{profile ? 'Edit Investor Profile' : 'Set Up Investor Profile'}</h3>
                                </div>
                                <p className="text-xs text-secondary">
                                    {profile ? 'Update your profile below.' : 'This is a one-time setup. Your profile will be reused for all future investments.'}
                                </p>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-secondary mb-1 block">Full Name *</label>
                                        <input type="text" value={profileData.full_name}
                                            onChange={e => setProfileData(p => ({ ...p, full_name: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="John Doe" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-secondary mb-1 block">ID Type</label>
                                        <select value={profileData.id_type}
                                            onChange={e => setProfileData(p => ({ ...p, id_type: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none">
                                            <option value="national_id">National ID</option>
                                            <option value="passport">Passport</option>
                                            <option value="military_id">Military ID</option>
                                            <option value="drivers_license">Driver&apos;s License</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-secondary mb-1 block">ID Number *</label>
                                        <input type="text" value={profileData.id_number}
                                            onChange={e => setProfileData(p => ({ ...p, id_number: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="12345678" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-secondary mb-1 block">Nationality *</label>
                                        <input type="text" value={profileData.nationality}
                                            onChange={e => setProfileData(p => ({ ...p, nationality: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="Kenyan" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-secondary mb-1 block">Date of Birth</label>
                                        <input type="date" value={profileData.date_of_birth}
                                            onChange={e => setProfileData(p => ({ ...p, date_of_birth: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-medium text-secondary mb-1 block">Address</label>
                                        <input type="text" value={profileData.address}
                                            onChange={e => setProfileData(p => ({ ...p, address: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="P.O. Box 1234, Nairobi" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-secondary mb-1 block">Tax PIN</label>
                                        <input type="text" value={profileData.tax_pin}
                                            onChange={e => setProfileData(p => ({ ...p, tax_pin: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="A012345678B" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-secondary mb-1 block">Source of Funds</label>
                                        <input type="text" value={profileData.source_of_funds}
                                            onChange={e => setProfileData(p => ({ ...p, source_of_funds: e.target.value }))}
                                            className="w-full px-3 py-2 border border-theme rounded-lg bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none"
                                            placeholder="Employment" />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    {profile && (
                                        <button onClick={() => setShowProfileForm(false)}
                                            className="flex-1 py-2.5 border border-theme rounded-xl text-secondary text-sm font-medium hover:bg-secondary/5 transition-colors">
                                            Cancel
                                        </button>
                                    )}
                                    <button onClick={handleSaveProfile}
                                        disabled={savingProfile || !profileData.full_name || !profileData.id_number || !profileData.nationality}
                                        className={`flex-1 py-2.5 bg-gradient-to-r ${categoryColor} text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2`}>
                                        {savingProfile ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Profile</>}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Quick Invest Form */
                            <div className="space-y-5">
                                {/* Profile badge */}
                                {profile && (
                                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                                                Profile verified: {profile.full_name}
                                            </span>
                                        </div>
                                        <button onClick={() => setShowProfileForm(true)}
                                            className="text-xs text-green-600 hover:text-green-700 flex items-center gap-1">
                                            <Edit3 className="w-3 h-3" /> Edit
                                        </button>
                                    </div>
                                )}

                                {/* Amount */}
                                <div>
                                    <label className="text-sm font-semibold text-primary mb-2 block flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 text-green-600" />
                                        {isDonation ? 'Donation Amount' : 'Investment Amount'} (USD)
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {PRESET_AMOUNTS.map(amt => (
                                            <button key={amt} onClick={() => setAmount(String(amt))}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${amount === String(amt)
                                                    ? 'bg-primary text-white border-primary'
                                                    : 'border-theme text-secondary hover:bg-secondary/5'
                                                    }`}>
                                                {formatMoneySimple(amt)}
                                            </button>
                                        ))}
                                    </div>
                                    <input type="number" value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="Enter custom amount"
                                        className="w-full px-4 py-3 border border-theme rounded-xl bg-elevated text-primary text-lg font-semibold focus:ring-2 focus:ring-primary outline-none"
                                        min="1" />
                                </div>

                                {/* Individual/Group toggle */}
                                <div>
                                    <label className="text-sm font-semibold text-primary mb-2 block">Payment Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => setPurchaseType('individual')}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${purchaseType === 'individual'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-theme hover:border-primary/30'
                                                }`}>
                                            <User className={`w-5 h-5 mb-1 ${purchaseType === 'individual' ? 'text-primary' : 'text-tertiary'}`} />
                                            <p className="font-medium text-sm text-primary">Individual</p>
                                            <p className="text-xs text-secondary">Pay alone</p>
                                        </button>
                                        <button onClick={() => setPurchaseType('group')}
                                            className={`p-3 rounded-xl border-2 text-left transition-all ${purchaseType === 'group'
                                                ? 'border-primary bg-primary/5'
                                                : 'border-theme hover:border-primary/30'
                                                }`}>
                                            <Users className={`w-5 h-5 mb-1 ${purchaseType === 'group' ? 'text-primary' : 'text-tertiary'}`} />
                                            <p className="font-medium text-sm text-primary">Group</p>
                                            <p className="text-xs text-secondary">Split with group</p>
                                        </button>
                                    </div>

                                    {/* Group selector */}
                                    {purchaseType === 'group' && (
                                        <div className="mt-3">
                                            {loadingGroups ? (
                                                <div className="flex items-center gap-2 text-sm text-secondary py-2">
                                                    <Loader2 className="w-4 h-4 animate-spin" /> Loading groups...
                                                </div>
                                            ) : paymentGroups.length > 0 ? (
                                                <select value={selectedGroupId}
                                                    onChange={e => setSelectedGroupId(e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-theme rounded-xl bg-elevated text-primary text-sm focus:ring-2 focus:ring-primary outline-none">
                                                    <option value="">Select a payment group...</option>
                                                    {paymentGroups.map(g => (
                                                        <option key={g.id} value={g.id}>
                                                            {g.name} ({g.member_count || g.members?.length || '?'} members)
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <p className="text-xs text-secondary py-2">No payment groups found. Create one first.</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Proceed button */}
                                <button onClick={handleProceedToCheckout}
                                    disabled={!canProceed}
                                    className={`w-full py-3.5 bg-gradient-to-r ${categoryColor} text-white rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-base shadow-lg`}>
                                    <ChevronRight className="w-5 h-5" />
                                    Proceed to Checkout — {formatMoneySimple(Number(amount || 0))}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default InvestModal;
