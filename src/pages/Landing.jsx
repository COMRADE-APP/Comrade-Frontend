import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../constants/routes';
import { motion } from 'framer-motion';
import { ShoppingBag, CreditCard, Users, ArrowRight, ShieldCheck, Zap, Target, Compass, Layers, Moon, Sun } from 'lucide-react';
import Button from '../components/common/Button';
import AboutSection from '../components/landing/AboutSection';
import CommunitySection from '../components/landing/CommunitySection';
import ServicesSection from '../components/landing/ServicesSection';
import ContactSection from '../components/landing/ContactSection';

// Animations
const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.2
        }
    }
};

const Landing = () => {
    const { isAuthenticated, loading } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [theme, setTheme] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') || 'system';
        }
        return 'system';
    });

    useEffect(() => {
        const root = document.documentElement;
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (loading) return null;
    if (isAuthenticated) return <Navigate to="/dashboard" replace />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-x-hidden font-sans">
            {/* ═══════════ NAVBAR ═══════════ */}
            <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-lg shadow-xl py-3 border-b border-gray-200 dark:border-white/10' : 'bg-transparent py-5'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img src="/qomrade_svg.svg" alt="Qomrade" className="w-10 h-10 object-contain drop-shadow-md" />
                        <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">Qomrade</span>
                    </div>

                    {/* Nav Links — separated clearly with spacing, glow on hover */}
                    <div className="hidden md:flex items-center gap-1">
                        {[
                            { href: '#about', label: 'About' },
                            { href: '#diagnosis', label: 'Why Us' },
                            { href: '#services', label: 'Services' },
                            { href: '#community', label: 'Community' },
                            { href: '#how-it-works', label: 'How it Works' },
                            { href: '#contact', label: 'Contact' },
                        ].map(link => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 dark:text-white/60 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-200"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    {/* Auth Buttons & Theme Toggle */}
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <Link
                            to={ROUTES.LOGIN}
                            className="px-5 py-2 rounded-full text-sm font-bold text-gray-700 border-2 border-gray-300 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-100 dark:text-white/80 dark:border-white/30 dark:hover:border-white dark:hover:text-white dark:hover:bg-white/5 transition-all duration-200"
                        >
                            Log In
                        </Link>
                        <Link
                            to={ROUTES.REGISTER}
                            className="bg-white text-gray-900 hover:bg-yellow-400 px-5 py-2 rounded-full text-sm font-bold shadow-md active:scale-95 transition-all duration-200"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ═══════════ HERO SECTION ═══════════ */}
            <section className="relative min-h-[100svh] flex items-center pt-24 pb-12 overflow-hidden bg-white dark:bg-gray-950">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-950 dark:to-black z-0" />

                {/* Watermark Emblem */}
                <div className="absolute right-0 top-0 bottom-0 w-full md:w-[80vw] max-w-[1000px] pointer-events-none z-0 translate-x-1/4 -translate-y-1/4">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white dark:to-gray-950 mix-blend-overlay z-10"></div>
                    <motion.img
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 0.06, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        src="/qomrade_growth_emblem.png"
                        alt=""
                        className="w-full h-full object-contain"
                    />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="max-w-4xl mx-auto flex flex-col items-center"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-blue-200 text-sm font-bold mb-8 shadow-2xl">
                            <Zap size={16} className="text-yellow-400" />
                            <span>The Next Generation of Fintech & Community</span>
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tighter leading-[1.1] mb-6 drop-shadow-2xl">
                            One Platform for All Your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-primary-900 dark:from-blue-300 dark:via-indigo-200 dark:to-white">Social & Financial Needs</span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl font-medium leading-relaxed mb-10 drop-shadow-md">
                            Replace your fragmented banking, shopping, and community apps with one unified ecosystem. Join the fight against digital piracy while radically improving your purchasing power through collaborative savings and investments.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-5 w-full sm:w-auto">
                            <Link to={ROUTES.REGISTER} className="w-full sm:w-auto">
                                <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4 rounded-full font-bold shadow-xl active:scale-95 bg-blue-600 hover:bg-yellow-400 hover:!text-gray-900 border-none transition-all duration-200 group flex items-center justify-center gap-2">
                                    Start Exploring Now
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to={ROUTES.LOGIN} className="w-full sm:w-auto">
                                <Button variant="outline" className="w-full sm:w-auto text-lg px-8 py-4 rounded-full font-bold text-gray-900 border-2 border-gray-300 hover:border-gray-900 hover:bg-gray-100 dark:text-white dark:border-white/30 dark:hover:border-white dark:hover:bg-white/10 backdrop-blur-sm active:scale-95 transition-all duration-200 justify-center">
                                    Sign In to Account
                                </Button>
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Decorative Bottom Fade */}
                <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-white to-transparent dark:from-gray-950 dark:to-transparent z-10 pointer-events-none" />
            </section>

            {/* ═══════════ ABOUT SECTION ═══════════ */}
            <AboutSection />

            {/* ═══════════ STRATEGIC DIAGNOSIS (Rumelt) ═══════════ */}
            <section id="diagnosis" className="py-24 bg-gray-50 dark:bg-gray-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-red-100/50 via-gray-50 to-gray-50 dark:from-red-900/10 dark:via-gray-950 dark:to-gray-950 z-0" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-300 text-sm font-bold mb-6 border border-red-500/30"
                        >
                            <Target size={16} />
                            <span>The Problem — Our Diagnosis</span>
                        </motion.div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Three Critical Challenges We Tackle Head On</h2>
                        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Richard Rumelt teaches that good strategy begins with an honest diagnosis of the challenge. Here are the three interconnected crises we identified.</p>
                    </div>

                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        <motion.div variants={fadeInUp} className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-red-300 dark:hover:border-red-500/30 transition-colors shadow-lg dark:shadow-none">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mb-6 border border-red-200 dark:border-red-500/30">
                                <Layers size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Service Fragmentation</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Individuals juggle dozens of disconnected apps: banking, shopping, community management, investments, bill payments — wasting time, increasing security exposure, and preventing natural synergies.</p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors shadow-lg dark:shadow-none">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6 border border-amber-200 dark:border-amber-500/30">
                                <CreditCard size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Weak Purchasing Power</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Individuals acting alone have zero bargaining power. Small orders mean higher costs, no bulk discounts, and no infrastructure for communities to pool their purchasing strength together.</p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-3xl border border-gray-200 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors shadow-lg dark:shadow-none">
                            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-6 border border-purple-200 dark:border-purple-500/30">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Rampant Digital Piracy</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Fragmented marketplaces with inconsistent enforcement create fertile ground for counterfeit goods and IP theft. Bad actors simply migrate across platforms with impunity.</p>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════ GUIDING POLICY (Rumelt) ═══════════ */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-white/5">
                <div className="max-w-5xl mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-blue-300 text-sm font-bold mb-6 border border-blue-500/30">
                            <Compass size={16} />
                            <span>Our Guiding Policy</span>
                        </div>
                        <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white italic leading-relaxed max-w-3xl mx-auto mb-6">
                            "Build a single, natively integrated ecosystem where marketplace commerce, financial operations, and community collaboration reinforce each other — creating compound value that fragmented alternatives structurally cannot match."
                        </blockquote>
                        <p className="text-gray-600 dark:text-gray-400 text-lg font-medium max-w-2xl mx-auto">This isn't a mission statement. It's our strategic commitment — the lens through which every feature, partnership, and policy decision is evaluated.</p>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════ SERVICES SECTION ═══════════ */}
            <ServicesSection />

            {/* ═══════════ COMMUNITY SECTION ═══════════ */}
            <CommunitySection />

            {/* ═══════════ HOW IT WORKS ═══════════ */}
            <section id="how-it-works" className="py-24 bg-white dark:bg-gray-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-50 via-white to-gray-50 dark:from-gray-800 dark:via-gray-950 dark:to-black z-0 dark:opacity-80 opacity-100" />
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col lg:flex-row gap-16 items-center">
                        <div className="w-full lg:flex-1 relative min-h-[350px] lg:h-[400px]">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/70 to-white/20 dark:from-white/10 dark:to-transparent rounded-[40px] border border-gray-200 dark:border-white/10 p-8 backdrop-blur-xl flex flex-col items-center justify-center overflow-hidden shadow-2xl"
                            >
                                <div className="absolute inset-0 bg-blue-50/50 dark:bg-gray-800/30 mix-blend-overlay"></div>
                                <ShieldCheck size={120} className="text-blue-500 dark:text-blue-400 opacity-80 mb-6 drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_0_30px_rgba(96,165,250,0.4)]" />
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white text-center relative z-10">Bank-Grade Security</h3>
                                <p className="text-center text-gray-700 dark:text-gray-300 font-medium mt-4 relative z-10 max-w-xs">Every transaction and message is fiercely protected by industry-leading encryption.</p>
                                <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500/30 blur-3xl rounded-full mix-blend-screen" />
                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-purple-500/30 blur-3xl rounded-full mix-blend-screen" />
                            </motion.div>
                        </div>
                        <div className="flex-1 w-full mx-auto">
                            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6">Designed for speed, built for trust.</h2>
                            <p className="text-lg text-gray-600 dark:text-gray-300 font-medium mb-12 max-w-xl">
                                Getting started on Qomrade takes minutes. Experience the seamless flow of managing your entire digital life in one intuitive hub.
                            </p>
                            <div className="space-y-10">
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">1</div>
                                    <div>
                                        <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Create Your Profile</h4>
                                        <p className="text-gray-600 dark:text-gray-300">Sign up instantly with your email, phone, or favorite social accounts. We ensure state-of-the-art verification.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">2</div>
                                    <div>
                                        <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Load Your Wallet</h4>
                                        <p className="text-gray-600 dark:text-gray-300">Connect to M-Pesa, Banks, Stripe, or PayPal to securely top up your uncompromised digital wallet.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.5)]">3</div>
                                    <div>
                                        <h4 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Transact & Collaborate</h4>
                                        <p className="text-gray-600 dark:text-gray-300">From group investments to splitting dinner bills, you are now fully equipped to thrive in the ecosystem.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════ CONTACT SECTION ═══════════ */}
            <ContactSection />

            {/* ═══════════ BOTTOM CTA ═══════════ */}
            <section className="py-24 bg-gray-900 relative overflow-hidden">
                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Ready to join the revolution?</h2>
                    <p className="text-xl text-gray-400 font-medium mb-10 max-w-2xl mx-auto">
                        Don't get left behind. Qomrade represents the smartest way to manage your payments, organizations, and marketplace needs.
                    </p>
                    <Link to={ROUTES.REGISTER}>
                        <Button variant="primary" className="text-lg px-10 py-5 rounded-full font-bold shadow-lg active:scale-95 transition-all duration-200 bg-blue-600 hover:bg-yellow-400 hover:!text-gray-900 border-none text-white">
                            Create Your Free Account
                        </Button>
                    </Link>
                </div>
            </section>

            {/* ═══════════ FOOTER ═══════════ */}
            <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-white/10 py-12">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <img src="/qomrade_svg.svg" alt="Qomrade" className="w-8 h-8 opacity-80 dark:opacity-60 grayscale hover:grayscale-0 transition-all" />
                        <span className="text-lg font-bold text-gray-700 dark:text-gray-400 tracking-tight">Qomrade</span>
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                        &copy; {new Date().getFullYear()} Qomrade. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                        <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/help" className="hover:text-gray-900 dark:hover:text-white transition-colors">Help Center</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
