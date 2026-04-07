import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Users, ShoppingBag, CreditCard, ShieldAlert, AlertTriangle, Scale, Lightbulb, Globe, Users2, Target, Compass, Layers, BookOpen, Mail, Gavel } from 'lucide-react';

const Section = ({ icon: Icon, title, color = 'indigo', children }) => (
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 pl-4 border-l-2 border-indigo-500">{title}</h3>
        <div className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed space-y-3 pl-4">{children}</div>
    </div>
);

const BreachStep = ({ number, title, children }) => (
    <div className="flex gap-4 p-5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl">
        <span className="font-extrabold text-red-600 dark:text-red-400 text-xl mt-0.5 shrink-0">{number}</span>
        <div>
            <strong className="text-gray-900 dark:text-white block mb-2 text-base">{title}</strong>
            <p className="text-sm text-gray-700 dark:text-gray-300">{children}</p>
        </div>
    </div>
);

const TermsOfService = () => {
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
                        <Link to="/privacy" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Privacy Policy</Link>
                        <Link to="/" className="text-gray-700 dark:text-white/80 hover:text-gray-900 dark:hover:text-white transition-colors bg-gray-100 dark:bg-white/10 px-4 py-2 rounded-full border border-gray-200 dark:border-white/20">Back to Home</Link>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-6 pt-32 pb-24">
                {/* Page Header */}
                <div className="mb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 text-sm font-bold mb-6 border border-indigo-200 dark:border-indigo-500/30">
                        <FileText size={16} />
                        <span>Legal Agreement</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">Terms of Service</h1>
                    <p className="text-gray-600 dark:text-gray-400 font-medium text-lg">Effective Date: April 2026 &bull; Last Updated: April 3, 2026</p>
                </div>

                {/* Table of Contents */}
                <div className="bg-white dark:bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none mb-12">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Table of Contents</h3>
                    <ol className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-indigo-300">
                        {[
                            'Acceptance & Eligibility',
                            'Our Strategic Diagnosis: The Problem We Solve',
                            'Our Guiding Policy & Platform Vision',
                            'Coherent Actions: The Solutions We Provide',
                            'Community Guidelines & Code of Conduct',
                            'Anti-Piracy & Intellectual Property Doctrine',
                            'Marketplace Regulations',
                            'Financial Services & Risk Disclosures',
                            'Group Finance: Kitties, Investments & Escrow',
                            'Breach of Contract & Enforcement Protocol',
                            'Account Termination & Consequences',
                            'Platform Growth Vision & Community Building',
                            'Intellectual Property Ownership',
                            'Limitation of Liability & Disclaimers',
                            'Dispute Resolution & Governing Law',
                            'Amendments & User Notification',
                            'Contact Information'
                        ].map((item, i) => (
                            <li key={i} className="flex gap-2"><span className="text-gray-400 dark:text-white/40 font-bold">{i + 1}.</span> {item}</li>
                        ))}
                    </ol>
                </div>

                {/* Sections */}
                <div className="space-y-10">

                    {/* 1 */}
                    <Section icon={FileText} title="1. Acceptance & Eligibility" color="indigo">
                        <p>
                            By accessing or using any Qomrade service—including our web application, mobile applications, APIs, marketplace, financial tools, or community features—you enter into a legally binding agreement governed by these Terms of Service. Continued usage constitutes ongoing acceptance.
                        </p>
                        <SubSection title="1.1 Eligibility Requirements">
                            <p>You must be at least 16 years of age to create an account. Users under 18 may not access financial services (wallet, investments, escrow) without verifiable parental or guardian consent. You must provide accurate, current, and complete information during registration and maintain the accuracy of such information. You may not create accounts on behalf of another person without their explicit authorization.</p>
                        </SubSection>
                        <SubSection title="1.2 Account Responsibility">
                            <p>You are solely responsible for maintaining the confidentiality of your authentication credentials. Any activity conducted under your account is your responsibility. You must immediately notify Qomrade of any unauthorized access or security breach via security@qomrade.com.</p>
                        </SubSection>
                    </Section>

                    {/* 2 - Rumelt Diagnosis */}
                    <Section icon={Target} title="2. Our Strategic Diagnosis: The Problem We Solve" color="red">
                        <p>
                            Drawing from Richard Rumelt's framework in <em className="text-gray-900 dark:text-white">Good Strategy / Bad Strategy</em>, a good strategy begins with an honest <strong className="text-gray-900 dark:text-white">diagnosis</strong>—a clear-eyed identification of the critical challenge. Qomrade's diagnosis of the modern digital landscape reveals three interconnected crises:
                        </p>
                        <SubSection title="2.1 The Fragmentation Crisis">
                            <p>Today's digital life forces individuals and communities to juggle dozens of disconnected applications: one for banking, another for shopping, separate apps for community management, investment tracking, event coordination, and bill payments. This fragmentation wastes time, increases security exposure (more accounts = more attack surfaces), and fundamentally prevents the synergies that emerge when financial, commercial, and social activities are natively interconnected.</p>
                        </SubSection>
                        <SubSection title="2.2 The Purchasing Power Deficit">
                            <p>Individuals acting alone in commercial markets have limited bargaining power. Small order quantities mean higher unit costs, no leverage for bulk discounts, and zero ability to negotiate favorable terms. Communities and organizations that could pool their purchasing power have no integrated infrastructure to do so—resulting in millions of people paying more than they should for everyday goods and services.</p>
                        </SubSection>
                        <SubSection title="2.3 The Digital Piracy Epidemic">
                            <p>Fragmented marketplaces with inconsistent enforcement create fertile ground for counterfeit goods, pirated digital content, and intellectual property theft. Individual platforms lack the holistic view needed to identify and eliminate bad actors who simply migrate from one marketplace to another. The absence of unified identity verification across platforms enables repeat offenders to operate with impunity.</p>
                        </SubSection>
                    </Section>

                    {/* 3 - Rumelt Guiding Policy */}
                    <Section icon={Compass} title="3. Our Guiding Policy & Platform Vision" color="blue">
                        <p>
                            Rumelt defines a <strong className="text-gray-900 dark:text-white">guiding policy</strong> as the overarching approach chosen to address the diagnosis—not a list of goals, but a clear directional choice that constrains and channels all subsequent decisions. Qomrade's guiding policy is:
                        </p>
                        <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl p-6 mt-4">
                            <p className="text-gray-900 dark:text-white text-lg font-bold italic text-center">
                                "Build a single, natively integrated ecosystem where marketplace commerce, financial operations, and community collaboration reinforce each other—creating compound value that fragmented alternatives structurally cannot match."
                            </p>
                        </div>
                        <SubSection title="3.1 Integration Over Aggregation">
                            <p>We do not simply link to external services. We build native, deeply integrated capabilities where your wallet balance directly powers your marketplace purchases, your organization's treasury seamlessly funds group investments, and your community reputation unlocks better marketplace opportunities. Every feature is designed to strengthen every other feature.</p>
                        </SubSection>
                        <SubSection title="3.2 Collective Advantage Over Individual Isolation">
                            <p>By enabling collaborative purchase (group buying), collaborative savings (kitties and pooled funds), and collaborative investment (group investment vehicles), we structurally shift the balance of power from corporations and middlemen back to organized communities of consumers.</p>
                        </SubSection>
                        <SubSection title="3.3 Verified Trust Over Anonymous Chaos">
                            <p>Our unified identity system means every marketplace seller, every organization admin, every financial counterparty operates under a verified identity. This makes piracy, fraud, and scams fundamentally harder to execute and easier to detect and prosecute.</p>
                        </SubSection>
                    </Section>

                    {/* 4 - Rumelt Coherent Actions */}
                    <Section icon={Layers} title="4. Coherent Actions: The Solutions We Provide" color="emerald">
                        <p>
                            Rumelt's third element is <strong className="text-gray-900 dark:text-white">coherent actions</strong>—specific, coordinated steps that execute the guiding policy. Each must reinforce the others. Qomrade's coherent actions include:
                        </p>
                        <SubSection title="4.1 Unified Marketplace">
                            <p>A single commercial hub where users shop for global products, order local food delivery, book professional services, and engage establishment-based experiences (hotels, restaurants)—all powered by the integrated Qomrade wallet. Verified seller identities and community-driven reviews create accountability that standalone marketplaces cannot replicate.</p>
                        </SubSection>
                        <SubSection title="4.2 Integrated Financial Services">
                            <p>A comprehensive financial layer including: digital wallet with multi-currency support, peer-to-peer transfers, bill payments and standing orders, escrow services for high-value transactions, and connections to M-Pesa, banks, Stripe, and PayPal. By integrating payments directly into commerce and community, we eliminate the friction and fees of moving money between disconnected systems.</p>
                        </SubSection>
                        <SubSection title="4.3 Collaborative Financial Instruments">
                            <p>Group financial tools—kitties (pooled savings), group investments (MMF, Bonds, Stocks, Startup equity), charity drives, and group checkout—enable communities to leverage collective purchasing power. A group of 50 members buying in bulk achieves pricing that no individual buyer could negotiate.</p>
                        </SubSection>
                        <SubSection title="4.4 Community & Organizational Infrastructure">
                            <p>Native tools for creating and managing organizations, hosting events and masterclasses, posting and applying to career opportunities, conducting research collaborations, and building professional networks. These are not bolted-on social features—they are structurally integrated with financial and commercial operations.</p>
                        </SubSection>
                        <SubSection title="4.5 Anti-Piracy Enforcement">
                            <p>Unified identity verification, AI-powered listing analysis, community-driven reporting, and cross-functional enforcement (marketplace ban + financial freeze + community restriction) create a comprehensive anti-piracy posture that fragmented platforms cannot achieve.</p>
                        </SubSection>
                    </Section>

                    {/* 5 */}
                    <Section icon={Users} title="5. Community Guidelines & Code of Conduct" color="purple">
                        <p>
                            Qomrade is built on the principle that social platforms should generate tangible value—not just engagement metrics. Our community standards reflect this conviction:
                        </p>
                        <SubSection title="5.1 Respectful Engagement">
                            <p>All interactions—marketplace reviews, community posts, organizational discussions, event comments—must maintain basic human dignity. Discriminatory language targeting race, ethnicity, gender, sexual orientation, religion, disability, or national origin is prohibited. Constructive criticism is welcome; personal attacks are not.</p>
                        </SubSection>
                        <SubSection title="5.2 Authentic Representation">
                            <p>Users must accurately represent themselves, their organizations, and their offerings. Impersonating other users, creating fake organizations, misrepresenting product quality, or fabricating credentials constitutes fraud. Marketplace sellers must accurately describe product condition, origin, and specifications.</p>
                        </SubSection>
                        <SubSection title="5.3 Collaborative Spirit">
                            <p>Group financial operations (kitties, group investments, group checkout) require good-faith participation. Deliberately sabotaging group financial instruments, refusing to honor approved group checkout commitments, or manipulating voting mechanisms within organizations undermines the trust infrastructure that benefits all users.</p>
                        </SubSection>
                        <SubSection title="5.4 Content Standards">
                            <p>Users may not post, share, or distribute: content promoting violence or self-harm, sexually explicit material, spam or unsolicited commercial messages, misleading health or financial claims, content that violates local laws in any jurisdiction where Qomrade operates, or personal information of others without their explicit consent (doxxing).</p>
                        </SubSection>
                        <SubSection title="5.5 Reporting & Moderation">
                            <p>All users have access to reporting tools for flagging violations. Reports are reviewed by our Trust & Safety team within 48 hours. Reporters' identities are kept confidential. False reporting intended to harass other users is itself a violation.</p>
                        </SubSection>
                    </Section>

                    {/* 6 */}
                    <Section icon={ShieldAlert} title="6. Anti-Piracy & Intellectual Property Doctrine" color="red">
                        <p className="text-gray-900 dark:text-white font-semibold">Joining the fight against digital piracy is a foundational platform axiom, not a peripheral policy.</p>
                        <SubSection title="6.1 Prohibited Activities">
                            <p>The following are strictly prohibited and will result in immediate enforcement action:</p>
                            <ul className="list-disc pl-6 space-y-2 mt-2">
                                <li>Selling, distributing, or advertising pirated software, unauthorized copies of films, music, books, or other copyrighted digital content.</li>
                                <li>Listing counterfeit physical goods—products bearing trademarks, logos, or branding of rights holders without authorization.</li>
                                <li>Providing tools, services, or instructions designed to circumvent digital rights management (DRM) systems.</li>
                                <li>Using Qomrade's organizational infrastructure to coordinate piracy networks or content distribution rings.</li>
                            </ul>
                        </SubSection>
                        <SubSection title="6.2 Detection & Enforcement">
                            <p>We employ multi-layered detection including: automated listing analysis using image recognition and text classification, community-driven reporting with dedicated piracy reporting categories, partnership with rights holders and industry anti-piracy organizations, and cross-referencing seller activity patterns across marketplace, financial, and community domains.</p>
                        </SubSection>
                        <SubSection title="6.3 DMCA & Takedown Procedures">
                            <p>Qomrade operates a DMCA-compliant notice-and-takedown process. Rights holders may submit takedown requests to ip@qomrade.com with: identification of the copyrighted work, identification of the infringing material and its location on Qomrade, a good-faith statement of unauthorized use, and a statement of accuracy under penalty of perjury. We will process valid takedown requests within 24 business hours.</p>
                        </SubSection>
                    </Section>

                    {/* 7 */}
                    <Section icon={ShoppingBag} title="7. Marketplace Regulations" color="amber">
                        <SubSection title="7.1 Seller Obligations">
                            <p>Marketplace sellers agree to: accurately describe all products and services, fulfill orders within stated delivery timelines, process refunds for items materially different from their listing descriptions, maintain accurate inventory counts to prevent overselling, and comply with all applicable consumer protection laws.</p>
                        </SubSection>
                        <SubSection title="7.2 Buyer Protections">
                            <p>Buyers are protected by: Qomrade's escrow system for transactions above specified thresholds, mandatory seller response windows (48 hours) for disputes, community review transparency (sellers cannot delete or manipulate reviews), and clear escalation paths to Qomrade's Resolution Center for unresolved disputes.</p>
                        </SubSection>
                        <SubSection title="7.3 Prohibited Listings">
                            <p>The following may not be listed: weapons, ammunition, or explosives, controlled substances and drug paraphernalia, stolen property, counterfeit currency or financial instruments, products violating export controls or sanctions, and any item prohibited by law in the seller's or buyer's jurisdiction.</p>
                        </SubSection>
                    </Section>

                    {/* 8 */}
                    <Section icon={CreditCard} title="8. Financial Services & Risk Disclosures" color="emerald">
                        <SubSection title="8.1 Wallet Services">
                            <p>The Qomrade wallet is a digital stored-value instrument. It is not a bank account and is not covered by deposit insurance schemes. Wallet balances earn no interest. Qomrade reserves the right to impose transaction limits, velocity controls, and enhanced verification requirements in compliance with applicable financial regulations.</p>
                        </SubSection>
                        <SubSection title="8.2 Payment Processing">
                            <p>Qomrade facilitates payments but is not the ultimate processor for external payment methods. Transactions involving M-Pesa, bank transfers, Stripe, or PayPal are subject to those providers' terms, fees, and processing timelines. Qomrade is not responsible for delays or failures originating from third-party payment infrastructure.</p>
                        </SubSection>
                        <SubSection title="8.3 Standing Orders & Bill Payments">
                            <p>Automated standing orders execute based on user-defined schedules. Users are responsible for maintaining sufficient wallet balance to cover scheduled payments. Failed standing orders due to insufficient funds will generate notifications but will not automatically retry. Users must re-initiate failed payments manually.</p>
                        </SubSection>
                    </Section>

                    {/* 9 */}
                    <Section icon={Users2} title="9. Group Finance: Kitties, Investments & Escrow" color="teal">
                        <SubSection title="9.1 Kitties (Pooled Savings)">
                            <p>Kitties are group savings instruments with defined rules for contributions and withdrawals. By joining a kitty, you agree to the specific terms set by the kitty administrator including contribution schedules, withdrawal conditions, and governance rules. Qomrade facilitates kitty operations but is not a fiduciary and does not guarantee returns.</p>
                        </SubSection>
                        <SubSection title="9.2 Group Investments">
                            <p className="font-semibold text-gray-900 dark:text-white">IMPORTANT RISK DISCLOSURE: All investments, including MMF, Bonds, Stocks, and Startup equity available through Qomrade, carry inherent risk of partial or total loss of principal. Past performance does not guarantee future results. Qomrade is a technology facilitator, not a registered investment advisor. Users should consult qualified financial advisors before making investment decisions.</p>
                            <p>Group investment decisions are governed by the organizational governance rules established by each group. Qomrade executes investment transactions as directed but does not provide investment advice, guarantee execution at specific prices, or assume liability for market losses.</p>
                        </SubSection>
                        <SubSection title="9.3 Escrow Services">
                            <p>Escrow protects both buyers and sellers in high-value transactions. Funds are held in segregated accounts and released only upon confirmed fulfillment of agreed conditions. Users agree to participate in good faith—manufacturing disputes to delay fund release, providing false delivery confirmation, or colluding to defraud counterparties constitutes severe marketplace abuse subject to the full enforcement protocol outlined in Section 10.</p>
                        </SubSection>
                    </Section>

                    {/* 10 - Breach Protocol */}
                    <Section icon={AlertTriangle} title="10. Breach of Contract & Enforcement Protocol" color="red">
                        <p>
                            Violation of these Terms triggers a graduated enforcement response. The severity of the response is proportional to the nature and impact of the violation:
                        </p>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-4">Tier 1: Warnings & Restrictions</h3>
                        <p className="text-sm mb-4">For first-time minor violations (e.g., borderline content, unintentional listing errors):</p>
                        <BreachStep number="1a" title="Written Warning">
                            A formal notification identifying the specific violation, the applicable rule, and the expected corrective action. Warning remains on account record for 12 months.
                        </BreachStep>
                        <div className="h-3" />
                        <BreachStep number="1b" title="Feature Restriction">
                            Temporary suspension of specific privileges (e.g., marketplace listing ability, community posting, event creation) for 7-30 days depending on violation severity.
                        </BreachStep>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-4">Tier 2: Account Suspension</h3>
                        <p className="text-sm mb-4">For repeat violations, serious community guideline breaches, or moderate financial misconduct:</p>
                        <BreachStep number="2a" title="Temporary Account Suspension (7-90 days)">
                            Full account access is suspended. The user cannot transact, post, or participate in any platform activity. Pending standing orders and active escrows are frozen and handled on a case-by-case basis. Group memberships are paused but not terminated.
                        </BreachStep>
                        <div className="h-3" />
                        <BreachStep number="2b" title="Financial Hold">
                            Wallet withdrawals are temporarily blocked during the investigation period. Internal transfers to other users are disabled. Funds remain the property of the user but are inaccessible until the investigation concludes and any remediation is applied.
                        </BreachStep>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-4">Tier 3: Permanent Termination & Legal Action</h3>
                        <p className="text-sm mb-4">For piracy distribution, organized fraud, money laundering, or severe repeated violations:</p>
                        <BreachStep number="3a" title="Permanent Account Termination">
                            Irrevocable closure of all accounts associated with the user. All marketplace listings are removed. Organization admin roles are transferred to co-admins or dissolved. The user is permanently banned from creating new accounts.
                        </BreachStep>
                        <div className="h-3" />
                        <BreachStep number="3b" title="Financial Forfeiture & Quarantine">
                            Funds demonstrably connected to prohibited activities (e.g., proceeds from pirated content sales, fraudulent escrow manipulation) are quarantined pending forensic review. Legitimate funds are released to the user within 90 days of account closure, minus any damages owed to affected parties as determined by our Resolution Center.
                        </BreachStep>
                        <div className="h-3" />
                        <BreachStep number="3c" title="Legal Referral & Authority Handoff">
                            For violations constituting criminal activity (fraud, money laundering, large-scale piracy distribution, intellectual property theft at commercial scale), comprehensive evidence packages are compiled and submitted to relevant law enforcement and regulatory authorities in applicable jurisdictions.
                        </BreachStep>

                        <SubSection title="10.4 Appeals Process">
                            <p>Users subject to Tier 2 or Tier 3 enforcement may submit a written appeal within 30 days to appeals@qomrade.com. Appeals are reviewed by a senior Trust & Safety panel independent of the original enforcement decision. Appeal decisions are issued within 15 business days and are final.</p>
                        </SubSection>
                    </Section>

                    {/* 11 */}
                    <Section icon={Gavel} title="11. Account Termination & Consequences" color="orange">
                        <SubSection title="11.1 Voluntary Termination">
                            <p>Users may close their account at any time through account settings. Upon closure: remaining wallet balance will be transferred to a designated external payment method within 14 business days, active marketplace listings will be deactivated, group memberships will be exited (with financial obligations settled first), and personal data will be handled according to our Privacy Policy retention schedule.</p>
                        </SubSection>
                        <SubSection title="11.2 Involuntary Termination">
                            <p>Qomrade reserves the right to suspend or terminate accounts that violate these Terms, remain inactive for 24 consecutive months, are associated with sanctioned individuals or entities, or are the subject of valid law enforcement requests.</p>
                        </SubSection>
                    </Section>

                    {/* 12 - Growth Vision */}
                    <Section icon={Lightbulb} title="12. Platform Growth Vision & Community Building" color="yellow">
                        <p>
                            Qomrade is not a static product—it is a continuously evolving ecosystem designed to compound value over time. In the spirit of strategic clarity, we transparently share our vision for growth:
                        </p>
                        <SubSection title="12.1 Expanding Collaborative Commerce">
                            <p>We envision a future where group purchasing is the default, not the exception. As our community grows, we will develop increasingly sophisticated tools for: bulk purchase negotiation with manufacturers, cooperative ownership models for high-value assets, community-negotiated service contracts (insurance, telecommunications, utilities), and local producer cooperatives connecting directly to organized consumer groups.</p>
                        </SubSection>
                        <SubSection title="12.2 Deepening Financial Inclusion">
                            <p>We aim to serve as a gateway to financial services for underbanked populations. Our roadmap includes: micro-lending circles with community-based credit scoring, savings goal automation with behavioral incentives, simplified investment education integrated into the platform experience, and insurance products designed for community groups.</p>
                        </SubSection>
                        <SubSection title="12.3 Strengthening Community Infrastructure">
                            <p>We are building the digital equivalent of a town square—a place where commerce, governance, and social connection naturally converge. Future capabilities include: democratic governance tools for community organizations, transparent treasury management for non-profits and cooperatives, skill-sharing marketplaces that leverage community trust networks, and mentorship matching powered by organizational affiliations and career history.</p>
                        </SubSection>
                        <SubSection title="12.4 Scaling Anti-Piracy Impact">
                            <p>As our user base grows, our anti-piracy capabilities compound. More verified identities mean fewer hiding spots for bad actors. More transaction data means better fraud detection models. More community reporters mean faster identification of infringing content. We commit to sharing anonymized enforcement insights with industry partners to improve ecosystem-wide protection.</p>
                        </SubSection>
                    </Section>

                    {/* 13 */}
                    <Section icon={BookOpen} title="13. Intellectual Property Ownership" color="cyan">
                        <SubSection title="13.1 Qomrade's IP">
                            <p>All proprietary technology, algorithms, branding (including the Qomrade growth emblem), user interface designs, and documentation are the exclusive intellectual property of Qomrade. Unauthorized reproduction, reverse engineering, or commercial exploitation of any Qomrade IP constitutes theft and will be pursued through legal channels.</p>
                        </SubSection>
                        <SubSection title="13.2 User-Generated Content">
                            <p>Content created by users (marketplace listings, reviews, community posts, event descriptions, gig postings) remains the intellectual property of the user. By posting content on Qomrade, you grant us a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content within the platform context. This license terminates when you delete the content or close your account.</p>
                        </SubSection>
                    </Section>

                    {/* 14 */}
                    <Section icon={Scale} title="14. Limitation of Liability & Disclaimers" color="slate">
                        <SubSection title="14.1 Service Availability">
                            <p>Qomrade strives for high availability but does not guarantee uninterrupted service. Scheduled maintenance, infrastructure failures, third-party service outages, or force majeure events may cause temporary service disruptions. We are not liable for losses resulting from service unavailability, including missed transactions, expired marketplace offers, or delayed standing orders.</p>
                        </SubSection>
                        <SubSection title="14.2 Third-Party Services">
                            <p>Integration with external payment processors, banking partners, and authentication providers means portions of the user experience depend on systems outside Qomrade's direct control. We are not liable for failures, delays, or data handling practices of third-party services, though we select partners with rigorous security and reliability standards.</p>
                        </SubSection>
                        <SubSection title="14.3 Investment Losses">
                            <p>Financial markets are inherently risky. Qomrade provides the infrastructure for group and individual investment but does not provide financial advice, guarantee returns, or indemnify users against market losses. All investment decisions are made at the user's own risk and discretion.</p>
                        </SubSection>
                        <SubSection title="14.4 Maximum Liability">
                            <p>To the maximum extent permitted by applicable law, Qomrade's total aggregate liability for any claims arising from or related to these Terms shall not exceed the greater of (a) the total fees paid by the user to Qomrade in the 12 months preceding the claim, or (b) USD $100.</p>
                        </SubSection>
                    </Section>

                    {/* 15 */}
                    <Section icon={Globe} title="15. Dispute Resolution & Governing Law" color="indigo">
                        <SubSection title="15.1 Informal Resolution">
                            <p>Before initiating formal proceedings, both parties agree to attempt good-faith resolution through Qomrade's internal Resolution Center. Most disputes can be resolved within 30 days through structured mediation.</p>
                        </SubSection>
                        <SubSection title="15.2 Binding Arbitration">
                            <p>If informal resolution fails, disputes shall be resolved through binding arbitration administered under the UNCITRAL Arbitration Rules. The arbitration shall be conducted in English, with the seat of arbitration in Nairobi, Kenya. Each party bears its own costs of arbitration unless the arbitrator determines otherwise.</p>
                        </SubSection>
                        <SubSection title="15.3 Governing Law">
                            <p>These Terms are governed by and construed in accordance with the laws of the Republic of Kenya, without regard to conflict of law principles. Users in other jurisdictions retain any mandatory consumer protection rights granted by their local laws that cannot be waived by contract.</p>
                        </SubSection>
                    </Section>

                    {/* 16 */}
                    <Section icon={FileText} title="16. Amendments & User Notification" color="gray">
                        <p>
                            We may modify these Terms to reflect platform evolution, legal developments, or operational changes. For material changes, we will: provide at least 14 days' advance notice via email and in-app notification, publish a clear "What Changed" summary alongside updated Terms, and maintain an archive of previous versions with effective dates.
                        </p>
                        <p>
                            Continued use after the effective date of changes constitutes acceptance. Users who disagree may terminate their account with full data deletion rights as specified in our Privacy Policy.
                        </p>
                    </Section>

                    {/* 17 */}
                    <Section icon={Mail} title="17. Contact Information" color="blue">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                            <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <h4 className="text-gray-900 dark:text-white font-bold mb-2">General Legal</h4>
                                <p className="text-blue-600 dark:text-blue-300 font-semibold">legal@qomrade.com</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <h4 className="text-gray-900 dark:text-white font-bold mb-2">Trust & Safety</h4>
                                <p className="text-blue-600 dark:text-blue-300 font-semibold">safety@qomrade.com</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-white/5 p-5 rounded-2xl border border-gray-200 dark:border-white/10">
                                <h4 className="text-gray-900 dark:text-white font-bold mb-2">IP & Anti-Piracy</h4>
                                <p className="text-blue-600 dark:text-blue-300 font-semibold">ip@qomrade.com</p>
                            </div>
                        </div>
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 text-center text-sm">
                            <p className="text-gray-600 dark:text-gray-400">Qomrade Global Headquarters &bull; Nairobi, Kenya</p>
                            <p className="text-gray-500 mt-1">Operating globally to improve interconnectedness and maximize the efficiency of social platforms.</p>
                        </div>
                    </Section>

                </div>

                {/* Footer Navigation */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Qomrade. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link to="/privacy" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Privacy Policy</Link>
                        <Link to="/" className="text-gray-500 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-medium">Home</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
