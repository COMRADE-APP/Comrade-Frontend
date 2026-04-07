import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ChevronDown, ChevronUp, Search, Wallet, ShoppingBag, Users, CreditCard, ShieldCheck, Settings, Zap, BookOpen, Mail } from 'lucide-react';

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
    <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden transition-colors hover:border-gray-300 dark:hover:border-white/20 bg-white dark:bg-transparent">
        <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left cursor-pointer">
            <span className="text-gray-900 dark:text-white font-semibold text-base pr-4">{question}</span>
            {isOpen ? <ChevronUp size={20} className="text-blue-500 dark:text-blue-400 shrink-0" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500 shrink-0" />}
        </button>
        {isOpen && (
            <div className="px-5 pb-5 text-gray-600 dark:text-gray-300 text-sm leading-relaxed border-t border-gray-100 dark:border-white/5 pt-4">
                {answer}
            </div>
        )}
    </div>
);

const CategoryCard = ({ icon: Icon, title, description, color }) => (
    <div className={`bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-${color}-300 dark:hover:border-${color}-500/40 transition-all duration-200 shadow-sm dark:shadow-none group cursor-default`}>
        <div className={`w-12 h-12 rounded-xl bg-${color}-100 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center mb-4 border border-${color}-200 dark:border-${color}-500/30 group-hover:scale-110 transition-transform`}>
            <Icon size={22} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
);

const HelpCenter = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);
    const [searchQuery, setSearchQuery] = useState('');
    const [openFAQ, setOpenFAQ] = useState(null);

    const categories = [
        { icon: Wallet, title: 'Wallet & Payments', description: 'Funding your wallet, making transfers, M-Pesa, Stripe, PayPal integrations, and standing orders.', color: 'blue' },
        { icon: ShoppingBag, title: 'Marketplace & Shopping', description: 'Browsing products, placing orders, seller verification, delivery, returns, refunds, and reviews.', color: 'amber' },
        { icon: Users, title: 'Community & Groups', description: 'Creating organizations, managing members, posting events, masterclasses, gigs, and networking.', color: 'purple' },
        { icon: CreditCard, title: 'Group Finance & Kitties', description: 'Setting up kitties, group investments, escrow services, checkout splitting, and fund management.', color: 'emerald' },
        { icon: ShieldCheck, title: 'Security & Privacy', description: 'Two-factor authentication, password resets, data export, account deletion, and fraud reporting.', color: 'red' },
        { icon: Settings, title: 'Account & Settings', description: 'Profile setup, theme settings, notification preferences, role management, and linked accounts.', color: 'cyan' },
    ];

    const faqs = [
        // Getting Started
        { category: 'Getting Started', question: 'What is Qomrade and how is it different from other platforms?', answer: 'Qomrade is a unified ecosystem that combines marketplace commerce, group financial services, and community networking into one platform. Unlike using separate apps for shopping, banking, and social networking, Qomrade natively integrates all three — meaning your wallet directly powers purchases, your organizations can pool finances for group investments, and your community reputation unlocks better opportunities. Our strategic approach, inspired by clarity-first strategy, addresses three critical problems: service fragmentation, weak individual purchasing power, and digital piracy.' },
        { category: 'Getting Started', question: 'How do I create an account?', answer: 'Click "Get Started" on the landing page or navigate to the registration page. You can sign up using your email address or via social login providers (Google, Apple). After providing your credentials, you\'ll receive a one-time password (OTP) via email for verification. Complete your profile setup by adding your display name, bio, and profile photo. The entire process takes under 2 minutes.' },
        { category: 'Getting Started', question: 'Is Qomrade free to use?', answer: 'Yes, creating an account and using core features is completely free. This includes browsing the marketplace, joining communities, accessing the social feed, applying to gigs, and managing organizations. Some financial services may involve small transaction fees (e.g., cross-border transfers, currency conversions), which are always transparently displayed before you confirm any transaction.' },
        { category: 'Getting Started', question: 'What devices and browsers are supported?', answer: 'Qomrade\'s web application works on all modern browsers including Chrome, Firefox, Safari, and Edge. The platform is fully responsive and optimized for desktop, tablet, and mobile screen sizes. We recommend using the latest browser version for the best experience.' },

        // Wallet & Payments
        { category: 'Wallet & Payments', question: 'How do I add money to my Qomrade wallet?', answer: 'Navigate to the Wallet section in your dashboard. Click "Top Up" or "Deposit." You can fund your wallet via: M-Pesa (instant transfer from your mobile money account), Bank Transfer (direct deposit from linked bank accounts), Stripe (credit/debit card payments), or PayPal. Each method has specific processing times — M-Pesa is instant, bank transfers may take 1-3 business days. All funding methods use tokenized security; we never store raw banking credentials.' },
        { category: 'Wallet & Payments', question: 'How do peer-to-peer (P2P) transfers work?', answer: 'From your wallet, select "Send Money." Enter the recipient\'s Qomrade username, email, or phone number. Specify the amount and optionally add a note. Confirm the transfer with your authentication method (password or 2FA code). P2P transfers within Qomrade are instant and free. The recipient receives a notification and the funds appear in their wallet immediately.' },
        { category: 'Wallet & Payments', question: 'What are standing orders and how do I set them up?', answer: 'Standing orders are automated recurring payments — perfect for bills, subscriptions, or regular contributions to kitties. Go to Wallet → Standing Orders → Create New. Specify the recipient, amount, frequency (daily, weekly, monthly), start date, and optional end date. You must maintain sufficient wallet balance for scheduled payments. If a payment fails due to insufficient funds, you\'ll receive a notification but the payment will not automatically retry.' },
        { category: 'Wallet & Payments', question: 'Can I withdraw money from my wallet to my bank or M-Pesa?', answer: 'Yes. Navigate to Wallet → Withdraw. Select your withdrawal method (bank account or M-Pesa). Enter the amount and confirm. Processing times vary: M-Pesa withdrawals are typically processed within minutes during business hours; bank withdrawals may take 1-3 business days depending on your bank\'s processing schedule.' },

        // Marketplace
        { category: 'Marketplace & Shopping', question: 'How do I buy products on the marketplace?', answer: 'Browse products through the Shop tab or search for specific items. Each product listing shows detailed descriptions, images, pricing, seller information, and community reviews. Add items to your cart, then proceed to checkout. You can pay directly from your Qomrade wallet. For group purchases, you can initiate a group checkout to split costs with your organization or group members.' },
        { category: 'Marketplace & Shopping', question: 'How does group purchasing improve my purchasing power?', answer: 'This is core to Qomrade\'s mission. When multiple users or an organization buy together through Group Checkout, the combined order volume can unlock bulk pricing, shared delivery costs, and better negotiation leverage with suppliers. For example, 20 organization members buying the same product together might achieve 15-30% lower unit costs compared to individual purchases. This is our coherent action for addressing the purchasing power deficit.' },
        { category: 'Marketplace & Shopping', question: 'How do I become a seller on the marketplace?', answer: 'Go to your Account settings and apply for Seller status. You\'ll need to complete enhanced KYC verification (identity verification) and agree to seller-specific terms including accurate product representation, timely fulfillment, and anti-piracy commitments. Once approved, you can create product listings with images, descriptions, pricing, and inventory management.' },
        { category: 'Marketplace & Shopping', question: 'What is the return and refund policy?', answer: 'Sellers must accept returns for items materially different from their listing descriptions. For transactions using Qomrade\'s escrow service, funds are held until the buyer confirms satisfactory delivery. Disputes can be raised within 7 days of delivery through our Resolution Center. Our Trust & Safety team mediates unresolved disputes and can authorize refunds when warranted.' },
        { category: 'Marketplace & Shopping', question: 'How does Qomrade fight against counterfeit and pirated goods?', answer: 'We employ multi-layered detection: automated listing analysis using image recognition and text classification, community-driven reporting with dedicated piracy categories, partnerships with rights holders and anti-piracy organizations, and cross-referencing seller activity patterns across marketplace, financial, and community domains. Sellers found distributing pirated or counterfeit goods face immediate account termination and potential legal referral.' },

        // Community
        { category: 'Community & Groups', question: 'How do I create an organization?', answer: 'Navigate to the Organizations section and click "Create Organization." Provide a name, description, category, and profile image. You can set the organization as public (discoverable by all users) or private (invitation-only). As the creator, you become the primary administrator with full control over membership, roles, treasury, and organizational settings.' },
        { category: 'Community & Groups', question: 'What can organizations do on Qomrade?', answer: 'Organizations are powerful entities on Qomrade. They can: manage member rosters and roles, pool funds into a shared treasury, initiate group purchases and investments, host events and masterclasses (free or ticketed), post career opportunities and gigs, create research hubs for knowledge sharing, and run charity donation drives. The financial and social capabilities are natively integrated — no need for external tools.' },
        { category: 'Community & Groups', question: 'How do events and masterclasses work?', answer: 'Any user or organization can create events. Navigate to Events → Create Event. Specify the title, description, date/time, location (physical or virtual), capacity, and ticket pricing (free or paid). Attendees can RSVP and pay ticket fees directly from their wallet. Masterclasses are structured educational sessions that can include materials, schedules, and certificates of completion.' },
        { category: 'Community & Groups', question: 'How do gigs and career opportunities work?', answer: 'Organizations and individuals can post gig opportunities (short-term tasks) or career positions. Interested users can view details and submit applications. The poster reviews applications and can accept, reject, or shortlist candidates. Payment for completed gigs flows through the Qomrade wallet ecosystem, providing transparency and security for both parties.' },

        // Group Finance
        { category: 'Group Finance & Kitties', question: 'What exactly is a "Kitty" on Qomrade?', answer: 'A kitty is a group savings instrument. Think of it as a communal piggy bank with transparent rules. The kitty administrator sets contribution schedules (e.g., KES 1,000/month from each member), withdrawal conditions, and governance rules. Members can track contributions and balances in real-time. Kitties are perfect for: savings groups (chamas), event funds, project budgets, emergency funds, and community investment pools.' },
        { category: 'Group Finance & Kitties', question: 'How do group investments work?', answer: 'Organizations or groups can collectively invest in financial instruments available on the platform, including MMF (Money Market Funds), government bonds, tracked stocks, and startup equity. Investment decisions follow the group\'s governance rules (e.g., majority vote). Qomrade facilitates the transactions but does not provide investment advice. All investments carry risk — we clearly disclose this and recommend consulting qualified financial advisors.' },
        { category: 'Group Finance & Kitties', question: 'What is escrow and when should I use it?', answer: 'Escrow is a secure holding mechanism for high-value transactions. When you initiate an escrow-protected transaction, the buyer\'s funds are held by Qomrade in a segregated account. Once the buyer confirms satisfactory delivery, the funds are released to the seller. This protects both parties: buyers know sellers must deliver before receiving payment, and sellers know funds are guaranteed and available. Use escrow for: large marketplace purchases, freelance project payments, property deposits, or any transaction requiring mutual assurance.' },

        // Security
        { category: 'Security & Privacy', question: 'How is my data protected?', answer: 'We employ defense-in-depth security: AES-256 encryption at rest, TLS 1.3 in transit, Argon2id password hashing, optional TOTP two-factor authentication, device trust scoring, and real-time anomaly detection. Role-based access controls ensure no employee has blanket access to user financial data. See our Privacy Policy for comprehensive details on data collection, retention, and your rights.' },
        { category: 'Security & Privacy', question: 'How do I enable two-factor authentication (2FA)?', answer: 'Go to Settings → Security → Two-Factor Authentication. Click "Enable 2FA." You\'ll be presented with a QR code to scan with an authenticator app (Google Authenticator, Authy, etc.). Enter the verification code from your authenticator to confirm setup. Once enabled, you\'ll need both your password and a time-based code from your authenticator app to log in.' },
        { category: 'Security & Privacy', question: 'How do I delete my account and all my data?', answer: 'Navigate to Settings → Account → Delete Account. You\'ll need to confirm your identity and acknowledge that deletion is permanent. Upon verified request, we purge all non-legally-mandated data within 30 days. Financial transaction records may be retained for up to 7 years as required by anti-money laundering regulations, but will be anonymized where possible. Active group memberships and financial obligations must be settled before account deletion.' },
        { category: 'Security & Privacy', question: 'What should I do if I suspect unauthorized access to my account?', answer: 'Immediately: 1) Change your password via Settings → Security. 2) Enable or reset 2FA. 3) Review recent login activity in Settings → Security → Active Sessions and revoke any unrecognized devices. 4) Contact security@qomrade.com with details. We can temporarily lock your account if needed while our team investigates. Review our Privacy Policy for our full breach notification commitments.' },

        // Account
        { category: 'Account & Settings', question: 'How do I change my theme?', answer: 'Qomrade supports multiple themes: Light, Dark, Dark High Contrast, and Ambient. Navigate to Settings → Appearance and select your preferred theme. The change applies instantly across the entire platform.' },
        { category: 'Account & Settings', question: 'How do I change my role on the platform?', answer: 'Navigate to Settings → Advanced → Role Management. Your current role is displayed. Click the "Apply for Role Change" button to submit a role change application. Role changes are reviewed by the platform team to ensure appropriate access levels.' },
        { category: 'Account & Settings', question: 'Can I link multiple payment methods?', answer: 'Yes. Go to Wallet → Payment Methods. You can link multiple M-Pesa numbers, bank accounts, Stripe cards, and PayPal accounts. Set one as your primary funding source and choose which method to use for each specific transaction or top-up. All linked methods use secure tokenization.' },
    ];

    const filteredFAQs = searchQuery
        ? faqs.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.category.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : faqs;

    const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
        if (!acc[faq.category]) acc[faq.category] = [];
        acc[faq.category].push(faq);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg shadow-xl py-4 border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/qomrade_svg.svg" alt="Qomrade" className="w-8 h-8 object-contain dark:invert-0 invert" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Qomrade</span>
                    </Link>
                    <div className="flex items-center gap-4 text-sm font-semibold">
                        <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy</Link>
                        <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms</Link>
                        <Link to="/" className="text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-full border border-gray-200 dark:border-white/20 transition-colors">Back to Home</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-5xl mx-auto px-6 pt-32 pb-24">
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-sm font-bold mb-6 border border-emerald-200 dark:border-emerald-500/30">
                        <HelpCircle size={16} />
                        <span>Help Center</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">How can we help you?</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium text-lg max-w-2xl mx-auto mb-8">Find answers to common questions about payments, marketplace, group finance, community features, and security.</p>

                    {/* Search Bar */}
                    <div className="max-w-xl mx-auto relative">
                        <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search for answers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/15 text-gray-900 dark:text-white rounded-2xl pl-12 pr-4 py-4 placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm dark:shadow-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                        />
                    </div>
                </div>

                {/* Category Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-20">
                    {categories.map((cat, idx) => (
                        <CategoryCard key={idx} {...cat} />
                    ))}
                </div>

                {/* FAQ Sections */}
                <div className="space-y-12">
                    {Object.entries(groupedFAQs).map(([category, items]) => (
                        <div key={category}>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <span className="w-8 h-[2px] bg-blue-500 rounded-full" />
                                {category}
                            </h2>
                            <div className="space-y-3">
                                {items.map((faq, idx) => {
                                    const globalIdx = faqs.indexOf(faq);
                                    return (
                                        <FAQItem
                                            key={globalIdx}
                                            question={faq.question}
                                            answer={faq.answer}
                                            isOpen={openFAQ === globalIdx}
                                            onToggle={() => setOpenFAQ(openFAQ === globalIdx ? null : globalIdx)}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {filteredFAQs.length === 0 && (
                        <div className="text-center py-16">
                            <HelpCircle size={48} className="text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-500 dark:text-gray-400 mb-2">No results found</h3>
                            <p className="text-gray-400 dark:text-gray-500">Try a different search term or browse the categories above.</p>
                        </div>
                    )}
                </div>

                {/* Still Need Help */}
                <div className="mt-20 bg-white dark:bg-white/5 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-white/10 p-10 text-center shadow-lg dark:shadow-none">
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Still need help?</h2>
                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-6 max-w-xl mx-auto">If you couldn't find the answer you're looking for, our support team is always ready to assist you personally.</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="mailto:support@qomrade.com" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-yellow-400 hover:text-gray-900 text-white px-6 py-3 rounded-full font-bold transition-all duration-200 active:scale-95">
                            <Mail size={18} />
                            Email Support
                        </a>
                        <Link to="/#contact" className="inline-flex items-center gap-2 border-2 border-gray-200 dark:border-white/30 text-gray-700 dark:text-white hover:border-gray-800 dark:hover:border-white px-6 py-3 rounded-full font-bold transition-all duration-200">
                            <BookOpen size={18} />
                            Contact Form
                        </Link>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Qomrade. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Privacy Policy</Link>
                        <Link to="/terms" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Terms of Service</Link>
                        <Link to="/" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HelpCenter;
