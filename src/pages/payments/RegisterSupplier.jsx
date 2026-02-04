import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, Check, Upload } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody } from '../../components/common/Card';

const RegisterSupplier = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        business_name: '',
        business_registration_number: '',
        categories: '', // Will parse strictly to array
        min_order_quantity: '1',
        wholesale_pricing_available: false
    });

    const [files, setFiles] = useState({
        business_permit: null,
        catalog_sample: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = new FormData();

            submitData.append('business_name', formData.business_name);
            submitData.append('business_registration_number', formData.business_registration_number);
            submitData.append('min_order_quantity', formData.min_order_quantity);
            submitData.append('wholesale_pricing_available', formData.wholesale_pricing_available);

            // Parse categories
            const categoriesList = formData.categories.split(',').map(c => c.trim()).filter(c => c);
            submitData.append('categories', JSON.stringify(categoriesList));

            if (files.business_permit) submitData.append('business_permit', files.business_permit);
            if (files.catalog_sample) submitData.append('catalog_sample', files.catalog_sample);

            await paymentsService.registerSupplierApplication(submitData);
            setSuccess(true);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Application Received!</h2>
                    <p className="text-secondary mb-6">
                        Thank you for applying to be a supplier. We will review your business details and contact you soon.
                    </p>
                    <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full">
                        Return to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 pl-0 hover:bg-transparent">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-primary">Become a Supplier</h1>
                    <p className="text-secondary">Supply products to our growing marketplace</p>
                </div>

                <Card>
                    <CardBody className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Business Name"
                                value={formData.business_name}
                                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                required
                            />

                            <Input
                                label="Registration Number (Optional)"
                                value={formData.business_registration_number}
                                onChange={(e) => setFormData({ ...formData, business_registration_number: e.target.value })}
                            />

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Product Categories</label>
                                <Input
                                    value={formData.categories}
                                    onChange={(e) => setFormData({ ...formData, categories: e.target.value })}
                                    placeholder="e.g. Electronics, Fashion, Stationary (comma separated)"
                                    required
                                />
                                <p className="text-xs text-secondary mt-1">Separate categories with commas</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="Min Order Quantity"
                                    type="number"
                                    min="1"
                                    value={formData.min_order_quantity}
                                    onChange={(e) => setFormData({ ...formData, min_order_quantity: e.target.value })}
                                    required
                                />
                                <div className="flex items-center pt-8">
                                    <label className="flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.wholesale_pricing_available}
                                            onChange={(e) => setFormData({ ...formData, wholesale_pricing_available: e.target.checked })}
                                            className="w-4 h-4 text-primary border-theme rounded focus:ring-primary"
                                        />
                                        <span className="ml-2 text-sm text-secondary">Wholesale Pricing Available?</span>
                                    </label>
                                </div>
                            </div>

                            {/* File Uploads */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Business Permit *</label>
                                    <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:bg-secondary/10 transition-colors">
                                        {files.business_permit ? (
                                            <div className="text-sm text-green-600 break-all">{files.business_permit.name}</div>
                                        ) : (
                                            <label className="cursor-pointer block">
                                                <Upload className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                                <span className="text-primary text-sm font-medium">Upload Permit</span>
                                                <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, business_permit: e.target.files?.[0] })} accept="image/*,.pdf" required />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Catalog / Portfolio (Optional)</label>
                                    <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:bg-secondary/10 transition-colors">
                                        {files.catalog_sample ? (
                                            <div className="text-sm text-green-600 break-all">{files.catalog_sample.name}</div>
                                        ) : (
                                            <label className="cursor-pointer block">
                                                <Upload className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                                <span className="text-primary text-sm font-medium">Upload File</span>
                                                <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, catalog_sample: e.target.files?.[0] })} accept=".pdf,.doc,.docx" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" variant="primary" className="w-full py-3 mt-6" disabled={loading}>
                                {loading ? 'Submitting Application...' : 'Submit Application'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default RegisterSupplier;
