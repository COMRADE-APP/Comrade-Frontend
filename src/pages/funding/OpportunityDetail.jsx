import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import {
    Building, ArrowLeft, Target, TrendingUp, AlertCircle, ShieldCheck, Link2
} from 'lucide-react';
import api from '../../services/api';

const OpportunityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [opportunity, setOpportunity] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Assume the API matches the generic ViewSet for Funding/investment-opportunities
            const res = await api.get(`/funding/investment-opportunities/${id}/`);
            setOpportunity(res.data);
        } catch (err) {
            console.error('Error loading config:', err);
            setError('Could not load opportunity details.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !opportunity) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-primary mb-2">{error || 'Not found'}</h3>
                <Button variant="primary" onClick={() => navigate('/funding/group-investments')}>
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 px-4">
            <div className="flex items-center gap-4 pt-8">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-elevated hover:bg-secondary/10 border border-theme transition-all"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div className="flex items-center gap-2 text-sm font-medium text-secondary">
                    <span>Back</span>
                </div>
            </div>

            <Card className="rounded-3xl overflow-hidden shadow-lg border-theme">
                <div className="h-4 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardBody className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="text-4xl font-black text-primary mb-2">{opportunity.title}</h1>
                            <p className="text-xl text-secondary flex items-center gap-2">
                                <Building className="w-6 h-6 text-indigo-500" />
                                {opportunity.provider}
                            </p>
                        </div>
                        {opportunity.is_verified && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                                <ShieldCheck className="w-5 h-5" />
                                Verified Offering
                            </span>
                        )}
                    </div>
                    
                    <p className="text-lg text-secondary leading-relaxed mb-8">
                        {opportunity.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-primary/5 p-6 rounded-2xl border border-theme">
                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Target Returns</h4>
                            <p className="text-2xl font-black text-green-600">{opportunity.expected_return}</p>
                            {opportunity.potential_gains && <p className="text-sm text-secondary mt-1">{opportunity.potential_gains}</p>}
                        </div>
                        <div className="bg-primary/5 p-6 rounded-2xl border border-theme">
                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Risk Factor</h4>
                            <p className="text-2xl font-black text-amber-600 capitalize">{opportunity.risk_level} Risk</p>
                        </div>
                        <div className="bg-primary/5 p-6 rounded-2xl border border-theme">
                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Min Individual Entry</h4>
                            <p className="text-2xl font-black text-primary">${parseFloat(opportunity.min_individual_entry || opportunity.min_investment).toLocaleString()}</p>
                        </div>
                        <div className="bg-primary/5 p-6 rounded-2xl border border-theme">
                            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Min Group Entry</h4>
                            <p className="text-2xl font-black text-primary">${parseFloat(opportunity.min_group_entry).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    {opportunity.group_benefit_summary && (
                        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl mb-8">
                            <h4 className="flex items-center gap-2 font-bold text-indigo-900 mb-2">
                                <Target className="w-5 h-5 text-indigo-600" />
                                Syndicate Group Edge
                            </h4>
                            <p className="text-indigo-800">{opportunity.group_benefit_summary}</p>
                        </div>
                    )}
                    
                    {opportunity.link && (
                        <div className="flex gap-4 pt-4 border-t border-theme">
                            <a href={opportunity.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition">
                                <Link2 className="w-5 h-5 mr-2" />
                                View External Offering
                            </a>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    );
};

export default OpportunityDetail;
