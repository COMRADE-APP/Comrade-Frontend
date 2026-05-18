import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import verificationService from '../services/verification';
import enhancedVerificationService from '../services/enhancedVerification';
import documentScanner from '../services/documentScanner';
import toast from 'react-hot-toast';

const ENTITY_TYPES = [
  { value: 'group', label: 'Group', icon: '👥', description: 'Community, team, club, company' },
  { value: 'business', label: 'Business', icon: '🏢', description: 'Sole proprietorship, LLC, corporation' },
  { value: 'shop', label: 'Shop', icon: '🏪', description: 'Retail, online, marketplace' },
  { value: 'personal', label: 'Personal', icon: '👤', description: 'Individual verification' },
  { value: 'creator', label: 'Creator', icon: '🎨', description: 'Artist, musician, influencer' },
  { value: 'tutor', label: 'Tutor', icon: '📚', description: 'Tutoring services' },
  { value: 'course', label: 'Course', icon: '🎓', description: 'Educational course' },
];

export default function EnhancedVerificationApplication() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [autoFillData, setAutoFillData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  
  const [formData, setFormData] = useState({
    entity_type: '',
    name: '',
    description: '',
    country: '',
    state: '',
    city: '',
    address: '',
    postal_code: '',
    is_virtual: false,
    virtual_link: '',
    email: '',
    phone_number: '',
    website: '',
    registration_number: '',
    year_established: '',
    legal_name: '',
    has_tax_id: false,
    tax_id: '',
    tax_system: '',
    tax_jurisdiction: '',
    vat_number: '',
    GST_number: '',
    identifications: [],
  });

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      const index = parseInt(name.split('_')[1]);
      const newIdentifications = [...formData.identifications];
      if (newIdentifications[index]) {
        newIdentifications[index] = { ...newIdentifications[index], file: files[0] };
      }
      setFormData({ ...formData, identifications: newIdentifications });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleScanDocument = async (index) => {
    const identification = formData.identifications[index];
    if (!identification?.file) {
      toast.error('Please select a file first');
      return;
    }

    setScanning(true);
    try {
      const result = await documentScanner.scanDocument(identification.file);
      if (result.success) {
        setAutoFillData(result.extractedData);
        
        // Auto-fill form with scanned data
        const newIdentifications = [...formData.identifications];
        newIdentifications[index] = {
          ...newIdentifications[index],
          number: result.extractedData.documentNumber || newIdentifications[index].number,
          issuing_country: result.extractedData.nationality || newIdentifications[index].issuing_country,
        };
        setFormData({ ...formData, identifications: newIdentifications });
        
        if (result.extractedData.name && !formData.name) {
          setFormData(prev => ({ ...prev, name: result.extractedData.name }));
        }
        
        toast.success(`Document scanned! Confidence: ${result.confidence.toFixed(0)}%`);
      } else {
        toast.error('Failed to scan document');
      }
    } catch (error) {
      toast.error('Error scanning document');
    } finally {
      setScanning(false);
    }
  };

  const handleBusinessLookup = async () => {
    if (!formData.registration_number && !formData.name) {
      toast.error('Please enter company name or registration number');
      return;
    }

    setLoading(true);
    try {
      const result = await (
        await import('../services/businessVerification')
      ).businessVerificationService.searchCompany(
        formData.registration_number || formData.name
      );

      if (result.success && result.companies?.length > 0) {
        const company = result.companies[0];
        setFormData(prev => ({
          ...prev,
          name: company.name,
          registration_number: company.companyNumber,
          year_established: company.incorporationDate?.split('-')[0] || '',
          address: company.address || prev.address,
        }));
        
        setVerificationResult({
          found: true,
          company,
          message: `Found: ${company.name} (${company.status})`,
        });
        toast.success('Company found in public registry!');
      } else {
        setVerificationResult({
          found: false,
          message: 'Company not found in public registries',
        });
        toast.warning('Company not found in public registries');
      }
    } catch (error) {
      toast.error('Error looking up company');
    } finally {
      setLoading(false);
    }
  };

  const handleTaxValidation = async () => {
    if (!formData.tax_id) {
      toast.error('Please enter tax ID');
      return;
    }

    setLoading(true);
    try {
      const result = await (
        await import('../services/businessVerification')
      ).businessVerificationService.validateTaxId(
        formData.tax_id,
        formData.country,
        formData.tax_system
      );

      if (result.valid) {
        toast.success('Tax ID validated successfully!');
        setVerificationResult(prev => ({
          ...prev,
          tax: { valid: true, details: result.details },
        }));
      } else {
        toast.warning('Tax ID could not be validated');
        setVerificationResult(prev => ({
          ...prev,
          tax: { valid: false, warnings: result.warnings },
        }));
      }
    } catch (error) {
      toast.error('Error validating tax ID');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoVerify = async () => {
    setLoading(true);
    try {
      const result = await enhancedVerificationService.runAutomatedVerification({
        entity_type: formData.entity_type,
        basic_info: { name: formData.name },
        location: {
          address: formData.address,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          is_virtual: formData.is_virtual,
        },
        contact: {
          email: formData.email,
          phone_number: formData.phone_number,
          website: formData.website,
        },
        registration: {
          registration_number: formData.registration_number,
          year_established: formData.year_established,
          legal_name: formData.legal_name,
        },
        tax_info: {
          tax_id: formData.tax_id,
          tax_system: formData.tax_system,
          tax_jurisdiction: formData.tax_jurisdiction,
          vat_number: formData.vat_number,
          GST_number: formData.GST_number,
        },
        identifications: formData.identifications,
      });

      setVerificationResult(prev => ({
        ...prev,
        automated: result,
      }));

      if (result.recommendation === 'auto_approved') {
        toast.success('Auto-verified! Your application has been approved.');
      } else {
        toast.info(`Risk Score: ${result.riskScore}% - ${result.recommendation}`);
      }
    } catch (error) {
      toast.error('Error running automated verification');
    } finally {
      setLoading(false);
    }
  };

  const addIdentification = () => {
    setFormData({
      ...formData,
      identifications: [
        ...formData.identifications,
        { type: 'national_id', number: '', issuing_country: '', file: null }
      ]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await verificationService.createVerification(formData);
      
      // Run automated verification
      if (response.id) {
        const autoResult = await enhancedVerificationService.runAutomatedVerification({
          ...formData,
          id: response.id,
        });
        
        if (autoResult.recommendation === 'auto_approved') {
          await verificationService.submitVerification(response.id);
          toast.success('Verification auto-approved!');
        }
      }
      
      toast.success('Verification application submitted!');
      navigate(`/verification/${response.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  };

  const renderAutoVerifyBadge = () => {
    if (!verificationResult?.automated) return null;
    
    const { riskScore, recommendation } = verificationResult.automated;
    
    const colors = {
      auto_approved: 'bg-green-500',
      standard_review: 'bg-blue-500',
      enhanced_review: 'bg-yellow-500',
      manual_review_required: 'bg-red-500',
    };

    return (
      <div className={`mt-4 p-4 rounded-lg ${colors[recommendation] || 'bg-gray-500'} text-white`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Auto-Verification: {recommendation.replace(/_/g, ' ').toUpperCase()}
          </span>
          <span className="text-2xl font-bold">{riskScore}%</span>
        </div>
        <div className="text-sm mt-1">Risk Score</div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Enhanced Verification</h1>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
            🤖 AI-Powered
          </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div
            key={s}
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Auto-Verification Result */}
      {renderAutoVerifyBadge()}

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Select Entity Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {ENTITY_TYPES.map((type) => (
                <div
                  key={type.value}
                  onClick={() => setFormData({ ...formData, entity_type: type.value })}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all text-center ${
                    formData.entity_type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2">{type.icon}</div>
                  <h3 className="font-semibold">{type.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Entity Name *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                  placeholder="Enter name"
                />
                {formData.entity_type === 'business' && (
                  <button
                    type="button"
                    onClick={handleBusinessLookup}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
                  >
                    🔍 Lookup
                  </button>
                )}
              </div>
              {verificationResult?.company && (
                <div className="mt-2 p-2 bg-green-50 text-green-700 rounded text-sm">
                  ✓ {verificationResult.company.name} - {verificationResult.company.status}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={3}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Location & Contact</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Postal Code</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="is_virtual"
                checked={formData.is_virtual}
                onChange={handleChange}
                className="w-4 h-4"
              />
              <label>This is a virtual entity</label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone *</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Registration & Tax</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Registration Number *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="registration_number"
                    value={formData.registration_number}
                    onChange={handleChange}
                    className="flex-1 p-3 border border-gray-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleBusinessLookup}
                    disabled={loading}
                    className="px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                  >
                    Verify
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Year Established</label>
                <input
                  type="number"
                  name="year_established"
                  value={formData.year_established}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="checkbox"
                  name="has_tax_id"
                  checked={formData.has_tax_id}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="font-medium">I have tax identification</label>
              </div>

              {formData.has_tax_id && (
                <div className="space-y-4 pl-7">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium mb-2">Tax ID</label>
                      <input
                        type="text"
                        name="tax_id"
                        value={formData.tax_id}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleTaxValidation}
                      disabled={loading || !formData.tax_id}
                      className="mt-7 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                    >
                      Validate
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax System</label>
                      <select
                        name="tax_system"
                        value={formData.tax_system}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="vat">VAT</option>
                        <option value="gst">GST</option>
                        <option value="sales_tax">Sales Tax</option>
                        <option value="income_tax">Income Tax</option>
                        <option value="corporate_tax">Corporate Tax</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax Jurisdiction</label>
                      <input
                        type="text"
                        name="tax_jurisdiction"
                        value={formData.tax_jurisdiction}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">VAT Number</label>
                      <input
                        type="text"
                        name="vat_number"
                        value={formData.vat_number}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">GST Number</label>
                      <input
                        type="text"
                        name="GST_number"
                        value={formData.GST_number}
                        onChange={handleChange}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">AI Document Scanner</h2>
            <p className="text-gray-600">Upload ID documents and AI will auto-fill the details</p>
            
            <button
              type="button"
              onClick={addIdentification}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + Add ID Document
            </button>

            {formData.identifications.map((id, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">Document #{index + 1}</h3>
                  <button
                    type="button"
                    onClick={() => {
                      const newIds = formData.identifications.filter((_, i) => i !== index);
                      setFormData({ ...formData, identifications: newIds });
                    }}
                    className="text-red-500"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">ID Type</label>
                    <select
                      value={id.type}
                      onChange={(e) => {
                        const newIds = [...formData.identifications];
                        newIds[index].type = e.target.value;
                        setFormData({ ...formData, identifications: newIds });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    >
                      <option value="passport">Passport</option>
                      <option value="national_id">National ID</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="voters_id">Voter's ID</option>
                      <option value="business_license">Business License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Document Number</label>
                    <input
                      type="text"
                      value={id.number}
                      onChange={(e) => {
                        const newIds = [...formData.identifications];
                        newIds[index].number = e.target.value;
                        setFormData({ ...formData, identifications: newIds });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Upload Document</label>
                    <input
                      type="file"
                      name={`identification_${index}`}
                      onChange={handleChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Issuing Country</label>
                    <input
                      type="text"
                      value={id.issuing_country}
                      onChange={(e) => {
                        const newIds = [...formData.identifications];
                        newIds[index].issuing_country = e.target.value;
                        setFormData({ ...formData, identifications: newIds });
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleScanDocument(index)}
                  disabled={scanning || !formData.identifications[index]?.file}
                  className="w-full py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  {scanning ? '🔄 Scanning...' : '🤖 AI Scan & Auto-Fill'}
                </button>
              </div>
            ))}

            {autoFillData && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">✓ AI Extracted Data</h4>
                <pre className="text-sm text-green-700 mt-2">
                  {JSON.stringify(autoFillData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold">Review & Submit</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Application Summary</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Type: <span className="font-medium capitalize">{formData.entity_type}</span></div>
                <div>Name: <span className="font-medium">{formData.name}</span></div>
                <div>Country: <span className="font-medium">{formData.country}</span></div>
                <div>City: <span className="font-medium">{formData.city}</span></div>
                <div>Email: <span className="font-medium">{formData.email}</span></div>
                <div>Reg Number: <span className="font-medium">{formData.registration_number}</span></div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAutoVerify}
                disabled={loading}
                className="flex-1 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                🤖 Run AI Auto-Verification
              </button>
            </div>

            {verificationResult?.automated && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-800">Auto-Verification Results</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Risk Score: {verificationResult.automated.riskScore}% - {' '}
                  {verificationResult.automated.recommendation.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 text-sm">
              <strong>Note:</strong> You will need to complete a live video liveness verification after submission.
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Previous
            </button>
          )}
          
          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ml-auto"
            >
              Next
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 ml-auto disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}