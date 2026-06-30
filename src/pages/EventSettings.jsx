import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import api from '../services/api';
import eventsService from '../services/events.service';
import { useToast } from '../contexts/ToastContext';
import {
    Settings, ArrowLeft, Users, Eye, EyeOff, MessageSquare, AlertTriangle,
    UserPlus, X, Trash2, Save, Check
} from 'lucide-react';

const TABS = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'visibility', label: 'Visibility', icon: Eye },
    { id: 'co_organizers', label: 'Co-Organizers', icon: UserPlus },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
];

const EventSettings = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('general');

    const [activateFeedback, setActivateFeedback] = useState(true);
    const [attendeesViewable, setAttendeesViewable] = useState(true);
    const [seekingSponsors, setSeekingSponsors] = useState(false);
    const [seekingPartners, setSeekingPartners] = useState(false);

    const [coOrganizers, setCoOrganizers] = useState([]);
    const [newOrgEmail, setNewOrgEmail] = useState('');
    const [addingCo, setAddingCo] = useState(false);

    const [deleting, setDeleting] = useState(false);

    useEffect(() => { loadEvent(); }, [id]);

    const loadEvent = async () => {
        try {
            const res = await api.get(`/api/events/${id}/`);
            const evt = res.data;
            setEvent(evt);
            setActivateFeedback(evt.activate_feedback !== false);
            setAttendeesViewable(evt.attendees_viewable !== false);
            setSeekingSponsors(evt.seeking_sponsors || false);
            setSeekingPartners(evt.seeking_partners || false);
            loadCoOrganizers();
        } catch (err) {
            console.error('Failed to load event', err);
            showToast('Failed to load event settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadCoOrganizers = async () => {
        try {
            const res = await api.get(`/api/events/co_organizers/?event=${id}`);
            setCoOrganizers(res.data?.results || res.data || []);
        } catch {
            setCoOrganizers([]);
        }
    };

    const saveGeneral = async () => {
        setSaving(true);
        try {
            await api.patch(`/api/events/${id}/`, {
                activate_feedback: activateFeedback,
                attendees_viewable: attendeesViewable,
                seeking_sponsors: seekingSponsors,
                seeking_partners: seekingPartners,
            });
            showToast('Settings saved', 'success');
        } catch (err) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addCoOrganizer = async () => {
        if (!newOrgEmail.trim()) return;
        setAddingCo(true);
        try {
            await api.post(`/api/events/co_organizers/`, {
                event: parseInt(id),
                user_email: newOrgEmail.trim(),
                role: 'moderator',
            });
            setNewOrgEmail('');
            showToast('Co-organizer added', 'success');
            loadCoOrganizers();
        } catch (err) {
            showToast(err.response?.data?.error || 'Failed to add co-organizer', 'error');
        } finally {
            setAddingCo(false);
        }
    };

    const removeCoOrganizer = async (coId) => {
        try {
            await api.delete(`/api/events/co_organizers/${coId}/`);
            showToast('Co-organizer removed', 'success');
            loadCoOrganizers();
        } catch (err) {
            showToast('Failed to remove co-organizer', 'error');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this event? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.delete(`/api/events/${id}/`);
            showToast('Event deleted', 'success');
            navigate('/events');
        } catch (err) {
            showToast('Failed to delete event', 'error');
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base">
                <Card className="max-w-md w-full p-8 text-center">
                    <h2 className="text-2xl font-bold text-primary mb-2">Event Not Found</h2>
                    <Button variant="primary" onClick={() => navigate('/events')}>Browse Events</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base p-4 md:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="text-secondary hover:text-primary">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-primary">Event Settings</h1>
                        <p className="text-secondary mt-1">{event.name}</p>
                    </div>
                </div>

                <div className="flex gap-1 bg-elevated rounded-lg p-1 w-fit">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-secondary hover:text-primary'}`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'general' && (
                    <Card>
                        <CardBody className="p-6 space-y-6">
                            <h3 className="text-lg font-bold text-primary">General Settings</h3>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between py-3 px-4 bg-elevated rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-medium text-primary">Activate Feedback & Reviews</p>
                                        <p className="text-sm text-secondary">Allow attendees to leave reviews and ratings</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={activateFeedback}
                                        onChange={e => setActivateFeedback(e.target.checked)}
                                        className="w-5 h-5 rounded border-theme text-green-600 focus:ring-green-500"
                                    />
                                </label>
                                <label className="flex items-center justify-between py-3 px-4 bg-elevated rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-medium text-primary">Attendees Visible to Public</p>
                                        <p className="text-sm text-secondary">Show the list of attendees on the event page</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={attendeesViewable}
                                        onChange={e => setAttendeesViewable(e.target.checked)}
                                        className="w-5 h-5 rounded border-theme text-blue-600 focus:ring-blue-500"
                                    />
                                </label>
                                <label className="flex items-center justify-between py-3 px-4 bg-elevated rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-medium text-primary">Seeking Sponsors</p>
                                        <p className="text-sm text-secondary">Mark this event as looking for sponsors</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={seekingSponsors}
                                        onChange={e => setSeekingSponsors(e.target.checked)}
                                        className="w-5 h-5 rounded border-theme text-green-600 focus:ring-green-500"
                                    />
                                </label>
                                <label className="flex items-center justify-between py-3 px-4 bg-elevated rounded-lg cursor-pointer">
                                    <div>
                                        <p className="font-medium text-primary">Seeking Partners</p>
                                        <p className="text-sm text-secondary">Mark this event as looking for partners</p>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={seekingPartners}
                                        onChange={e => setSeekingPartners(e.target.checked)}
                                        className="w-5 h-5 rounded border-theme text-blue-600 focus:ring-blue-500"
                                    />
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <Button variant="primary" onClick={saveGeneral} disabled={saving}>
                                    {saving ? 'Saving...' : <><Save size={16} className="mr-2" /> Save Settings</>}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'visibility' && (
                    <Card>
                        <CardBody className="p-6">
                            <h3 className="text-lg font-bold text-primary mb-4">Visibility Controls</h3>
                            <p className="text-secondary mb-4">Fine-grained visibility settings are available through the EventVisibility model. Currently, the event type ({event.event_type || 'public'}) controls the basic audience reach.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-elevated rounded-lg">
                                    <p className="text-sm text-secondary">Current Type</p>
                                    <p className="font-medium text-primary capitalize">{event.event_type || 'public'}</p>
                                </div>
                                <div className="p-4 bg-elevated rounded-lg">
                                    <p className="text-sm text-secondary">Location</p>
                                    <p className="font-medium text-primary capitalize">{event.event_location || 'physical'}</p>
                                </div>
                            </div>
                            <p className="text-xs text-tertiary mt-4">To change these settings, edit the event or use the Edit Event option from the detail page.</p>
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'co_organizers' && (
                    <Card>
                        <CardBody className="p-6 space-y-6">
                            <h3 className="text-lg font-bold text-primary">Co-Organizers</h3>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={newOrgEmail}
                                    onChange={e => setNewOrgEmail(e.target.value)}
                                    placeholder="Enter email address..."
                                    className="flex-1 px-3 py-2 bg-elevated border border-theme rounded-lg text-primary outline-none focus:border-primary"
                                    onKeyDown={e => { if (e.key === 'Enter') addCoOrganizer(); }}
                                />
                                <Button variant="primary" onClick={addCoOrganizer} disabled={addingCo || !newOrgEmail.trim()}>
                                    {addingCo ? 'Adding...' : <><UserPlus size={16} className="mr-1" /> Add</>}
                                </Button>
                            </div>
                            {coOrganizers.length === 0 ? (
                                <p className="text-secondary text-center py-4">No co-organizers added yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {coOrganizers.map(co => (
                                        <div key={co.id} className="flex items-center justify-between p-3 bg-elevated rounded-lg">
                                            <div>
                                                <p className="font-medium text-primary">{co.user_name || co.user_email || `User ${co.user}`}</p>
                                                {co.role && <p className="text-xs text-secondary capitalize">{co.role}</p>}
                                            </div>
                                            <button onClick={() => removeCoOrganizer(co.id)} className="text-red-400 hover:text-red-300 p-1">
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                )}

                {activeTab === 'danger' && (
                    <Card className="border-red-500/30">
                        <CardBody className="p-6 space-y-6">
                            <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                                <AlertTriangle size={20} /> Danger Zone
                            </h3>
                            <p className="text-secondary">Once you delete this event, there is no going back. All data including bookings, tickets, reviews, and analytics will be permanently removed.</p>
                            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <p className="font-medium text-primary mb-2">Delete "{event.name}"</p>
                                <p className="text-sm text-secondary mb-4">This event has {event.attendees?.length || 0} attendees and {event.ticket_tiers?.length || 0} ticket tiers.</p>
                                <Button variant="primary" onClick={handleDelete} disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700 text-white">
                                    {deleting ? 'Deleting...' : <><Trash2 size={16} className="mr-2" /> Delete Event Permanently</>}
                                </Button>
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default EventSettings;
