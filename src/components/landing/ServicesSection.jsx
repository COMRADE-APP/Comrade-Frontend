import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ShoppingBag, CreditCard, PiggyBank, Settings } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const ServicesSection = () => {
    return (
        <section id="services" className="py-24 bg-gray-50 dark:bg-gray-950 border-y border-gray-200 dark:border-white/10 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-white/10 text-blue-600 dark:text-blue-300 text-sm font-bold mb-6 border border-blue-200 dark:border-white/20"
                    >
                        <Settings size={16} />
                        <span>Core Services — Our Coherent Actions</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">An Entire Universe of Utilities</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">From daily payments to massive group investments, every tool is natively integrated — each reinforcing the others to create compound value no fragmented alternative can match.</p>
                </div>

                {/* Modern Bento Grid Layout */}
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-min md:auto-rows-[250px]"
                >
                    {/* Big Unified Marketplace Card */}
                    <motion.div variants={fadeInUp} className="md:col-span-2 lg:col-span-2 row-span-2 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[40px] p-10 flex flex-col justify-between text-white shadow-xl group overflow-hidden relative">
                        <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <ShoppingBag size={300} className="translate-x-1/4 translate-y-1/4" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/20">
                                <ShoppingBag size={28} />
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Unified Commerce</h3>
                            <p className="text-blue-100 font-medium text-lg leading-relaxed max-w-sm mb-6">
                                Why switch tabs? Buy global items, order local food delivery, and seamlessly book business services straight from your uncompromised Qomrade wallet.
                            </p>
                        </div>
                        <div className="relative z-10 hidden sm:flex gap-3 mt-auto">
                            <span className="px-5 py-2.5 bg-white/10 text-white backdrop-blur-md rounded-full text-sm font-semibold border border-white/20">Hotels & Properties</span>
                            <span className="px-5 py-2.5 bg-white/10 text-white backdrop-blur-md rounded-full text-sm font-semibold border border-white/20">Restaurants</span>
                            <span className="px-5 py-2.5 bg-white/10 text-white backdrop-blur-md rounded-full text-sm font-semibold border border-white/20">Marketplace Shops</span>
                        </div>
                    </motion.div>

                    {/* Small Finance Card */}
                    <motion.div variants={fadeInUp} className="bg-white dark:bg-gray-900 rounded-[40px] p-8 border border-gray-200 dark:border-white/10 shadow-md flex flex-col items-center justify-center text-center hover:shadow-xl transition-shadow">
                        <CreditCard size={40} className="text-blue-600 dark:text-blue-400 mb-4" />
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Smart Payments</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pay bills flawlessly and completely automate recurring standing orders directly from balance.</p>
                    </motion.div>

                    {/* Small P2P Card */}
                    <motion.div variants={fadeInUp} className="bg-gray-900 dark:bg-gray-800 rounded-[40px] p-8 shadow-xl flex flex-col items-center justify-center text-center text-white">
                        <Wallet size={40} className="text-purple-300 mb-4" />
                        <h4 className="text-xl font-bold mb-2">Escrow & P2P</h4>
                        <p className="text-sm text-gray-300 font-medium">Zero-risk peer transactions, wallet integrations, business transfers and instant micro-loans.</p>
                    </motion.div>

                    {/* Medium Investment Card */}
                    <motion.div variants={fadeInUp} className="md:col-span-2 lg:col-span-2 bg-gradient-to-tr from-emerald-500 to-green-700 rounded-[40px] p-8 flex flex-col sm:flex-row items-center gap-6 text-white shadow-xl hover:-translate-y-1 transition-transform">
                        <div className="p-6 bg-white/20 rounded-3xl shrink-0 backdrop-blur-md border border-white/20">
                            <PiggyBank size={48} />
                        </div>
                        <div>
                            <h4 className="text-2xl font-bold mb-3">Group Investments & Kitties</h4>
                            <p className="text-green-50 font-medium leading-relaxed">Join forces to manage group funds (kitties), invest structurally in startups (MMF, Stocks, Bonds), or precisely coordinate donation drives securely and transparently.</p>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default ServicesSection;
