import React, { useState, useEffect, useCallback } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import { X, Search, Mail, UserPlus, ArrowRight, ArrowLeft, Check, AlertCircle, Globe, Users } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { useToast } from '../../contexts/ToastContext';

const GroupInviteModal = ({ isOpen, onClose, groupId, groupName, onInviteSent }) => {
    const [step, setStep] = useState(1); // 1: Method, 2: Input, 3: Review
    const [inviteMethod, setInviteMethod] = useState(null); // 'qomrade' or 'external'
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [externalEmail, setExternalEmail] = useState('');
    const [isSending, setIsSending] = useState(false);
    const toast = useToast();

    // Debounced search
    useEffect(() => {
        if (inviteMethod !== 'qomrade' || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const handler = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await paymentsService.searchInvitableUsers(groupId, searchQuery);
                setSearchResults(results || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsSearching(false);
            }
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery, inviteMethod, groupId]);

    const handleNextStep = () => {
        if (step === 1 && inviteMethod) setStep(2);
        else if (step === 2) {
            if (inviteMethod === 'qomrade' && selectedUser) setStep(3);
            else if (inviteMethod === 'external' && externalEmail) setStep(3);
        }
    };

    const handlePrevStep = () => {
        if (step === 3) setStep(2);
        else if (step === 2) {
            setStep(1);
            setSelectedUser(null);
            setSearchResults([]);
        }
    };

    const handleSendInvite = async () => {
        setIsSending(true);
        try {
            const identifier = inviteMethod === 'qomrade' ? selectedUser.username : externalEmail;
            const forceExternal = inviteMethod === 'external';
            
            await paymentsService.inviteToGroup(groupId, identifier, forceExternal);
            
            toast.success(`Invitation sent to ${identifier}`);
            onInviteSent();
            handleClose();
        } catch (error) {
            console.error('Invite error:', error);
            toast.error(error.response?.data?.error || 'Failed to send invitation');
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = () => {
        setStep(1);
        setInviteMethod(null);
        setSearchQuery('');
        setSelectedUser(null);
        setExternalEmail('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <Card className="w-full max-w-md shadow-2xl border-theme overflow-hidden">
                <CardBody className="p-0">
                    {/* Header */}
                    <div className="p-4 border-b border-theme flex items-center justify-between bg-tertiary/5">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <UserPlus className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-primary">Invite to {groupName}</h2>
                                <p className="text-[10px] text-secondary uppercase tracking-wider font-semibold">Step {step} of 3</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 hover:bg-secondary/10 rounded-full transition-colors">
                            <X className="w-5 h-5 text-secondary" />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Step 1: Method Selection */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-secondary mb-4">How would you like to invite?</h3>
                                <button
                                    onClick={() => setInviteMethod('qomrade')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                                        inviteMethod === 'qomrade' 
                                        ? 'border-primary bg-primary/5 shadow-md' 
                                        : 'border-theme hover:border-primary/30 hover:bg-secondary/5'
                                    }`}
                                >
                                    <div className={`p-3 rounded-xl ${inviteMethod === 'qomrade' ? 'bg-primary text-white' : 'bg-secondary/10 text-secondary'}`}>
                                        <Search className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-primary">Search Qomrade</p>
                                        <p className="text-xs text-secondary">Find existing users by name or username</p>
                                    </div>
                                    {inviteMethod === 'qomrade' && <Check className="w-5 h-5 text-primary" />}
                                </button>

                                <button
                                    onClick={() => setInviteMethod('external')}
                                    className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                                        inviteMethod === 'external' 
                                        ? 'border-primary bg-primary/5 shadow-md' 
                                        : 'border-theme hover:border-primary/30 hover:bg-secondary/5'
                                    }`}
                                >
                                    <div className={`p-3 rounded-xl ${inviteMethod === 'external' ? 'bg-primary text-white' : 'bg-secondary/10 text-secondary'}`}>
                                        <Mail className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-primary">External Email</p>
                                        <p className="text-xs text-secondary">Invite anyone via their email address</p>
                                    </div>
                                    {inviteMethod === 'external' && <Check className="w-5 h-5 text-primary" />}
                                </button>
                            </div>
                        )}

                        {/* Step 2: Input */}
                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                {inviteMethod === 'qomrade' ? (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                            <input
                                                type="text"
                                                autoFocus
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Search by name or username..."
                                                className="w-full pl-10 pr-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            />
                                            {isSearching && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="max-h-60 overflow-y-auto space-y-2 rounded-xl custom-scrollbar">
                                            {searchResults.length > 0 ? (
                                                searchResults.map((u) => (
                                                    <button
                                                        key={u.id}
                                                        onClick={() => setSelectedUser(u)}
                                                        className={`w-full p-3 rounded-lg border flex items-center gap-3 transition-all ${
                                                            selectedUser?.id === u.id
                                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                                            : 'border-theme hover:bg-secondary/5'
                                                        }`}
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden">
                                                            {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : (u.username?.[0]?.toUpperCase() || '?')}
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className="font-bold text-primary text-sm">{u.full_name}</p>
                                                            <p className="text-xs text-secondary">@{u.username}</p>
                                                        </div>
                                                        {selectedUser?.id === u.id && <Check className="w-4 h-4 text-primary" />}
                                                    </button>
                                                ))
                                            ) : searchQuery.length >= 2 && !isSearching ? (
                                                <div className="p-8 text-center text-secondary bg-secondary/5 rounded-xl border border-dashed border-theme">
                                                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                                    <p className="text-sm">No users found matching "{searchQuery}"</p>
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center text-secondary">
                                                    <p className="text-xs italic">Type at least 2 characters to search</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-secondary ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary" />
                                            <input
                                                type="email"
                                                autoFocus
                                                value={externalEmail}
                                                onChange={(e) => setExternalEmail(e.target.value)}
                                                placeholder="friend@example.com"
                                                className="w-full pl-10 pr-4 py-3 bg-secondary/5 border border-theme rounded-xl text-primary focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                        <p className="text-[10px] text-tertiary ml-1">They will receive an email with instructions to join Qomrade.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="p-6 bg-primary/5 rounded-2xl border border-primary/20 text-center space-y-4">
                                    <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary mx-auto">
                                        {inviteMethod === 'qomrade' ? (
                                            selectedUser?.avatar ? (
                                                <img src={selectedUser.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                            ) : <Users className="w-10 h-10" />
                                        ) : <Globe className="w-10 h-10" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-primary text-lg">
                                            {inviteMethod === 'qomrade' ? selectedUser?.full_name : 'External Invitation'}
                                        </h3>
                                        <p className="text-secondary">
                                            {inviteMethod === 'qomrade' ? `@${selectedUser?.username}` : externalEmail}
                                        </p>
                                    </div>
                                    <div className="pt-2 border-t border-primary/10">
                                        <p className="text-xs text-secondary">
                                            Ready to send invitation to join <span className="font-bold text-primary">{groupName}</span>?
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3 mt-8">
                            {step > 1 && (
                                <Button variant="outline" className="flex-1 py-3" onClick={handlePrevStep} disabled={isSending}>
                                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                                </Button>
                            )}
                            <Button 
                                variant="primary" 
                                className="flex-[2] py-3 shadow-lg shadow-primary/20" 
                                onClick={step === 3 ? handleSendInvite : handleNextStep}
                                disabled={
                                    (step === 1 && !inviteMethod) ||
                                    (step === 2 && inviteMethod === 'qomrade' && !selectedUser) ||
                                    (step === 2 && inviteMethod === 'external' && !externalEmail) ||
                                    isSending
                                }
                            >
                                {isSending ? 'Sending...' : step === 3 ? 'Confirm & Send' : 'Continue'}
                                {step < 3 && !isSending && <ArrowRight className="w-4 h-4 ml-2" />}
                            </Button>
                        </div>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default GroupInviteModal;
