import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, MapPin, Send } from 'lucide-react';
import Button from '../common/Button';

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const ContactSection = () => {
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        // In a real implementation this would post to a backend endpoint
        alert("Thanks for reaching out! We will get back to you shortly.");
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <section id="contact" className="py-24 bg-gray-100 dark:bg-primary-900 relative z-20 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-gray-100 to-gray-100 dark:from-blue-900/20 dark:via-primary-900 dark:to-primary-900 z-0" />
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-white/10 text-gray-900 dark:text-white text-sm font-bold mb-6 border border-blue-200 dark:border-white/20"
                    >
                        <MessageSquare size={16} />
                        <span>Get in Touch</span>
                    </motion.div>
                    <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 tracking-tight">We're here to assist you</h2>
                    <p className="text-lg text-gray-600 dark:text-primary-100 font-medium">Have questions about migrating your organization, setting up group investments, or navigating the marketplace? Drop us a line.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 max-w-5xl mx-auto">
                    {/* Contact Info */}
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="flex-1 space-y-8"
                    >
                        <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 rounded-3xl">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h3>
                            <div className="space-y-6 text-gray-600 dark:text-primary-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-semibold mb-1">Email Us</h4>
                                        <p className="text-sm">support@qomrade.com</p>
                                        <p className="text-sm mt-1">Our friendly team is here to help.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                        <MapPin size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900 dark:text-white font-semibold mb-1">Headquarters</h4>
                                        <p className="text-sm">Nairobi, Kenya</p>
                                        <p className="text-sm mt-1">Global operations managed entirely on-chain.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Contact Form */}
                    <motion.div 
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        variants={fadeInUp}
                        className="flex-[1.5]"
                    >
                        <div className="bg-white dark:bg-white/5 backdrop-blur-md border border-gray-200 dark:border-white/10 p-8 rounded-3xl">
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-white/80">Full Name</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            placeholder="Jane Doe"
                                        />
                                </div>
                                    <div className="flex flex-col space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-white/80">Email Address</label>
                                        <input 
                                            type="email" 
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                            className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                                            placeholder="jane@example.com"
                                        />
                                </div>
                            </div>
                                <div className="flex flex-col space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-white/80">Message</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        value={formData.message}
                                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        className="bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow resize-none"
                                        placeholder="How can we help you?"
                                    ></textarea>
                            </div>
                            <Button type="submit" variant="primary" className="bg-blue-600 hover:bg-yellow-400 hover:!text-gray-900 text-white border-none transition-colors mt-2 py-4 shadow-xl flex items-center justify-center gap-2">
                                Send Message
                                <Send size={18} />
                            </Button>
                        </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default ContactSection;
