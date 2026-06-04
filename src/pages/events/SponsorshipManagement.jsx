import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import eventsService from '../../services/events.service';
import {
    ArrowLeft, DollarSign, Star, Users, CheckCircle, XCircle,
    Clock, Plus, Trash2, Edit2, Check, X, AlertCircle, Loader, Filter
} from 'lucide-react';

const TABS = [
    { id: 'applications', label: 'Applications', icon: Users },
    { id: 'levels', label: 'Sponsorship Levels', icon: DollarSign },
    { id: 'sponsors', label: 'Sponsors', icon: Star },
];

const STATUS_STYLES = {
    pending: 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    approved: 'bg-green-500/10 text-green-500 border border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border border-red-500/20',
};

const SponsorshipManagement = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('applications');
    const [event, setEvent] = useState(null);
    const [applications, setApplications] = useState([]);
    const [levels, setLevels] = useState([]);
    const [sponsors, setSponsors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [actionMsg, setActionMsg] = useState(null);

    const [approveModal, setApproveModal] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [levelForm, setLevelForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [evtRes, appsRes, levelsRes, sponsorsRes] = await Promise.all([
                eventsService.getEvent(id),
                eventsService.getSponsorshipApplications(id),
                eventsService.getSponsorshipLevels(id),
                eventsService.getEventSponsors(id),
            ]);
            const evt = evtRes?.data || evtRes;
            if (!evt || (!evt.id && !evt.name)) {
                setError('Event not found');
                return;
            }
            setEvent(evt);
            setApplications(appsRes?.data || appsRes || []);
            setLevels(levelsRes?.data || levelsRes || []);
            setSponsors(sponsorsRes?.data || sponsorsRes || []);
        } catch (err) {
            setError('Failed to load sponsorship data');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => { loadData(); }, [loadData]);

    const showMessage = (type, text) => {
        setActionMsg({ type, text });
        setTimeout(() => setActionMsg(null), 5000);
    };

    const handleApprove = async (applicationId, sponsorshipLevelId, reason) => {
        setSaving(true);
        try {
            await eventsService.approveSponsorshipApplication(applicationId, {
                sponsorship_level_id: sponsorshipLevelId,
                reason,
            });
            setApproveModal(null);
            showMessage('success', 'Application approved successfully.');
            loadData();
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to approve application');
        } finally {
            setSaving(false);
        }
    };

    const handleReject = async (applicationId, reason) => {
        setSaving(true);
        try {
            await eventsService.rejectSponsorshipApplication(applicationId, {
                reason,
            });
            setRejectModal(null);
            showMessage('success', 'Application rejected.');
            loadData();
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to reject application');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLevel = async () => {
        if (!levelForm.name || !levelForm.price) {
            showMessage('error', 'Name and price are required.');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                event: id,
                level_name: levelForm.name,
                level_benefits: levelForm.benefits || '',
                level_price: levelForm.price,
            };
            if (levelForm.id) {
                await eventsService.updateSponsorshipLevel(levelForm.id, payload);
            } else {
                await eventsService.createSponsorshipLevel(payload);
            }
            setLevelForm(null);
            showMessage('success', `Level ${levelForm.id ? 'updated' : 'created'} successfully.`);
            loadData();
        } catch (err) {
            showMessage('error', err.response?.data?.error || 'Failed to save level');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLevel = async (levelId) => {
        if (!window.confirm('Delete this sponsorship level?')) return;
        setSaving(true);
        try {
            await eventsService.deleteSponsorshipLevel(levelId);
            showMessage('success', 'Level deleted.');
            loadData();
        } catch (err) {
            showMessage('error', 'Failed to delete level');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader size={32} className="animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Card><CardBody>
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertCircle size={24} />
                        <p className="font-medium">{error}</p>
                    </div>
                    <Button variant="secondary" className="mt-4" onClick={() => navigate(-1)}>
                        <ArrowLeft size={16} /> Go Back
                    </Button>
                </CardBody></Card>
            </div>
        );
    }

    const filteredApplications = statusFilter === 'all'
        ? applications
        : applications.filter(a => a.status === statusFilter);

    const pendingCount = applications.filter(a => a.status === 'pending').length;
    const approvedCount = applications.filter(a => a.status === 'approved').length;
    const rejectedCount = applications.filter(a => a.status === 'rejected').length;

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(`/events/${id}`)} className="p-2 hover:bg-secondary/20 rounded-lg transition-colors">
                        <ArrowLeft size={20} className="text-secondary" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-primary">Sponsorship Management</h1>
                        <p className="text-sm text-secondary">{event?.name}</p>
                    </div>
                </div>
            </div>

            {/* Action message */}
            {actionMsg && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                    actionMsg.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-red-500/10 border border-red-500/20'
                }`}>
                    {actionMsg.type === 'success'
                        ? <CheckCircle size={20} className="text-green-500 mt-0.5 shrink-0" />
                        : <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                    }
                    <p className={`text-sm flex-1 ${actionMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                        {actionMsg.text}
                    </p>
                    <button onClick={() => setActionMsg(null)} className="text-secondary hover:text-primary">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-secondary/10 rounded-lg p-1">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeTab === tab.id
                                ? 'bg-primary text-white shadow-sm'
                                : 'text-secondary hover:text-primary hover:bg-secondary/20'
                        }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                        {tab.id === 'applications' && pendingCount > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500 text-white">
                                {pendingCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Applications Tab */}
            {activeTab === 'applications' && (
                <div className="space-y-4">
                    {/* Summary cards */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-amber-500/10 rounded-xl text-center">
                            <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
                            <p className="text-xs text-secondary">Pending</p>
                        </div>
                        <div className="p-4 bg-green-500/10 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-500">{approvedCount}</p>
                            <p className="text-xs text-secondary">Approved</p>
                        </div>
                        <div className="p-4 bg-red-500/10 rounded-xl text-center">
                            <p className="text-2xl font-bold text-red-500">{rejectedCount}</p>
                            <p className="text-xs text-secondary">Rejected</p>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-secondary" />
                        {['all', 'pending', 'approved', 'rejected'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                    statusFilter === status
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary/10 text-secondary hover:text-primary'
                                }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Applications list */}
                    {filteredApplications.length === 0 ? (
                        <Card><CardBody>
                            <p className="text-center text-secondary py-8">No applications found.</p>
                        </CardBody></Card>
                    ) : (
                        filteredApplications.map(app => (
                            <Card key={app.id}><CardBody>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold shrink-0">
                                                {app.applicant_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-primary">{app.applicant_name}</h4>
                                                <p className="text-xs text-secondary">{app.applicant_contact}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-secondary line-clamp-3 mb-2">{app.application_details}</p>
                                        <p className="text-xs text-secondary">
                                            Applied {new Date(app.application_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[app.status] || STATUS_STYLES.pending}`}>
                                            {app.status === 'pending' ? 'Pending'
                                                : app.status === 'approved' ? 'Approved'
                                                : 'Rejected'}
                                        </span>
                                        {app.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <Button variant="primary" size="sm" onClick={() => setApproveModal(app)}>
                                                    <Check size={14} /> Approve
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => setRejectModal(app)}>
                                                    <X size={14} /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardBody></Card>
                        ))
                    )}
                </div>
            )}

            {/* Levels Tab */}
            {activeTab === 'levels' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-primary">Sponsorship Tiers</h3>
                        <Button variant="primary" size="sm" onClick={() => setLevelForm({ name: '', benefits: '', price: '' })}>
                            <Plus size={16} /> Add Level
                        </Button>
                    </div>

                    {levelForm && (
                        <Card><CardBody>
                            <h4 className="font-semibold text-primary mb-4">
                                {levelForm.id ? 'Edit Level' : 'New Level'}
                            </h4>
                            <div className="space-y-3">
                                <input type="text" placeholder="Level name (e.g. Gold, Platinum)" value={levelForm.name}
                                    onChange={e => setLevelForm({ ...levelForm, name: e.target.value })}
                                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20" />
                                <textarea placeholder="Benefits description" value={levelForm.benefits}
                                    onChange={e => setLevelForm({ ...levelForm, benefits: e.target.value })}
                                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none resize-y focus:ring-2 focus:ring-primary/20" rows={3} />
                                <input type="number" placeholder="Price ($)" value={levelForm.price}
                                    onChange={e => setLevelForm({ ...levelForm, price: e.target.value })}
                                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20" />
                                <div className="flex gap-2">
                                    <Button variant="primary" size="sm" onClick={handleSaveLevel} disabled={saving}>
                                        {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
                                        {levelForm.id ? 'Update' : 'Create'}
                                    </Button>
                                    <Button variant="secondary" size="sm" onClick={() => setLevelForm(null)}>Cancel</Button>
                                </div>
                            </div>
                        </CardBody></Card>
                    )}

                    {levels.length === 0 ? (
                        <Card><CardBody>
                            <p className="text-center text-secondary py-8">No sponsorship levels defined yet.</p>
                        </CardBody></Card>
                    ) : (
                        levels.map(level => (
                            <Card key={level.id}><CardBody>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <h4 className="font-bold text-primary">{level.level_name || level.name}</h4>
                                            <span className="text-primary-600 font-bold text-lg">
                                                ${level.level_price || level.price}
                                            </span>
                                        </div>
                                        <p className="text-sm text-secondary mt-1">{level.level_benefits || level.benefits}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => setLevelForm({
                                            id: level.id,
                                            name: level.level_name || level.name,
                                            benefits: level.level_benefits || level.benefits,
                                            price: level.level_price || level.price,
                                        })} className="p-2 hover:bg-secondary/20 rounded-lg transition-colors text-secondary hover:text-primary">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDeleteLevel(level.id)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-secondary hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </CardBody></Card>
                        ))
                    )}
                </div>
            )}

            {/* Sponsors Tab */}
            {activeTab === 'sponsors' && (
                <div className="space-y-4">
                    {sponsors.length === 0 ? (
                        <Card><CardBody>
                            <p className="text-center text-secondary py-8">No sponsors yet. Approve applications to add sponsors.</p>
                        </CardBody></Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sponsors.map(sponsor => (
                                <Card key={sponsor.id}><CardBody>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg">
                                            {sponsor.sponsor_name?.[0]?.toUpperCase() || 'S'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-primary truncate">{sponsor.sponsor_name}</h4>
                                            <p className="text-xs text-secondary">
                                                {sponsor.sponsorship_level || 'Sponsor'}
                                            </p>
                                            {sponsor.contribution_amount && (
                                                <p className="text-sm font-medium text-primary-600">
                                                    ${sponsor.contribution_amount}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardBody></Card>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Approve Modal */}
            {approveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setApproveModal(null)}>
                    <div className="bg-background rounded-2xl border border-theme shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-primary mb-4">Approve Application</h3>
                        <p className="text-sm text-secondary mb-4">
                            Approve sponsorship from <strong className="text-primary">{approveModal.applicant_name}</strong>
                        </p>
                        <ApproveForm
                            levels={levels}
                            onConfirm={(levelId, reason) => handleApprove(approveModal.id, levelId, reason)}
                            onCancel={() => setApproveModal(null)}
                            saving={saving}
                        />
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRejectModal(null)}>
                    <div className="bg-background rounded-2xl border border-theme shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-primary mb-4">Reject Application</h3>
                        <p className="text-sm text-secondary mb-4">
                            Reject sponsorship from <strong className="text-primary">{rejectModal.applicant_name}</strong>
                        </p>
                        <RejectForm
                            onConfirm={(reason) => handleReject(rejectModal.id, reason)}
                            onCancel={() => setRejectModal(null)}
                            saving={saving}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const ApproveForm = ({ levels, onConfirm, onCancel, saving }) => {
    const [levelId, setLevelId] = useState(levels?.[0]?.id || '');
    const [reason, setReason] = useState('Application meets sponsorship criteria.');

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-medium text-secondary mb-1 block">Sponsorship Level</label>
                <select value={levelId} onChange={e => setLevelId(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none focus:ring-2 focus:ring-primary/20">
                    <option value="">No level (manual setup)</option>
                    {levels.map(l => (
                        <option key={l.id} value={l.id}>
                            {l.level_name || l.name} (${l.level_price || l.price})
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="text-xs font-medium text-secondary mb-1 block">Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none resize-y focus:ring-2 focus:ring-primary/20" rows={2} />
            </div>
            <div className="flex gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={() => onConfirm(levelId, reason)} disabled={saving}>
                    {saving ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />} Approve
                </Button>
                <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
};

const RejectForm = ({ onConfirm, onCancel, saving }) => {
    const [reason, setReason] = useState('Application did not meet sponsorship requirements.');

    return (
        <div className="space-y-3">
            <div>
                <label className="text-xs font-medium text-secondary mb-1 block">Reason</label>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-transparent border border-theme rounded-lg text-primary outline-none resize-y focus:ring-2 focus:ring-primary/20" rows={3} />
            </div>
            <div className="flex gap-2 pt-2">
                <Button variant="primary" size="sm" onClick={() => onConfirm(reason)} disabled={saving}
                    className="!bg-red-500 hover:!bg-red-600">
                    {saving ? <Loader size={14} className="animate-spin" /> : <XCircle size={14} />} Reject
                </Button>
                <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
            </div>
        </div>
    );
};

export default SponsorshipManagement;