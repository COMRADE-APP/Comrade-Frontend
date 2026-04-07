import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Upload, CheckCircle, Briefcase, FileText, ArrowLeft, 
    ChevronRight, MapPin, Mail, Phone, Lock, 
    AlertCircle, Check, Building2, Banknote
} from 'lucide-react';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';
import SearchableSelect from '../../components/common/SearchableSelect';

// Define Country and City data locally or from a lib (mocked for this example)
const COUNTRIES = [
    { value: 'US', label: 'United States', code: '+1' },
    { value: 'KE', label: 'Kenya', code: '+254' },
    { value: 'GB', label: 'United Kingdom', code: '+44' },
    { value: 'CA', label: 'Canada', code: '+1' },
    { value: 'ZA', label: 'South Africa', code: '+27' },
];

const CITIES = [
    { value: 'Nairobi', label: 'Nairobi', searchKey: 'Kenya Nairobi' },
    { value: 'Mombasa', label: 'Mombasa', searchKey: 'Kenya Mombasa' },
    { value: 'New York', label: 'New York', searchKey: 'US USA New York' },
    { value: 'London', label: 'London', searchKey: 'UK England London' },
    { value: 'Toronto', label: 'Toronto', searchKey: 'Canada Toronto' },
    { value: 'Cape Town', label: 'Cape Town', searchKey: 'South Africa Cape Town' }
];

const STAGES = [
    { value: 'idea', label: 'Idea Phase', desc: 'Just starting out' },
    { value: 'mvp', label: 'MVP', desc: 'Prototype or early product' },
    { value: 'pre_seed', label: 'Pre-Seed', desc: 'Early revenue or traction' },
    { value: 'growth', label: 'Growth', desc: 'Scaling and expanding' },
];

const CreateBusiness = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Form States
    const [formData, setFormData] = useState({
        name: '', industry: 'tech', stage: 'idea', description: '', website: '', valuation: '',
        contact_email: '', country: '', city: '', country_code: '+254', phone_number: '',
    });
    const [portalPassword, setPortalPassword] = useState('');
    const [businessId, setBusinessId] = useState(null);
    const [documents, setDocuments] = useState([]);
    
    // Funding Destination State
    const [fundingConfig, setFundingConfig] = useState({
        primary_destination: 'kitty', // kitty, piggy, group, donation
        primary_percentage: 100,
        secondary_destination: '',
        secondary_percentage: 0,
    });
    
    // Validation States
    const [emailValid, setEmailValid] = useState(null); // null, true, false

    useEffect(() => {
        // Simple email regex validation
        if (formData.contact_email) {
            const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email);
            setEmailValid(isValid);
        } else {
            setEmailValid(null);
        }
    }, [formData.contact_email]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSearchableChange = (name, val) => {
        setFormData(prev => {
            const next = { ...prev, [name]: val };
            if (name === 'country') {
                const c = COUNTRIES.find(x => x.value === val);
                if (c) next.country_code = c.code;
            }
            return next;
        });
    };

    const handleCreateBusiness = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await fundingService.createBusiness(formData);
            setBusinessId(result.id);
            setStep(3); // Move to Document Upload
        } catch (error) {
            console.error("Failed to create business:", error);
            alert("Failed to create business. Please check details.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('business', businessId);
        uploadData.append('file', file);
        uploadData.append('title', file.name);
        uploadData.append('doc_type', type);

        try {
            const result = await fundingService.uploadDocument(uploadData);
            setDocuments([...documents, result]);
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Document upload failed.");
        }
    };

    const handleSetupFunding = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (businessId) {
                await fundingService.setupFundingDestination(businessId, fundingConfig);
            }
            setStep(5);
        } catch (error) {
            console.error("Funding setup failed:", error);
            alert("Failed to setup funding destination. You can do this later.");
            setStep(5); // Proceed anyway
        } finally {
            setLoading(false);
        }
    };

    const handleSetupPortal = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fundingService.setupBusinessPortal(businessId, portalPassword);
            navigate('/funding');
        } catch (error) {
            console.error("Portal setup failed:", error);
            alert("Failed to setup portal password.");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { num: 1, title: 'Basics', icon: Building2 },
        { num: 2, title: 'Contact', icon: MapPin },
        { num: 3, title: 'Docs', icon: FileText },
        { num: 4, title: 'Funding', icon: Banknote },
        { num: 5, title: 'Account', icon: Lock }
    ];

    return (
        <div className="min-h-screen bg-background flex flex-col py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl w-full mx-auto">
                <button onClick={() => navigate('/funding')} className="group flex items-center text-sm font-medium text-secondary hover:text-primary mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
                    Back to Funding Hub
                </button>

                {/* Progress Stepper - Numbered with Checkmarks */}
                <div className="mb-10 px-4">
                    <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary/20 rounded-full z-0 overflow-hidden">
                            <div className="h-full bg-primary-600 transition-all duration-500 ease-out" style={{ width: `${((step - 1) / 4) * 100}%` }} />
                        </div>
                        {steps.map((s, i) => (
                            <div key={i} className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-300 ${step >= s.num ? 'text-primary-600' : 'text-tertiary opacity-60'}`}>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-background transition-colors duration-500 ${step > s.num ? 'bg-primary-600 text-white' : step === s.num ? 'bg-elevated border-primary-200 shadow-md text-primary-600' : 'bg-secondary/20 text-tertiary'}`}>
                                    {step > s.num ? <Check size={18} strokeWidth={3} /> : <span className="text-sm font-bold">{s.num}</span>}
                                </div>
                                <span className={`absolute -bottom-6 text-xs font-bold tracking-wide ${step >= s.num ? 'text-primary' : 'text-tertiary'}`}>{s.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content Card */}
                <div className="bg-elevated rounded-3xl shadow-xl shadow-black/5 overflow-hidden border border-theme">
                    <div className="md:flex">
                        
                        {/* Left Side / Decorative Panel */}
                        <div className="hidden md:flex flex-col w-1/3 bg-gradient-to-br from-primary-600 to-primary-800 p-8 text-white">
                            <h3 className="text-2xl font-bold mb-2">Create Business Profile</h3>
                            <p className="text-white/70 text-sm mb-8 leading-relaxed">Establish your brand, connect with investors, and access advanced analytics.</p>
                            
                            <div className="mt-auto space-y-6">
                                <div className="flex gap-4 opacity-80">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">1</div>
                                    <div><h4 className="font-semibold text-sm">Professional Display</h4><p className="text-xs text-white/70 mt-1">Look great to investors.</p></div>
                                </div>
                                <div className="flex gap-4 opacity-80">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">2</div>
                                    <div><h4 className="font-semibold text-sm">Account Switching</h4><p className="text-xs text-white/70 mt-1">Manage as the business.</p></div>
                                </div>
                                <div className="flex gap-4 opacity-80">
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">3</div>
                                    <div><h4 className="font-semibold text-sm">Global Reach</h4><p className="text-xs text-white/70 mt-1">Join the comrade network.</p></div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side / Form Container */}
                        <div className="w-full md:w-2/3 p-6 sm:p-10">
                            
                            {/* STEP 1: BASICS */}
                            {step === 1 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-bold text-primary mb-6">Business Basics</h2>
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-secondary mb-1.5">Business Name *</label>
                                            <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-primary" placeholder="e.g. Acme Corp" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-secondary mb-1.5">Industry *</label>
                                                <select name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-primary">
                                                    <option value="tech">Technology</option>
                                                    <option value="agri">Agriculture</option>
                                                    <option value="fin">Finance</option>
                                                    <option value="retail">Retail</option>
                                                    <option value="health">Healthcare</option>
                                                    <option value="educ">Education</option>
                                                    <option value="energy">Energy</option>
                                                    <option value="other">Other</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-secondary mb-1.5">Company Stage *</label>
                                                <select name="stage" value={formData.stage} onChange={handleChange} className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-primary">
                                                    {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-secondary mb-1.5">Description *</label>
                                            <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-primary resize-none" placeholder="What does your business do? Limit to 2-3 sentences." />
                                        </div>
                                        
                                        <div className="pt-4 flex justify-end">
                                            <Button onClick={() => formData.name && formData.description ? setStep(2) : alert("Please fill required fields.")} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20">
                                                Continue <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: CONTACT */}
                            {step === 2 && (
                                <form onSubmit={handleCreateBusiness} className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-2"><MapPin className="text-primary-600" /> Contact Details</h2>
                                    <div className="space-y-6">
                                        
                                        <div>
                                            <label className="block text-sm font-semibold text-secondary mb-1.5">Business Email *</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                    <Mail className="h-4 w-4 text-gray-400" />
                                                </div>
                                                <input 
                                                    type="email" required name="contact_email" value={formData.contact_email} onChange={handleChange} 
                                                    className={`w-full bg-elevated border rounded-xl pl-11 pr-11 py-3 outline-none focus:ring-2 transition-all font-medium text-primary ${
                                                        emailValid === true ? 'border-green-400 focus:ring-green-400/20' : 
                                                        emailValid === false ? 'border-red-400 focus:ring-red-400/20' : 
                                                        'border-theme focus:border-primary-500 focus:ring-primary-500/20'
                                                    }`} 
                                                    placeholder="contact@company.com" 
                                                />
                                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                                    {emailValid === true && <CheckCircle className="h-5 w-5 text-green-500" />}
                                                    {emailValid === false && <AlertCircle className="h-5 w-5 text-red-500" />}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-secondary mb-1.5">Country *</label>
                                                <SearchableSelect 
                                                    options={COUNTRIES.map(c => ({ ...c, name: 'country' }))} 
                                                    value={formData.country} 
                                                    onChange={(e) => handleSearchableChange('country', e.target.value)} 
                                                    placeholder="Search country..." 
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-secondary mb-1.5">City *</label>
                                                <SearchableSelect 
                                                    options={CITIES.map(c => ({ ...c, name: 'city' }))} 
                                                    value={formData.city} 
                                                    onChange={(e) => handleSearchableChange('city', e.target.value)} 
                                                    placeholder="Search city..." 
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-secondary mb-1.5">Phone Number *</label>
                                            <div className="flex bg-elevated border border-theme rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                                                <div className="flex items-center px-4 bg-secondary/10 border-r border-theme text-secondary font-medium text-sm">
                                                    {formData.country_code}
                                                </div>
                                                <input 
                                                    type="tel" required name="phone_number" value={formData.phone_number} onChange={handleChange} 
                                                    className="w-full bg-transparent px-4 py-3 outline-none font-medium text-primary" 
                                                    placeholder="712 345 678" 
                                                />
                                            </div>
                                        </div>

                                        <div className="pt-6 flex items-center justify-between border-t border-theme">
                                            <button type="button" onClick={() => setStep(1)} className="text-secondary hover:text-primary font-medium text-sm">Go Back</button>
                                            <Button type="submit" loading={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20">
                                                Create Business <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* STEP 3: DOCUMENTS */}
                            {step === 3 && (
                                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="text-center mb-8">
                                        <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 mb-4">
                                            <Check className="h-7 w-7 text-green-600" strokeWidth={3} />
                                        </div>
                                        <h2 className="text-2xl font-bold text-primary">Awesome, {formData.name} is Created!</h2>
                                        <p className="mt-2 text-sm text-secondary">Upload initial verification documents to get the verified badge faster.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {['license', 'pitch_deck', 'kpi'].map((type) => {
                                            const typeDocs = documents.filter(d => d.doc_type === type);
                                            const isDone = typeDocs.length > 0;
                                            return (
                                                <div key={type} className={`border rounded-2xl p-4 transition-all ${isDone ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : 'bg-elevated border-theme hover:border-primary-300'}`}>
                                                    <div className="flex justify-between items-center">
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-2.5 rounded-xl ${isDone ? 'bg-green-500 text-white' : 'bg-secondary/10 text-tertiary'}`}>
                                                                {isDone ? <Check size={18} /> : <FileText size={18} />}
                                                            </div>
                                                            <div>
                                                                <h4 className={`font-semibold text-sm capitalize ${isDone ? 'text-green-900 dark:text-green-200' : 'text-primary'}`}>{type.replace('_', ' ')}</h4>
                                                                <p className="text-xs text-tertiary mt-0.5">{isDone ? typeDocs[0].title : 'PDF, DOCX, PNG'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="relative">
                                                            <input type="file" onChange={(e) => handleFileUpload(e, type)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" title="Upload document" />
                                                            <button className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${isDone ? 'text-green-700 hover:bg-green-100' : 'text-primary-600 bg-primary-50 hover:bg-primary-100'}`}>
                                                                {isDone ? 'Replace' : 'Upload'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-theme flex justify-end">
                                        <Button onClick={() => setStep(4)} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20">
                                            Next: Funding Destination <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: FUNDING DESTINATION */}
                            {step === 4 && (
                                <form onSubmit={handleSetupFunding} className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2"><Banknote className="text-primary-600" /> Receiving Funds</h2>
                                    <p className="text-secondary text-sm mb-6 leading-relaxed">
                                        Where should funds sent to this business go? By default, a new Kitty is created, but you can automate routing to existing goals.
                                    </p>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-semibold text-secondary mb-1.5">Primary Destination *</label>
                                            <select 
                                                value={fundingConfig.primary_destination} 
                                                onChange={(e) => setFundingConfig({...fundingConfig, primary_destination: e.target.value})}
                                                className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-primary"
                                            >
                                                <option value="kitty">Default Business Kitty (New)</option>
                                                <option value="piggy">My Personal Piggy Bank</option>
                                                <option value="group">A Group Investment</option>
                                                <option value="donation">A Donation Campaign</option>
                                            </select>
                                        </div>

                                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3 text-primary-800 text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p>All funds (100%) will be automatically sent to the selected destination as a Standing Order. You can configure split percentages and secondary destinations later in your Business Settings.</p>
                                        </div>

                                        <div className="pt-6 flex items-center justify-between border-t border-theme">
                                            <button type="button" onClick={() => setStep(3)} className="text-secondary hover:text-primary font-medium text-sm">Go Back</button>
                                            <Button type="submit" loading={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-primary-600/20">
                                                Next: Setup Account <ChevronRight size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* STEP 5: ACCOUNT PORTAL SETUP */}
                            {step === 5 && (
                                <form onSubmit={handleSetupPortal} className="animate-in fade-in slide-in-from-right-4 duration-500">
                                    <h2 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2"><Lock className="text-primary-600" /> Account Access</h2>
                                    <p className="text-secondary text-sm mb-6 leading-relaxed">
                                        Set up a portal password to manage this business as an independent account. You can switch to this business right from your profile menu.
                                    </p>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex gap-3 text-primary-800 text-sm">
                                            <AlertCircle className="w-5 h-5 shrink-0" />
                                            <p>This password is independent of your personal `{formData.contact_email}` login. Use it when acting on behalf of {formData.name}.</p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-secondary mb-1.5">Set Business Portal Password</label>
                                            <input 
                                                type="password" required value={portalPassword} onChange={(e) => setPortalPassword(e.target.value)} 
                                                className="w-full bg-elevated border border-theme rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium text-primary" 
                                                placeholder="••••••••" 
                                            />
                                        </div>

                                        <div className="pt-6 flex items-center justify-between border-t border-theme">
                                            <button type="button" onClick={() => navigate('/funding')} className="text-secondary hover:text-primary font-medium text-sm">Skip for now</button>
                                            <Button type="submit" loading={loading} className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-primary-200">
                                                Finish Setup <CheckCircle size={16} />
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBusiness;
