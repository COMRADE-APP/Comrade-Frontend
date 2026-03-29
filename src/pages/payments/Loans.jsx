import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, Shield, Clock, AlertTriangle, CheckCircle,
    ChevronRight, ArrowLeft, Target, Percent, Calculator, Users, FileText,
    Activity, Award, RefreshCw, XCircle, BarChart3, Loader2
} from 'lucide-react';
import { loansService } from '../../services/finservices.service';
import Button from '../../components/common/Button';
import PaymentTypeSelector from '../../components/payments/PaymentTypeSelector';

const Loans = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('marketplace');
    const [products, setProducts] = useState([]);
    const [myLoans, setMyLoans] = useState([]);
    const [creditScore, setCreditScore] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [amount, setAmount] = useState('');
    const [tenure, setTenure] = useState(6);
    const [purpose, setPurpose] = useState('');
    const [applying, setApplying] = useState(false);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingLoans, setLoadingLoans] = useState(true);
    const [loadingScore, setLoadingScore] = useState(true);

    const [purchaseType, setPurchaseType] = useState('individual');
    const [selectedGroupId, setSelectedGroupId] = useState('');

    useEffect(() => {
        loansService.getProducts().then(r => setProducts(r.data?.results || r.data || [])).catch(() => {}).finally(() => setLoadingProducts(false));
        loansService.getMyLoans().then(r => setMyLoans(r.data?.results || r.data || [])).catch(() => {}).finally(() => setLoadingLoans(false));
        loansService.getMyScore().then(r => { if (r.data?.score) setCreditScore(r.data); }).catch(() => {}).finally(() => setLoadingScore(false));
    }, []);

    const scoreColor = creditScore ? (creditScore.score >= 700 ? 'text-emerald-500' : creditScore.score >= 500 ? 'text-amber-500' : 'text-rose-500') : 'text-secondary';
    const monthlyPayment = selectedProduct && amount ? ((parseFloat(amount) * (1 + (parseFloat(selectedProduct.interest_rate) / 100) * tenure)) / tenure).toFixed(2) : 0;
    const totalRepayment = selectedProduct && amount ? (monthlyPayment * tenure).toFixed(2) : 0;

    const handleApply = async () => {
        if (!selectedProduct || !amount) return;
        if (purchaseType === 'group' && !selectedGroupId) return;
        
        setApplying(true);
        try {
            const payload = { loan_product: selectedProduct.id, amount: parseFloat(amount), tenure_months: tenure, purpose };
            if (purchaseType === 'group' && selectedGroupId) {
                payload.group = parseInt(selectedGroupId); // In models it's named 'group'
            }
            await loansService.applyForLoan(payload);
            setSelectedProduct(null); setAmount(''); setTenure(6); setPurpose('');
            setTab('my-loans');
        } catch (e) { console.error(e); }
        finally { setApplying(false); }
    };

    const tabs = [
        { id: 'marketplace', label: 'Loan Products', icon: DollarSign },
        { id: 'credit', label: 'Credit Score', icon: Award },
        { id: 'my-loans', label: 'My Loans', icon: FileText },
    ];

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-primary">Micro-Loans</h1>
                <p className="text-secondary text-sm mt-1">Affordable credit, powered by your platform activity</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {tabs.map(t => (
                    <button key={t.id} onClick={() => { setTab(t.id); setSelectedProduct(null); }}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${tab === t.id ? 'bg-primary-600 text-white shadow-md' : 'bg-elevated border border-theme text-secondary hover:bg-secondary/10'}`}>
                        <t.icon className="w-4 h-4" /> {t.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {/* MARKETPLACE */}
                {tab === 'marketplace' && !selectedProduct && (
                    <motion.div key="market" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {loadingProducts ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                        ) : products.length === 0 ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <DollarSign className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                <h3 className="font-bold text-primary">No Loan Products Available</h3>
                                <p className="text-tertiary text-sm mt-1">Check back soon for new loan products.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {products.map(p => (
                                    <motion.div key={p.id} whileHover={{ y: -4 }} onClick={() => setSelectedProduct(p)}
                                        className="bg-elevated border border-theme rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg hover:border-primary-500 transition-all group">
                                        <div className={`bg-gradient-to-br ${p.color || 'from-blue-500 to-cyan-600'} p-6 text-white flex flex-col justify-between`}>
                                            <div>
                                                <DollarSign className="w-8 h-8 mb-4 opacity-80" />
                                                <h3 className="font-bold text-lg">{p.name}</h3>
                                            </div>
                                            <p className="text-white/80 text-xs mt-2 line-clamp-2">{p.description}</p>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">Interest Rate</span>
                                                <span className="font-bold text-primary">{p.interest_rate}%<span className="text-xs text-tertiary">/mo</span></span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">Range</span>
                                                <span className="font-medium text-primary">KES {parseInt(p.min_amount).toLocaleString()} - {parseInt(p.max_amount).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-secondary">Tenure</span>
                                                <span className="text-primary">{p.min_tenure_months}-{p.max_tenure_months} months</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-tertiary">
                                                {p.requires_guarantor ? <><Users className="w-3.5 h-3.5" /> Guarantor needed</> : <><Shield className="w-3.5 h-3.5 text-emerald-500" /> No guarantor</>}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* APPLICATION FORM */}
                {tab === 'marketplace' && selectedProduct && (
                    <motion.div key="apply" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        <button onClick={() => setSelectedProduct(null)} className="flex items-center text-secondary hover:text-primary text-sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</button>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-elevated border border-theme rounded-2xl p-6 space-y-5">
                                <div className="flex items-center gap-4 pb-4 border-b border-theme">
                                    <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedProduct.color || 'from-blue-500 to-cyan-600'}`}>
                                        <DollarSign className="w-6 h-6 text-white" />
                                    </div>
                                    <div><h3 className="font-bold text-lg text-primary">{selectedProduct.name}</h3><p className="text-xs text-tertiary">{selectedProduct.interest_rate}% monthly interest</p></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Loan Amount (KES)</label>
                                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder={`${parseInt(selectedProduct.min_amount).toLocaleString()} - ${parseInt(selectedProduct.max_amount).toLocaleString()}`}
                                        className="w-full px-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary text-2xl font-bold placeholder:text-tertiary placeholder:text-base focus:ring-2 focus:ring-primary/30 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Repayment Tenure: <span className="text-primary font-bold">{tenure} month{tenure > 1 ? 's' : ''}</span></label>
                                    <input type="range" min={selectedProduct.min_tenure_months} max={selectedProduct.max_tenure_months} value={tenure} onChange={e => setTenure(parseInt(e.target.value))}
                                        className="w-full accent-primary" />
                                    <div className="flex justify-between text-xs text-tertiary"><span>{selectedProduct.min_tenure_months} mo</span><span>{selectedProduct.max_tenure_months} mo</span></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Purpose (optional)</label>
                                    <textarea value={purpose} onChange={e => setPurpose(e.target.value)} rows={2} placeholder="What will you use this loan for?"
                                        className="w-full px-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary placeholder:text-tertiary focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
                                </div>
                                <PaymentTypeSelector purchaseType={purchaseType} setPurchaseType={setPurchaseType} selectedGroupId={selectedGroupId} setSelectedGroupId={setSelectedGroupId} />
                                <Button variant="primary" className="w-full py-3 font-bold text-lg rounded-xl" onClick={handleApply} disabled={!amount || applying || (purchaseType === 'group' && !selectedGroupId)}>
                                    {applying ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : 'Submit Application'}
                                </Button>
                            </div>
                            {/* Calculator */}
                            <div className="bg-elevated border border-theme rounded-2xl p-6 space-y-4 h-fit">
                                <h4 className="font-bold text-primary flex items-center gap-2"><Calculator className="w-5 h-5" /> Loan Calculator</h4>
                                {amount ? (
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm"><span className="text-secondary">Principal</span><span className="font-bold text-primary">KES {parseFloat(amount).toLocaleString()}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-secondary">Interest Rate</span><span className="text-primary">{selectedProduct.interest_rate}% / mo</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-secondary">Processing Fee</span><span className="text-primary">KES {(parseFloat(amount) * parseFloat(selectedProduct.processing_fee) / 100).toLocaleString()}</span></div>
                                        <div className="flex justify-between text-sm"><span className="text-secondary">Tenure</span><span className="text-primary">{tenure} months</span></div>
                                        <div className="border-t border-theme pt-3 space-y-2">
                                            <div className="flex justify-between"><span className="text-secondary text-sm">Monthly Payment</span><span className="font-bold text-lg text-primary">KES {parseFloat(monthlyPayment).toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-secondary text-sm">Total Repayment</span><span className="font-bold text-primary">KES {parseFloat(totalRepayment).toLocaleString()}</span></div>
                                            <div className="flex justify-between"><span className="text-secondary text-sm">Total Interest</span><span className="font-medium text-amber-500">KES {(totalRepayment - parseFloat(amount)).toLocaleString()}</span></div>
                                        </div>
                                    </div>
                                ) : <p className="text-tertiary text-sm text-center py-6">Enter an amount to see calculations</p>}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* CREDIT SCORE */}
                {tab === 'credit' && (
                    <motion.div key="credit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        {loadingScore ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                        ) : !creditScore ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <Award className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                <h3 className="font-bold text-primary">Credit Score Not Yet Computed</h3>
                                <p className="text-tertiary text-sm mt-1">Your score will be calculated based on your platform activity.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="bg-elevated border border-theme rounded-2xl p-8 text-center space-y-6">
                                    <h3 className="font-bold text-primary text-lg">Your Credit Score</h3>
                                    <div className="relative w-40 h-40 mx-auto">
                                        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                                            <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-color, #e5e7eb)" strokeWidth="10" />
                                            <circle cx="60" cy="60" r="50" fill="none" stroke={creditScore.score >= 700 ? '#10b981' : creditScore.score >= 500 ? '#f59e0b' : '#ef4444'}
                                                strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(creditScore.score / 900) * 314} 314`} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className={`text-4xl font-bold ${scoreColor}`}>{creditScore.score}</span>
                                            <span className="text-xs text-tertiary">out of 900</span>
                                        </div>
                                    </div>
                                    <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${creditScore.score >= 700 ? 'bg-emerald-500/15 text-emerald-500' : creditScore.score >= 500 ? 'bg-amber-500/15 text-amber-500' : 'bg-rose-500/15 text-rose-500'}`}>
                                        {creditScore.risk_display || creditScore.risk_level} Risk
                                    </span>
                                </div>
                                <div className="bg-elevated border border-theme rounded-2xl p-6 space-y-4">
                                    <h3 className="font-bold text-primary text-lg">Score Breakdown</h3>
                                    {[
                                        { label: 'Repayment History', score: creditScore.repayment_score, color: 'bg-emerald-500' },
                                        { label: 'Savings Consistency', score: creditScore.savings_score, color: 'bg-blue-500' },
                                        { label: 'Transaction Volume', score: creditScore.transaction_score, color: 'bg-indigo-500' },
                                        { label: 'Group Participation', score: creditScore.group_score, color: 'bg-purple-500' },
                                        { label: 'Platform Tenure', score: creditScore.tenure_score, color: 'bg-amber-500' },
                                    ].map((f, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-sm"><span className="text-secondary">{f.label}</span><span className="font-bold text-primary">{f.score}%</span></div>
                                            <div className="w-full h-2 bg-secondary/10 rounded-full overflow-hidden">
                                                <div className={`h-full ${f.color} rounded-full transition-all duration-700`} style={{ width: `${f.score}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-tertiary mt-4 pt-4 border-t border-theme">Your credit score is computed using your savings patterns, loan repayments, group activity, transaction history, and how long you've been on Qomrade.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* MY LOANS */}
                {tab === 'my-loans' && (
                    <motion.div key="loans" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                        {loadingLoans ? (
                            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-secondary" /></div>
                        ) : myLoans.length === 0 ? (
                            <div className="bg-elevated border border-theme rounded-2xl p-10 text-center">
                                <FileText className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                <h3 className="font-bold text-primary">No Loans Yet</h3>
                                <p className="text-tertiary text-sm mt-1">Browse loan products to get started.</p>
                                <Button variant="primary" className="mt-4 rounded-xl" onClick={() => setTab('marketplace')}>Browse Products</Button>
                            </div>
                        ) : myLoans.map(loan => {
                            const totalDue = loan.repayments?.reduce((sum, r) => sum + parseFloat(r.amount_due), 0) || 0;
                            const totalPaid = loan.repayments?.filter(r => r.status === 'paid').reduce((sum, r) => sum + parseFloat(r.amount_due), 0) || 0;
                            const progress = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
                            
                            return (
                                <div key={loan.id} className="bg-elevated border border-theme rounded-2xl overflow-hidden">
                                    <div className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${loan.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : loan.status === 'repaying' || loan.status === 'disbursed' ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'}`}>
                                                {loan.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-primary">{loan.product_name || loan.loan_product?.name || 'Loan'}</h4>
                                                <p className="text-xs text-tertiary">KES {parseFloat(loan.amount).toLocaleString()} • {loan.tenure_months} months</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${loan.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' : loan.status === 'repaying' || loan.status === 'disbursed' ? 'bg-blue-500/15 text-blue-500' : 'bg-amber-500/15 text-amber-500'}`}>{loan.status}</span>
                                    </div>
                                    
                                    {/* Progress Bar & Repayment Stats */}
                                    {totalDue > 0 && (
                                        <div className="px-6 py-4 bg-secondary/5 border-t border-theme">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-secondary font-medium">Repayment Progress</span>
                                                <span className="font-bold text-primary">{progress.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-secondary/20 rounded-full overflow-hidden mb-3">
                                                <div className={`h-full rounded-full transition-all duration-1000 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progress}%` }} />
                                            </div>
                                            <div className="flex justify-between text-xs sm:text-sm">
                                                <div>
                                                    <p className="text-tertiary mb-0.5">Total Paid</p>
                                                    <p className="font-bold text-emerald-500">KES {totalPaid.toLocaleString()}</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-tertiary mb-0.5">Total Cost (incl. Interest)</p>
                                                    <p className="font-bold text-primary">KES {totalDue.toLocaleString()}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-tertiary mb-0.5">Remaining Balance</p>
                                                    <p className="font-bold text-amber-500">KES {(totalDue - totalPaid).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {loan.repayments?.length > 0 && (
                                        <div className="border-t border-theme divide-y divide-theme">
                                            {loan.repayments.map(r => (
                                                <div key={r.installment_number} className="px-6 py-3 flex items-center justify-between text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {r.status === 'paid' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : r.status === 'due' || r.status === 'overdue' ? <Clock className="w-4 h-4 text-amber-500" /> : <Clock className="w-4 h-4 text-tertiary" />}
                                                        <span className="text-secondary">Installment {r.installment_number}</span>
                                                    </div>
                                                    <span className="text-primary font-medium">KES {parseFloat(r.amount_due).toLocaleString()}</span>
                                                    <span className="text-tertiary text-xs">{r.due_date}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.status === 'paid' ? 'bg-emerald-500/15 text-emerald-500' : r.status === 'due' || r.status === 'overdue' ? 'bg-amber-500/15 text-amber-500' : 'bg-secondary/10 text-tertiary'}`}>{r.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Loans;
