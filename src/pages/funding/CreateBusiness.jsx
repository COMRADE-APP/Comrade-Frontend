import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, CheckCircle, Briefcase, FileText, ArrowLeft } from 'lucide-react';
import fundingService from '../../services/funding.service';
import Button from '../../components/common/Button';

const CreateBusiness = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        industry: 'tech',
        stage: 'idea',
        description: '',
        website: '',
        valuation: ''
    });
    const [businessId, setBusinessId] = useState(null);
    const [documents, setDocuments] = useState([]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateBusiness = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const result = await fundingService.createBusiness(formData);
            setBusinessId(result.id);
            setStep(2); // Move to document upload
        } catch (error) {
            console.error("Failed to create business:", error);
            alert("Failed to create business. Please check details.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        // Confirmation Check
        const proceed = window.confirm(`Ready to upload "${file.name}" as your ${type.replace('_', ' ')}?`);
        if (!proceed) {
            e.target.value = null; // Reset input
            return;
        }

        const uploadData = new FormData();
        uploadData.append('business', businessId);
        uploadData.append('file', file);
        uploadData.append('title', file.name);
        uploadData.append('doc_type', type);

        try {
            const result = await fundingService.uploadDocument(uploadData);
            setDocuments([...documents, result]);
        } catch (error) {
            console.error("Upload failed:", error);
            if (error.response) {
                console.error("Server response:", error.response.data);
                alert(`Upload failed: ${JSON.stringify(error.response.data)}`);
            } else {
                alert("Document upload failed.");
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <button onClick={() => navigate('/funding')} className="flex items-center text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Hub
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Progress Bar */}
                    <div className="bg-gray-100 p-4 flex justify-between items-center text-sm font-medium text-gray-500">
                        <span className={step >= 1 ? 'text-violet-600' : ''}>1. Business Details</span>
                        <span className={step >= 2 ? 'text-violet-600' : ''}>2. Documents</span>
                        <span className={step >= 3 ? 'text-violet-600' : ''}>3. Review</span>
                    </div>

                    <div className="p-8">
                        {step === 1 && (
                            <form onSubmit={handleCreateBusiness} className="space-y-6">
                                <h2 className="text-2xl font-bold text-gray-900">Tell us about your startup</h2>

                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Business Name</label>
                                        <input required name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-violet-500 focus:border-violet-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Industry</label>
                                        <select name="industry" value={formData.industry} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-violet-500 focus:border-violet-500">
                                            <option value="tech">Technology</option>
                                            <option value="agri">Agriculture</option>
                                            <option value="fin">Finance</option>
                                            <option value="retail">Retail</option>
                                            <option value="health">Healthcare</option>
                                            <option value="energy">Energy</option>
                                            <option value="educ">Education</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Stage</label>
                                        <select name="stage" value={formData.stage} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-violet-500 focus:border-violet-500">
                                            <option value="idea">Idea Phase</option>
                                            <option value="mvp">MVP (Prototype)</option>
                                            <option value="pre_seed">Pre-Seed</option>
                                            <option value="growth">Growth</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Website (Optional)</label>
                                        <input name="website" value={formData.website} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3" placeholder="https://" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea required name="description" value={formData.description} onChange={handleChange} rows={4} className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:ring-violet-500 focus:border-violet-500" placeholder="Pitch your business in a few sentences..." />
                                </div>
                                <div className="flex justify-end">
                                    <Button type="submit" loading={loading} className="bg-violet-600 hover:bg-violet-700 text-white">
                                        Next: Upload Documents
                                    </Button>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                                        <Briefcase className="h-6 w-6 text-green-600" />
                                    </div>
                                    <h2 className="mt-3 text-2xl font-bold text-gray-900">{formData.name} Registered!</h2>
                                    <p className="mt-2 text-gray-500">Now allow investors to do due diligence by uploading documents.</p>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {['license', 'pitch_deck', 'financials', 'kpi'].map((type) => {
                                        const typeDocs = documents.filter(d => d.doc_type === type);
                                        return (
                                            <div key={type} className="border rounded-xl p-4 bg-gray-50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-white rounded-lg border">
                                                            <FileText className="w-5 h-5 text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</h4>
                                                            <p className="text-xs text-gray-500">
                                                                {typeDocs.length > 0 ? `${typeDocs.length} file(s) uploaded` : 'Required for verification'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="relative">
                                                        <input
                                                            type="file"
                                                            onChange={(e) => handleFileUpload(e, type)}
                                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                            title="Upload another document"
                                                        />
                                                        <button className="text-sm text-violet-600 font-medium hover:text-violet-700 bg-violet-50 px-3 py-1 rounded-lg">
                                                            + Upload
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Uploaded Files List */}
                                                {typeDocs.length > 0 && (
                                                    <div className="space-y-2 mt-2 pl-12">
                                                        {typeDocs.map((doc, idx) => (
                                                            <div key={idx} className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded border border-green-100">
                                                                <CheckCircle className="w-4 h-4" />
                                                                <span className="truncate max-w-[200px]">{doc.title}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="flex justify-between pt-6">
                                    <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900">Back</button>
                                    <Button onClick={() => navigate('/funding')} className="bg-green-600 hover:bg-green-700 text-white">
                                        Finish & Go to Hub
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateBusiness;
