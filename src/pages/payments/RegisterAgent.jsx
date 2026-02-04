import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCheck, Check, Upload } from 'lucide-react';
import paymentsService from '../../services/payments.service';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card, { CardBody } from '../../components/common/Card';

const RegisterAgent = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [formData, setFormData] = useState({
        agent_type: 'delivery',
        vehicle_type: '',
        license_plate: '',
        operating_zone: '',
        availability: '' // We will parse this to JSON if needed or send as string if backend handles it (backend expects JSON, so I'll wrap it)
    });
    const [files, setFiles] = useState({
        id_card: null,
        driving_license: null
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                // If it's availability, wrap in simple object or array
                if (key === 'availability') {
                    submitData.append(key, JSON.stringify({ hours: formData[key] }));
                } else {
                    submitData.append(key, formData[key]);
                }
            });
            if (files.id_card) submitData.append('id_card', files.id_card);
            if (files.driving_license) submitData.append('driving_license', files.driving_license);

            await paymentsService.registerAgentApplication(submitData);
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
                    <h2 className="text-2xl font-bold text-primary mb-2">Application Submitted!</h2>
                    <p className="text-secondary mb-6">
                        We have received your agent application. Our team will review your documents and get back to you shortly.
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
                    <h1 className="text-3xl font-bold text-primary">Become an Agent</h1>
                    <p className="text-secondary">Join our network as a verified agent</p>
                </div>

                <Card>
                    <CardBody className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Agent Type */}
                            <div>
                                <label className="block text-sm font-medium text-secondary mb-1">Agent Type</label>
                                <select
                                    value={formData.agent_type}
                                    onChange={(e) => setFormData({ ...formData, agent_type: e.target.value })}
                                    className="w-full px-4 py-2 border border-theme bg-elevated text-primary rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                >
                                    <option value="delivery">Delivery Agent</option>
                                    <option value="sales">Sales Agent</option>
                                    <option value="support">Support Agent</option>
                                </select>
                            </div>

                            {/* Conditional Fields for Delivery */}
                            {formData.agent_type === 'delivery' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Input
                                        label="Vehicle Type"
                                        value={formData.vehicle_type}
                                        onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                        placeholder="e.g. Motorbike, Van"
                                        required
                                    />
                                    <Input
                                        label="License Plate"
                                        value={formData.license_plate}
                                        onChange={(e) => setFormData({ ...formData, license_plate: e.target.value })}
                                        placeholder="e.g. KAA 123B"
                                        required
                                    />
                                </div>
                            )}

                            {/* Operating Zone */}
                            <Input
                                label="Operating Zone / Region"
                                value={formData.operating_zone}
                                onChange={(e) => setFormData({ ...formData, operating_zone: e.target.value })}
                                placeholder="e.g. Nairobi CBC, Westlands"
                                required
                            />

                            {/* Availability */}
                            <Input
                                label="Availability (Hours)"
                                value={formData.availability}
                                onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                                placeholder="e.g. Mon-Fri 8am - 6pm"
                                required
                            />

                            {/* File Uploads */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className="block text-sm font-medium text-secondary mb-2">ID Card / Passport *</label>
                                    <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:bg-secondary/10 transition-colors">
                                        {files.id_card ? (
                                            <div className="text-sm text-green-600 break-all">{files.id_card.name}</div>
                                        ) : (
                                            <label className="cursor-pointer block">
                                                <Upload className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                                <span className="text-primary text-sm font-medium">Upload ID</span>
                                                <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, id_card: e.target.files?.[0] })} accept="image/*,.pdf" required />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {formData.agent_type === 'delivery' && (
                                    <div>
                                        <label className="block text-sm font-medium text-secondary mb-2">Driving License *</label>
                                        <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center hover:bg-secondary/10 transition-colors">
                                            {files.driving_license ? (
                                                <div className="text-sm text-green-600 break-all">{files.driving_license.name}</div>
                                            ) : (
                                                <label className="cursor-pointer block">
                                                    <Upload className="w-8 h-8 text-tertiary mx-auto mb-2" />
                                                    <span className="text-primary text-sm font-medium">Upload License</span>
                                                    <input type="file" className="hidden" onChange={(e) => setFiles({ ...files, driving_license: e.target.files?.[0] })} accept="image/*,.pdf" required />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                )}
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

export default RegisterAgent;
