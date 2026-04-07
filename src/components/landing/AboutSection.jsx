import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Target, ShieldCheck } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const AboutSection = () => {
    return (
        <section id="about" className="py-24 bg-gray-100 dark:bg-primary-900 relative overflow-hidden overflow-x-hidden">
            {/* Background embellishments */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full mix-blend-screen pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="flex flex-col lg:flex-row gap-16 items-center"
                >
                    <div className="flex-1 w-full relative">
                        <motion.div variants={fadeInUp} className="relative z-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80" alt="Team collaborating" className="w-full aspect-[4/3] object-cover opacity-80 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 to-transparent opacity-80" />
                        </motion.div>
                        {/* Decorative floating card */}
                        <motion.div variants={fadeInUp} className="absolute -bottom-8 -right-8 bg-white/90 dark:bg-white/10 backdrop-blur-xl border border-gray-200 dark:border-white/20 p-6 rounded-2xl shadow-xl w-64 hidden md:block z-20">
                            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Our Mission</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300">To end fragmentation by unifying commerce, community, and finance into one ecosystem.</p>
                        </motion.div>
                    </div>

                    <div className="flex-1 w-full relative z-20">
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-white/10 backdrop-blur-md border border-blue-200 dark:border-white/20 text-blue-600 dark:text-blue-200 text-sm font-bold mb-6">
                            <Globe size={16} />
                            <span>About Us</span>
                        </motion.div>
                        <motion.h2 variants={fadeInUp} className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Our Core Mission</motion.h2>
                        <motion.p variants={fadeInUp} className="text-lg text-gray-600 dark:text-primary-100 font-medium mb-8 leading-relaxed">
                            Qomrade was built to drastically improve people's purchasing power, join the fight against digital piracy, and heavily reduce the unnecessary fragmentation of daily services. By seamlessly enabling collaborative purchase, savings, and investment, we strive to improve the true efficiency of interconnectedness and maximize the tangible benefits of social platforms.
                        </motion.p>

                        <div className="space-y-6">
                            <motion.div variants={fadeInUp} className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-500/30">
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">A Unified Platform</h4>
                                    <p className="text-gray-600 dark:text-primary-100 text-sm leading-relaxed">We provide the singular platform that seamlessly marries your digital wallet, your commerce behavior, and your peer groups into one holistic environment, optimizing value.</p>
                                </div>
                            </motion.div>
                            
                            <motion.div variants={fadeInUp} className="flex gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-200 dark:border-purple-500/30">
                                    <ShieldCheck size={24} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Trust at the Core</h4>
                                    <p className="text-gray-600 dark:text-primary-100 text-sm leading-relaxed">Whether handling group escrows, standing orders, or personal payments, uncompromised security is structurally embedded inside our DNA.</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default AboutSection;
