import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Eye, Database, Share2, Lock, Trash2, Globe, Bell, Scale, Mail } from 'lucide-react';

const Section = ({ icon: Icon, title, color = 'blue', children }) => (
    <section className="bg-white dark:bg-white/5 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-gray-200 dark:border-white/10 shadow-lg">
        <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-2xl bg-${color}-100 dark:bg-${color}-500/20 text-${color}-600 dark:text-${color}-400 flex items-center justify-center shrink-0 border border-${color}-200 dark:border-${color}-500/30`}>
                <Icon size={22} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
        </div>
        <div className="text-gray-700 dark:text-gray-300 leading-relaxed space-y-4">{children}</div>
    </section>
);

const SubSection = ({ title, children }) => (
    <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pl-4 border-l-2 border-blue-500">{title}</h3>
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3 pl-4">{children}</div>
    </div>
);

const BulletItem = ({ label, children }) => (
    <div className="flex gap-3">
        <span className="text-blue-500 dark:text-blue-400 font-bold mt-0.5">&#x2022;</span>
        <p><strong className="text-gray-900 dark:text-white">{label}:</strong> {children}</p>
    </div>
);

const PrivacyPolicy = () => {
    useEffect(() => { window.scrollTo(0, 0); }, []);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-800 dark:text-gray-200 font-sans">
            {/* Navbar */}
            <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg shadow-xl py-4 border-b border-gray-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/qomrade_svg.svg" alt="Qomrade" className="w-8 h-8 object-contain dark:invert-0 invert" />
                        <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Qomrade</span>
                    </Link>
                    <div className="flex items-center gap-6 text-sm font-semibold">
                        <Link to="/terms" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Terms of Service</Link>
                        <Link to="/" className="text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-full border border-gray-200 dark:border-white/20">Back to Home</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                {/* Page Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 text-sm font-bold mb-6 border border-blue-200 dark:border-blue-500/30">
                        <ShieldCheck size={16} />
                        <span>Data Protection & Privacy</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Privacy Policy</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Effective Date: April 2026 &bull; Last Updated: April 3, 2026</p>
                </div>

                {/* Table of Contents */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none mb-12">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Table of Contents</h3>
                    <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-300">
                        {[
                            'Introduction & Core Philosophy',
                            'Categories of Data Collected',
                            'Purpose & Legal Basis for Processing',
                            'Cookies, Analytics & Tracking Technologies',
                            'Strategic Data Sharing & Third Parties',
                            'International Data Transfers',
                            'Data Retention Policy',
                            'User Rights & Data Sovereignty',
                            'Children\'s Privacy',
                            'Security Infrastructure',
                            'Breach Notification Protocol',
                            'Policy Amendments & Versioning',
                            'Contact & Grievance Resolution'
                        ].map((item, i) => (
                            <li key={i} className="flex gap-2"><span className="text-gray-400 dark:text-white/40 font-bold">{i + 1}.</span> {item}</li>
                        ))}
                    </ol>
                </div>

                {/* Sections */}
                <div className="space-y-10">

                    {/* 1 */}
                    <Section icon={Eye} title="1. Introduction & Core Philosophy" color="blue">
                        <p>
                            At Qomrade, privacy is not an afterthought—it is a structural pillar. Our platform unifies marketplace transactions, group financial operations, community networking, and collaborative investment tools into a single integrated ecosystem. This consolidation inherently means we handle a breadth of sensitive user data spanning personal identifiers, financial instruments, behavioral patterns, and organizational affiliations.
                        </p>
                        <p>
                            We approach this responsibility through what strategist Richard Rumelt calls a "guiding policy"—a clear, unwavering principle that channels all subsequent decisions. <strong className="text-gray-900 dark:text-white">Our guiding policy on data is simple: collect only what is operationally necessary, encrypt everything in transit and at rest, never monetize raw user data through third-party brokerage, and give users absolute sovereignty over their digital footprint.</strong>
                        </p>
                        <p>
                            This Privacy Policy applies to all users of the Qomrade web application, mobile applications, APIs, and any affiliated services operated under the Qomrade brand. By creating an account or using any Qomrade service, you acknowledge and consent to the practices described herein.
                        </p>
                    </Section>

                    {/* 2 */}
                    <Section icon={Database} title="2. Categories of Data Collected" color="indigo">
                        <p>We categorize collected data into six distinct tiers, each with specific operational justification:</p>

                        <SubSection title="2.1 Identity & Account Data">
                            <BulletItem label="Full Legal Name">Required for KYC (Know Your Customer) compliance in financial transactions, escrow agreements, and investment instruments.</BulletItem>
                            <BulletItem label="Email Address & Phone Number">Primary authentication channels. Used for OTP verification, account recovery, and critical security notifications.</BulletItem>
                            <BulletItem label="Government-Issued ID">Collected exclusively during elevated verification tiers (e.g., opening investment kitties above regulatory thresholds, operating as a registered marketplace vendor). Stored in encrypted vaults with restricted access logs.</BulletItem>
                            <BulletItem label="Profile Information">Display name, biography, profile photo, and organizational affiliations. Voluntarily provided and publicly visible based on user privacy settings.</BulletItem>
                        </SubSection>

                        <SubSection title="2.2 Financial & Transactional Data">
                            <BulletItem label="Wallet Balances & Transaction History">Every deposit, withdrawal, peer-to-peer transfer, marketplace purchase, bill payment, standing order, and escrow settlement is logged with timestamps, counterparty references, and status indicators.</BulletItem>
                            <BulletItem label="Payment Method Tokens">We store tokenized representations of linked bank accounts, M-Pesa numbers, Stripe payment methods, and PayPal accounts. We never store raw card numbers, CVVs, or banking credentials directly.</BulletItem>
                            <BulletItem label="Group Financial Activity">Kitty contributions, investment pool allocations, group checkout splits, charity donation records, and organization treasury movements.</BulletItem>
                        </SubSection>

                        <SubSection title="2.3 Behavioral & Interaction Data">
                            <BulletItem label="Marketplace Behavior">Product views, search queries, cart additions, wishlist items, purchase frequency, review submissions, and supplier interaction patterns. Used for recommendation engine personalization.</BulletItem>
                            <BulletItem label="Community Engagement">Posts created, comments, reactions, event RSVPs, group memberships, gig applications, masterclass enrollments, and research hub participation metrics.</BulletItem>
                            <BulletItem label="Navigation Patterns">Pages visited, feature usage frequency, session durations, and click-through rates. Aggregated to improve UX and identify friction points.</BulletItem>
                        </SubSection>

                        <SubSection title="2.4 Device & Technical Data">
                            <BulletItem label="Device Identifiers">Hardware model, operating system version, browser type, screen resolution. Used for responsive rendering and fraud detection.</BulletItem>
                            <BulletItem label="IP Address & Geolocation">Logged for security audit trails, location-based service delivery (local restaurants, nearby events), and regulatory compliance with regional financial laws.</BulletItem>
                            <BulletItem label="Session Tokens & Authentication Logs">JWT tokens, login timestamps, failed authentication attempts, and device trust scores.</BulletItem>
                        </SubSection>

                        <SubSection title="2.5 Communication Data">
                            <BulletItem label="Support Interactions">Messages sent through the Contact form, in-app support chat, or email to support@qomrade.com are retained to maintain service quality and audit trails.</BulletItem>
                            <BulletItem label="Organization Messaging">Messages within organizational channels are encrypted end-to-end. Qomrade does not read, scan, or analyze private organizational communications for advertising purposes.</BulletItem>
                        </SubSection>

                        <SubSection title="2.6 Third-Party Authentication Data">
                            <BulletItem label="Social Login Providers">When authenticating via Google, Apple, or other OAuth providers, we receive only the minimum profile scope (name, email, profile photo). We do not request access to contacts, calendars, or drive storage.</BulletItem>
                        </SubSection>
                    </Section>

                    {/* 3 */}
                    <Section icon={Scale} title="3. Purpose & Legal Basis for Processing" color="emerald">
                        <p>Each category of data processing is grounded in a specific legal basis:</p>
                        <div className="overflow-x-auto mt-4">
                            <table className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white">
                                        <th className="text-left p-3 font-bold border-b border-gray-200 dark:border-white/10">Purpose</th>
                                        <th className="text-left p-3 font-bold border-b border-gray-200 dark:border-white/10">Legal Basis</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-gray-700 dark:text-gray-300">
                                    <tr><td className="p-3">Account creation & authentication</td><td className="p-3">Contractual necessity</td></tr>
                                    <tr><td className="p-3">Processing payments & financial transactions</td><td className="p-3">Contractual necessity / Legal obligation</td></tr>
                                    <tr><td className="p-3">KYC verification for financial instruments</td><td className="p-3">Legal obligation (AML/CFT regulations)</td></tr>
                                    <tr><td className="p-3">Fraud detection & anti-piracy enforcement</td><td className="p-3">Legitimate interest</td></tr>
                                    <tr><td className="p-3">Marketplace recommendation personalization</td><td className="p-3">Legitimate interest / Consent</td></tr>
                                    <tr><td className="p-3">Community feed curation & gig matching</td><td className="p-3">Legitimate interest</td></tr>
                                    <tr><td className="p-3">Analytics & platform improvement</td><td className="p-3">Legitimate interest</td></tr>
                                    <tr><td className="p-3">Marketing communications</td><td className="p-3">Explicit consent (opt-in)</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* 4 */}
                    <Section icon={Eye} title="4. Cookies, Analytics & Tracking Technologies" color="amber">
                        <SubSection title="4.1 Essential Cookies">
                            <p>Session authentication tokens, CSRF protection, and theme preferences. These cannot be disabled as they are required for core functionality.</p>
                        </SubSection>
                        <SubSection title="4.2 Analytics Cookies">
                            <p>We utilize privacy-respecting analytics to understand aggregate usage patterns. No individual-level tracking is shared with advertising networks. Users may opt out of analytics cookies through their account settings.</p>
                        </SubSection>
                        <SubSection title="4.3 Third-Party Embeds">
                            <p>Payment gateway iframes (Stripe, PayPal) may set their own cookies governed by their respective privacy policies. Qomrade does not control these cookies but selects partners with strong privacy commitments.</p>
                        </SubSection>
                    </Section>

                    {/* 5 */}
                    <Section icon={Share2} title="5. Strategic Data Sharing & Third Parties" color="purple">
                        <p className="font-semibold text-gray-900 dark:text-white">Qomrade does not sell, rent, or lease personal data to third parties for their independent marketing purposes. Period.</p>
                        <p>We share limited, purpose-specific data exclusively with the following categories of partners:</p>
                        <SubSection title="5.1 Payment Processors">
                            <p>Tokenized payment credentials and transaction details are shared with Stripe, PayPal, M-Pesa (Safaricom), and banking partners solely to execute, clear, and settle financial transactions initiated by you.</p>
                        </SubSection>
                        <SubSection title="5.2 Regulatory & Law Enforcement">
                            <p>Upon receipt of valid legal process (court orders, subpoenas, or binding regulatory requests), we may disclose identity and transactional data to competent authorities. This includes compliance with Anti-Money Laundering (AML), Counter-Financing of Terrorism (CFT), and tax reporting obligations in applicable jurisdictions.</p>
                        </SubSection>
                        <SubSection title="5.3 Infrastructure Providers">
                            <p>Cloud hosting, CDN, and database services process data on our behalf under strict Data Processing Agreements (DPAs) that prohibit independent use, require encryption, and mandate breach notification within 24 hours.</p>
                        </SubSection>
                        <SubSection title="5.4 Anti-Piracy & IP Protection Partners">
                            <p>Suspected piracy listings or counterfeit goods flagged on the marketplace may be reported to rights holders or anti-piracy organizations with relevant listing metadata (not buyer personal data) to support enforcement actions.</p>
                        </SubSection>
                    </Section>

                    {/* 6 */}
                    <Section icon={Globe} title="6. International Data Transfers" color="teal">
                        <p>Qomrade operates globally with infrastructure spanning multiple regions. When your data is transferred across borders, we ensure protection through: Standard Contractual Clauses (SCCs) approved by relevant data protection authorities, encryption in transit using TLS 1.3, and storage in facilities with SOC 2 Type II certification.</p>
                    </Section>

                    {/* 7 */}
                    <Section icon={Lock} title="7. Data Retention Policy" color="cyan">
                        <div className="overflow-x-auto mt-2">
                            <table className="w-full text-sm border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white">
                                        <th className="text-left p-3 font-bold border-b border-gray-200 dark:border-white/10">Data Category</th>
                                        <th className="text-left p-3 font-bold border-b border-gray-200 dark:border-white/10">Retention Period</th>
                                        <th className="text-left p-3 font-bold border-b border-gray-200 dark:border-white/10">Justification</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-gray-700 dark:text-gray-300">
                                    <tr><td className="p-3">Account profile data</td><td className="p-3">Duration of account + 30 days</td><td className="p-3">Grace period for reactivation</td></tr>
                                    <tr><td className="p-3">Financial transaction records</td><td className="p-3">7 years post-transaction</td><td className="p-3">AML/tax regulatory compliance</td></tr>
                                    <tr><td className="p-3">KYC identity documents</td><td className="p-3">5 years post-account closure</td><td className="p-3">Financial regulatory mandate</td></tr>
                                    <tr><td className="p-3">Behavioral analytics</td><td className="p-3">24 months (rolling)</td><td className="p-3">Recommendation relevance</td></tr>
                                    <tr><td className="p-3">Security/audit logs</td><td className="p-3">3 years</td><td className="p-3">Forensic investigation capability</td></tr>
                                    <tr><td className="p-3">Support communications</td><td className="p-3">2 years post-resolution</td><td className="p-3">Quality assurance</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </Section>

                    {/* 8 */}
                    <Section icon={Trash2} title="8. User Rights & Data Sovereignty" color="rose">
                        <p>You possess the following rights regardless of your jurisdiction:</p>
                        <SubSection title="8.1 Right to Access">
                            <p>Request a complete export of all personal data held by Qomrade in a machine-readable format (JSON/CSV). We will fulfill requests within 30 calendar days.</p>
                        </SubSection>
                        <SubSection title="8.2 Right to Rectification">
                            <p>Correct inaccurate personal data through your account settings or by contacting our data protection team.</p>
                        </SubSection>
                        <SubSection title={'8.3 Right to Erasure ("Right to be Forgotten")'}>
                            <p>Request complete deletion of your account and associated data. Upon verified request, we will purge all non-legally-mandated data within 30 days. Financial records retained under regulatory obligation will be anonymized where possible.</p>
                        </SubSection>
                        <SubSection title="8.4 Right to Data Portability">
                            <p>Transfer your data to another service provider using our structured export tools.</p>
                        </SubSection>
                        <SubSection title="8.5 Right to Object">
                            <p>Object to processing based on legitimate interest. We will cease processing unless we demonstrate compelling legitimate grounds that override your interests.</p>
                        </SubSection>
                        <SubSection title="8.6 Right to Restrict Processing">
                            <p>Request temporary restriction of data processing while disputes about data accuracy or processing legitimacy are resolved.</p>
                        </SubSection>
                    </Section>

                    {/* 9 */}
                    <Section icon={ShieldCheck} title="9. Children's Privacy" color="pink">
                        <p>
                            Qomrade services are not directed at individuals under the age of 16. We do not knowingly collect personal information from children. If we discover that a child under 16 has provided us with personal data, we will promptly delete such data and terminate the associated account. Parents or guardians who believe their child may have submitted information should contact us immediately at privacy@qomrade.com.
                        </p>
                    </Section>

                    {/* 10 */}
                    <Section icon={Lock} title="10. Security Infrastructure" color="emerald">
                        <p>We employ a defense-in-depth security architecture:</p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li><strong className="text-gray-900 dark:text-white">Encryption:</strong> AES-256 at rest, TLS 1.3 in transit for all data flows.</li>
                            <li><strong className="text-gray-900 dark:text-white">Authentication:</strong> Argon2id password hashing, optional TOTP-based two-factor authentication, and device trust scoring.</li>
                            <li><strong className="text-gray-900 dark:text-white">Access Controls:</strong> Role-based access control (RBAC) with principle of least privilege for all internal systems. No employee has blanket access to user financial data.</li>
                            <li><strong className="text-gray-900 dark:text-white">Monitoring:</strong> Real-time anomaly detection on authentication patterns, transaction volumes, and API access patterns.</li>
                            <li><strong className="text-gray-900 dark:text-white">Penetration Testing:</strong> Regular third-party security audits and responsible disclosure program.</li>
                        </ul>
                    </Section>

                    {/* 11 */}
                    <Section icon={Bell} title="11. Breach Notification Protocol" color="red">
                        <p>
                            In the event of a confirmed data breach affecting personal information, Qomrade commits to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-sm">
                            <li>Notifying affected users within <strong className="text-gray-900 dark:text-white">72 hours</strong> of confirmed discovery via email and in-app notification.</li>
                            <li>Reporting to relevant data protection authorities within mandated timeframes.</li>
                            <li>Providing clear, non-technical descriptions of: the nature of the breach, categories of data affected, approximate number of users impacted, measures taken to mitigate harm, and recommended user actions.</li>
                            <li>Publishing a post-incident report detailing root cause analysis and preventive measures implemented.</li>
                        </ul>
                    </Section>

                    {/* 12 */}
                    <Section icon={Globe} title="12. Policy Amendments & Versioning" color="slate">
                        <p>
                            We may update this Privacy Policy to reflect changes in our practices, technologies, legal requirements, or platform capabilities. When we make material changes, we will: notify users via email and prominent in-app notification at least 14 days before changes take effect, clearly highlight what has changed in a summary changelog, and maintain an archive of previous policy versions accessible upon request.
                        </p>
                        <p>
                            Continued use of Qomrade after the effective date of changes constitutes acceptance. Users who disagree with material changes may close their account and request data deletion.
                        </p>
                    </Section>

                    {/* 13 */}
                    <Section icon={Mail} title="13. Contact & Grievance Resolution" color="blue">
                        <p>For privacy-related inquiries, data requests, or grievances:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                            <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <h4 className="text-gray-900 dark:text-white font-bold mb-2">Data Protection Officer</h4>
                                <p>Email: <strong className="text-blue-600 dark:text-blue-300">privacy@qomrade.com</strong></p>
                                <p className="mt-1">Response time: Within 5 business days</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <h4 className="text-gray-900 dark:text-white font-bold mb-2">Supervisory Authority</h4>
                                <p>If unsatisfied with our response, you have the right to lodge a complaint with your local data protection authority.</p>
                            </div>
                        </div>
                    </Section>

                </div>

                {/* Footer Navigation */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Qomrade. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/terms" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Terms of Service</Link>
                        <Link to="/" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
