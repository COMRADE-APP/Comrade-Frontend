import React, { useState, useEffect } from 'react';
import { Settings, Save, Shield, Clock, AlertTriangle, Info, ShieldCheck, Vote } from 'lucide-react';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';

const GroupSettingsTab = ({ groupId, isAdmin, groupData, onUpdate }) => {
    const toast = useToast();
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
            setProposedChanges(Array.isArray(data) ? data.filter(d => d.status === 'pending') : (data?.results?.filter(d => d.status === 'pending') || []));
        } catch (error) {
            console.error('Error loading proposed changes:', error);
        }
    };

    // Determine if changes require a vote
    const requiresVote = groupData?.hierarchy_mode !== 'admin_dictatorship';

    const handleSave = async () => {
        setIsSaving(true);
        try {
            if (requiresVote) {
                // All settings go through governance if democratic or capital weighted
                await paymentsService.proposeSettingsChange(groupId, {
                    change_type: 'settings_update',
                    new_values: settings,
                    change_description: `Proposed update to core group settings by ${isAdmin ? 'Admin' : 'Member'}`
                });
                toast.success('Change proposal submitted for group voting!');
                loadProposedChanges();
            } else {
                // Direct update only if admin dictatorship
                if (!isAdmin) {
                    toast.error('Only admins can change settings in this hierarchy mode.');
                    setIsSaving(false);
                    return;
                }
                await paymentsService.updateGroupSettings(groupId, settings);
                if (onUpdate) onUpdate();
                toast.success('Settings updated successfully!');
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            toast.error('Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                        <Settings className="w-5 h-5 text-amber-500" />
                        Group Settings & Lifecycle
                    </h3>
                    <p className="text-sm text-secondary">Manage how your group operates and its long-term goals.</p>
                </div>
                <Button 
                    variant="primary" 
                    className={`gap-2 shadow-lg ${requiresVote ? '!bg-amber-600 shadow-amber-500/20' : '!bg-emerald-600 shadow-emerald-500/20'}`} 
                    onClick={handleSave} 
                    disabled={isSaving || (!isAdmin && !requiresVote)}
                >
                    {isSaving ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : requiresVote ? (
                        <><Vote className="w-4 h-4" /> Propose Settings</>
                    ) : (
                        <><Save className="w-4 h-4" /> Save Settings</>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <Card className="border-theme bg-gradient-to-br from-white to-secondary/5 dark:from-background dark:to-secondary/5">
                        <CardBody className="p-6 space-y-5">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-2 pb-3 border-b border-theme">
                                <Shield className="w-4 h-4 text-amber-500" /> General Configuration
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-tertiary mb-1.5 tracking-wide">Group Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 transition-shadow shadow-sm"
                                        value={settings.name}
                                        onChange={(e) => setSettings({...settings, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-tertiary mb-1.5 tracking-wide">Contribution Frequency</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 transition-shadow shadow-sm"
                                        value={settings.contribution_frequency}
                                        onChange={(e) => setSettings({...settings, contribution_frequency: e.target.value})}
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
                                <label className="block text-[11px] font-bold uppercase text-tertiary mb-1.5 tracking-wide">Description & Manifesto</label>
                                <textarea 
                                    className="w-full px-4 py-3 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 transition-shadow shadow-sm h-28 resize-none"
                                    value={settings.description}
                                    onChange={(e) => setSettings({...settings, description: e.target.value})}
                                />
                            </div>
                        </CardBody>
                    </Card>

                    <Card className="border-theme">
                        <CardBody className="p-6 space-y-5">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-2 pb-3 border-b border-theme">
                                <Clock className="w-4 h-4 text-amber-500" /> Maturity & Lifecycle
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[11px] font-bold uppercase text-tertiary mb-1.5 tracking-wide">Lifetime Mode</label>
                                    <select 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 transition-shadow shadow-sm"
                                        value={settings.lifetime_mode}
                                        onChange={(e) => setSettings({...settings, lifetime_mode: e.target.value})}
                                    >
                                        <option value="perpetual">Perpetual (Ongoing)</option>
                                        <option value="fixed_term">Fixed Term (Ends at Maturity)</option>
                                        <option value="target_based">Target Based (Ends when Goal Met)</option>
                                    </select>
                                </div>
                                <div className={settings.lifetime_mode === 'perpetual' ? 'opacity-50 pointer-events-none' : ''}>
                                    <label className="block text-[11px] font-bold uppercase text-tertiary mb-1.5 tracking-wide">Maturity Date</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2.5 rounded-xl border border-theme bg-elevated text-primary outline-none focus:ring-2 focus:ring-amber-500 transition-shadow shadow-sm"
                                        value={settings.maturity_date}
                                        onChange={(e) => setSettings({...settings, maturity_date: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                                    Changing the maturity date or lifetime mode affects withdrawal penalties and benefit distribution schedules. Governance voting may require a supermajority.
                                </p>
                            </div>
                        </CardBody>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card className="border-amber-100 dark:border-amber-800 bg-gradient-to-b from-amber-50 to-white dark:from-amber-900/20 dark:to-background">
                        <CardBody className="p-6">
                            <h4 className="font-bold text-primary flex items-center gap-2 mb-4">
                                <ShieldCheck className="w-5 h-5 text-amber-600" /> Governance Context
                            </h4>
                            
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-theme mb-5 shadow-sm">
                                <div className="text-[10px] font-bold text-tertiary uppercase tracking-wider mb-1">Hierarchy Mode</div>
                                <div className="font-bold text-amber-600 capitalize text-lg">
                                    {groupData?.hierarchy_mode?.replace('_', ' ') || 'Democratic'}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-secondary font-medium">Approval Threshold</span>
                                    <span className="font-bold text-primary bg-secondary/10 px-2.5 py-0.5 rounded-md">{groupData?.approval_threshold || 51}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-secondary font-medium">Voting Weight</span>
                                    <span className="font-bold text-primary bg-secondary/10 px-2.5 py-0.5 rounded-md">
                                        {groupData?.hierarchy_mode === 'capital_weighted' ? 'Capital Based' : 'Equal (1 per user)'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-amber-100 dark:border-amber-800">
                                <div className="flex items-start gap-2.5">
                                    <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                        {requiresVote 
                                            ? "Core settings modifications will automatically be submitted as governance proposals for group members to vote on." 
                                            : "Your group is in Admin Dictatorship mode. Core settings can be modified instantly without group voting."}
                                    </p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                    
                    {requiresVote && proposedChanges.length > 0 && (
                        <Card className="border-theme overflow-hidden">
                            <div className="bg-amber-500 h-1 w-full" />
                            <CardBody className="p-6">
                                <h4 className="font-bold text-primary flex items-center gap-2 mb-3">
                                    <Vote className="w-4 h-4 text-amber-500" /> Active Proposals
                                </h4>
                                <div className="text-3xl font-black text-primary mb-1">
                                    {proposedChanges.length}
                                </div>
                                <p className="text-xs text-secondary mb-4">Pending setting changes waiting for approval.</p>
                                <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => window.location.hash = '#governance'}>
                                    View in Governance Tab
                                </Button>
                            </CardBody>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupSettingsTab;
