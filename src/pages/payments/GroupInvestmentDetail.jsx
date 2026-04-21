import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    Briefcase, ArrowLeft, Calendar, DollarSign, Users, AlertCircle, PieChart, Target, TrendingUp, Building, ThumbsUp, ThumbsDown, CheckCircle, Share2, UploadCloud
} from 'lucide-react';
import paymentsService from '../../services/payments.service';
import { formatDate } from '../../utils/dateFormatter';

const GroupInvestmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [investment, setInvestment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [quoteAmount, setQuoteAmount] = useState('');
    const [voteLoading, setVoteLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await paymentsService.getGroupInvestmentById(id);
            setInvestment(data);
        } catch (err) {
            console.error('Error loading Group Investment:', err);
            setError('Failed to load Investment details.');
        } finally {
            setLoading(false);
        }
    };

    const handleQuote = (e) => {
        e.preventDefault();
        if (!quoteAmount || isNaN(quoteAmount)) return;

        navigate('/payments/checkout', {
            state: {
                cartItems: [{
                    id: investment.id,
                    type: 'investment_quote',
                    name: `Investment in ${investment.name}`,
                    price: parseFloat(quoteAmount),
                    qty: 1,
                    image: null
                }],
                purchaseType: 'individual',
                totalAmount: parseFloat(quoteAmount)
            }
        });
    };

    const handleVote = async (voteValue, voteId) => {
        if (!voteId) return;
        setVoteLoading(true);
        try {
            await paymentsService.castVote(voteId, voteValue);
            loadData();
        } catch (err) {
            console.error('Vote failed:', err);
            alert('Vote submission failed.');
        } finally {
            setVoteLoading(false);
        }
    };

    const handleJoinPitch = async () => {
        try {
            await paymentsService.joinPublicPitch(investment.id);
            alert('You have successfully joined the syndicate!');
            loadData();
        } catch (err) {
            console.error('Join failed:', err);
            alert('Could not join syndicate.');
        }
    };

    const handleWithdraw = async (type) => {
        try {
            const amount = prompt(`Enter amount to withdraw from your ${type}:`);
            if (!amount) return;
            if (type === 'contribution') {
                await paymentsService.withdrawContribution(investment.id, amount);
            } else {
                await paymentsService.withdrawGains(investment.id, amount, 'direct_to_wallet');
            }
            alert('Withdrawal successful');
            loadData();
        } catch (err) {
            console.error('Withdrawal failed:', err);
            alert('Withdrawal failed.');
        }
    };

    const handleShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({
                    title: `Join ${investment.name}`,
                    text: `Check out this investment pitch on Qomrade: ${investment.name}`,
                    url: window.location.href,
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
            }
        } catch (err) {
            console.error('Share failed', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !investment) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{error || 'Investment pitch not found'}</h3>
                <Button variant="primary" onClick={() => navigate('/funding/group-investments')}>
                    Return to Investments
                </Button>
            </div>
        );
    }

    const progress = investment.target_amount > 0 
        ? Math.min(100, (parseFloat(investment.amount_collected || 0) / parseFloat(investment.target_amount)) * 100) 
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 lg:pb-12 lg:px-4">
            
            {/* Nav Header */}
            <div className="flex items-center gap-4 pt-4 lg:pt-8 bg-transparent">
                <button
                    onClick={() => navigate('/funding/group-investments')}
                    className="p-2.5 rounded-xl bg-elevated hover:bg-secondary/10 border border-theme shadow-sm transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                    <span>Funding</span>
                    <span className="opacity-50">/</span>
                    <span className="text-primary truncate max-w-[200px] sm:max-w-xs">{investment.name}</span>
                </div>
            </div>

            {/* Dashboard Hero */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                
                {/* Left Side: Summary & Action */}
                <div className="xl:col-span-2 flex flex-col gap-8">
                    <div>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {investment.opportunity_category && (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full uppercase font-bold tracking-wider">
                                    <Target className="w-3.5 h-3.5" />
                                    {investment.opportunity_category}
                                </span>
                            )}
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full uppercase font-bold tracking-wider ${
                                investment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                investment.status === 'active' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                                <TrendingUp className="w-3.5 h-3.5" />
                                {investment.status}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-primary tracking-tight mb-4">
                            {investment.name}
                        </h1>
                        <p className="text-xl text-secondary leading-relaxed">
                            {investment.description || 'No description provided.'}
                        </p>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 shadow-inner mt-4">
                        <div className="flex flex-col md:flex-row gap-8 items-center">
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-indigo-900 font-bold uppercase tracking-wider text-sm">Capital Raised</span>
                                    <span className="text-secondary font-medium">Goal: ${parseFloat(investment.target_amount || 0).toLocaleString()}</span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-4xl font-black text-indigo-700">
                                        ${parseFloat(investment.amount_collected || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="h-4 bg-indigo-200/50 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${Math.max(2, progress)}%` }}
                                    ></div>
                                </div>
                                <p className="text-right text-indigo-700 text-sm font-bold mt-2">{progress.toFixed(1)}% Subscribed</p>
                            </div>
                            
                            <div className="w-full md:w-auto flex shrink-0 gap-4">
                                <Button
                                    variant="outline"
                                    onClick={handleShare}
                                    className="py-4 px-6 text-lg hover:-translate-y-1 transition-all rounded-2xl border-indigo-200 text-indigo-700 bg-white"
                                >
                                    <Share2 className="w-5 h-5" />
                                </Button>
                                {investment.status === 'active' && investment.pitch_visibility === 'public' && !investment.is_group_member && (
                                    <Button
                                        variant="primary"
                                        onClick={handleJoinPitch}
                                        className="w-full md:w-auto py-4 px-8 text-lg shadow-xl shadow-green-200 hover:-translate-y-1 transition-all bg-green-600 hover:bg-green-700 border-0 rounded-2xl"
                                    >
                                        <Users className="w-6 h-6 mr-3" />
                                        Join Syndicate
                                    </Button>
                                )}
                                {investment.status === 'active' && (investment.is_group_member || investment.pitch_visibility !== 'public') && (
                                    <Button
                                        variant="primary"
                                        onClick={() => setShowQuoteModal(true)}
                                        className="w-full md:w-auto py-4 px-8 text-lg shadow-xl shadow-indigo-200 hover:-translate-y-1 transition-all bg-indigo-600 hover:bg-indigo-700 border-0 rounded-2xl"
                                    >
                                        <DollarSign className="w-6 h-6 mr-3" />
                                        Quote Shares
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Term Sheet */}
                <Card className="xl:col-span-1 border-theme shadow-lg rounded-3xl overflow-hidden h-fit sticky top-24">
                    <div className="h-2 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
                    <CardBody className="p-6">
                        <h3 className="font-bold text-primary flex items-center gap-2 mb-6 text-lg">
                            <Briefcase className="text-indigo-600" />
                            Term Sheet Summary
                        </h3>
                        
                        <div className="space-y-4">
                            <div className="bg-primary/5 rounded-2xl p-4 border border-theme">
                                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Syndicate Group</p>
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                    <Users className="w-5 h-5 text-blue-600" />
                                    {investment.payment_group_name || 'Group Backed'}
                                </div>
                            </div>

                            <div className="bg-primary/5 rounded-2xl p-4 border border-theme">
                                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Maturity Horizon</p>
                                <div className="flex items-center gap-2 font-semibold text-primary">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    {investment.maturity_date ? formatDate(investment.maturity_date) : 'Open-Ended'}
                                </div>
                            </div>

                            <div className="bg-primary/5 rounded-2xl p-4 border border-theme">
                                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-1">Quoting Mode</p>
                                <div className="flex items-center gap-2 font-semibold text-primary capitalize">
                                    <PieChart className="w-5 h-5 text-blue-600" />
                                    {investment.quoting_mode}
                                </div>
                            </div>
                        </div>

                        {investment.payment_group && (
                            <div className="mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/payments/groups/${investment.payment_group}?tab=overview`)}
                                    className="w-full justify-center h-12 rounded-xl"
                                >
                                    <Building className="w-4 h-4 mr-2" />
                                    View Managing Group
                                </Button>
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Voting Section */}
            {investment.approval_vote && (
                <div className="mt-12 bg-elevated border border-theme rounded-3xl p-8 shadow-sm">
                    <h3 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                        <CheckCircle className="text-indigo-600 w-7 h-7" />
                        Pitch Approval
                    </h3>
                    
                    {!investment.approval_vote.user_vote ? (
                        <div className="text-center py-8 max-w-lg mx-auto">
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h4 className="text-xl font-bold text-primary mb-2">Your Vote is Required</h4>
                            <p className="text-secondary mb-8">
                                You must vote on this investment pitch to unlock the capitalization table and view the group's consensus.
                            </p>
                            <div className="flex gap-4 justify-center">
                                <Button onClick={() => handleVote('against', investment.approval_vote.id)} disabled={voteLoading} className="bg-red-50 text-red-700 hover:bg-red-100 px-8 py-3 rounded-xl font-bold border-0">
                                    <ThumbsDown className="w-5 h-5 mr-2" /> Reject
                                </Button>
                                <Button onClick={() => handleVote('for', investment.approval_vote.id)} disabled={voteLoading} className="bg-green-50 text-green-700 hover:bg-green-100 px-8 py-3 rounded-xl font-bold border-0">
                                    <ThumbsUp className="w-5 h-5 mr-2" /> Approve
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-8 items-center border border-indigo-100 bg-indigo-50/50 rounded-2xl p-6">
                            <div className="flex-1 w-full space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-indigo-900 font-bold uppercase tracking-wider text-sm">Group Sentiment</span>
                                    <span className={`text-2xl font-black ${investment.approval_vote.approval_percentage >= 50 ? 'text-green-600' : 'text-amber-600'}`}>
                                        {investment.approval_vote.approval_percentage}% Approved
                                    </span>
                                </div>
                                <div className="h-3 bg-secondary/10 rounded-full overflow-hidden p-0.5">
                                    <div
                                        className="h-full bg-green-500 rounded-full transition-all"
                                        style={{ width: `${investment.approval_vote.approval_percentage}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-sm font-medium text-secondary">
                                    <span className="text-green-700">{investment.approval_vote.votes_for_count} For</span>
                                    <span className="text-red-700">{investment.approval_vote.votes_against_count} Against</span>
                                    <span>{investment.approval_vote.votes_abstain_count} Abstain</span>
                                </div>
                            </div>
                            <div className="w-full md:w-auto shrink-0 bg-white p-4 rounded-xl border border-indigo-100 text-center shadow-sm">
                                <p className="text-xs text-secondary font-bold uppercase tracking-wider mb-2">You Voted</p>
                                <div className="flex justify-center items-center gap-2">
                                    {investment.approval_vote.user_vote === 'for' ? <ThumbsUp className="w-6 h-6 text-green-600" /> : <ThumbsDown className="w-6 h-6 text-red-600" />}
                                    <span className={`font-black text-lg capitalize ${investment.approval_vote.user_vote === 'for' ? 'text-green-600' : 'text-red-600'}`}>
                                        {investment.approval_vote.user_vote}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Cap Table */}
            {(!investment.approval_vote || investment.approval_vote.user_vote) && investment.quotes && investment.quotes.length > 0 && (
                <div className="mt-12">
                    <h3 className="text-2xl font-black text-primary mb-6 flex items-center gap-3">
                        <PieChart className="text-indigo-600 w-7 h-7" />
                        Capitalization Table
                    </h3>
                    <div className="bg-elevated border border-theme rounded-3xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-secondary/5 border-b border-theme text-xs uppercase tracking-wider text-secondary font-bold">
                                    <tr>
                                        <th className="p-4 pl-6">Investor</th>
                                        <th className="p-4 text-right">Capital Committed</th>
                                        <th className="p-4 text-right pr-6">Ownership Base</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-theme">
                                    {investment.quotes.map((quote, idx) => (
                                        <tr key={idx} className="hover:bg-primary/5 transition-colors group">
                                            <td className="p-4 pl-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-inner">
                                                        {quote.member_name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <span className="font-semibold text-primary group-hover:text-indigo-600 transition-colors">
                                                        {quote.member_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right font-bold text-primary">
                                                ${parseFloat(quote.amount_quoted).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 text-right pr-6">
                                                <span className="inline-block bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold text-sm mb-2">
                                                    {parseFloat(quote.ownership_percentage).toFixed(2)}%
                                                </span>
                                                {investment.is_group_member && quote.member_name && ( // assuming checking logic if this row is me wouldn't hurt
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button title="Withdraw Contribution (2% penalty early)" onClick={() => handleWithdraw('contribution')} className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded hover:bg-red-100 font-bold uppercase">
                                                            W/D Cap
                                                        </button>
                                                        <button title="Withdraw Gains" onClick={() => handleWithdraw('gains')} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 font-bold uppercase">
                                                            W/D Gain
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Quote Modal */}
            {showQuoteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg shadow-2xl scale-in-center overflow-hidden border-0 rounded-3xl">
                        <div className="h-2 bg-gradient-to-r from-indigo-600 to-blue-500"></div>
                        <CardBody className="p-8">
                            <h3 className="text-3xl font-black text-primary mb-2">Quote Shares</h3>
                            <p className="text-secondary mb-8">Secure your allocation in <strong className="text-primary">{investment.name}</strong></p>
                            
                            <form onSubmit={handleQuote} className="space-y-6">
                                <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                    <div className="flex justify-between items-end mb-4">
                                        <span className="text-sm font-bold text-indigo-900 uppercase">Available Volume</span>
                                        <span className="text-xl font-black text-primary text-right">
                                            ${Math.max(0, parseFloat(investment.target_amount) - parseFloat(investment.amount_collected)).toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="relative mt-2">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <DollarSign className="h-6 w-6 text-tertiary" />
                                        </div>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            required
                                            value={quoteAmount}
                                            onChange={(e) => setQuoteAmount(e.target.value)}
                                            placeholder="Enter amount..."
                                            className="block w-full pl-12 pr-4 py-4 border-2 border-indigo-200 bg-white text-indigo-900 rounded-xl focus:ring-0 focus:border-indigo-500 text-2xl font-bold transition-all shadow-inner"
                                        />
                                    </div>
                                    
                                    {quoteAmount && investment.target_amount > 0 && investment.quoting_mode === 'proportional' && (
                                        <div className="mt-4 flex items-start gap-3 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                                            <PieChart className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm font-bold text-primary">Proportional Stake</p>
                                                <p className="text-xs text-secondary mt-0.5">
                                                    This quote secures <strong className="text-indigo-600">{((parseFloat(quoteAmount) / parseFloat(investment.target_amount)) * 100).toFixed(2)}%</strong> of the total vehicle equity.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <Button type="button" variant="outline" className="flex-1 py-3" onClick={() => setShowQuoteModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 border-0 shadow-md" disabled={!quoteAmount}>
                                        Commit Capital
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

export default GroupInvestmentDetail;
