import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
    Clock, RefreshCw, Zap, Plus, X, Calendar, 
    CreditCard, BellRing, Settings, ShieldCheck, CheckCircle2, Circle,
    ShoppingCart, PiggyBank, Coins, ArrowUpCircle, Search, Filter,
    TrendingUp, Heart, Landmark, Smartphone, BookOpen, ArrowLeft,
    Check, ChevronRight, User, AlertCircle
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { billsService, loansService, insuranceService } from '../../services/finservices.service';
import fundingService from '../../services/funding.service';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { formatMoneySimple } from '../../utils/moneyUtils';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const AUTOMATION_TYPES = [
    { key: 'contribute', label: 'Contribute', icon: Coins, color: 'emerald', desc: 'Auto-contribute to group rounds or kitties' },
    { key: 'save', label: 'Save', icon: PiggyBank, color: 'blue', desc: 'Auto-save to a piggy bank target' },
    { key: 'purchase', label: 'Purchase', icon: ShoppingCart, color: 'purple', desc: 'Auto-purchase products on schedule' },
    { key: 'course', label: 'Courses', icon: BookOpen, color: 'amber', desc: 'Auto-pay for courses and learning paths' },
    { key: 'withdraw', label: 'Withdraw', icon: ArrowUpCircle, color: 'amber', desc: 'Auto-withdraw to your wallet' },
    { key: 'loan_repayment', label: 'Loan Repayment', icon: Landmark, color: 'rose', desc: 'Auto-repay group or subscribed loans' },
    { key: 'insurance', label: 'Insurance', icon: ShieldCheck, color: 'sky', desc: 'Auto-pay insurance premiums' },
    { key: 'bills', label: 'Bills & Airtime', icon: Smartphone, color: 'orange', desc: 'Auto-pay bills, utilities, and airtime' },
    { key: 'investment', label: 'Investment', icon: TrendingUp, color: 'indigo', desc: 'Auto-invest in group or external opportunities' },
    { key: 'donation', label: 'Donation', icon: Heart, color: 'pink', desc: 'Auto-donate to campaigns or charities' },
];

const CreateAutomationPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const toast = useToast();
    
    const isGroup = !!groupId;
    
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState(1);
    const [selectedType, setSelectedType] = useState(isGroup ? 'contribute' : 'save');

    // Target selectors
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [kitties, setKitties] = useState([]);
    const [products, setProducts] = useState([]);
    const [searching, setSearching] = useState(false);
    const [loans, setLoans] = useState([]);
    const [insurancePlans, setInsurancePlans] = useState([]);
    const [bills, setBills] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [existingInvestments, setExistingInvestments] = useState([]);
    const [availableInvestments, setAvailableInvestments] = useState([]);
    const [recommendedInvestments, setRecommendedInvestments] = useState([]);
    const [donations, setDonations] = useState([]);
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedTarget, setSelectedTarget] = useState(null);
    
    // Configuration Form State
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('monthly');
    const [executionDay, setExecutionDay] = useState(1);
    const [startDate, setStartDate] = useState('');
    const [deliveryMode, setDeliveryMode] = useState('pickup');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [keepForLater, setKeepForLater] = useState(false);
    const [withdrawalMode, setWithdrawalMode] = useState('all');

    const filteredTypes = AUTOMATION_TYPES.filter(t => {
        if (!isGroup) {
            // Hide group-exclusive types for individual context
            return t.key !== 'contribute' && t.key !== 'withdraw';
        }
        return true;
    });

    useEffect(() => {
        if (['purchase', 'course'].includes(selectedType)) {
            if (!searchQuery) {
                loadTargets(selectedType);
                return;
            }
            const searchTargets = async () => {
                setSearching(true);
                try {
                    const targetType = selectedType === 'course' ? 'course' : 'all';
                    const res = await paymentsService.searchAutomationTargets(searchQuery, targetType);
                    const merged = [
                        ...(res.products || []),
                        ...(res.services || []),
                        ...(res.courses || []),
                        ...(res.subscriptions || []),
                        ...(res.bookings || [])
                    ];
                    setProducts(merged);
                } catch (error) {
                    console.error("Failed to search targets:", error);
                } finally {
                    setSearching(false);
                }
            };
            
            const handler = setTimeout(() => {
                searchTargets();
            }, 300);
            
            return () => clearTimeout(handler);
        }
    }, [searchQuery, selectedType]);

    const loadTargets = async (type) => {
        try {
            if (type === 'save') {
                if (isGroup) {
                    const data = await paymentsService.getGroupPiggyBanks(groupId);
                    setPiggyBanks(Array.isArray(data) ? data : (data?.results || []));
                } else {
                    const data = await paymentsService.getPiggyBanks();
                    setPiggyBanks(Array.isArray(data) ? data : (data?.results || []));
                }
            } else if (type === 'contribute') {
                if (isGroup) {
                    const data = await paymentsService.getGroupKitties(groupId);
                    setKitties(Array.isArray(data) ? data : (data?.results || []));
                }
            } else if (type === 'purchase') {
                try {
                    const res = await paymentsService.getServiceProducts?.() || [];
                    const list = Array.isArray(res) ? res : (res?.results || []);
                    const mapped = list.map(p => ({
                        ...p,
                        image: p.image_url || p.image,
                        type: p.product_type || p.type || 'product'
                    }));
                    setProducts(mapped);
                } catch { setProducts([]); }
            } else if (type === 'course') {
                try {
                    const res = await paymentsService.searchAutomationTargets('', 'course');
                    setProducts(res.courses || []);
                } catch { setProducts([]); }
            } else if (type === 'loan_repayment') {
                if (isGroup) {
                    const res = await api.get('/api/payments/loans/');
                    setLoans(res.data || []);
                } else {
                    const res = await loansService.getMyLoans();
                    const list = res.data?.results || res.data || (Array.isArray(res) ? res : []);
                    const activeLoans = list.filter(l => ['disbursed', 'repaying'].includes(l.status));
                    setLoans(activeLoans);
                }
            } else if (type === 'insurance') {
                if (isGroup) {
                    const res = await api.get('/api/payments/insurance/');
                    setInsurancePlans(res.data || []);
                } else {
                    const res = await insuranceService.getMyPolicies();
                    const policies = res.data?.results || res.data || (Array.isArray(res) ? res : []);
                    setInsurancePlans(policies.map(p => ({
                        id: p.id,
                        product_name: p.product?.name || p.product_name || 'Insurance Plan',
                        policy_number: p.policy_number,
                        premium_paid: p.premium_paid || p.premium_amount || 0
                    })));
                }
            } else if (type === 'bills') {
                if (isGroup) {
                    setBills([
                        { id: 'airtime', name: 'Airtime Topup', type: 'bill' },
                        { id: 'electricity', name: 'Electricity Bill', type: 'bill' },
                        { id: 'water', name: 'Water Bill', type: 'bill' },
                        { id: 'internet', name: 'Internet Subscription', type: 'bill' },
                    ]);
                } else {
                    const res = await billsService.getMyServiceProviders();
                    const list = res.data?.results || res.data || (Array.isArray(res) ? res : []);
                    setBills(list);
                }
            } else if (type === 'investment') {
                if (isGroup) {
                    const res = await api.get('/api/payments/investments/');
                    setInvestments(res.data || []);
                } else {
                    try {
                        // 1. Existing investments made
                        const historyRes = await fundingService.getInvestmentHistory();
                        setExistingInvestments(historyRes || []);
                        
                        // 2. Available for user to start investing on
                        const opportunitiesRes = await fundingService.getOpportunities();
                        setAvailableInvestments(opportunitiesRes || []);
                        
                        // 3. Recommended investments (personalized top picks)
                        const recommendationsRes = await fundingService.getRecommendedOpportunities();
                        setRecommendedInvestments(recommendationsRes || []);
                    } catch (error) {
                        console.error("Failed to load investments", error);
                    }
                }
            } else if (type === 'donation') {
                if (isGroup) {
                    const res = await api.get('/api/payments/donations/');
                    setDonations(res.data || []);
                } else {
                    try {
                        const res = await paymentsService.getDonations?.() || [];
                        setDonations(Array.isArray(res) ? res : (res?.results || []));
                    } catch {
                        setDonations([]);
                    }
                }
            }
        } catch (e) { console.warn('Could not load targets:', e); }
    };

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const typeParam = queryParams.get('type');
        if (typeParam && AUTOMATION_TYPES.some(t => t.key === typeParam)) {
            setSelectedType(typeParam);
            loadTargets(typeParam);
        } else {
            loadTargets(selectedType);
        }
    }, [groupId]);

    const handleTypeSelect = (type) => {
        setSelectedType(type);
        setSelectedTarget(null);
        setSearchQuery('');
        loadTargets(type);
    };

    const handleNextFromStep3 = (e) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            toast.error("Please specify a valid amount.");
            return;
        }
        setStep(4);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        try {
            if (isGroup) {
                await paymentsService.createGroupAutomation(groupId, {
                    automation_type: selectedType,
                    amount: parseFloat(amount),
                    frequency: frequency,
                    execution_day: parseInt(executionDay, 10),
                    target_id: selectedTarget?.id || null,
                    target_type: selectedTarget?.type || null,
                    is_active: false, // Initially false pending vote/approval
                    start_date: startDate || null,
                    withdrawal_mode: selectedType === 'withdraw' ? withdrawalMode : null,
                    delivery_mode: ['purchase', 'booking'].includes(selectedType) ? deliveryMode : null,
                    delivery_date: ['purchase', 'booking'].includes(selectedType) ? deliveryDate : null,
                    keep_for_later: ['purchase', 'booking'].includes(selectedType) ? keepForLater : false,
                });
                toast.success('Automation rule created and sent for group approval!');
                navigate(`/payments/groups/${groupId}?tab=automations`);
            } else {
                // Personal wallet automation mapping to BillStandingOrder viewset
                let providerId = null;
                if (selectedType === 'bills') {
                    providerId = selectedTarget.id;
                } else {
                    // Create UserServiceProvider dynamically
                    const providerRes = await billsService.addServiceProvider({
                        name: `${selectedType.toUpperCase()}: ${selectedTarget?.name || 'Target'}`,
                        category: 'other',
                        account_number: String(selectedTarget?.id || 'N/A'),
                        destination_account: String(selectedTarget?.id || 'N/A'),
                        destination_type: 'internal_wallet',
                        details: `Automated personal ${selectedType} for ${selectedTarget?.name || 'Target'}`
                    });
                    providerId = providerRes.data?.id || providerRes.id;
                }
                
                await billsService.createStandingOrder({
                    provider: providerId,
                    amount: parseFloat(amount),
                    frequency: frequency === 'fortnight' || frequency === 'daily' ? 'weekly' : frequency,
                    start_date: startDate || new Date().toISOString().split('T')[0]
                });
                toast.success('Smart Standing Order automation active!');
                navigate('/payments?tab=transactions');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.error || 'Failed to create automation rule.');
        } finally {
            setSubmitting(false);
        }
    };

    const getTypeConfig = (type) => AUTOMATION_TYPES.find(t => t.key === type) || AUTOMATION_TYPES[0];

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => {
                            if (step > 1) {
                                setStep(step - 1);
                            } else {
                                if (isGroup) navigate(`/payments/groups/${groupId}?tab=automations`);
                                else navigate('/payments');
                            }
                        }}
                        className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
                            <Zap className="w-6 h-6 text-amber-500" />
                            Create Smart Automation
                        </h1>
                        <p className="text-sm text-secondary mt-1">
                            {step === 1 ? 'Step 1: Choose the type of automation' : 
                             step === 2 ? 'Step 2: Select the target for your automation' : 
                             step === 3 ? 'Step 3: Configure the rule scheduling and amount' :
                             'Step 4: Formal Review & Confirmation'}
                        </p>
                    </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isGroup ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300'
                }`}>
                    {isGroup ? 'Group Wallet Context' : 'Personal Wallet Context'}
                </span>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mb-8 px-2">
                {[1, 2, 3, 4].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                            s < step ? 'bg-emerald-500 text-white' :
                            s === step ? 'bg-primary text-white font-extrabold ring-4 ring-primary/20' :
                            'bg-tertiary/20 text-secondary'
                        }`}>
                            {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                        </div>
                        {s < 4 && (
                            <div className={`flex-1 h-1 transition-colors ${s < step ? 'bg-emerald-500' : 'bg-tertiary/20'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <Card className="border-theme shadow-xl overflow-hidden">
                <CardBody className="p-6 md:p-8">
                    {/* Step 1: Type Selection */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {filteredTypes.map(t => {
                                    const Icon = t.icon;
                                    const isSelected = selectedType === t.key;
                                    return (
                                        <button
                                            key={t.key}
                                            onClick={() => handleTypeSelect(t.key)}
                                            className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                                isSelected
                                                    ? `border-${t.color}-500 bg-${t.color}-50 dark:bg-${t.color}-900/10 shadow-md transform scale-[1.02]`
                                                    : 'border-theme hover:border-primary/30 hover:bg-secondary/5 hover:-translate-y-1'
                                            }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-12 h-12 rounded-xl bg-${t.color}-100 dark:bg-${t.color}-800/30 text-${t.color}-600 flex items-center justify-center flex-shrink-0`}>
                                                    <Icon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-primary">{t.label}</p>
                                                    <p className="text-xs text-secondary mt-1 leading-relaxed">{t.desc}</p>
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="flex justify-end pt-6 border-t border-theme mt-8">
                                <Button variant="primary" className="!bg-emerald-600 px-8 py-2.5 text-base shadow-lg" onClick={() => { setStep(2); loadTargets(selectedType); }}>
                                    Next Step →
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Target Selection */}
                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Search & Filter for Targets */}
                            {['purchase', 'course', 'loan_repayment', 'insurance', 'bills', 'investment', 'donation'].includes(selectedType) && (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary w-5 h-5" />
                                        <input
                                            type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search by name, category, or supplier..." 
                                            className="w-full pl-12 pr-12 py-3.5 border border-theme rounded-2xl bg-elevated text-primary outline-none focus:ring-2 focus:ring-primary shadow-sm transition-shadow"
                                        />
                                        {searching && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                                            </div>
                                        )}
                                    </div>
                                    {selectedType === 'purchase' && (
                                        <select value={filterType} onChange={e => setFilterType(e.target.value)}
                                            className="px-4 py-3.5 border border-theme rounded-2xl bg-elevated text-primary outline-none focus:ring-2 focus:ring-primary shadow-sm">
                                            <option value="all">All Categories</option>
                                            <option value="subscription">Subscriptions</option>
                                            <option value="service">Services</option>
                                            <option value="product">Products</option>
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Target Lists */}
                            <div className="bg-secondary/5 rounded-2xl p-4 min-h-[300px]">
                                {selectedType === 'purchase' || selectedType === 'course' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {products.length === 0 && !searching ? (
                                            <div className="col-span-full py-12 text-center text-secondary">
                                                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No targets found. Try searching for something else.</p>
                                            </div>
                                        ) : products.filter(p => filterType === 'all' || p.type === filterType || p.service_type === filterType).map(p => (
                                            <button key={p.id} onClick={() => setSelectedTarget({ id: p.id, name: p.name, type: p.type || 'product' })}
                                                className={`w-full p-4 rounded-xl border-2 text-left flex gap-4 transition-all ${
                                                    selectedTarget?.id === p.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 shadow-md' : 'border-theme hover:bg-elevated hover:shadow-sm bg-white dark:bg-gray-800'
                                                }`}>
                                                {p.image ? (
                                                    <img src={p.image} alt={p.name} className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border border-theme" />
                                                ) : (
                                                    <div className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center ${
                                                        p.type === 'product' ? 'bg-purple-100 text-purple-600' :
                                                        p.type === 'service' ? 'bg-emerald-100 text-emerald-600' :
                                                        p.type === 'course' || selectedType === 'course' ? 'bg-amber-100 text-amber-600' :
                                                        p.type === 'booking' ? 'bg-sky-100 text-sky-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        {selectedType === 'course' || p.type === 'course' ? <BookOpen className="w-6 h-6" /> :
                                                         p.type === 'product' ? <ShoppingCart className="w-6 h-6" /> :
                                                         p.type === 'service' ? <Zap className="w-6 h-6" /> :
                                                         p.type === 'booking' ? <Calendar className="w-6 h-6" /> :
                                                         <Coins className="w-6 h-6" />}
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                    <div>
                                                        <p className="font-bold text-sm text-primary truncate" title={p.name}>{p.name}</p>
                                                        <p className="text-xs text-secondary truncate mt-0.5">{p.seller || p.provider || 'Platform'}</p>
                                                    </div>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-sm font-black text-primary">{formatMoneySimple(p.price || 0)}</p>
                                                        <div className="flex items-center gap-1 text-xs font-medium text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                                                            <span>★</span>
                                                            <span>{p.rating || '4.5'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : selectedType === 'save' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {piggyBanks.map(pb => (
                                            <button key={pb.id} onClick={() => setSelectedTarget({ id: pb.id, name: pb.name, type: 'piggy_bank' })}
                                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                    selectedTarget?.id === pb.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                }`}>
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center text-blue-600 flex-shrink-0">
                                                    <PiggyBank className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-primary truncate">{pb.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="flex-1 h-1.5 bg-secondary/20 rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 rounded-full" style={{width: `${Math.min(100, (pb.current_amount/pb.target_amount)*100 || 0)}%`}}></div>
                                                        </div>
                                                    </div>
                                                    <p className="text-[10px] text-secondary mt-1 font-medium">{formatMoneySimple(pb.current_amount || 0)} / {formatMoneySimple(pb.target_amount || 0)}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {piggyBanks.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-secondary">
                                                <PiggyBank className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No active piggy banks found.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : selectedType === 'contribute' ? (
                                    <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 max-w-xl mx-auto">
                                        <button onClick={() => setSelectedTarget({ id: null, name: 'Group Pool (Default)', type: 'group' })}
                                            className={`w-full p-5 rounded-2xl border-2 text-left flex items-center gap-4 transition-all ${
                                                selectedTarget?.type === 'group' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                            }`}>
                                            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                                <Coins className="w-7 h-7" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-primary mb-1">Group Pool (Default)</p>
                                                <p className="text-sm text-secondary">Contribute directly to the group balance</p>
                                            </div>
                                        </button>
                                        
                                        {kitties.length > 0 && <div className="text-xs font-bold text-secondary uppercase tracking-wider mt-4 mb-2 pl-2">Available Kitties</div>}
                                        
                                        {kitties.map(k => (
                                            <button key={k.id} onClick={() => setSelectedTarget({ id: k.id, name: k.name, type: 'kitty' })}
                                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                    selectedTarget?.id === k.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                }`}>
                                                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                                                    <Coins className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-bold text-primary">{k.name}</p>
                                                    <p className="text-xs text-secondary mt-1">Balance: <span className="font-medium text-primary">{formatMoneySimple(k.current_amount || k.balance || 0)}</span></p>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : selectedType === 'withdraw' ? (
                                    <div className="max-w-xl mx-auto space-y-6 py-6">
                                        <div className="text-center mb-8">
                                            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-gray-900 shadow-sm">
                                                <ArrowUpCircle className="w-10 h-10 text-amber-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-primary">Configure Withdrawal Target</h3>
                                            <p className="text-secondary mt-2 text-sm">Where should the withdrawn funds go?</p>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {[
                                                { id: 'wallet', title: 'Personal Wallet', desc: 'Withdraw directly to your Comrade wallet' },
                                                { id: 'bank', title: 'Bank Account', desc: 'Transfer to your linked bank account' },
                                                { id: 'mpesa', title: 'Mobile Money', desc: 'Send to your mobile money number' },
                                            ].map(opt => (
                                                <label key={opt.id} className={`flex items-start p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                                                    selectedTarget?.id === opt.id ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                }`}>
                                                    <div className="flex items-center h-5">
                                                        <input 
                                                            type="radio" 
                                                            name="withdrawTarget" 
                                                            checked={selectedTarget?.id === opt.id}
                                                            onChange={() => setSelectedTarget({ id: opt.id, name: opt.title, type: 'withdrawal_method' })}
                                                            className="w-4 h-4 text-amber-600 border-gray-300 focus:ring-amber-500" 
                                                        />
                                                    </div>
                                                    <div className="ml-3">
                                                        <span className="block text-sm font-bold text-primary">{opt.title}</span>
                                                        <span className="block text-xs text-secondary mt-0.5">{opt.desc}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl text-sm text-blue-800 dark:text-blue-200 flex gap-3">
                                            <Settings className="w-5 h-5 flex-shrink-0 text-blue-600 mt-0.5" />
                                            <p>Auto-withdrawals are subject to group rules and may require admin approval or community voting before they activate.</p>
                                        </div>
                                    </div>
                                ) : selectedType === 'loan_repayment' ? (
                                    <>
                                        {loans.length === 0 ? (
                                            <div className="p-8 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 rounded-2xl text-center max-w-md mx-auto my-6">
                                                <Landmark className="w-12 h-12 text-rose-500 mx-auto mb-3 opacity-85" />
                                                <h4 className="font-bold text-rose-900 dark:text-rose-200">No Active Loans Found</h4>
                                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 leading-relaxed">
                                                    There are currently no active or disbursed loans associated with this {isGroup ? 'group' : 'account'} that are eligible for automated repayment schedules.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                                {loans.map(loan => (
                                                    <button key={loan.id} onClick={() => setSelectedTarget({ id: loan.id, name: loan.loan_product_name || `Loan Repayment (#${loan.id.slice(0,6)})`, type: 'loan' })}
                                                        className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                            selectedTarget?.id === loan.id ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                        }`}>
                                                        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-800/30 flex items-center justify-center text-rose-600 flex-shrink-0">
                                                            <Landmark className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-primary truncate">{loan.loan_product_name || 'Loan Repayment'}</p>
                                                            <p className="text-xs text-secondary mt-1">Outstanding: <span className="font-medium text-primary">{formatMoneySimple(loan.outstanding_balance || loan.amount || 0)}</span></p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : selectedType === 'insurance' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {insurancePlans.map(plan => (
                                            <button key={plan.id} onClick={() => setSelectedTarget({ id: plan.id, name: plan.product_name || plan.policy_number, type: 'insurance' })}
                                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                    selectedTarget?.id === plan.id ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                }`}>
                                                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-800/30 flex items-center justify-center text-sky-600 flex-shrink-0">
                                                    <ShieldCheck className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-primary truncate">{plan.product_name || 'Insurance Policy'}</p>
                                                    <p className="text-xs text-secondary truncate mt-0.5">{plan.policy_number}</p>
                                                    <p className="text-[10px] text-secondary mt-1 font-medium">Premium: {formatMoneySimple(plan.premium_paid || plan.premium_amount || 0)}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {insurancePlans.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-secondary">
                                                <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No active insurance policies found.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : selectedType === 'bills' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {bills.map(bill => (
                                            <button key={bill.id} onClick={() => setSelectedTarget({ id: bill.id, name: bill.name, type: 'bill' })}
                                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                    selectedTarget?.id === bill.id ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                }`}>
                                                <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center text-orange-600 flex-shrink-0">
                                                    <Smartphone className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-primary truncate">{bill.name}</p>
                                                    <p className="text-xs text-secondary truncate mt-0.5">{bill.account_number || bill.destination_account || 'Paybill/Utility'}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {bills.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-secondary">
                                                <Smartphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No saved payees or service providers found.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : selectedType === 'investment' ? (
                                    isGroup ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                            {investments.map(inv => (
                                                <button key={inv.id} type="button" onClick={() => setSelectedTarget({ id: inv.id, name: inv.name || inv.title, type: 'investment' })}
                                                    className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                        selectedTarget?.id === inv.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                    }`}>
                                                    <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                                        <TrendingUp className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-primary truncate">{inv.name || inv.title}</p>
                                                        <p className="text-xs text-secondary truncate mt-0.5">{inv.type || 'Opportunity'}</p>
                                                        <p className="text-[10px] text-secondary mt-1 font-medium">Goal: {formatMoneySimple(inv.target_amount || inv.goal || 0)}</p>
                                                    </div>
                                                </button>
                                            ))}
                                            {investments.length === 0 && (
                                                <div className="col-span-full py-8 text-center text-secondary">
                                                    <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p>No active investment pitches found.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-8 pr-2 max-h-[550px] overflow-y-auto">
                                            {/* Section 1: Personalized Recommended Top Picks */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                                    <h4 className="text-sm font-extrabold text-primary uppercase tracking-wider flex items-center gap-2">
                                                        ★ Personalized Recommended Top Picks
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {recommendedInvestments.map(inv => (
                                                        <button key={inv.id} type="button" onClick={() => setSelectedTarget({ id: inv.id, name: inv.title, type: 'investment', price: inv.min_individual_entry })}
                                                            className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                                selectedTarget?.id === inv.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                            }`}>
                                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm animate-pulse">
                                                                <TrendingUp className="w-6 h-6 text-white" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <p className="font-bold text-primary truncate text-sm">{inv.title}</p>
                                                                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded uppercase">{inv.risk_level}</span>
                                                                </div>
                                                                <p className="text-xs text-secondary truncate mt-0.5">{inv.provider}</p>
                                                                <div className="flex items-center justify-between mt-2 text-[10px] font-medium text-secondary">
                                                                    <span>Min: {formatMoneySimple(inv.min_individual_entry || 0)}</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{inv.expected_return}</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {recommendedInvestments.length === 0 && (
                                                        <p className="text-xs text-secondary col-span-full py-4 text-center border border-dashed border-theme rounded-xl">No personalized recommendations yet.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Section 2: Existing Investments Made */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-6 bg-purple-600 rounded-full" />
                                                    <h4 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                                                        Existing Investments Made
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {existingInvestments.map(inv => (
                                                        <button key={inv.id || inv.order_id} type="button" onClick={() => setSelectedTarget({ id: inv.id || inv.order_id, name: inv.name, type: 'investment', price: inv.amount })}
                                                            className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                                selectedTarget?.id === (inv.id || inv.order_id) ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                            }`}>
                                                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-800/30 flex items-center justify-center text-purple-600 flex-shrink-0">
                                                                <Check className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-bold text-primary truncate text-sm">{inv.name}</p>
                                                                <p className="text-xs text-secondary truncate mt-0.5">Invested: {formatMoneySimple(inv.amount || 0)}</p>
                                                                <div className="flex items-center justify-between mt-2 text-[10px] font-bold text-secondary">
                                                                    <span className="uppercase text-purple-600">{inv.type}</span>
                                                                    <span className="text-emerald-600">{inv.status?.toUpperCase()}</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {existingInvestments.length === 0 && (
                                                        <p className="text-xs text-secondary col-span-full py-4 text-center border border-dashed border-theme rounded-xl">No existing investments found.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Section 3: Available To Start Investing On */}
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                                                    <h4 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                                                        Available Opportunities
                                                    </h4>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {availableInvestments.map(inv => (
                                                        <button key={inv.id} type="button" onClick={() => setSelectedTarget({ id: inv.id, name: inv.title, type: 'investment', price: inv.min_individual_entry })}
                                                            className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                                selectedTarget?.id === inv.id ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                            }`}>
                                                            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-800/30 flex items-center justify-center text-emerald-600 flex-shrink-0">
                                                                <Coins className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <p className="font-bold text-primary truncate text-sm">{inv.title}</p>
                                                                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{inv.risk_level}</span>
                                                                </div>
                                                                <p className="text-xs text-secondary truncate mt-0.5">{inv.provider}</p>
                                                                <div className="flex items-center justify-between mt-2 text-[10px] font-medium text-secondary">
                                                                    <span>Min: {formatMoneySimple(inv.min_individual_entry || 0)}</span>
                                                                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{inv.expected_return}</span>
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                    {availableInvestments.length === 0 && (
                                                        <div className="col-span-full py-8 text-center text-secondary">
                                                            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                            <p className="text-xs">No active available opportunities found.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : selectedType === 'donation' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                                        {donations.map(don => (
                                            <button key={don.id} onClick={() => setSelectedTarget({ id: don.id, name: don.name || don.title, type: 'donation' })}
                                                className={`w-full p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all ${
                                                    selectedTarget?.id === don.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10 shadow-md' : 'border-theme hover:bg-elevated bg-white dark:bg-gray-800'
                                                }`}>
                                                <div className="w-12 h-12 rounded-xl bg-pink-100 dark:bg-pink-800/30 flex items-center justify-center text-pink-600 flex-shrink-0">
                                                    <Heart className="w-6 h-6" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-primary truncate">{don.name || don.title}</p>
                                                    <p className="text-xs text-secondary truncate mt-0.5">{don.organizer || 'Charity'}</p>
                                                </div>
                                            </button>
                                        ))}
                                        {donations.length === 0 && (
                                            <div className="col-span-full py-8 text-center text-secondary">
                                                <Heart className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                <p>No active donation campaigns found.</p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="py-12 text-center text-secondary">
                                        <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>Select a target for this automation type.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-theme mt-8">
                                <Button variant="outline" className="px-8 py-2.5 text-base" onClick={() => setStep(1)}>← Back</Button>
                                <Button variant="primary" className={`flex-1 !bg-${getTypeConfig(selectedType).color}-600 py-2.5 text-base shadow-md`} onClick={() => setStep(3)}
                                    disabled={!selectedTarget && selectedType !== 'withdraw' && !['withdraw'].includes(selectedType)}>
                                    Next: Configure Rule →
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Configure Rule */}
                    {step === 3 && (
                        <form onSubmit={handleNextFromStep3} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
                            {/* Summary Banner */}
                            <div className={`p-4 bg-${getTypeConfig(selectedType).color}-50 dark:bg-${getTypeConfig(selectedType).color}-900/10 rounded-2xl border border-${getTypeConfig(selectedType).color}-200 dark:border-${getTypeConfig(selectedType).color}-800 flex items-center gap-4`}>
                                <div className={`w-12 h-12 rounded-xl bg-${getTypeConfig(selectedType).color}-100 text-${getTypeConfig(selectedType).color}-600 flex items-center justify-center flex-shrink-0`}>
                                    {React.createElement(getTypeConfig(selectedType).icon, { className: "w-6 h-6" })}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-0.5">Automation Setup</p>
                                    <p className="text-base font-bold text-primary capitalize flex items-center gap-2">
                                        {selectedType} 
                                        {selectedTarget ? (
                                            <>
                                                <span className="text-secondary">→</span> 
                                                <span>{selectedTarget.name}</span>
                                            </>
                                        ) : ''}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-elevated p-6 rounded-2xl border border-theme space-y-6 shadow-sm">
                                <h3 className="font-bold text-lg text-primary border-b border-theme pb-3">Financial Details</h3>
                                
                                <div>
                                    <Input 
                                        label="Amount per execution *" 
                                        name="amount" 
                                        type="number" 
                                        min="0" 
                                        step="0.01" 
                                        required 
                                        placeholder="0.00" 
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="text-lg font-bold"
                                    />
                                    <p className="text-[11px] text-secondary mt-1.5 ml-1 flex items-center gap-1">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        The exact amount to be processed during each schedule run.
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-bold text-secondary mb-2">Frequency Schedule *</label>
                                        <select 
                                            required 
                                            value={frequency}
                                            onChange={(e) => setFrequency(e.target.value)}
                                            className="w-full px-4 py-3 border border-theme bg-white dark:bg-gray-900 text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm transition-all hover:border-gray-400"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="fortnight">Fortnight (14 days)</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                    
                                    {/* Dynamic fields based on frequency */}
                                    {frequency === 'monthly' && (
                                        <div className="animate-in fade-in duration-300">
                                            <label className="block text-sm font-bold text-secondary mb-2">Day of Month</label>
                                            <select 
                                                value={executionDay}
                                                onChange={(e) => setExecutionDay(e.target.value)}
                                                className="w-full px-4 py-3 border border-theme bg-white dark:bg-gray-900 text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm transition-all hover:border-gray-400"
                                            >
                                                {[...Array(28)].map((_, i) => {
                                                    const num = i + 1;
                                                    const suffix = [1, 21].includes(num) ? 'st' : [2, 22].includes(num) ? 'nd' : [3, 23].includes(num) ? 'rd' : 'th';
                                                    return <option key={num} value={num}>{num}{suffix}</option>;
                                                })}
                                            </select>
                                        </div>
                                    )}
                                    {(frequency === 'weekly' || frequency === 'fortnight') && (
                                        <div className="animate-in fade-in duration-300">
                                            <label className="block text-sm font-bold text-secondary mb-2">Day of Week</label>
                                            <select 
                                                value={executionDay}
                                                onChange={(e) => setExecutionDay(e.target.value)}
                                                className="w-full px-4 py-3 border border-theme bg-white dark:bg-gray-900 text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm transition-all hover:border-gray-400"
                                            >
                                                <option value="1">Monday</option>
                                                <option value="2">Tuesday</option>
                                                <option value="3">Wednesday</option>
                                                <option value="4">Thursday</option>
                                                <option value="5">Friday</option>
                                                <option value="6">Saturday</option>
                                                <option value="7">Sunday</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <Input 
                                        label="Start Date (Optional)" 
                                        type="date" 
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                    <p className="text-[11px] text-secondary mt-1.5 ml-1">Leave blank to start immediately upon approval.</p>
                                </div>
                            </div>
                            
                            {/* Delivery / Booking Fields */}
                            {['purchase', 'booking'].includes(selectedType) && (
                                <div className="bg-elevated p-6 rounded-2xl border border-theme space-y-6 shadow-sm">
                                    <h3 className="font-bold text-lg text-primary border-b border-theme pb-3">Delivery & Logistics</h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-sm font-bold text-secondary mb-2">Fulfillment Method</label>
                                            <select 
                                                value={deliveryMode}
                                                onChange={e => setDeliveryMode(e.target.value)}
                                                className="w-full px-4 py-3 border border-theme bg-white dark:bg-gray-900 text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm"
                                            >
                                                <option value="pickup">Store Pickup</option>
                                                <option value="delivery">Home Delivery</option>
                                                <option value="digital">Digital / Email</option>
                                            </select>
                                        </div>
                                        
                                        <div>
                                            <Input 
                                                label="Specific Delivery Date" 
                                                type="date" 
                                                value={deliveryDate}
                                                onChange={e => setDeliveryDate(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <label className="flex items-center gap-3 p-4 border border-theme rounded-xl cursor-pointer hover:bg-secondary/5 transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={keepForLater}
                                            onChange={e => setKeepForLater(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer" 
                                        />
                                        <div>
                                            <span className="block text-sm font-bold text-primary">Hold Order Until Specified Date</span>
                                            <span className="block text-xs text-secondary mt-0.5">Keep the order pending and deliver only on the exact date specified above.</span>
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* Withdrawal Mode UI */}
                            {selectedType === 'withdraw' && (
                                <div className="bg-elevated p-6 rounded-2xl border border-theme space-y-6 shadow-sm">
                                    <h3 className="font-bold text-lg text-primary border-b border-theme pb-3">Distribution Rules</h3>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-secondary mb-2">How should funds be distributed?</label>
                                        <select 
                                            value={withdrawalMode}
                                            onChange={e => setWithdrawalMode(e.target.value)}
                                            className="w-full px-4 py-3 border border-theme bg-white dark:bg-gray-900 text-primary rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium shadow-sm"
                                        >
                                            <option value="all">Split equally among all members</option>
                                            <option value="sequential">Rotate sequentially (Merry-go-round)</option>
                                            <option value="selected">Send to specific selected members</option>
                                        </select>
                                    </div>
                                    
                                    {withdrawalMode === 'sequential' && (
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                                            <p className="text-sm text-amber-800 dark:text-amber-200">
                                                <strong>Sequential Rotation:</strong> Each execution will send the full amount to the next member in the sequence. You will define the sequence order after the rule is approved.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info Banners */}
                            <div className="space-y-3">
                                {isGroup && (
                                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 flex gap-3 shadow-sm">
                                        <BellRing className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <div className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                                            <strong>Group Approval Required:</strong> All new automations are subject to a group vote. Once the required approval threshold is reached, the automation will be activated.
                                        </div>
                                    </div>
                                )}

                                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800 flex gap-3 shadow-sm">
                                    <RefreshCw className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                        <strong>How it works:</strong> Your wallet will be automatically {selectedType === 'withdraw' ? 'credited' : 'debited'} based on this schedule. If your wallet balance is insufficient, the system will pause the automation.
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-theme sticky bottom-4 bg-background p-4 rounded-xl shadow-lg z-10">
                                <Button type="button" variant="outline" className="px-8 py-3 text-base font-bold bg-white dark:bg-gray-800" onClick={() => setStep(2)}>← Back</Button>
                                <Button type="submit" variant="primary" className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 py-3 text-base font-bold shadow-md">
                                    Review & Confirm →
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Step 4: Formal Review & Confirmation */}
                    {step === 4 && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto">
                            <div className="text-center pb-4 border-b border-theme">
                                <ShieldCheck className="w-16 h-16 text-emerald-500 mx-auto mb-2 animate-bounce-slow" />
                                <h3 className="text-2xl font-black text-primary">Formal Automation Review</h3>
                                <p className="text-sm text-secondary mt-1">Please review all rules carefully before persisting the automation.</p>
                            </div>

                            {/* Summary Detail Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-secondary/5 rounded-2xl p-5 border border-theme space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">AUTOMATION TYPE</span>
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-bold bg-primary text-white">
                                            {React.createElement(getTypeConfig(selectedType).icon, { className: "w-4 h-4" })}
                                            {getTypeConfig(selectedType).label}
                                        </span>
                                    </div>

                                    <div>
                                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">TARGET VALUE</span>
                                        <p className="font-black text-base text-primary">{selectedTarget?.name || 'Group Pool'}</p>
                                        <p className="text-xs text-secondary mt-0.5 capitalize">ID: {selectedTarget?.id || 'default'} &bull; Type: {selectedTarget?.type || 'payment_group'}</p>
                                    </div>

                                    <div>
                                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">CONTEXT PROFILE</span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                            isGroup ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                                        }`}>
                                            {isGroup ? <Users className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                                            {isGroup ? 'Group Chama Wallet' : 'Personal Wallet'}
                                        </span>
                                    </div>
                                </div>

                                <div className="bg-secondary/5 rounded-2xl p-5 border border-theme space-y-4">
                                    <div>
                                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">TRANSFER QUANTITY</span>
                                        <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                            {formatMoneySimple(parseFloat(amount))}
                                        </p>
                                        <p className="text-xs text-secondary mt-1">Deducted per execution cycle</p>
                                    </div>

                                    <div>
                                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">SCHEDULE FREQUENCY</span>
                                        <p className="font-bold text-sm text-primary capitalize flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-emerald-500" />
                                            {frequency}
                                        </p>
                                        <p className="text-xs text-secondary mt-0.5">
                                            {frequency === 'monthly' ? `Runs on the ${executionDay} day of each month` :
                                             (frequency === 'weekly' || frequency === 'fortnight') ? `Runs every ${executionDay === 1 ? 'Monday' : executionDay === 2 ? 'Tuesday' : executionDay === 3 ? 'Wednesday' : executionDay === 4 ? 'Thursday' : executionDay === 5 ? 'Friday' : executionDay === 6 ? 'Saturday' : 'Sunday'}` :
                                             'Runs daily'}
                                        </p>
                                    </div>

                                    <div>
                                        <span className="text-xs font-bold text-secondary uppercase tracking-widest block mb-1">EFFECTIVE START DATE</span>
                                        <p className="font-bold text-sm text-primary flex items-center gap-1.5">
                                            <Calendar className="w-4 h-4 text-blue-500" />
                                            {startDate || 'Starts Immediately'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Checklist */}
                            <div className="bg-amber-500/5 rounded-2xl p-5 border border-amber-500/20 space-y-3">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-bold text-sm text-primary">Important Agreement Terms</h4>
                                        <ul className="text-xs text-secondary mt-2 space-y-1.5 list-disc list-inside leading-relaxed">
                                            <li>You are authorizing recurring automated debits for this rule.</li>
                                            {isGroup ? (
                                                <li>This rule requires consensus approvals from group members.</li>
                                            ) : (
                                                <li>This personal order is active instantly and will trigger on due dates.</li>
                                            )}
                                            <li>Deductions rely on sufficient Comrade balances. If balance is too low, scheduling fails.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 pt-6 border-t border-theme sticky bottom-4 bg-background p-4 rounded-xl shadow-lg z-10">
                                <Button type="button" variant="outline" className="px-8 py-3 text-base font-bold bg-white dark:bg-gray-800" onClick={() => setStep(3)}>← Back</Button>
                                <Button type="button" variant="primary" className="flex-1 !bg-emerald-600 hover:!bg-emerald-700 py-3 text-base font-bold shadow-md flex items-center justify-center gap-2" 
                                    onClick={handleConfirmSubmit} disabled={submitting}>
                                    {submitting ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Creating Rules...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5" />
                                            Confirm & Create Rule
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default CreateAutomationPage;
