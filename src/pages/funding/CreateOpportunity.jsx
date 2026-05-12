import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Target, ArrowLeft, Send } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody } from '../../components/common/Card';
import fundingService from '../../services/funding.service';

const CreateOpportunity = () => {
    const navigate = useNavigate();
    const { businessId } = useParams(); // Using URL parameter to tie opportunity to a business if needed, or simply let provider be business name
    const [loading, setLoading] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        type: 'mmf',
        provider: '',
        description: '',
        expected_return: '',
        potential_gains: '',
        risk_level: 'medium',
        min_individual_entry: '',
        min_group_entry: '',
        group_benefit_summary: '',
        gain_intervals: 'monthly',
        maturity_period: '',
        link: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Include backward compatible min_investment
            const payload = { ...formData, min_investment: formData.min_individual_entry || 0 };
            await fundingService.createOpportunity(payload);
            navigate('/funding/business-portal'); // or back to business detail
        } catch (err) {
            console.error('Failed to create opportunity:', err);
            alert('Failed to create opportunity. Ensure all fields are valid.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-8">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2.5 rounded-xl bg-elevated hover:bg-secondary/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-secondary" />
                </button>
                <div>
                    <h1 className="text-3xl font-extrabold text-primary">Create Investment Opportunity</h1>
                    <p className="text-secondary">Offer an investment vehicle or funding prospect to the Comrade community.</p>
                </div>
            </div>

            <Card className="rounded-3xl border-theme shadow-lg overflow-hidden">
                <div className="h-4 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <CardBody className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Opportunity Title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Real Estate Fund Series A"
                                required
                            />
                            
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Investment Category</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full bg-elevated text-primary border border-theme rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                >
                                    <option value="mmf">Money Market Fund</option>
                                    <option value="stock">Stock Offering</option>
                                    <option value="bond_domestic">Domestic Bond</option>
                                    <option value="bond_foreign">Foreign Bond</option>
                                    <option value="agency">Agency Backed</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                                label="Provider / Business Name"
                                name="provider"
                                value={formData.provider}
                                onChange={handleChange}
                                placeholder="Who is providing this opportunity?"
                                required
                            />
                            <Input
                                label="External Link (Optional)"
                                name="link"
                                value={formData.link}
                                onChange={handleChange}
                                placeholder="https://..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-secondary mb-2">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Provide comprehensive details about this opportunity."
                                rows={4}
                                required
                                className="w-full bg-elevated text-primary border border-theme rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
                            ></textarea>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Input
                                label="Target / Expected Return"
                                name="expected_return"
                                value={formData.expected_return}
                                onChange={handleChange}
                                placeholder="e.g. 10.5% p.a."
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Risk Level</label>
                                <select
                                    name="risk_level"
                                    value={formData.risk_level}
                                    onChange={handleChange}
                                    className="w-full bg-elevated text-primary border border-theme rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                >
                                    <option value="low">Low Risk</option>
                                    <option value="medium">Medium Risk</option>
                                    <option value="high">High Risk</option>
                                </select>
                            </div>

                            <Input
                                label="Maturity Period"
                                name="maturity_period"
                                value={formData.maturity_period}
                                onChange={handleChange}
                                placeholder="e.g. 24 Months"
                            />
                        </div>
                        
                        <div className="border-t border-theme pt-6 mt-6">
                            <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                                <Target className="w-5 h-5 text-indigo-500" />
                                Entry & Syndication Details
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Input
                                    label="Min Individual Entry (USD)"
                                    name="min_individual_entry"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.min_individual_entry}
                                    onChange={handleChange}
                                    placeholder="e.g. 1000"
                                    required
                                />
                                <Input
                                    label="Min Group Entry (USD)"
                                    name="min_group_entry"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.min_group_entry}
                                    onChange={handleChange}
                                    placeholder="e.g. 50000"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <Input
                                    label="Potential Gains Description"
                                    name="potential_gains"
                                    value={formData.potential_gains}
                                    onChange={handleChange}
                                    placeholder="e.g. Regular monthly interest with principal back"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Gain Payout Intervals</label>
                                    <select
                                        name="gain_intervals"
                                        value={formData.gain_intervals}
                                        onChange={handleChange}
                                        className="w-full bg-elevated text-primary border border-theme rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                                    >
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="semi_annually">Semi-Annually</option>
                                        <option value="annually">Annually</option>
                                        <option value="at_maturity">At Maturity</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-2">Group Benefit Summary</label>
                                <textarea
                                    name="group_benefit_summary"
                                    value={formData.group_benefit_summary}
                                    onChange={handleChange}
                                    placeholder="Explain why this opportunity is better for a syndicate/group (e.g. Lower fees, higher interest tier)."
                                    rows={3}
                                    className="w-full bg-elevated text-primary border border-theme rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all resize-y"
                                ></textarea>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-theme">
                            <Button type="submit" variant="primary" disabled={loading} className="w-full py-4 text-lg font-bold">
                                {loading ? 'Creating...' : (
                                    <>
                                        <Send className="w-5 h-5 mr-2" />
                                        Publish Opportunity
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
};

export default CreateOpportunity;
