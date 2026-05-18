import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Clock, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';

const GroupSettingsTab = ({ groupId, isAdmin, groupData, onUpdate }) => {
    const [settings, setSettings] = useState({
        name: groupData?.name || '',
        description: groupData?.description || '',
        maturity_date: groupData?.maturity_date || '',
        lifetime_mode: groupData?.lifetime_mode || 'perpetual',
        min_contribution: groupData?.min_contribution || 0,
        contribution_frequency: groupData?.contribution_frequency || 'flexible'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [proposedChanges, setProposedChanges] = useState([]);

    useEffect(() => {
        if (groupData) {
            setSettings({
                name: groupData.name || '',
                description: groupData.description || '',
                maturity_date: groupData.maturity_date ? groupData.maturity_date.split('T')[0] : '',
                lifetime_mode: groupData.lifetime_mode || 'perpetual',
                min_contribution: groupData.min_contribution || 0,
                contribution_frequency: groupData.contribution_frequency || 'flexible'
            });
        }
        loadProposedChanges();
    }, [groupData, groupId]);

    const loadProposedChanges = async () => {
        try {
            const data = await paymentsService.getGroupSettingsChanges(groupId);
            setProposedChanges(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error loading proposed changes:', error);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (isAdmin) {
                // Direct update if admin (or propose if settings require vote)
                await paymentsService.updateGroupSettings(groupId, settings);
                if (onUpdate) onUpdate();
                alert('Settings updated successfully');
            } else {
                // Propose change for members
                await paymentsService.proposeSettingsChange(groupId, {
                    change_type: 'settings_update',
                    new_values: settings,
                    change_description: 'Member proposed settings update'
                });
                alert('Change proposal submitted for voting');
                loadProposedChanges();
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary">Group Settings & Lifecycle</h3>
                    <p className="text-sm text-secondary">Manage how your group operates and its long-term goals.</p>
                </div>
                {isAdmin && (
                    <Button variant="primary" className="gap-2" onClick={handleSave} disabled={isSaving}>
                        <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Settings'}
                    </Button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Card className="border-theme">
                        <CardBody className="p-6 space-y-4">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                <Settings className="w-5 h-5 text-indigo-500" /> General Configuration
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-tertiary mb-1">Group Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={settings.name}
                                        onChange={(e) => setSettings({...settings, name: e.target.value})}
                                        disabled={!isAdmin}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-tertiary mb-1">Contribution Frequency</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={settings.contribution_frequency}
                                        onChange={(e) => setSettings({...settings, contribution_frequency: e.target.value})}
                                        disabled={!isAdmin}
                                    >
                                        <option value="flexible">Flexible</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="annually">Annually</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase text-tertiary mb-1">Description</label>
                                <textarea 
                                    className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary h-24"
                                    value={settings.description}
                                    onChange={(e) => setSettings({...settings, description: e.target.value})}
                                    disabled={!isAdmin}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-theme">
                        <CardBody className="p-6 space-y-4">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-amber-500" /> Maturity & Lifetime
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-tertiary mb-1">Lifetime Mode</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={settings.lifetime_mode}
                                        onChange={(e) => setSettings({...settings, lifetime_mode: e.target.value})}
                                        disabled={!isAdmin}
                                    >
                                        <option value="perpetual">Perpetual (Ongoing)</option>
                                        <option value="fixed_term">Fixed Term (Ends at Maturity)</option>
                                        <option value="target_based">Target Based (Ends when Goal Met)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-tertiary mb-1">Maturity Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2 rounded-xl border border-theme bg-secondary/5 text-primary outline-none focus:ring-2 focus:ring-primary"
                                        value={settings.maturity_date}
                                        onChange={(e) => setSettings({...settings, maturity_date: e.target.value})}
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700 leading-relaxed">
                                    Changing the maturity date or lifetime mode may affect withdrawal penalties and benefit distribution schedules. Ensure all members are notified of these changes.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="border-theme bg-indigo-500/5">
                        <CardBody className="p-6">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" /> Governance Info
                            </h4>
                            <p className="text-sm text-secondary mb-4">
                                Your group is currently in <span className="font-bold text-indigo-600 uppercase">{groupData?.hierarchy_mode || 'democratic'}</span> mode.
                            </p>
                            <div className="space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-tertiary">Approval Threshold:</span>
                                    <span className="font-bold text-primary">{groupData?.approval_threshold || 50}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-tertiary">Member Voting Power:</span>
                                    <span className="font-bold text-primary">Equal (1 vote/person)</span>
                                </div>
                            </div>
                            {!isAdmin && (
                                <div className="mt-6 pt-4 border-t border-theme">
                                    <p className="text-xs text-tertiary italic">
                                        Only admins can change core settings directly. Members can propose changes via the Governance tab.
                                    </p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                    
                    <Card className="border-theme">
                        <CardBody className="p-6">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5 text-blue-500" /> Quick Stats
                            </h4>
                            <div className="space-y-2">
                                <div className="text-2xl font-bold text-primary">
                                    {proposedChanges.length}
                                </div>
                                <p className="text-xs text-secondary">Active governance proposals</p>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsTab;
