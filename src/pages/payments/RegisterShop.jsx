import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Check, Upload, Image as ImageIcon } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody } from '../../components/common/Card';

const RegisterShop = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        currency: 'KES'
    });

    const [files, setFiles] = useState({
        logo: null,
        banner: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('name', formData.name);
            submitData.append('description', formData.description);
            submitData.append('currency', formData.currency);

            if (files.logo) submitData.append('logo', files.logo);
            if (files.banner) submitData.append('banner', files.banner);

            await paymentsService.registerShop(submitData);
            setSuccess(true);
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create shop');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Store className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-primary mb-2">Shop Created!</h2>
                    <p className="text-secondary mb-6">
                        Your shop "{formData.name}" has been successfully created. You can now start adding products.
                    </p>
                    <div className="space-y-3">
                        <Button onClick={() => navigate('/shop/manage')} variant="primary" className="w-full">
                            Manage Shop
                        </Button>
                        <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
                            Go to Dashboard
                        </Button>
                    </div>
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
                    <h1 className="text-3xl font-bold text-primary">Open Your Shop</h1>
                    <p className="text-secondary">Start selling to the Qomrade community today</p>
                </div>

                <Card>
                    <CardBody className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Shop Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Campus Essentials"
                                required
                            />

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                    placeholder="Tell customers what your shop is about..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Currency</label>
                                <select
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                >
                                    <option value="KES">KES (Kenyan Shilling)</option>
                                    <option value="USD">USD (US Dollar)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Shop Logo</label>
                                    <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:bg-secondary/10 transition-colors h-40 flex flex-col justify-center">
                                        {files.logo ? (
                                            <div className="text-sm text-green-600 break-all">{files.logo.name}</div>
                                        ) : (
                                            <label className="cursor-pointer block">
                                                <Store className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                                <span className="text-primary text-sm font-medium">Upload Logo</span>
                                                <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, logo: e.target.files?.[0] })} accept="image/*" />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">Shop Banner</label>
                                    <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:bg-secondary/10 transition-colors h-40 flex flex-col justify-center">
                                        {files.banner ? (
                                            <div className="text-sm text-green-600 break-all">{files.banner.name}</div>
                                        ) : (
                                            <label className="cursor-pointer block">
                                                <ImageIcon className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                                <span className="text-primary text-sm font-medium">Upload Banner</span>
                                                <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, banner: e.target.files?.[0] })} accept="image/*" />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button type="submit" variant="primary" className="w-full py-3 mt-6" disabled={loading}>
                                {loading ? 'Creating Shop...' : 'Create Shop'}
                            </Button>
                        </form>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default RegisterShop;
