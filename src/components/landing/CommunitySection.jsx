import React from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, GraduationCap, Briefcase } from 'lucide-react';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const CommunitySection = () => {
    return (
        <section id="community" className="py-24 bg-gray-50 dark:bg-gray-950 relative z-20">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 dark:bg-white/10 text-purple-600 dark:text-purple-300 text-sm font-bold mb-6 border border-purple-200 dark:border-white/20"
                    >
                        <Users size={16} />
                        <span>The Community</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">Your Network is Your Net Worth</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">Qomrade isn't just about moving money; it's about the people you move it with. Find infinite opportunities, network deeply, and grow organically.</p>
                </div>

                <motion.div 
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={staggerContainer}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                >
                    {[
                        { title: 'Peer Networking', desc: 'Connect, chat, heavily manage organizations, and share expert insights globally.', icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/20' },
                        { title: 'Dynamic Events', desc: 'Host engaging masterclasses, ticket premium events, and attend local gatherings.', icon: Calendar, color: 'text-purple-400', bg: 'bg-purple-500/20' },
                        { title: 'Gigs & Careers', desc: 'Unlock powerful new streams of income and find your desired path in the ecosystem.', icon: Briefcase, color: 'text-amber-400', bg: 'bg-amber-500/20' },
                        { title: 'Research & Learn', desc: 'Participate actively in verified masterclasses and heavily structured research hubs.', icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
                    ].map((feature, idx) => (
                        <motion.div key={idx} variants={fadeInUp} className="bg-white dark:bg-white/5 backdrop-blur-md p-8 rounded-[32px] shadow-lg border border-gray-200 dark:border-white/10 hover:-translate-y-2 hover:border-gray-300 dark:hover:border-white/20 transition-all duration-300">
                            <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center ${feature.color} mb-6`}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </motion.div>
                    ))}
                </motion.div>
                
                {/* Visual Connector / Graphic */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="mt-16 w-full py-16 px-6 min-h-[300px] md:h-[400px] bg-gradient-to-br from-indigo-900 to-gray-900 dark:from-gray-800 dark:to-indigo-900 rounded-[40px] overflow-hidden relative shadow-2xl flex items-center justify-center"
                >
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80')] opacity-20 dark:opacity-30 object-cover mix-blend-overlay w-full h-full" />
                    <div className="relative z-10 text-center">
                        <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4">A Thriving Ecosystem</h3>
                        <p className="text-blue-100 dark:text-gray-300 text-lg max-w-xl mx-auto font-medium">Join thousands of organizations, institutions, and leaders securely managing their operations completely in-house.</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default CommunitySection;
