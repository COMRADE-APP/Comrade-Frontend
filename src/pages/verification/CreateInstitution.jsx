import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import verificationService from '../services/verification.service';
import './CreateInstitution.css';

const CreateInstitution = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [institutionId, setInstitutionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Step 1: Basic Information
    const [basicInfo, setBasicInfo] = useState({
        institution_name: '',
        institution_type: 'university',
        description: '',
        year_established: ''
    });

    // Step 2: Location & Contact
    const [contactInfo, setContactInfo] = useState({
        country: '',
        state: '',
        city: '',
        address: '',
        postal_code: '',
        official_email: '',
        official_phone: '',
        official_website: ''
    });

    // Step 3: Registration Details
    const [registrationInfo, setRegistrationInfo] = useState({
        registration_number: '',
        tax_id: '',
        accreditation_body: '',
        accreditation_number: ''
    });

    // Step 4: Document Upload
    const [documents, setDocuments] = useState([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Step 5: Email Verification
    const [emailCode, setEmailCode] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);

    // Step 6: Website Verification
    const [websiteMethod, setWebsiteMethod] = useState('dns');
    const [websiteVerified, setWebsiteVerified] = useState(false);
    const [verificationInstructions, setVerificationInstructions] = useState(null);

    const handleBasicInfoSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = { ...basicInfo, ...contactInfo, ...registrationInfo };
            const response = await verificationService.createInstitution(data);
            setInstitutionId(response.data.id);
            setVerificationInstructions(response.data);
            setStep(4); // Move to document upload
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create institution request');
        } finally {
            setLoading(false);
        }
    };

    const handleDocumentUpload = async (file, documentType) => {
        if (!institutionId) return;

        setUploadingDoc(true);
        try {
            const response = await verificationService.uploadInstitutionDocument(
                institutionId,
                file,
                documentType
            );
            setDocuments([...documents, response.data]);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload document');
        } finally {
            setUploadingDoc(false);
        }
    };

    const handleSendEmailVerification = async () => {
        setLoading(true);
        try {
            await verificationService.sendInstitutionEmailVerification(institutionId);
            alert('Verification code sent to your email');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send verification email');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        setLoading(true);
        try {
            await verificationService.verifyInstitutionEmail(institutionId, emailCode);
            setEmailVerified(true);
            alert('Email verified successfully!');
            setStep(6); // Move to website verification
        } catch (err) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyWebsite = async () => {
        setLoading(true);
        try {
            await verificationService.verifyInstitutionWebsite(institutionId, websiteMethod);
            setWebsiteVerified(true);
            alert('Website verified successfully!');
            setStep(7); // Move to final submission
        } catch (err) {
            setError(err.response?.data?.error || 'Website verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleFinalSubmit = async () => {
        setLoading(true);
        try {
            await verificationService.submitInstitution(institutionId);
            alert('Institution verification request submitted successfully!');
            navigate('/verification-status/' + institutionId);
        } catch (err) {
            setError(err.response?.data?.error || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-institution-container">
            <div className="verification-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                    <div className="step-number">1</div>
                    <div className="step-label">Basic Info</div>
                </div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                    <div className="step-number">2</div>
                    <div className="step-label">Contact</div>
                </div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                    <div className="step-number">3</div>
                    <div className="step-label">Registration</div>
                </div>
                <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
                    <div className="step-number">4</div>
                    <div className="step-label">Documents</div>
                </div>
                <div className={`progress-step ${step >= 5 ? 'active' : ''}`}>
                    <div className="step-number">5</div>
                    <div className="step-label">Email</div>
                </div>
                <div className={`progress-step ${step >= 6 ? 'active' : ''}`}>
                    <div className="step-number">6</div>
                    <div className="step-label">Website</div>
                </div>
                <div className={`progress-step ${step >= 7 ? 'active' : ''}`}>
                    <div className="step-number">7</div>
                    <div className="step-label">Submit</div>
                </div>
            </div>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {/* Step 1: Basic Information */}
            {step === 1 && (
                <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
                    <h2>Basic Information</h2>
                    <div className="form-group">
                        <label>Institution Name *</label>
                        <input
                            type="text"
                            required
                            value={basicInfo.institution_name}
                            onChange={(e) => setBasicInfo({ ...basicInfo, institution_name: e.target.value })}
                            placeholder="Enter institution name"
                        />
                    </div>
                    <div className="form-group">
                        <label>Institution Type *</label>
                        <select
                            required
                            value={basicInfo.institution_type}
                            onChange={(e) => setBasicInfo({ ...basicInfo, institution_type: e.target.value })}
                        >
                            <option value="university">University</option>
                            <option value="college">College</option>
                            <option value="school">School</option>
                            <option value="training_center">Training Center</option>
                            <option value="research_institute">Research Institute</option>
                            <option value="government">Government Agency</option>
                            <option value="hospital">Hospital/Medical</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Description *</label>
                        <textarea
                            required
                            value={basicInfo.description}
                            onChange={(e) => setBasicInfo({ ...basicInfo, description: e.target.value })}
                            placeholder="Describe your institution"
                            rows="4"
                        ></textarea>
                    </div>
                    <div className="form-group">
                        <label>Year Established *</label>
                        <input
                            type="number"
                            required
                            value={basicInfo.year_established}
                            onChange={(e) => setBasicInfo({ ...basicInfo, year_established: e.target.value })}
                            placeholder="e.g., 1990"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary">Next</button>
                </form>
            )}

            {/* Step 2: Contact Information */}
            {step === 2 && (
                <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
                    <h2>Location & Contact Information</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Country *</label>
                            <input
                                type="text"
                                required
                                value={contactInfo.country}
                                onChange={(e) => setContactInfo({ ...contactInfo, country: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>State/Province *</label>
                            <input
                                type="text"
                                required
                                value={contactInfo.state}
                                onChange={(e) => setContactInfo({ ...contactInfo, state: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>City *</label>
                            <input
                                type="text"
                                required
                                value={contactInfo.city}
                                onChange={(e) => setContactInfo({ ...contactInfo, city: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Postal Code</label>
                            <input
                                type="text"
                                value={contactInfo.postal_code}
                                onChange={(e) => setContactInfo({ ...contactInfo, postal_code: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Address *</label>
                        <input
                            type="text"
                            required
                            value={contactInfo.address}
                            onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                            placeholder="Street address"
                        />
                    </div>
                    <div className="form-group">
                        <label>Official Email *</label>
                        <input
                            type="email"
                            required
                            value={contactInfo.official_email}
                            onChange={(e) => setContactInfo({ ...contactInfo, official_email: e.target.value })}
                            placeholder="contact@institution.edu"
                        />
                    </div>
                    <div className="form-group">
                        <label>Official Phone *</label>
                        <input
                            type="tel"
                            required
                            value={contactInfo.official_phone}
                            onChange={(e) => setContactInfo({ ...contactInfo, official_phone: e.target.value })}
                            placeholder="+1 234 567 8900"
                        />
                    </div>
                    <div className="form-group">
                        <label>Official Website *</label>
                        <input
                            type="url"
                            required
                            value={contactInfo.official_website}
                            onChange={(e) => setContactInfo({ ...contactInfo, official_website: e.target.value })}
                            placeholder="https://institution.edu"
                        />
                    </div>
                    <div className="button-group">
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
                        <button type="submit" className="btn btn-primary">Next</button>
                    </div>
                </form>
            )}

            {/* Step 3: Registration Details */}
            {step === 3 && (
                <form onSubmit={handleBasicInfoSubmit}>
                    <h2>Registration Details</h2>
                    <div className="form-group">
                        <label>Registration Number *</label>
                        <input
                            type="text"
                            required
                            value={registrationInfo.registration_number}
                            onChange={(e) => setRegistrationInfo({ ...registrationInfo, registration_number: e.target.value })}
                            placeholder="Official registration number"
                        />
                    </div>
                    <div className="form-group">
                        <label>Tax ID</label>
                        <input
                            type="text"
                            value={registrationInfo.tax_id}
                            onChange={(e) => setRegistrationInfo({ ...registrationInfo, tax_id: e.target.value })}
                            placeholder="Tax identification number"
                        />
                    </div>
                    <div className="form-group">
                        <label>Accreditation Body</label>
                        <input
                            type="text"
                            value={registrationInfo.accreditation_body}
                            onChange={(e) => setRegistrationInfo({ ...registrationInfo, accreditation_body: e.target.value })}
                            placeholder="e.g., Ministry of Education"
                        />
                    </div>
                    <div className="form-group">
                        <label>Accreditation Number</label>
                        <input
                            type="text"
                            value={registrationInfo.accreditation_number}
                            onChange={(e) => setRegistrationInfo({ ...registrationInfo, accreditation_number: e.target.value })}
                            placeholder="Accreditation certificate number"
                        />
                    </div>
                    <div className="button-group">
                        <button type="button" className="btn btn-secondary" onClick={() => setStep(2)}>Back</button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Creating...' : 'Create & Continue'}
                        </button>
                    </div>
                </form>
            )}

            {/* Step 4: Document Upload */}
            {step === 4 && (
                <div className="document-upload-section">
                    <h2>Upload Verification Documents</h2>
                    <p className="help-text">
                        Please upload the following documents to verify your institution:
                    </p>

                    <div className="document-types">
                        <DocumentUploadItem
                            label="Registration Certificate"
                            documentType="registration_certificate"
                            onUpload={handleDocumentUpload}
                            uploaded={documents.some(d => d.document_type === 'registration_certificate')}
                            uploading={uploadingDoc}
                        />
                        <DocumentUploadItem
                            label="Accreditation Certificate"
                            documentType="accreditation_certificate"
                            onUpload={handleDocumentUpload}
                            uploaded={documents.some(d => d.document_type === 'accreditation_certificate')}
                            uploading={uploadingDoc}
                        />
                        <DocumentUploadItem
                            label="Tax Document"
                            documentType="tax_document"
                            onUpload={handleDocumentUpload}
                            uploaded={documents.some(d => d.document_type === 'tax_document')}
                            uploading={uploadingDoc}
                        />
                        <DocumentUploadItem
                            label="Proof of Address"
                            documentType="proof_of_address"
                            onUpload={handleDocumentUpload}
                            uploaded={documents.some(d => d.document_type === 'proof_of_address')}
                            uploading={uploadingDoc}
                        />
                    </div>

                    <div className="uploaded-documents">
                        <h3>Uploaded Documents ({documents.length})</h3>
                        {documents.map((doc, index) => (
                            <div key={index} className="document-item">
                                <span>{doc.document_type}</span>
                                <span className="file-name">{doc.file_name}</span>
                                <span className="badge badge-success">✓ Uploaded</span>
                            </div>
                        ))}
                    </div>

                    <div className="button-group">
                        <button
                            className="btn btn-primary"
                            onClick={() => setStep(5)}
                            disabled={documents.length < 2}
                        >
                            Continue to Email Verification
                        </button>
                    </div>
                </div>
            )}

            {/* Step 5: Email Verification */}
            {step === 5 && (
                <div className="email-verification-section">
                    <h2>Verify Official Email</h2>
                    <p>We'll send a verification code to: <strong>{contactInfo.official_email}</strong></p>

                    {!emailVerified ? (
                        <>
                            <button
                                className="btn btn-secondary"
                                onClick={handleSendEmailVerification}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Verification Code'}
                            </button>

                            <div className="form-group" style={{ marginTop: '20px' }}>
                                <label>Enter 6-Digit Code</label>
                                <input
                                    type="text"
                                    value={emailCode}
                                    onChange={(e) => setEmailCode(e.target.value)}
                                    placeholder="000000"
                                    maxLength="6"
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleVerifyEmail}
                                disabled={loading || emailCode.length !== 6}
                            >
                                Verify Email
                            </button>
                        </>
                    ) : (
                        <div className="success-message">
                            <h3>✓ Email Verified Successfully!</h3>
                            <button className="btn btn-primary" onClick={() => setStep(6)}>
                                Continue to Website Verification
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 6: Website Verification */}
            {step === 6 && verificationInstructions && (
                <div className="website-verification-section">
                    <h2>Verify Website Ownership</h2>
                    <p>Verify you own: <strong>{contactInfo.official_website}</strong></p>

                    <div className="verification-methods">
                        <label>
                            <input
                                type="radio"
                                value="dns"
                                checked={websiteMethod === 'dns'}
                                onChange={(e) => setWebsiteMethod(e.target.value)}
                            />
                            DNS TXT Record (Recommended)
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="file"
                                checked={websiteMethod === 'file'}
                                onChange={(e) => setWebsiteMethod(e.target.value)}
                            />
                            HTML File Upload
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="meta_tag"
                                checked={websiteMethod === 'meta_tag'}
                                onChange={(e) => setWebsiteMethod(e.target.value)}
                            />
                            HTML Meta Tag
                        </label>
                    </div>

                    {websiteMethod === 'dns' && verificationInstructions.website_verification && (
                        <div className="verification-instructions">
                            <h4>DNS Verification Instructions</h4>
                            <p>Add the following TXT record to your domain's DNS settings:</p>
                            <div className="code-block">
                                <div><strong>Name:</strong> {verificationInstructions.website_verification.dns_record_name}</div>
                                <div><strong>Value:</strong> {verificationInstructions.website_verification.dns_record_value}</div>
                            </div>
                        </div>
                    )}

                    {websiteMethod === 'file' && verificationInstructions.website_verification && (
                        <div className="verification-instructions">
                            <h4>File Upload Instructions</h4>
                            <p>1. Create a file named: <code>{verificationInstructions.website_verification.verification_file_name}</code></p>
                            <p>2. Add this content to the file:</p>
                            <div className="code-block">
                                {verificationInstructions.website_verification.verification_file_content}
                            </div>
                            <p>3. Upload it to: <code>{contactInfo.official_website}/{verificationInstructions.website_verification.verification_file_name}</code></p>
                        </div>
                    )}

                    {websiteMethod === 'meta_tag' && verificationInstructions.website_verification && (
                        <div className="verification-instructions">
                            <h4>Meta Tag Instructions</h4>
                            <p>Add the following meta tag to your website's &lt;head&gt; section:</p>
                            <div className="code-block">
                                {verificationInstructions.website_verification.meta_tag_content}
                            </div>
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleVerifyWebsite}
                        disabled={loading || websiteVerified}
                    >
                        {loading ? 'Verifying...' : 'Verify Website'}
                    </button>

                    {websiteVerified && (
                        <div className="success-message">
                            <h3>✓ Website Verified!</h3>
                            <button className="btn btn-primary" onClick={() => setStep(7)}>
                                Continue to Final Submission
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Step 7: Final Submission */}
            {step === 7 && (
                <div className="final-submission-section">
                    <h2>Review and Submit</h2>
                    <div className="verification-summary">
                        <h3>Verification Summary</h3>
                        <div className="summary-item">
                            <span>Institution Name:</span>
                            <strong>{basicInfo.institution_name}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Type:</span>
                            <strong>{basicInfo.institution_type}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Documents Uploaded:</span>
                            <strong>{documents.length}</strong>
                        </div>
                        <div className="summary-item">
                            <span>Email Verified:</span>
                            <strong className="badge badge-success">✓ Yes</strong>
                        </div>
                        <div className="summary-item">
                            <span>Website Verified:</span>
                            <strong className="badge badge-success">✓ Yes</strong>
                        </div>
                    </div>

                    <div className="submission-notice">
                        <p>
                            By submitting this verification request, you confirm that all information provided is accurate and that you have the authority to represent this institution on the Comrade platform.
                        </p>
                        <p>
                            Our team will review your submission within 3-5 business days. You will be notified via email once the review is complete.
                        </p>
                    </div>

                    <button
                        className="btn btn-primary btn-large"
                        onClick={handleFinalSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Submitting...' : 'Submit for Review'}
                    </button>
                </div>
            )}
        </div>
    );
};

// Helper component for document upload
const DocumentUploadItem = ({ label, documentType, onUpload, uploaded, uploading }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file, documentType);
        }
    };

    return (
        <div className={`document-upload-item ${uploaded ? 'uploaded' : ''}`}>
            <label>
                <div className="upload-icon">{uploaded ? '✓' : '📄'}</div>
                <div className="upload-label">{label}</div>
                <input
                    type="file"
                    onChange={handleFileChange}
                    disabled={uploaded || uploading}
                    accept=".pdf,.jpg,.jpeg,.png"
                />
                {uploaded && <span className="badge badge-success">Uploaded</span>}
                {uploading && <span className="badge badge-info">Uploading...</span>}
            </label>
        </div>
    );
};

export default CreateInstitution;
