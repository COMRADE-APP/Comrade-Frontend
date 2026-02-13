import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2, DollarSign, Target, ArrowLeft, CheckCircle, Info
} from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import fundingService from '../../services/funding.service';

const CreateFundingOrg = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        investment_focus: '',
        investment_criteria: '',
        total_fund: '',
        available_fund: '',
        min_investment: '',
        max_investment: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Convert string amounts to numbers
            const data = {
                ...formData,
                total_fund: parseFloat(formData.total_fund) || 0,
                available_fund: parseFloat(formData.available_fund) || parseFloat(formData.total_fund) || 0,
                min_investment: parseFloat(formData.min_investment) || 0,
                max_investment: parseFloat(formData.max_investment) || 0,
            };

            const result = await fundingService.createVenture(data);
            setSuccess(true);
            setTimeout(() => {
                navigate(`/funding/ventures/${result.id}`);
            }, 1500);
        } catch (err) {
            console.error('Failed to create venture:', err);
            setError(err.response?.data?.detail || 'Failed to create funding organization');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="max-w-2xl mx-auto p-4">
                <Card>
                    <CardBody className="text-center py-12">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-primary mb-2">Funding Organization Created!</h2>
                        <p className="text-secondary">Redirecting to your dashboard...</p>
                    </CardBody>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg">
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Create Funding Organization</h1>
                    <p className="text-secondary">Set up a capital venture to fund businesses</p>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-medium">What is a Funding Organization?</p>
                    <p className="mt-1 opacity-80">
                        A funding organization (Capital Venture) allows you to receive and review funding requests
                        from businesses, manage due diligence, and facilitate investment negotiations.
                    </p>
                </div>
            </div>

            {/* Form */}
            <Card>
                <CardBody className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Basic Information
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">
                                    Organization Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Acme Ventures"
                                    className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">
                                    Description *
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe your funding organization and its mission..."
                                    className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary h-24 resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Investment Focus */}
                        <div className="space-y-4 pt-4 border-t border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Target className="w-5 h-5" />
                                Investment Focus
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">
                                    Investment Focus
                                </label>
                                <input
                                    type="text"
                                    name="investment_focus"
                                    value={formData.investment_focus}
                                    onChange={handleChange}
                                    placeholder="e.g. Tech, Agriculture, Healthcare"
                                    className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primary mb-1">
                                    Investment Criteria *
                                </label>
                                <textarea
                                    name="investment_criteria"
                                    value={formData.investment_criteria}
                                    onChange={handleChange}
                                    placeholder="Describe what types of businesses you invest in, requirements, stages..."
                                    className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary h-24 resize-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Fund Details */}
                        <div className="space-y-4 pt-4 border-t border-theme">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <DollarSign className="w-5 h-5" />
                                Fund Details (KES)
                            </h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">
                                        Total Fund *
                                    </label>
                                    <input
                                        type="number"
                                        name="total_fund"
                                        value={formData.total_fund}
                                        onChange={handleChange}
                                        placeholder="1000000"
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">
                                        Available Fund
                                    </label>
                                    <input
                                        type="number"
                                        name="available_fund"
                                        value={formData.available_fund}
                                        onChange={handleChange}
                                        placeholder="Same as total"
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                                        min="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">
                                        Min Investment *
                                    </label>
                                    <input
                                        type="number"
                                        name="min_investment"
                                        value={formData.min_investment}
                                        onChange={handleChange}
                                        placeholder="10000"
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                                        required
                                        min="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">
                                        Max Investment *
                                    </label>
                                    <input
                                        type="number"
                                        name="max_investment"
                                        value={formData.max_investment}
                                        onChange={handleChange}
                                        placeholder="500000"
                                        className="w-full px-3 py-2 border border-theme rounded-lg bg-secondary text-primary"
                                        required
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary" disabled={loading} className="flex-1">
                                {loading ? 'Creating...' : 'Create Funding Organization'}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default CreateFundingOrg;
