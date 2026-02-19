import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { Users, ArrowLeft, Target, DollarSign, Calendar, UserPlus, X, Mail, CheckCircle } from 'lucide-react';
import paymentsService from '../../services/payments.service';

const CreatePaymentGroup = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Group Details, 2: Invite Members, 3: Confirmation
    const [invitedMembers, setInvitedMembers] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [inviteError, setInviteError] = useState('');
    const [createdGroup, setCreatedGroup] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [formError, setFormError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        target_amount: '',
        contribution_type: 'fixed',
        contribution_amount: '',
        frequency: 'monthly',
        deadline: '',
        is_public: true,
        requires_approval: true,
        max_capacity: 10,
        allow_anonymous: false,
    });

    const addMember = () => {
        setInviteError('');
        const email = newEmail.trim().toLowerCase();

        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setInviteError('Please enter a valid email address');
            return;
        }
        if (invitedMembers.some(m => m.email === email)) {
            setInviteError('This email is already added');
            return;
        }

        setInvitedMembers([...invitedMembers, { email, status: 'pending' }]);
        setNewEmail('');
    };

    const removeMember = (email) => {
        setInvitedMembers(invitedMembers.filter(m => m.email !== email));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        setLoading(true);
        setFormError('');
        try {
            const payload = {
                ...formData,
                target_amount: parseFloat(formData.target_amount) || 0,
                contribution_amount: parseFloat(formData.contribution_amount) || 0,
                max_capacity: parseInt(formData.max_capacity) || 10,
            };

            const group = await paymentsService.createPaymentGroup(payload);
            setCreatedGroup(group);

            // Send invitations
            for (const member of invitedMembers) {
                try {
                    await paymentsService.inviteToGroup(group.id, member.email);
                    setInvitedMembers(prev =>
                        prev.map(m => m.email === member.email ? { ...m, status: 'sent' } : m)
                    );
                } catch (err) {
                    setInvitedMembers(prev =>
                        prev.map(m => m.email === member.email ? { ...m, status: 'failed' } : m)
                    );
                }
            }

            setStep(3);
            setShowSuccessModal(true);
        } catch (error) {
            console.error('Failed to create payment group:', error);
            // Extract descriptive error message from backend
            const data = error.response?.data;
            let msg = 'Failed to create payment group. Please try again.';
            if (typeof data === 'string') {
                msg = data;
            } else if (Array.isArray(data)) {
                msg = data.join(' ');
            } else if (data?.detail) {
                msg = data.detail;
            } else if (data && typeof data === 'object') {
                // Handle DRF ValidationError → { field: [errors] }
                const parts = Object.entries(data).map(([key, val]) => {
                    const errText = Array.isArray(val) ? val.join(', ') : String(val);
                    return key === 'non_field_errors' ? errText : `${key}: ${errText}`;
                });
                if (parts.length) msg = parts.join(' | ');
            }
            setFormError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleFinish = () => {
        if (formData.group_type === 'piggy_bank') {
            navigate('/piggy-banks');
        } else {
            navigate('/payments/groups');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => step > 1 ? setStep(step - 1) : navigate('/payments')}
                    className="p-2 hover:bg-secondary/10 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Create Payment Group</h1>
                    <p className="text-secondary mt-1">
                        {step === 1 && 'Set up a group savings goal or contribution pool'}
                        {step === 2 && 'Invite members to your payment group'}
                        {step === 3 && 'Group created successfully!'}
                    </p>
                </div>
            </div>

            {/* Inline Error Banner */}
            {formError && (
                <div style={{
                    background: 'var(--color-error-bg, #fef2f2)',
                    border: '1px solid var(--color-error, #ef4444)',
                    borderRadius: '0.75rem',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    color: 'var(--color-error, #dc2626)',
                    fontSize: '0.9rem',
                    lineHeight: '1.4',
                }}>
                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>⚠️</span>
                    <span style={{ flex: 1 }}>{formError}</span>
                    <button
                        onClick={() => setFormError('')}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.25rem', padding: 0, lineHeight: 1 }}
                    >×</button>
                </div>
            )}

            {/* Progress Steps */}
            <div className="flex items-center gap-2">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${s < step ? 'bg-green-500 text-white' :
                            s === step ? 'bg-primary text-white' :
                                'bg-tertiary/20 text-secondary'
                            }`}>
                            {s < step ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && (
                            <div className={`flex-1 h-1 ${s < step ? 'bg-green-500' : 'bg-tertiary/20'}`} />
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Step 1: Group Details */}
            {step === 1 && (
                <Card>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Group Details
                                </h3>

                                <Input
                                    label="Group Name *"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Team Vacation Fund"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        placeholder="Describe the purpose of this payment group..."
                                        className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                                    />
                                </div>

                                <Input
                                    label="Maximum Members"
                                    type="number"
                                    min="2"
                                    max="50"
                                    value={formData.max_capacity}
                                    onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value })}
                                    placeholder="10"
                                />

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-1">Group Type</label>
                                    <select
                                        value={formData.group_type || 'standard'}
                                        onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
                                        className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    >
                                        <option value="standard">Standard Group</option>
                                        <option value="piggy_bank">Piggy Bank Group</option>
                                    </select>
                                </div>


                            </div>

                            {/* Financial Settings */}
                            <div className="space-y-4 pt-4 border-t border-theme">
                                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                    <Target className="w-5 h-5 text-primary" />
                                    Financial Settings
                                </h3>

                                <Input
                                    label="Target Amount"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.target_amount}
                                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                                    placeholder="e.g., 1000.00"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Contribution Type</label>
                                        <select
                                            value={formData.contribution_type}
                                            onChange={(e) => setFormData({ ...formData, contribution_type: e.target.value })}
                                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        >
                                            <option value="fixed">Fixed Amount</option>
                                            <option value="flexible">Flexible</option>
                                            <option value="percentage">Percentage</option>
                                        </select>
                                    </div>

                                    <Input
                                        label="Contribution Amount"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.contribution_amount}
                                        onChange={(e) => setFormData({ ...formData, contribution_amount: e.target.value })}
                                        placeholder="e.g., 50.00"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-1">Frequency</label>
                                        <select
                                            value={formData.frequency}
                                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                            className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="once">One-time</option>
                                        </select>
                                    </div>

                                    <Input
                                        label="Deadline"
                                        type="date"
                                        value={formData.deadline}
                                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Settings */}
                            <div className="space-y-4 pt-4 border-t border-theme">
                                <h3 className="text-lg font-semibold text-primary">Settings</h3>

                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="is_public"
                                            checked={formData.is_public}
                                            onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                                            className="w-4 h-4 text-primary border-theme rounded focus:ring-primary"
                                        />
                                        <label htmlFor="is_public" className="text-sm text-secondary">
                                            Make this group public (visible to all users)
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="requires_approval"
                                            checked={formData.requires_approval}
                                            onChange={(e) => setFormData({ ...formData, requires_approval: e.target.checked })}
                                            className="w-4 h-4 text-primary border-theme rounded focus:ring-primary"
                                        />
                                        <label htmlFor="requires_approval" className="text-sm text-secondary">
                                            Require admin approval for new members
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="allow_anonymous"
                                            checked={formData.allow_anonymous}
                                            onChange={(e) => setFormData({ ...formData, allow_anonymous: e.target.checked })}
                                            className="w-4 h-4 text-primary border-theme rounded focus:ring-primary"
                                        />
                                        <label htmlFor="allow_anonymous" className="text-sm text-secondary">
                                            Allow anonymous membership (members can join without revealing identity)
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate('/payments')}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    disabled={!formData.name}
                                >
                                    Next: Invite Members
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            )}

            {/* Step 2: Invite Members */}
            {step === 2 && (
                <Card>
                    <CardBody>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-primary" />
                                    Invite Members
                                </h3>
                                <p className="text-sm text-secondary">
                                    Add members by email. They'll receive an invitation to join your group.
                                    You can skip this step and invite members later.
                                </p>

                                {/* Add Member */}
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => { setNewEmail(e.target.value); setInviteError(''); }}
                                            placeholder="Enter email address"
                                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addMember}
                                    >
                                        <UserPlus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {inviteError && (
                                    <p className="text-sm text-red-500">{inviteError}</p>
                                )}

                                {/* Member List */}
                                {invitedMembers.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium text-secondary">
                                            Members to invite ({invitedMembers.length})
                                        </h4>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            {invitedMembers.map((member) => (
                                                <div
                                                    key={member.email}
                                                    className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Mail className="w-4 h-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm text-primary">{member.email}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeMember(member.email)}
                                                        className="p-1 hover:bg-secondary/10 rounded"
                                                    >
                                                        <X className="w-4 h-4 text-secondary" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-6 border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setStep(1)}
                                >
                                    Back
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1"
                                    disabled={loading}
                                >
                                    {loading ? 'Creating...' : (invitedMembers.length > 0 ? 'Create & Send Invites' : 'Create Group')}
                                </Button>
                            </div>
                        </form>
                    </CardBody>
                </Card>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
                <Card>
                    <CardBody className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-primary mb-2">
                            Payment Group Created!
                        </h3>
                        <p className="text-secondary mb-6">
                            "{formData.name}" has been created successfully.
                        </p>

                        {invitedMembers.length > 0 && (
                            <div className="mb-6 text-left">
                                <h4 className="text-sm font-medium text-secondary mb-2">Invitation Status:</h4>
                                <div className="space-y-2">
                                    {invitedMembers.map((member) => (
                                        <div
                                            key={member.email}
                                            className="flex items-center justify-between p-2 bg-secondary/10 rounded-lg text-sm"
                                        >
                                            <span className="text-primary">{member.email}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs ${member.status === 'sent' ? 'bg-green-500/10 text-green-700' :
                                                member.status === 'failed' ? 'bg-red-500/10 text-red-700' :
                                                    'bg-yellow-500/10 text-yellow-700'
                                                }`}>
                                                {member.status === 'sent' ? 'Sent' :
                                                    member.status === 'failed' ? 'Failed' : 'Pending'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => navigate('/payments')}
                            >
                                Go to Payments
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={() => navigate(`/payments/groups/${createdGroup?.id}`)}
                            >
                                View Group
                            </Button>
                        </div>
                    </CardBody>
                </Card>
            )}
            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody className="text-center p-8">
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-primary mb-2">Success!</h2>
                            <p className="text-secondary mb-8">
                                {formData.group_type === 'piggy_bank'
                                    ? 'Your Piggy Bank has been created successfully.'
                                    : 'Your Payment Group has been created successfully.'}
                            </p>
                            <Button variant="primary" className="w-full" onClick={handleFinish}>
                                {formData.group_type === 'piggy_bank' ? 'View Piggy Banks' : 'View Groups'}
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default CreatePaymentGroup;

