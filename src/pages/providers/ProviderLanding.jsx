import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, TrendingUp, Users, ArrowRight, Building2, Briefcase, Network } from 'lucide-react';
import Button from '../../components/common/Button';

const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="bg-elevated p-8 rounded-2xl border border-theme hover:shadow-xl transition-shadow duration-300">
        <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
            <Icon className="text-primary" size={28} />
        </div>
        <h3 className="text-xl font-bold text-primary mb-3">{title}</h3>
        <p className="text-secondary leading-relaxed">{description}</p>
    </div>
);

const ProviderLanding = () => {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 -skew-y-6 transform origin-top-left -z-10" />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-8">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        Partner with Qomrade
                    </div>
                    <h1 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight mb-6 leading-tight">
                        Empower Your Business <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-emerald-500">
                            with Seamless Payments
                        </span>
                    </h1>
                    <p className="text-xl text-secondary max-w-2xl mx-auto mb-10">
                        Join our network of trusted providers. Offer your services, handle bill payments, and reach thousands of users globally with our secure fintech infrastructure.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link to="/providers/register">
                            <Button variant="primary" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 rounded-xl font-bold shadow-lg shadow-primary/30">
                                Become a Provider <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Link to="/providers/login">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-4 rounded-xl font-bold border-2">
                                Provider Portal Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-primary mb-4">Why Partner With Us?</h2>
                    <p className="text-secondary max-w-2xl mx-auto">
                        We provide the tools and infrastructure you need to scale your operations and manage payments efficiently.
                    </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={TrendingUp}
                        title="Instant Settlements"
                        description="Experience lightning-fast payouts and atomic transaction settlements directly into your operational kitty."
                    />
                    <FeatureCard 
                        icon={Shield}
                        title="Automated Escrow"
                        description="Minimize risks with built-in escrow logic. Funds are secured automatically until service delivery is verified."
                    />
                    <FeatureCard 
                        icon={Users}
                        title="Global Reach"
                        description="Tap into a vast network of individuals and community groups ready to access your financial products."
                    />
                    <FeatureCard 
                        icon={Network}
                        title="Unified API Integration"
                        description="Connect your existing systems seamlessly. Manage invoices, claims, and loan disbursements programmatically."
                    />
                    <FeatureCard 
                        icon={Building2}
                        title="Dedicated Kitties"
                        description="We auto-create operations kitties to help you track inflows, manage expenses, and generate detailed analytics."
                    />
                    <FeatureCard 
                        icon={Zap}
                        title="Analytics Dashboard"
                        description="Gain actionable insights. Monitor your total transaction volume, active products, and customer behavior."
                    />
                </div>
            </div>

            {/* CTA Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="bg-primary rounded-3xl p-12 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    
                    <h2 className="text-4xl font-extrabold text-white mb-6 relative z-10">
                        Ready to scale your financial services?
                    </h2>
                    <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-10 relative z-10">
                        Registration takes less than 5 minutes. Upload your documents, set up your profile, and start processing payments today.
                    </p>
                    <Link to="/providers/register" className="relative z-10">
                        <Button className="bg-white text-primary hover:bg-gray-50 px-8 py-4 rounded-xl font-bold text-lg shadow-xl">
                            Start Registration Process
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProviderLanding;
