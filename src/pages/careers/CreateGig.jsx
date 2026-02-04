import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Briefcase, DollarSign, Clock, MapPin, FileText,
    Calendar, ArrowLeft, Loader2, CheckCircle
} from 'lucide-react';
import { gigsService } from '../../services/careers.service';
import './Careers.css';

const CreateGig = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requirements: '',
        pay_amount: '',
        pay_timing: 'after',
        industry: 'tech',
        deadline: '',
        location: '',
        is_remote: true
    });

    const industries = [
        { value: 'tech', label: 'Technology' },
        { value: 'design', label: 'Design & Creative' },
        { value: 'writing', label: 'Writing & Content' },
        { value: 'marketing', label: 'Marketing' },
        { value: 'finance', label: 'Finance & Accounting' },
        { value: 'education', label: 'Education & Training' },
        { value: 'engineering', label: 'Engineering' },
        { value: 'healthcare', label: 'Healthcare' },
        { value: 'other', label: 'Other' },
    ];

    const payTimings = [
        { value: 'before', label: 'Payment Before Work' },
        { value: 'after', label: 'Payment After Completion' },
        { value: 'milestone', label: 'Milestone-based Payment' },
        { value: 'negotiable', label: 'Negotiable' },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                ...formData,
                pay_amount: parseFloat(formData.pay_amount),
                deadline: formData.deadline || null
            };

            await gigsService.create(payload);
            setSuccess(true);

            setTimeout(() => {
                navigate('/gigs');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to create gig. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="create-gig-page">
                <div className="success-card">
                    <CheckCircle size={64} color="#059669" />
                    <h2>Gig Posted Successfully!</h2>
                    <p>Redirecting to your gigs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="create-gig-page">
            <div className="page-header">
                <button className="btn-back" onClick={() => navigate('/gigs')}>
                    <ArrowLeft size={20} />
                    Back to Gigs
                </button>
                <h1><Briefcase /> Post a New Gig</h1>
            </div>

            <form className="gig-form" onSubmit={handleSubmit}>
                {error && (
                    <div className="error-banner">
                        {error}
                    </div>
                )}

                <div className="form-section">
                    <h3>Basic Information</h3>

                    <div className="form-group">
                        <label htmlFor="title">
                            <FileText size={18} />
                            Gig Title *
                        </label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Build a React Dashboard"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">
                            Description *
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Describe the work in detail..."
                            rows={5}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="requirements">
                            Requirements *
                        </label>
                        <textarea
                            id="requirements"
                            name="requirements"
                            value={formData.requirements}
                            onChange={handleChange}
                            placeholder="List the skills and qualifications needed..."
                            rows={4}
                            required
                        />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Payment Details</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="pay_amount">
                                <DollarSign size={18} />
                                Payment Amount (USD) *
                            </label>
                            <input
                                type="number"
                                id="pay_amount"
                                name="pay_amount"
                                value={formData.pay_amount}
                                onChange={handleChange}
                                placeholder="e.g., 500"
                                min="1"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="pay_timing">
                                <Clock size={18} />
                                Payment Timing
                            </label>
                            <select
                                id="pay_timing"
                                name="pay_timing"
                                value={formData.pay_timing}
                                onChange={handleChange}
                            >
                                {payTimings.map(pt => (
                                    <option key={pt.value} value={pt.value}>{pt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-section">
                    <h3>Details & Location</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="industry">
                                Industry *
                            </label>
                            <select
                                id="industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                            >
                                {industries.map(ind => (
                                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="deadline">
                                <Calendar size={18} />
                                Deadline (Optional)
                            </label>
                            <input
                                type="datetime-local"
                                id="deadline"
                                name="deadline"
                                value={formData.deadline}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="is_remote"
                                    checked={formData.is_remote}
                                    onChange={handleChange}
                                />
                                <MapPin size={18} />
                                This is a remote gig
                            </label>
                        </div>

                        {!formData.is_remote && (
                            <div className="form-group">
                                <label htmlFor="location">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="e.g., New York, NY"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/gigs')}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="spinner" size={18} />
                                Posting...
                            </>
                        ) : (
                            <>
                                <Briefcase size={18} />
                                Post Gig
                            </>
                        )}
                    </button>
                </div>
            </form>

            <style>{`
        .create-gig-page {
          padding: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .btn-back {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: var(--text-secondary, #6b7280);
          cursor: pointer;
          margin-bottom: 16px;
        }

        .btn-back:hover {
          color: var(--text-primary, #111827);
        }

        .page-header h1 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.75rem;
          margin: 0;
        }

        .gig-form {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }

        .form-section {
          margin-bottom: 32px;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .form-section:last-of-type {
          border-bottom: none;
          margin-bottom: 24px;
        }

        .form-section h3 {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 20px;
          color: var(--text-primary, #111827);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
          margin-bottom: 8px;
          color: var(--text-primary, #111827);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          width: 100%;
          padding: 12px 16px;
          border: 1px solid var(--border-color, #e5e7eb);
          border-radius: 10px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .checkbox-group .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 12px;
          background: #f9fafb;
          border-radius: 10px;
        }

        .checkbox-group input[type="checkbox"] {
          width: 20px;
          height: 20px;
          accent-color: #667eea;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 16px;
          padding-top: 24px;
          border-top: 1px solid var(--border-color, #e5e7eb);
        }

        .btn-secondary {
          padding: 12px 24px;
          background: #f3f4f6;
          color: var(--text-secondary, #6b7280);
          border: none;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
        }

        .error-banner {
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 10px;
          color: #dc2626;
          margin-bottom: 24px;
        }

        .success-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          background: white;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
        }

        .success-card h2 {
          margin: 24px 0 8px;
          color: #059669;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default CreateGig;
