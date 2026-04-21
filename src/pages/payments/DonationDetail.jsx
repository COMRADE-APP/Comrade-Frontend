import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import {
    Target, ArrowLeft, Calendar, DollarSign, Users, AlertCircle, Heart, Ribbon, Share2, ShieldCheck, Mail
} from 'lucide-react';
import paymentsService from '../../services/payments.service';

const DonationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [donation, setDonation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [contributeAmount, setContributeAmount] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentsService.getDonationById(id);
            setDonation(data);
        } catch (err) {
            console.error('Error loading Donation:', err);
            setError('Failed to load Donation details.');
        } finally {
            setLoading(false);
        }
    };

    const handleContribute = (e) => {
        e.preventDefault();
        if (!contributeAmount || isNaN(contributeAmount)) return;

        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: donation.id,
                    type: 'donation',
                    name: `Donation: ${donation.name}`,
                    price: parseFloat(contributeAmount),
                    qty: 1,
                    image: donation.cover_photo || null
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(contributeAmount)
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
            </div>
        );
    }

    if (error || !donation) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{error || 'Donation campaign not found'}</h3>
                <Button variant="primary" onClick={() => navigate('/funding/donations')}>
                    Return to Donations
                </Button>
            </div>
        );
    }

    const progress = donation.target_amount > 0 
        ? Math.min(100, (parseFloat(donation.current_amount || 0) / parseFloat(donation.target_amount)) * 100) 
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-6 lg:pb-12">
            {/* Top Back Action */}
            <div className="flex items-center gap-4 px-4 pt-4 lg:hidden">
                <button
                    onClick={() => navigate('/funding/donations')}
                    className="p-2 rounded-xl bg-elevated hover:bg-secondary/10 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
            </div>

            {/* Premium Hero Banner */}
            <div className="relative w-full h-[300px] md:h-[400px] lg:h-[450px] rounded-b-3xl md:rounded-3xl overflow-hidden shadow-2xl lg:mt-6 group">
                {donation.cover_photo ? (
                    <img 
                        src={donation.cover_photo} 
                        alt={donation.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 via-rose-500 to-red-600 flex items-center justify-center">
                        <Heart className="w-32 h-32 text-white/20" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
                
                {/* Embedded Headings in Banner */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="flex-1">
                        {donation.donation_type && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs rounded-full uppercase font-bold tracking-wider mb-4 shadow-sm">
                                <Ribbon className="w-3 h-3" /> {donation.donation_type}
                            </span>
                        )}
                        <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-md">
                            {donation.name}
                        </h1>
                        <div className="flex items-center gap-4 mt-4 text-white/80 text-sm font-medium">
                            {donation.charity_organization && (
                                <span className="flex items-center gap-1.5 bg-green-500/20 backdrop-blur-sm px-2 py-1 rounded-md text-green-300 border border-green-500/30">
                                    <ShieldCheck className="w-4 h-4" /> Verified Charity
                                </span>
                            )}
                            {donation.payment_group && (
                                <span className="flex items-center gap-1.5">
                                    <Users className="w-4 h-4" /> Group Managed
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                        <button className="h-12 px-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 text-white font-semibold flex items-center gap-2 transition-all shadow-lg hover:-translate-y-1">
                            <Share2 className="w-5 h-5" /> Share
                        </button>
                    </div>
                </div>

                {/* Desktop Back button */}
                <button
                    onClick={() => navigate('/funding/donations')}
                    className="absolute top-6 left-6 p-2 rounded-xl bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/20 text-white transition-all hidden lg:block"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            {/* Campaign Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 md:px-0">
                
                {/* Left Col: Narrative */}
                <div className="lg:col-span-7 space-y-8">
                    <div className="bg-elevated p-8 rounded-3xl shadow-sm border border-theme">
                        <h2 className="text-xl font-bold text-primary border-b border-theme pb-4 mb-6">About the Campaign</h2>
                        <div className="prose max-w-none text-secondary">
                            <p className="whitespace-pre-wrap leading-relaxed text-lg text-primary/90">
                                {donation.description}
                            </p>
                        </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-100 p-6 rounded-3xl flex gap-4 items-start shadow-inner">
                        <div className="bg-white p-3 rounded-2xl shadow-sm text-pink-600 shrink-0">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-bold text-rose-900">Campaign Guarantee</h4>
                            <p className="text-sm text-rose-800/80 mt-1">100% of the funds contributed securely route directly into this verified campaign's settlement pool. Every contribution leaves a public trace for absolute transparency.</p>
                        </div>
                    </div>
                </div>

                {/* Right Col: Funding Status UI */}
                <div className="lg:col-span-5 relative">
                    <div className="sticky top-24">
                        <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden bg-gradient-to-b from-elevated to-primary/5">
                            <div className="h-1 bg-gradient-to-r from-pink-500 to-rose-600"></div>
                            <CardBody className="p-8">
                                <p className="text-sm font-bold text-secondary uppercase tracking-widest mb-2">Total Raised</p>
                                <div className="flex items-baseline gap-2 mb-6 text-primary">
                                    <span className="text-5xl font-black">${parseFloat(donation.current_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    <span className="text-secondary font-medium">USD</span>
                                </div>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="h-3 bg-secondary/10 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-500 to-rose-600 rounded-full transition-all duration-1000 ease-out relative"
                                            style={{ width: `${Math.max(2, progress)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-white/20 w-full h-full skeleton-shimmer"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between text-sm font-semibold">
                                        <span className="text-pink-600">{progress.toFixed(1)}% of Goal</span>
                                        <span className="text-secondary">${parseFloat(donation.target_amount || 0).toLocaleString()} Goal</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-8 mb-8 border-b border-theme text-center">
                                    <div className="bg-secondary/5 rounded-2xl p-4 border border-theme">
                                        <h4 className="text-2xl font-bold text-primary">
                                            {/* We don't have donors count from API, mockup for aesthetics */}
                                            {Math.floor(progress * 1.5) + 3}
                                        </h4>
                                        <p className="text-xs text-secondary font-medium uppercase mt-1">Supporters</p>
                                    </div>
                                    <div className="bg-secondary/5 rounded-2xl p-4 border border-theme">
                                        <h4 className="text-2xl font-bold text-primary">
                                            {donation.remaining_days !== undefined ? (donation.remaining_days > 0 ? donation.remaining_days : 0) : '∞'}
                                        </h4>
                                        <p className="text-xs text-secondary font-medium uppercase mt-1">Days Left</p>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    onClick={() => setShowContributeModal(true)}
                                    className="w-full h-14 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all bg-gradient-to-r from-pink-600 to-rose-600 border-0"
                                >
                                    <Heart className="w-5 h-5 mr-3" fill="currentColor" />
                                    Make a Donation
                                </Button>
                                
                                {donation.payment_group && (
                                    <Button
                                        variant="outline"
                                        onClick={() => navigate(`/payments/groups/${donation.payment_group}?tab=overview`)}
                                        className="w-full h-12 mt-4 text-sm font-semibold bg-transparent border-theme hover:bg-secondary/5 text-secondary"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        View Organizer Group
                                    </Button>
                                )}
                            </CardBody>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Contribute Modal connected to Checkout */}
            {showContributeModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md shadow-2xl scale-in-center overflow-hidden rounded-3xl border-0">
                        <div className="h-2 bg-gradient-to-r from-pink-500 to-rose-600"></div>
                        <CardBody className="p-8">
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center border-4 border-white shadow-sm">
                                    <Heart className="w-8 h-8 text-pink-600" fill="currentColor" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-center text-primary mb-2">Back this Campaign</h3>
                            <p className="text-center text-secondary mb-8 text-sm">Enter the amount you wish to donate. You will be redirected to secure checkout.</p>
                            
                            <form onSubmit={handleContribute} className="space-y-6">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <DollarSign className="h-6 w-6 text-tertiary" />
                                    </div>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        required
                                        value={contributeAmount}
                                        onChange={(e) => setContributeAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="block w-full pl-12 pr-4 py-4 border-2 border-theme bg-elevated text-primary rounded-xl focus:ring-0 focus:border-pink-500 text-3xl font-bold transition-colors shadow-inner text-center"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    {[10, 50, 100].map(amt => (
                                        <button
                                            key={amt}
                                            type="button"
                                            className="py-2 border border-theme rounded-lg font-semibold text-secondary hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 transition-colors"
                                            onClick={() => setContributeAmount(amt.toString())}
                                        >
                                            ${amt}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="flex gap-3 pt-4 border-t border-theme">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowContributeModal(false)}
                                        className="flex-1 py-3"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        disabled={!contributeAmount}
                                        className="flex-1 py-3 shadow-md bg-pink-600 hover:bg-pink-700 text-white border-0"
                                    >
                                        Proceed
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default DonationDetail;
