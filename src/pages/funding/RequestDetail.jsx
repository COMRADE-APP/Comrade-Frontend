import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Calendar, FileText, CheckCircle, Clock, XCircle,
    Shield, ShieldAlert, Download, Eye, AlertTriangle, Play,
    MessageSquare, Building2, BarChart3, TrendingUp, DollarSign, Globe,
    Send, Paperclip
} from 'lucide-react';
import Card, { CardBody, CardHeader } from '../../components/common/Card';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';
import { formatDistanceToNow } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { formatMoneySimple } from '../../utils/moneyUtils.jsx';

const SCAN_STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    scanning: 'bg-blue-100 text-blue-700',
    clean: 'bg-green-100 text-green-700',
    malware: 'bg-red-100 text-red-700',
    nsfw_rejected: 'bg-red-100 text-red-700',
    error: 'bg-gray-100 text-gray-700'
};

const SCAN_STATUS_ICONS = {
    pending: Clock,
    scanning: Play,
    clean: Shield,
    malware: ShieldAlert,
    nsfw_rejected: AlertTriangle,
    error: XCircle
};

const STATUS_TIMELINE = [
    { key: 'draft', label: 'Draft' },
    { key: 'submitted', label: 'Submitted' },
    { key: 'under_review', label: 'Under Review' },
    { key: 'due_diligence', label: 'Due Diligence' },
    { key: 'negotiating', label: 'Negotiating' },
    { key: 'approved', label: 'Approved' },
    { key: 'funded', label: 'Funded' }
];

const DocumentViewerModal = ({ document, onClose }) => {
    if (!document) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-elevated w-full max-w-5xl h-[85vh] rounded-2xl shadow-xl flex flex-col">
                <div className="p-4 border-b border-theme flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-primary">{document.title}</h3>
                        <p className="text-xs text-secondary mt-1 text-center sm:text-left">
                            {document.doc_type?.replace('_', ' ')}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={document.file}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-secondary rounded-lg hover:bg-tertiary transition-colors text-primary flex items-center gap-2 text-sm"
                        >
                            <Download className="w-4 h-4" /> Download
                        </a>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 bg-secondary/30 relative">
                    <iframe
                        src={document.file}
                        className="w-full h-full border-0"
                        title={document.title}
                    />
                </div>
            </div>
        </div>
    );
};

const RequestDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [request, setRequest] = useState(null);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewingDoc, setViewingDoc] = useState(null);

    // Messaging states
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [attachment, setAttachment] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [negotiationId, setNegotiationId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const reqData = await fundingService.getRequestDetail(id);
                setRequest(reqData);

                if (reqData.business) {
                    // Fetch full business details to get documents
                    const bizData = await fundingService.getBusinessDetail(reqData.business.id || reqData.business);
                    setBusiness(bizData);
                }
            } catch (error) {
                console.error("Failed to load request details:", error);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchDetails();
    }, [id]);

    useEffect(() => {
        if (isChatOpen && id) {
            setupNegotiation();
        }
    }, [isChatOpen, id]);

    useEffect(() => {
        // Scroll to bottom when messages update
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isChatOpen]);

    const setupNegotiation = async () => {
        try {
            const negotiation = await fundingService.getOrCreateNegotiation(id);
            setNegotiationId(negotiation.id);
            const msgs = await fundingService.getNegotiationMessages(negotiation.id);
            setMessages(msgs);
        } catch (error) {
            console.error("Failed to setup negotiation:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !attachment) || !negotiationId || isSending) return;

        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append('content', newMessage);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            const newMsg = await fundingService.sendNegotiationMessage(negotiationId, formData);
            setMessages([...messages, newMsg]);
            setNewMessage('');
            setAttachment(null);

            // Re-fetch to ensure we have identical state as server
            const msgs = await fundingService.getNegotiationMessages(negotiationId);
            setMessages(msgs);

        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setIsSending(false);
        }
    };

    const formatCurrency = (amount) => {
        return formatMoneySimple(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!request) {
        return (
            <div className="max-w-4xl mx-auto p-4 text-center py-20">
                <FileText className="w-16 h-16 text-tertiary mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-primary mb-2">Request Not Found</h2>
                <p className="text-secondary mb-6">The funding request you are looking for does not exist or has been removed.</p>
                <Button onClick={() => navigate(-1)} variant="primary">
                    Go Back
                </Button>
            </div>
        );
    }

    const currentStatusIndex = STATUS_TIMELINE.findIndex(s => s.key === request.status);

    return (
        <div className={`max-w-6xl mx-auto p-4 md:p-6 space-y-6 transition-all duration-300 ${isChatOpen ? 'pr-[340px] md:pr-[400px]' : ''}`}>
            {/* Header / Actions */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-primary">Funding Request details</h1>
                    <p className="text-secondary mt-1">
                        Submitted {formatDistanceToNow(new Date(request.created_at))} ago
                    </p>
                </div>
                {request.status !== 'funded' && request.status !== 'rejected' && (
                    <div className="flex gap-2">
                        <Button
                            variant={isChatOpen ? "primary" : "outline"}
                            className="hidden sm:flex"
                            onClick={() => setIsChatOpen(!isChatOpen)}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" /> Message Founder
                        </Button>
                    </div>
                )}
            </div>

            {/* Status Timeline */}
            <Card className="overflow-hidden">
                <CardBody className="p-6">
                    <div className="relative">
                        <div className="overflow-x-auto pb-4 custom-scrollbar">
                            <div className="flex items-center min-w-max">
                                {STATUS_TIMELINE.map((step, idx) => {
                                    const isCompleted = idx <= currentStatusIndex;
                                    const isCurrent = idx === currentStatusIndex;
                                    return (
                                        <div key={step.key} className="flex items-center">
                                            <div className="flex flex-col items-center relative z-10">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                                                    ? 'bg-primary-600 border-primary-600 text-white'
                                                    : 'bg-secondary border-theme text-tertiary'
                                                    } ${isCurrent ? 'ring-4 ring-primary-100 scale-110' : ''}`}>
                                                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-medium">{idx + 1}</span>}
                                                </div>
                                                <span className={`text-xs font-medium mt-2 absolute top-10 whitespace-nowrap ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-primary' : 'text-tertiary'}`}>
                                                    {step.label}
                                                </span>
                                            </div>
                                            {idx < STATUS_TIMELINE.length - 1 && (
                                                <div className={`h-1 w-16 sm:w-24 md:w-32 mx-2 rounded transition-colors ${idx < currentStatusIndex ? 'bg-primary-600' : 'bg-theme'
                                                    }`} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </CardBody>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Content Details */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary-600" /> Investment Details
                            </h2>
                        </CardHeader>
                        <CardBody className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div className="bg-secondary/30 p-4 rounded-xl">
                                    <p className="text-sm text-secondary">Amount Needed</p>
                                    <p className="text-xl font-bold text-primary-600">{formatCurrency(request.amount_needed)}</p>
                                </div>
                                <div className="bg-secondary/30 p-4 rounded-xl">
                                    <p className="text-sm text-secondary">Equity Offered</p>
                                    <p className="text-xl font-bold text-primary">{request.equity_offered}%</p>
                                </div>
                                <div className="bg-secondary/30 p-4 rounded-xl">
                                    <p className="text-sm text-secondary">Min Investment</p>
                                    <p className="text-xl font-bold text-primary">{formatCurrency(request.min_investment)}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold text-primary mb-2">Use of Funds</h3>
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/50">
                                    <p className="text-secondary whitespace-pre-wrap">{request.use_of_funds}</p>
                                </div>
                            </div>
                        </CardBody>
                    </Card>

                    {/* Business/Pitch Section */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary-600" /> About the Business
                            </h2>
                        </CardHeader>
                        <CardBody className="p-6 space-y-4">
                            {business ? (
                                <>
                                    <div className="flex items-center gap-4 mb-4">
                                        {business.logo ? (
                                            <img src={business.logo} alt={business.name} className="w-16 h-16 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                                                {business.name?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-xl font-bold text-primary">{business.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="px-2 py-0.5 bg-secondary text-primary rounded-md text-xs font-medium uppercase tracking-wider">
                                                    {business.industry}
                                                </span>
                                                <span className="px-2 py-0.5 bg-secondary text-primary rounded-md text-xs font-medium uppercase tracking-wider">
                                                    {business.stage} stage
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-secondary">{business.description}</p>
                                </>
                            ) : (
                                <p className="text-tertiary italic">Loading business details...</p>
                            )}
                        </CardBody>
                    </Card>

                    {/* Documents & Virus Scanning */}
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <FileText className="w-5 h-5 text-primary-600" /> Attached Documents
                            </h2>
                        </CardHeader>
                        <CardBody className="p-6">
                            {business?.documents && business.documents.length > 0 ? (
                                <div className="space-y-3">
                                    {business.documents.map((doc) => {
                                        const statusColor = SCAN_STATUS_COLORS[doc.scan_status] || SCAN_STATUS_COLORS.pending;
                                        const StatusIcon = SCAN_STATUS_ICONS[doc.scan_status] || SCAN_STATUS_ICONS.pending;
                                        const isClean = doc.scan_status === 'clean';

                                        return (
                                            <div key={doc.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-secondary/5 border border-theme rounded-xl gap-4 hover:border-primary/30 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-lg ${statusColor} bg-opacity-20`}>
                                                        <FileText className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-primary">{doc.title}</h4>
                                                        <p className="text-xs text-secondary mt-0.5 uppercase tracking-wide">
                                                            {doc.doc_type?.replace('_', ' ')}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                                        <StatusIcon className="w-3.5 h-3.5" />
                                                        {doc.scan_status?.replace('_', ' ').toUpperCase()}
                                                    </span>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            disabled={!isClean}
                                                            onClick={() => setViewingDoc(doc)}
                                                            className={!isClean ? 'opacity-50 cursor-not-allowed' : ''}
                                                        >
                                                            <Eye className="w-4 h-4 sm:mr-2" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                        <a
                                                            href={isClean ? doc.file : '#'}
                                                            download={isClean}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={`p-2 border border-theme rounded-lg transition-colors flex items-center justify-center ${isClean ? 'hover:bg-primary-50 text-primary-600 border-primary-100 hover:border-primary-300' : 'bg-secondary text-tertiary cursor-not-allowed border-transparent'
                                                                }`}
                                                            onClick={(e) => {
                                                                if (!isClean) {
                                                                    e.preventDefault();
                                                                    alert("This document cannot be downloaded until it passes the security scan.");
                                                                }
                                                            }}
                                                        >
                                                            <Download className="w-4 h-4" />
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center p-8 border border-dashed border-theme rounded-xl">
                                    <FileText className="w-12 h-12 text-tertiary mx-auto mb-3" />
                                    <p className="text-secondary font-medium">No documents attached.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </div>

                {/* Sidebar (Target Venture & Quick Stats) */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold">Target Fund</h2>
                        </CardHeader>
                        <CardBody className="p-6">
                            {request.target_venture ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-semibold text-primary text-lg">{request.target_venture_name}</h3>
                                    <p className="text-sm text-secondary mt-1">This request was sent specifically to this venture capital fund.</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Globe className="w-8 h-8" />
                                    </div>
                                    <h3 className="font-semibold text-primary text-lg">Public Request</h3>
                                    <p className="text-sm text-secondary mt-1">This request is open to all investors and verified funds on the platform.</p>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    <Card>
                        <CardBody className="p-6">
                            <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary-600" /> Platform Traction
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-secondary flex items-center gap-2">
                                        <Eye className="w-4 h-4" /> Views
                                    </span>
                                    <span className="font-semibold text-primary">--</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-secondary flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Interests Shown
                                    </span>
                                    <span className="font-semibold text-primary">{request.reactions_count || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                                    <span className="text-secondary flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" /> Investment Offers
                                    </span>
                                    <span className="font-semibold text-primary">{request.responses_count || 0}</span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-6"
                                onClick={() => navigate(`/funding/analytics/${request.id}`)}
                            >
                                <BarChart3 className="w-4 h-4 mr-2" /> View Full Analytics
                            </Button>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Document Viewer Portal */}
            <AnimatePresence>
                {viewingDoc && (
                    <DocumentViewerModal
                        document={viewingDoc}
                        onClose={() => setViewingDoc(null)}
                    />
                )}
            </AnimatePresence>

            {/* Messaging Slide-Out Drawer */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                        className="fixed right-0 top-[73px] bottom-0 w-full sm:w-[340px] md:w-[400px] bg-elevated border-l border-theme shadow-2xl z-40 flex flex-col"
                    >
                        {/* Drawer Header */}
                        <div className="p-4 border-b border-theme flex items-center justify-between bg-secondary/10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-100 text-primary-600 rounded-lg">
                                    <MessageSquare className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-primary">Founder Chat</h3>
                                    <p className="text-xs text-secondary">{business?.name || 'Business'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsChatOpen(false)}
                                className="p-2 hover:bg-secondary rounded-lg transition-colors"
                            >
                                <XCircle className="w-5 h-5 text-tertiary" />
                            </button>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-secondary/5">
                            {!negotiationId && loading ? (
                                <div className="h-full flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                    <MessageSquare className="w-12 h-12 text-tertiary mb-3" />
                                    <p className="text-sm text-secondary">
                                        No messages yet. Start the conversation with the founder to discuss this funding request.
                                    </p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.is_me === true;
                                    return (
                                        <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div
                                                className={`max-w-[85%] rounded-2xl p-3 ${isMe
                                                    ? 'bg-primary-600 text-white rounded-tr-sm'
                                                    : 'bg-white dark:bg-gray-800 border border-theme text-primary rounded-tl-sm shadow-sm'
                                                    }`}
                                            >
                                                {msg.content && <p className="text-sm whitespace-pre-wrap">{msg.content}</p>}
                                                {msg.attachment && (
                                                    <a
                                                        href={msg.attachment}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={`mt-2 flex items-center gap-2 text-xs p-2 rounded-lg ${isMe ? 'bg-primary-700 hover:bg-primary-800' : 'bg-secondary hover:bg-tertiary'
                                                            }`}
                                                    >
                                                        <FileText className="w-3 h-3" /> View Attachment
                                                    </a>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-tertiary mt-1 mx-1">
                                                {formatDistanceToNow(new Date(msg.created_at || new Date()))} ago
                                            </span>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 border-t border-theme bg-elevated">
                            {attachment && (
                                <div className="mb-3 flex items-center justify-between p-2 bg-secondary rounded-lg text-sm border border-theme">
                                    <span className="truncate flex-1 font-medium">{attachment.name}</span>
                                    <button
                                        onClick={() => setAttachment(null)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                            <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                                <label className="shrink-0 p-2 text-tertiary hover:text-primary transition-colors cursor-pointer bg-secondary rounded-xl mb-1 border border-theme hover:border-primary-300">
                                    <Paperclip className="w-5 h-5" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) {
                                                setAttachment(e.target.files[0]);
                                            }
                                        }}
                                    />
                                </label>
                                <div className="flex-1 bg-secondary rounded-xl border border-theme focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all overflow-hidden relative">
                                    <textarea
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type your message..."
                                        className="w-full bg-transparent p-3 text-sm resize-none focus:outline-none max-h-32 min-h-[44px]"
                                        rows={1}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendMessage(e);
                                            }
                                        }}
                                        style={{ height: 'auto' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={(!newMessage.trim() && !attachment) || isSending}
                                    className={`shrink-0 p-3 rounded-xl flex items-center justify-center transition-colors mb-1 ${(!newMessage.trim() && !attachment) || isSending
                                        ? 'bg-secondary text-tertiary cursor-not-allowed border border-theme'
                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md'
                                        }`}
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default RequestDetail;
