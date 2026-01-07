/**
 * Example Usage Component - Shows how to use all new portal features
 */
import React from 'react';
import usePortalNavigation from '../hooks/usePortalNavigation';
import EntityStatusBadge from '../components/common/EntityStatusBadge';
import QuickActionMenu from '../components/common/QuickActionMenu';

const PortalExamplePage = () => {
    const portal = usePortalNavigation();

    return (
        <div className="example-page" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <h1>Portal Features Example</h1>

            {/* Navigation Examples */}
            <section style={{ margin: '2rem 0' }}>
                <h2>Quick Navigation</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button onClick={portal.createInstitution} style={buttonStyle}>
                        Create Institution
                    </button>
                    <button onClick={portal.createOrganization} style={buttonStyle}>
                        Create Organization
                    </button>
                    <button onClick={portal.setupTOTP} style={buttonStyle}>
                        Setup 2FA
                    </button>
                    <button onClick={portal.checkout} style={buttonStyle}>
                        Make Payment
                    </button>
                    <button onClick={portal.convertToAnnouncement} style={buttonStyle}>
                        Convert Service
                    </button>
                </div>
            </section>

            {/* Status Badge Examples */}
            <section style={{ margin: '2rem 0' }}>
                <h2>Status Badges</h2>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <EntityStatusBadge status="pending" />
                    <EntityStatusBadge status="email_verified" />
                    <EntityStatusBadge status="submitted" />
                    <EntityStatusBadge status="verified" />
                    <EntityStatusBadge status="rejected" />
                </div>

                <h3 style={{ marginTop: '1rem' }}>Different Sizes</h3>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <EntityStatusBadge status="verified" size="small" />
                    <EntityStatusBadge status="verified" size="medium" />
                    <EntityStatusBadge status="verified" size="large" />
                </div>
            </section>

            {/* Feature Routes */}
            <section style={{ margin: '2rem 0' }}>
                <h2>Available Routes</h2>
                <ul style={{ lineHeight: '2' }}>
                    <li><code>/institutions/portal/create</code> - Create institution wizard</li>
                    <li><code>/institutions/portal/:id/verify</code> - Institution verification dashboard</li>
                    <li><code>/organizations/portal/create</code> - Create organization wizard</li>
                    <li><code>/organizations/portal/:id/verify</code> - Organization verification dashboard</li>
                    <li><code>/settings/security/totp</code> - Setup TOTP 2FA</li>
                    <li><code>/payments/checkout</code> - Payment processing</li>
                    <li><code>/announcements/convert</code> - Service converter</li>
                </ul>
            </section>

            {/* Quick Action Menu - shown at bottom right */}
            <QuickActionMenu />

            <div style={{ marginTop: '3rem', padding: '1.5rem', background: '#f0f7ff', borderRadius: '12px' }}>
                <h3>🎉 All Features Ready!</h3>
                <p>All portal components are integrated and accessible. Use the floating action button (bottom right) for quick access.</p>
            </div>
        </div>
    );
};

const buttonStyle = {
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'transform 0.2s'
};

export default PortalExamplePage;
