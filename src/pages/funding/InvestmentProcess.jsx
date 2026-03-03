/**
 * Investment Process Page
 * Multi-step legal, ethical, and verifiable investment contract
 * Works as binding contract between enterprises and users (including donations)
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Shield, FileText, CheckCircle, AlertTriangle, Scale, Users,
    ChevronLeft, ChevronRight, Eye, DollarSign, Lock, UserCheck,
    FileCheck, Landmark, ClipboardCheck, PenTool, BadgeCheck, AlertCircle, Heart
} from 'lucide-react';

const PROCESS_STEPS = [
    { id: 1, label: 'Terms & Conditions', icon: FileText, description: 'Review investment terms' },
    { id: 2, label: 'KYC Verification', icon: UserCheck, description: 'Identity verification' },
    { id: 3, label: 'Risk Disclosure', icon: AlertTriangle, description: 'Understand the risks' },
    { id: 4, label: 'Ethical Compliance', icon: Scale, description: 'Ethical investment standards' },
    { id: 5, label: 'Investment Details', icon: DollarSign, description: 'Set your investment' },
    { id: 6, label: 'Contract Signing', icon: PenTool, description: 'Digitally sign the contract' },
    { id: 7, label: 'Confirmation', icon: BadgeCheck, description: 'Final confirmation' },
];

const InvestmentProcess = () => {
    const { ventureId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [processing, setProcessing] = useState(false);

    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
        riskAcknowledged: false,
        ethicalCompliance: false,
        antiMoneyLaundering: false,
        contractSigned: false,
        finalConfirmation: false,
    });

    const [kycData, setKycData] = useState({
        full_name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : '',
        id_number: '',
        id_type: 'national_id',
        nationality: '',
        date_of_birth: '',
        address: '',
        tax_pin: '',
        source_of_funds: '',
    });

    const [investmentData, setInvestmentData] = useState({
        amount: '',
        currency: 'KES',
        investment_type: 'equity',
        duration_months: '12',
        purpose: '',
        is_donation: false,
    });

    const [signature, setSignature] = useState('');

    const updateKYC = (field, value) => setKycData(prev => ({ ...prev, [field]: value }));
    const updateInvestment = (field, value) => setInvestmentData(prev => ({ ...prev, [field]: value }));
    const toggleAgreement = (key) => setAgreements(prev => ({ ...prev, [key]: !prev[key] }));

    const canProceed = () => {
        switch (currentStep) {
            case 1: return agreements.terms && agreements.privacy;
            case 2: return kycData.full_name && kycData.id_number && kycData.nationality;
            case 3: return agreements.riskAcknowledged;
            case 4: return agreements.ethicalCompliance && agreements.antiMoneyLaundering;
            case 5: return investmentData.amount && parseFloat(investmentData.amount) > 0;
            case 6: return signature.trim() && agreements.contractSigned;
            case 7: return agreements.finalConfirmation;
            default: return false;
        }
    };

    const nextStep = () => {
        if (canProceed()) setCurrentStep(prev => Math.min(prev + 1, 7));
    };
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleFinalSubmit = async () => {
        if (!canProceed()) return;
        setProcessing(true);
        try {
            const { default: fundingService } = await import('../../services/funding.service');
            await fundingService.createRequest({
                target_venture: ventureId,
                amount: parseFloat(investmentData.amount),
                currency: investmentData.currency,
                investment_type: investmentData.investment_type,
                duration_months: parseInt(investmentData.duration_months),
                purpose: investmentData.purpose,
                is_donation: investmentData.is_donation,
                kyc_verified: true,
                terms_accepted: true,
                risk_acknowledged: true,
                ethical_compliance: true,
                digital_signature: signature,
            });
            navigate('/funding', { state: { tab: 'tracking', message: 'Investment submitted successfully!' } });
        } catch (error) {
            console.error('Investment submission failed:', error);
        } finally {
            setProcessing(false);
        }
    };

    const completedSteps = currentStep - 1;
    const progress = (completedSteps / (PROCESS_STEPS.length - 1)) * 100;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-full transition-colors">
                    <ChevronLeft size={24} className="text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Investment Process</h1>
                    <p className="text-secondary text-sm">Secure, legal, and verifiable investment workflow</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-elevated rounded-xl border border-theme p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-primary">Step {currentStep} of {PROCESS_STEPS.length}</span>
                    <span className="text-xs text-secondary">{Math.round(progress)}% complete</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-green-500 transition-all duration-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between mt-3 overflow-x-auto">
                    {PROCESS_STEPS.map((step) => {
                        const StepIcon = step.icon;
                        const isActive = currentStep === step.id;
                        const isDone = currentStep > step.id;
                        return (
                            <div key={step.id} className={`flex flex-col items-center min-w-[60px] ${isActive ? 'text-primary' : isDone ? 'text-green-500' : 'text-tertiary'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${isActive ? 'bg-primary text-white' : isDone ? 'bg-green-500/10' : 'bg-secondary/50'
                                    }`}>
                                    {isDone ? <CheckCircle size={16} /> : <StepIcon size={14} />}
                                </div>
                                <span className="text-[10px] text-center leading-tight hidden sm:block">{step.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Step Content */}
            <Card>
                <CardBody className="p-6 md:p-8">
                    {/* Step 1: Terms & Conditions */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Terms & Conditions</h2>
                                <p className="text-secondary text-sm">Read and accept the investment terms</p>
                            </div>
                            <div className="bg-secondary/20 rounded-xl p-4 max-h-64 overflow-y-auto text-sm text-secondary leading-relaxed border border-theme">
                                <h3 className="font-semibold text-primary mb-2">Investment Agreement Terms</h3>
                                <p className="mb-3">By proceeding with this investment, you acknowledge and agree to the following terms:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>All investments are subject to market risk and regulatory compliance.</li>
                                    <li>The enterprise reserves the right to accept or reject investment proposals.</li>
                                    <li>Returns are not guaranteed and depend on the performance of the underlying asset.</li>
                                    <li>Minimum hold periods may apply depending on the investment type.</li>
                                    <li>All parties agree to dispute resolution through arbitration.</li>
                                    <li>This agreement constitutes a legally binding contract between the investor and the enterprise.</li>
                                    <li>Withdrawal and exit terms are governed by the specific investment vehicle's prospectus.</li>
                                    <li>Both parties agree to comply with all applicable anti-money laundering and counter-terrorism financing regulations.</li>
                                </ul>
                            </div>
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.terms} onChange={() => toggleAgreement('terms')} className="w-5 h-5 rounded accent-primary" />
                                <span className="text-sm text-primary font-medium">I have read and agree to the Terms & Conditions</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.privacy} onChange={() => toggleAgreement('privacy')} className="w-5 h-5 rounded accent-primary" />
                                <span className="text-sm text-primary font-medium">I consent to the processing of my personal data under the Privacy Policy</span>
                            </label>
                        </div>
                    )}

                    {/* Step 2: KYC */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Know Your Customer (KYC)</h2>
                                <p className="text-secondary text-sm">Verify your identity to comply with financial regulations</p>
                            </div>
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3">
                                <Lock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-700 dark:text-blue-300">Your information is encrypted and will only be used for verification purposes.</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div><label className="block text-sm font-medium text-primary mb-1.5">Full Legal Name *</label><Input value={kycData.full_name} onChange={e => updateKYC('full_name', e.target.value)} /></div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">ID Type *</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={kycData.id_type} onChange={e => updateKYC('id_type', e.target.value)}>
                                        <option value="national_id">National ID</option>
                                        <option value="passport">Passport</option>
                                        <option value="driving_license">Driving License</option>
                                    </select>
                                </div>
                                <div><label className="block text-sm font-medium text-primary mb-1.5">ID Number *</label><Input value={kycData.id_number} onChange={e => updateKYC('id_number', e.target.value)} /></div>
                                <div><label className="block text-sm font-medium text-primary mb-1.5">Nationality *</label><Input value={kycData.nationality} onChange={e => updateKYC('nationality', e.target.value)} /></div>
                                <div><label className="block text-sm font-medium text-primary mb-1.5">Date of Birth</label><Input type="date" value={kycData.date_of_birth} onChange={e => updateKYC('date_of_birth', e.target.value)} /></div>
                                <div><label className="block text-sm font-medium text-primary mb-1.5">Tax PIN</label><Input value={kycData.tax_pin} onChange={e => updateKYC('tax_pin', e.target.value)} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-primary mb-1.5">Residential Address</label><Input value={kycData.address} onChange={e => updateKYC('address', e.target.value)} /></div>
                                <div className="md:col-span-2"><label className="block text-sm font-medium text-primary mb-1.5">Source of Funds</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={kycData.source_of_funds} onChange={e => updateKYC('source_of_funds', e.target.value)}>
                                        <option value="">Select source of funds</option>
                                        <option value="salary">Salary / Employment</option>
                                        <option value="business">Business Income</option>
                                        <option value="inheritance">Inheritance</option>
                                        <option value="savings">Savings</option>
                                        <option value="investment_returns">Investment Returns</option>
                                        <option value="gift">Gift / Donation</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Risk Disclosure */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Risk Disclosure</h2>
                                <p className="text-secondary text-sm">Understand the risks before investing</p>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                                <div className="flex gap-3 mb-4">
                                    <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                                    <h3 className="font-semibold text-primary">Important Risk Information</h3>
                                </div>
                                <div className="space-y-3 text-sm text-secondary leading-relaxed">
                                    <p><strong>Market Risk:</strong> Investments can lose value due to market conditions.</p>
                                    <p><strong>Liquidity Risk:</strong> You may not be able to sell your investment when desired.</p>
                                    <p><strong>Credit Risk:</strong> The enterprise may be unable to meet its financial obligations.</p>
                                    <p><strong>Regulatory Risk:</strong> Changes in laws may affect investment returns.</p>
                                    <p><strong>Currency Risk:</strong> Exchange rate fluctuations may impact foreign investments.</p>
                                    <p><strong>Capital Loss:</strong> You may lose all or part of your invested capital.</p>
                                </div>
                            </div>
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.riskAcknowledged} onChange={() => toggleAgreement('riskAcknowledged')} className="w-5 h-5 rounded accent-amber-500" />
                                <span className="text-sm text-primary font-medium">I acknowledge and understand all investment risks described above</span>
                            </label>
                        </div>
                    )}

                    {/* Step 4: Ethical Compliance */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Ethical & Legal Compliance</h2>
                                <p className="text-secondary text-sm">Ensure compliance with ethical investment standards</p>
                            </div>
                            <div className="space-y-4">
                                <div className="bg-elevated rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><Scale size={18} /> Ethical Investment Standards</h3>
                                    <ul className="text-sm text-secondary space-y-2 list-disc pl-5">
                                        <li>The investment does not support activities harmful to human rights or the environment.</li>
                                        <li>All parties commit to transparent reporting and fair dealing.</li>
                                        <li>The enterprise operates under the principles of corporate social responsibility.</li>
                                        <li>No conflict of interest exists that could compromise the integrity of this transaction.</li>
                                    </ul>
                                </div>
                                <div className="bg-elevated rounded-xl p-5 border border-theme">
                                    <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><Shield size={18} /> Anti-Money Laundering (AML)</h3>
                                    <ul className="text-sm text-secondary space-y-2 list-disc pl-5">
                                        <li>I confirm that my funds are legally obtained.</li>
                                        <li>I am not acting on behalf of any sanctioned individual or entity.</li>
                                        <li>I consent to ongoing monitoring of my transactions for compliance.</li>
                                    </ul>
                                </div>
                            </div>
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.ethicalCompliance} onChange={() => toggleAgreement('ethicalCompliance')} className="w-5 h-5 rounded accent-primary" />
                                <span className="text-sm text-primary font-medium">I comply with Ethical Investment Standards</span>
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.antiMoneyLaundering} onChange={() => toggleAgreement('antiMoneyLaundering')} className="w-5 h-5 rounded accent-primary" />
                                <span className="text-sm text-primary font-medium">I confirm AML compliance and that my funds are legally sourced</span>
                            </label>
                        </div>
                    )}

                    {/* Step 5: Investment Details */}
                    {currentStep === 5 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Investment Details</h2>
                                <p className="text-secondary text-sm">Specify your investment amount and terms</p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Investment Amount *</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" size={18} />
                                        <Input type="number" className="pl-10" value={investmentData.amount} onChange={e => updateInvestment('amount', e.target.value)} placeholder="0.00" min="0" step="100" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Currency</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={investmentData.currency} onChange={e => updateInvestment('currency', e.target.value)}>
                                        <option value="KES">KES (Kenya Shilling)</option>
                                        <option value="USD">USD (US Dollar)</option>
                                        <option value="EUR">EUR (Euro)</option>
                                        <option value="GBP">GBP (British Pound)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Type</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={investmentData.investment_type} onChange={e => updateInvestment('investment_type', e.target.value)}>
                                        <option value="equity">Equity Investment</option>
                                        <option value="debt">Debt / Loan</option>
                                        <option value="grant">Grant</option>
                                        <option value="donation">Donation</option>
                                        <option value="convertible_note">Convertible Note</option>
                                        <option value="revenue_share">Revenue Share</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1.5">Duration</label>
                                    <select className="w-full px-4 py-2.5 bg-secondary border border-theme rounded-xl text-primary" value={investmentData.duration_months} onChange={e => updateInvestment('duration_months', e.target.value)}>
                                        <option value="3">3 months</option>
                                        <option value="6">6 months</option>
                                        <option value="12">12 months</option>
                                        <option value="24">24 months</option>
                                        <option value="36">36 months</option>
                                        <option value="60">60 months</option>
                                        <option value="0">Open-ended</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary mb-1.5">Purpose / Notes</label>
                                    <textarea className="w-full px-4 py-3 bg-secondary border border-theme rounded-xl text-primary placeholder-tertiary focus:ring-2 focus:ring-primary-500 outline-none resize-none" rows={3} value={investmentData.purpose} onChange={e => updateInvestment('purpose', e.target.value)} placeholder="Describe the purpose of this investment..." />
                                </div>
                            </div>
                            {investmentData.investment_type === 'donation' && (
                                <div className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-4 flex gap-3">
                                    <Heart className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" fill="currentColor" />
                                    <p className="text-sm text-pink-700 dark:text-pink-300">This is a donation. It will be treated as a non-recoverable contribution to the enterprise's mission.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 6: Contract Signing */}
                    {currentStep === 6 && (
                        <div className="space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-primary mb-1">Digital Contract Signing</h2>
                                <p className="text-secondary text-sm">Sign the investment contract digitally</p>
                            </div>
                            <div className="bg-elevated rounded-xl p-5 border border-theme space-y-4">
                                <h3 className="font-semibold text-primary flex items-center gap-2"><FileCheck size={18} /> Contract Summary</h3>
                                <div className="grid gap-2 text-sm">
                                    <div className="flex justify-between py-2 border-b border-theme"><span className="text-secondary">Investor</span><span className="text-primary font-medium">{kycData.full_name}</span></div>
                                    <div className="flex justify-between py-2 border-b border-theme"><span className="text-secondary">Amount</span><span className="text-primary font-medium">{investmentData.currency} {parseFloat(investmentData.amount || 0).toLocaleString()}</span></div>
                                    <div className="flex justify-between py-2 border-b border-theme"><span className="text-secondary">Type</span><span className="text-primary capitalize">{investmentData.investment_type.replace('_', ' ')}</span></div>
                                    <div className="flex justify-between py-2 border-b border-theme"><span className="text-secondary">Duration</span><span className="text-primary">{investmentData.duration_months === '0' ? 'Open-ended' : `${investmentData.duration_months} months`}</span></div>
                                    <div className="flex justify-between py-2"><span className="text-secondary">Date</span><span className="text-primary">{new Date().toLocaleDateString()}</span></div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-2">
                                    <PenTool className="inline w-4 h-4 mr-1" /> Digital Signature *
                                </label>
                                <p className="text-xs text-secondary mb-2">Type your full legal name to digitally sign this contract</p>
                                <Input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Type your full legal name" className="text-lg italic" />
                                {signature && (
                                    <div className="mt-3 p-4 bg-secondary/20 rounded-xl border border-dashed border-theme text-center">
                                        <p className="text-2xl italic text-primary font-serif">{signature}</p>
                                        <p className="text-xs text-tertiary mt-1">Digital Signature — {new Date().toLocaleString()}</p>
                                    </div>
                                )}
                            </div>

                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.contractSigned} onChange={() => toggleAgreement('contractSigned')} className="w-5 h-5 rounded accent-primary" />
                                <span className="text-sm text-primary font-medium">I digitally sign this contract and confirm all details are accurate</span>
                            </label>
                        </div>
                    )}

                    {/* Step 7: Confirmation */}
                    {currentStep === 7 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-green-500/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                                    <BadgeCheck className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-xl font-bold text-primary mb-1">Ready to Submit</h2>
                                <p className="text-secondary text-sm">Review and confirm your investment submission</p>
                            </div>

                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex gap-3">
                                <ClipboardCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-green-700 dark:text-green-300">All verification steps completed</p>
                                    <p className="text-green-600 dark:text-green-400 mt-0.5">Your investment will be sent to the enterprise for review.</p>
                                </div>
                            </div>

                            <div className="grid gap-3 text-sm">
                                {PROCESS_STEPS.slice(0, -1).map(step => {
                                    const StepIcon = step.icon;
                                    return (
                                        <div key={step.id} className="flex items-center gap-3 p-3 bg-elevated rounded-lg border border-theme">
                                            <CheckCircle size={18} className="text-green-500" />
                                            <StepIcon size={16} className="text-primary" />
                                            <span className="text-primary font-medium">{step.label}</span>
                                            <span className="text-green-600 text-xs ml-auto">Completed</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <label className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-theme hover:bg-secondary/20 cursor-pointer transition-colors">
                                <input type="checkbox" checked={agreements.finalConfirmation} onChange={() => toggleAgreement('finalConfirmation')} className="w-5 h-5 rounded accent-green-500" />
                                <span className="text-sm text-primary font-medium">I confirm this submission is final and understand it cannot be reversed</span>
                            </label>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="ghost" onClick={currentStep === 1 ? () => navigate(-1) : prevStep}>
                    <ChevronLeft size={18} className="mr-1" />
                    {currentStep === 1 ? 'Cancel' : 'Previous'}
                </Button>
                {currentStep < 7 ? (
                    <Button onClick={nextStep} disabled={!canProceed()}>
                        Next <ChevronRight size={18} className="ml-1" />
                    </Button>
                ) : (
                    <Button onClick={handleFinalSubmit} disabled={!canProceed() || processing} className="bg-green-600 hover:bg-green-700 text-white">
                        {processing ? 'Processing...' : 'Submit Investment'}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default InvestmentProcess;
