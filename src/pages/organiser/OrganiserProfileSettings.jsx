import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Camera, Save, Loader, Globe, MapPin, Link as LinkIcon, X, Settings, Users, Handshake } from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import { useToast } from '../../contexts/ToastContext';
import eventsService from '../../services/events.service';

const TABS = [
    { id: 'profile', label: 'Profile', icon: Users },
    { id: 'social', label: 'Social Links', icon: LinkIcon },
    { id: 'partnership', label: 'Partnership', icon: Handshake },
];

const OrganiserProfileSettings = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { user } = useAuth();
    const toast = useToast();
    const activeTab = searchParams.get('tab') || 'profile';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState(null);
    const avatarInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [formData, setFormData] = useState({
        business_name: '',
        bio: '',
        website: '',
        location: '',
        social_links: {},
        is_open_for_partnership: false,
    });

    const [avatarPreview, setAvatarPreview] = useState(null);
    const [coverPreview, setCoverPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const myProfileRes = await (await import('../../services/api')).default.get('/api/events/organizer_profiles/my_profile/');
            const p = myProfileRes.data;
            setProfile(p);
            setFormData({
                business_name: p.business_name || '',
                bio: p.bio || '',
                website: p.website || '',
                location: p.location || '',
                social_links: p.social_links || {},
                is_open_for_partnership: p.is_open_for_partnership || false,
            });
            setAvatarPreview(p.avatar || null);
            setCoverPreview(p.cover_photo || null);
        } catch (error) {
            console.error('Failed to load organizer profile:', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
    };

    const handleSocialLinkChange = (key, value) => {
        setFormData(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: value } }));
    };

    const addSocialLink = () => {
        const key = prompt('Enter platform name (e.g., twitter, linkedin, instagram):');
        if (!key) return;
        setFormData(prev => ({ ...prev, social_links: { ...prev.social_links, [key]: '' } }));
    };

    const removeSocialLink = (key) => {
        const newLinks = { ...formData.social_links };
        delete newLinks[key];
        setFormData(prev => ({ ...prev, social_links: newLinks }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('business_name', formData.business_name);
            fd.append('bio', formData.bio);
            fd.append('website', formData.website);
            fd.append('location', formData.location);
            fd.append('social_links', JSON.stringify(formData.social_links));
            fd.append('is_open_for_partnership', formData.is_open_for_partnership);
            if (avatarFile) fd.append('avatar', avatarFile);
            if (coverFile) fd.append('cover_photo', coverFile);
            await eventsService.updateOrganizerProfile(fd);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error('Failed to save profile:', error);
            toast.error('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleTabClick = (tabId) => {
        const params = new URLSearchParams(searchParams);
        params.set('tab', tabId);
        setSearchParams(params);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/dashboard/organiser')} className="p-2 hover:bg-secondary rounded-full text-secondary hover:text-primary transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Organiser Profile Settings</h1>
                    <p className="text-secondary mt-1">Manage your organiser profile and branding</p>
                </div>
            </div>

            <div className="flex gap-1 bg-secondary/50 rounded-xl p-1 overflow-x-auto">
                {TABS.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.id} onClick={() => handleTabClick(tab.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-elevated text-primary shadow-sm' : 'text-secondary hover:text-primary hover:bg-elevated/50'}`}>
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === 'profile' && (
                <>
                    <Card>
                        <CardBody className="p-0 overflow-hidden">
                            <div className="relative h-48 bg-gradient-to-br from-primary-600 to-primary-800">
                                {coverPreview && <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />}
                                <button onClick={() => coverInputRef.current?.click()} className="absolute bottom-3 right-3 p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white transition-colors">
                                    <Camera size={18} />
                                </button>
                                <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                                <div className="absolute -bottom-12 left-6">
                                    <div className="relative w-24 h-24 rounded-full border-4 border-elevated bg-secondary overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold">
                                                {(formData.business_name || 'O')[0].toUpperCase()}
                                            </div>
                                        )}
                                        <button onClick={() => avatarInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <Camera size={20} className="text-white" />
                                        </button>
                                        <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                                    </div>
                                </div>
                            </div>
                            <div className="pt-16 pb-6 px-6">
                                <p className="text-xs text-secondary mb-4">Upload cover photo and avatar to personalize your organiser profile</p>
                            </div>
                        </CardBody>
                    </Card>
                    <Card>
                        <CardBody>
                            <h3 className="text-lg font-semibold text-primary mb-4">Business Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Business Name</label>
                                    <input type="text" value={formData.business_name} onChange={e => setFormData(prev => ({ ...prev, business_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="Your business or brand name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Bio</label>
                                    <textarea value={formData.bio} onChange={e => setFormData(prev => ({ ...prev, bio: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none" placeholder="Describe your event organizing services..." />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1"><Globe size={14} className="inline mr-1" /> Website</label>
                                        <input type="url" value={formData.website} onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="https://example.com" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-primary mb-1"><MapPin size={14} className="inline mr-1" /> Location</label>
                                        <input type="text" value={formData.location} onChange={e => setFormData(prev => ({ ...prev, location: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="City, Country" />
                                    </div>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </>
            )}

            {activeTab === 'social' && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-primary"><LinkIcon size={16} className="inline mr-1" /> Social Links</h3>
                            <Button variant="outline" size="sm" onClick={addSocialLink}>+ Add Link</Button>
                        </div>
                        {Object.keys(formData.social_links).length === 0 ? (
                            <p className="text-secondary text-sm">No social links added yet. Click "Add Link" to get started.</p>
                        ) : (
                            <div className="space-y-3">
                                {Object.entries(formData.social_links).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-primary w-24 capitalize truncate">{key}</span>
                                        <input type="url" value={value} onChange={e => handleSocialLinkChange(key, e.target.value)} className="flex-1 px-3 py-2 rounded-lg border border-theme bg-elevated text-sm text-primary focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder={`https://${key}.com/your-profile`} />
                                        <button onClick={() => removeSocialLink(key)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500 transition-colors"><X size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            {activeTab === 'partnership' && (
                <Card>
                    <CardBody>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-semibold text-primary">Partnership Availability</h3>
                                <p className="text-sm text-secondary mt-1">Allow other organisers to discover you for collaborations and partnerships</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={formData.is_open_for_partnership} onChange={e => setFormData(prev => ({ ...prev, is_open_for_partnership: e.target.checked }))} className="sr-only peer" />
                                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600" />
                            </label>
                        </div>
                        {formData.is_open_for_partnership && (
                            <div className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <p className="text-sm text-green-600">Your profile is now visible to other organisers looking for partnership opportunities.</p>
                            </div>
                        )}
                    </CardBody>
                </Card>
            )}

            <div className="flex justify-end gap-3 pb-8">
                <Button variant="outline" onClick={() => navigate('/dashboard/organiser')}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><Loader className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Changes</>}
                </Button>
            </div>
        </div>
    );
};

export default OrganiserProfileSettings;
