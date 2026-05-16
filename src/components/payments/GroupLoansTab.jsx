import React, { useState, useEffect } from 'react';
import { Plus, Coins, Landmark, Timer, Percent, ArrowUpRight, X, Info, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Input from '../common/Input';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';
import { useToast } from '../../contexts/ToastContext';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const GroupLoansTab = ({ groupId }) => {
    const toast = useToast();
    const [loans, setLoans] = useState([]);
    const [loanProducts, setLoanProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [step, setStep] = useState(1);
    const totalSteps = 3;
    const [createLoading, setCreateLoading] = useState(false);

    const [formData, setFormData] = useState({
        loan_product: '',
        amount: '',
        tenure_months: 6,
        purpose: '',
    });

    useEffect(() => {
        loadData();
    }, [groupId]);

    const loadData = async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const [loansData, productsData] = await Promise.all([
                paymentsService.getGroupLoans(groupId),
                paymentsService.getLoanProducts()
            ]);
            setLoans(Array.isArray(loansData) ? loansData : (loansData?.results || []));
            const products = Array.isArray(productsData) ? productsData : (productsData?.results || []);
            setLoanProducts(products);
            
            if (products.length > 0) {
                setFormData(prev => ({ ...prev, loan_product: products[0].id }));
            }
        } catch (error) {
            console.error('Error loading loans data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        if (e) e.preventDefault();
        setCreateLoading(true);
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount),
                tenure_months: parseInt(formData.tenure_months),
            };
            await paymentsService.applyForLoan(groupId, payload);
            setShowCreateModal(false);
            resetForm();
            loadData();
            toast.success('Loan application submitted successfully!');
        } catch (error) {
            console.error('Failed to submit loan application:', error);
            toast.error('Failed to submit application. Please check your eligibility.');
        } finally {
            setCreateLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            loan_product: loanProducts[0]?.id || '',
            amount: '',
            tenure_months: 6,
            purpose: '',
        });
        setStep(1);
    };

    if (loading) {
        return <div className="p-8 text-center"><div className="animate-spin h-8 w-8 border-b-2 border-primary mx-auto rounded-full"></div></div>;
    }

    const selectedProduct = loanProducts.find(p => p.id === formData.loan_product);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Credit & Loans</h3>
                    <p className="text-sm text-secondary">Access and manage loans for group projects or individual member support.</p>
                </div>
                <Button variant="primary" className="gap-2 !bg-amber-600 shadow-lg shadow-amber-600/20" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4" /> Apply for Loan
                </Button>
            </div>

            {loans.length === 0 ? (
                <div className="bg-elevated border border-theme rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-4">
                        <Coins className="w-8 h-8 text-amber-500" />
                    </div>
                    <h4 className="text-lg font-bold text-primary mb-2">No Active Loans</h4>
                    <p className="text-secondary max-w-sm mb-6">
                        Need quick capital for a group project? Apply for a loan from our partners or your group's internal fund.
                    </p>
                    <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                        Check Eligibility
                    </Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {loans.map(loan => (
                        <Card key={loan.id} className="border-theme overflow-hidden hover:shadow-md transition-shadow">
                            <div className={`h-1 w-full ${
                                loan.status === 'disbursed' ? 'bg-emerald-500' : 
                                loan.status === 'pending' ? 'bg-amber-500' : 'bg-secondary/20'
                            }`} />
                            <CardBody className="p-4">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 border border-amber-100 dark:border-amber-800">
                                            <Landmark className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-primary">{loan.product_name || 'Group Loan'}</h4>
                                            <p className="text-[10px] text-secondary font-bold uppercase tracking-wider">Applied on {formatDate(loan.created_at)}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 flex-1 md:justify-end px-4">
                                        <div>
                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-0.5">Amount</p>
                                            <p className="text-sm font-bold text-primary">{formatMoneySimple(loan.amount)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-0.5">Interest</p>
                                            <p className="text-sm font-bold text-amber-600">{loan.product_interest}%</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-0.5">Monthly</p>
                                            <p className="text-sm font-bold text-primary">{formatMoneySimple(loan.monthly_payment || 0)}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-tertiary font-bold uppercase mb-0.5">Status</p>
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                                                loan.status === 'disbursed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                loan.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-secondary/10 text-secondary border-transparent'
                                            }`}>
                                                {loan.status}
                                            </span>
                                        </div>
                                    </div>

                                    <Button variant="outline" size="sm" className="gap-2 border-amber-100 text-amber-700 hover:bg-amber-50 font-bold group">
                                        Loan Details <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border-theme">
                        <CardBody className="p-0 overflow-hidden flex flex-col">
                            {/* Modal Header */}
                            <div className="p-6 border-b border-theme bg-gradient-to-r from-amber-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                                            <div className="p-2 bg-amber-500 rounded-lg text-white shadow-lg shadow-amber-500/20">
                                                <Coins className="w-5 h-5" />
                                            </div>
                                            Loan Application
                                        </h2>
                                        <p className="text-xs text-secondary mt-1">Access capital for group ventures or member support.</p>
                                    </div>
                                    <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-secondary" />
                                    </button>
                                </div>

                                {/* Step Indicator */}
                                <div className="flex items-center gap-2">
                                    {[
                                        { id: 1, label: 'Terms' },
                                        { id: 2, label: 'Intent' },
                                        { id: 3, label: 'Review' }
                                    ].map((s) => (
                                        <div key={s.id} className="flex-1 flex flex-col gap-1.5">
                                            <div className={`h-1.5 rounded-full transition-all duration-300 ${step >= s.id ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-secondary/10'}`} />
                                            <span className={`text-[10px] font-bold uppercase tracking-tight ${step === s.id ? 'text-amber-500' : 'text-tertiary'}`}>{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Modal Content */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {step === 1 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <label className="block text-sm font-bold text-secondary mb-3 uppercase tracking-wider text-[10px]">Select Loan Product *</label>
                                            <div className="grid grid-cols-1 gap-3">
                                                {loanProducts.map(product => (
                                                    <label key={product.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                        formData.loan_product === product.id 
                                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' 
                                                        : 'border-theme hover:bg-secondary/5'
                                                    }`}>
                                                        <input type="radio" name="loan_product" value={product.id}
                                                            checked={formData.loan_product === product.id}
                                                            onChange={() => setFormData({ ...formData, loan_product: product.id })}
                                                            className="sr-only"
                                                        />
                                                        <div className={`p-3 rounded-lg ${formData.loan_product === product.id ? 'bg-amber-500 text-white' : 'bg-secondary/10 text-secondary'}`}>
                                                            <Landmark className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-bold text-sm text-primary">{product.name}</p>
                                                            <p className="text-xs text-secondary font-medium">{product.interest_rate}% Annual Interest • {product.max_tenure_months || 24} Months Max</p>
                                                        </div>
                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.loan_product === product.id ? 'border-amber-500 bg-amber-500' : 'border-theme'}`}>
                                                            {formData.loan_product === product.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Input label="Desired Amount (USD) *" type="number" min="1" step="0.01"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    required placeholder="0.00" icon={CreditCard}
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">USD</span>
                                            </div>
                                            <div className="relative">
                                                <Input label="Tenure (Months) *" type="number" min="1" max="60"
                                                    value={formData.tenure_months}
                                                    onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                                                    required icon={Timer}
                                                />
                                                <span className="absolute right-4 bottom-3 text-xs font-bold text-tertiary">MO</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-secondary mb-1.5">Application Narrative / Purpose *</label>
                                            <textarea value={formData.purpose}
                                                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                                rows={6} required placeholder="Why does the group or member need this loan? How will it be repaid?"
                                                className="w-full px-4 py-3 border border-theme bg-elevated text-primary rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm transition-all shadow-sm"
                                            />
                                        </div>

                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-4">
                                            <div className="p-2 bg-amber-500 rounded-lg text-white shrink-0 h-fit">
                                                <Info className="w-4 h-4" />
                                            </div>
                                            <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
                                                <p className="font-bold mb-1">Group Consent Required</p>
                                                <p>Large loan applications may trigger a group vote. Ensure your proposal is clear and realistic to increase chances of approval by fellow members.</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="bg-secondary/5 rounded-2xl border border-theme overflow-hidden shadow-inner p-6 space-y-6">
                                            <div className="flex justify-between items-start border-b border-theme pb-4">
                                                <div>
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">Loan Product</p>
                                                    <h3 className="text-xl font-bold text-primary">{selectedProduct?.name}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest">Amount Requested</p>
                                                    <p className="text-2xl font-black text-amber-600">{formatMoneySimple(formData.amount || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8">
                                                <div>
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1">Interest Rate</p>
                                                    <p className="text-lg font-bold text-primary flex items-center gap-2">
                                                        <Percent className="w-4 h-4 text-amber-500" /> {selectedProduct?.interest_rate}% <span className="text-[10px] text-secondary font-normal">Annual</span>
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-1">Repayment Period</p>
                                                    <p className="text-lg font-bold text-primary flex items-center gap-2">
                                                        <Timer className="w-4 h-4 text-amber-500" /> {formData.tenure_months} Months
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-theme">
                                                <p className="text-[10px] text-tertiary font-bold uppercase tracking-widest mb-2">Statement of Purpose</p>
                                                <p className="text-secondary text-sm leading-relaxed bg-white dark:bg-gray-800 p-4 rounded-xl border border-theme italic shadow-sm min-h-[100px]">
                                                    "{formData.purpose}"
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-3">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed font-medium">
                                                By submitting, you confirm that all information provided is accurate and that you have the authority to apply on behalf of the group if applicable.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 border-t border-theme bg-secondary/5 flex gap-3">
                                {step > 1 ? (
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>Back</Button>
                                ) : (
                                    <Button type="button" variant="outline" className="flex-1" onClick={() => { setShowCreateModal(false); resetForm(); }}>Cancel</Button>
                                )}
                                
                                {step < totalSteps ? (
                                    <Button type="button" variant="primary" className="flex-1 !bg-amber-600 shadow-lg shadow-amber-600/20" onClick={() => setStep(step + 1)} disabled={step === 1 && (!formData.amount || !formData.loan_product)}>
                                        Continue
                                    </Button>
                                ) : (
                                    <Button type="button" variant="primary" className="flex-1 !bg-amber-600 shadow-lg shadow-amber-600/30" onClick={handleCreate} disabled={createLoading || !formData.purpose}>
                                        {createLoading ? 'Submitting...' : 'Submit Application'}
                                    </Button>
                                )}
                            </div>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default GroupLoansTab;
