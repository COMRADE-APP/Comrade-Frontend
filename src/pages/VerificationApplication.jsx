import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import verificationService from '../services/verification';
import toast from 'react-hot-toast';

const ENTITY_TYPES = [
  { value: 'group', label: 'Group', description: 'Community, team, club, company' },
  { value: 'business', label: 'Business', description: 'Sole proprietorship, LLC, corporation' },
  { value: 'shop', label: 'Shop', description: 'Retail, online, marketplace' },
  { value: 'personal', label: 'Personal', description: 'Individual verification' },
  { value: 'creator', label: 'Creator', description: 'Artist, musician, influencer' },
  { value: 'tutor', label: 'Tutor', description: 'Tutoring services' },
  { value: 'course', label: 'Course', description: 'Educational course' },
];

const GROUP_TYPES = [
  'community', 'team', 'club', 'company', 'nonprofit', 'educational'
];

const BUSINESS_TYPES = [
  'sole_proprietorship', 'partnership', 'llc', 'corporation', 'nonprofit', 'government'
];

const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'voters_id', label: "Voter's ID" },
  { value: 'business_license', label: 'Business License' },
  { value: 'tax_certificate', label: 'Tax Certificate' },
];

export default function VerificationApplication() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
      newIdentifications[index] = {
        ...newIdentifications[index],
        file: files[0],
      };
      setFormData({ ...formData, identifications: newIdentifications });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleIdentificationChange = (index, field, value) => {
    const newIdentifications = [...formData.identifications];
    newIdentifications[index] = { ...newIdentifications[index], [field]: value };
    setFormData({ ...formData, identifications: newIdentifications });
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

  const removeIdentification = (index) => {
    const newIdentifications = formData.identifications.filter((_, i) => i !== index);
    setFormData({ ...formData, identifications: newIdentifications });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await verificationService.createVerification(formData);
      toast.success('Verification application created!');
      
      if (formData.identifications.length > 0) {
        await verificationService.submitVerification(response.id);
        toast.success('Verification submitted! Please complete liveness verification.');
      }
      
      navigate(`/verification/${response.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create verification');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Select Entity Type</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ENTITY_TYPES.map((type) => (
          <div
            key={type.value}
            onClick={() => setFormData({ ...formData, entity_type: type.value })}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              formData.entity_type === type.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <h3 className="font-semibold">{type.label}</h3>
            <p className="text-sm text-gray-600">{type.description}</p>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Entity Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="Enter name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg"
          rows={3}
          placeholder="Describe your entity"
        />
      </div>

      {formData.entity_type === 'group' && (
        <div>
          <label className="block text-sm font-medium mb-2">Group Type</label>
          <select
            name="entity_type_specific"
            onChange={(e) => handleChange({ target: { name: 'group_type', value: e.target.value } })}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="">Select type</option>
            {GROUP_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}

      {formData.entity_type === 'business' && (
        <div>
          <label className="block text-sm font-medium mb-2">Business Type</label>
          <select
            name="business_type"
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            <option value="">Select type</option>
            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Location Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Country *</label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">State/Province</label>
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
            required
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
          required
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

      {formData.is_virtual && (
        <div>
          <label className="block text-sm font-medium mb-2">Virtual Link</label>
          <input
            type="url"
            name="virtual_link"
            value={formData.virtual_link}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="https://..."
          />
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Contact Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Phone Number *</label>
          <input
            type="tel"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
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
          placeholder="https://..."
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Registration & Tax Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Registration Number *</label>
          <input
            type="text"
            name="registration_number"
            value={formData.registration_number}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Year Established</label>
          <input
            type="number"
            name="year_established"
            value={formData.year_established}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg"
            min={1800}
            max={new Date().getFullYear()}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Legal Name</label>
        <input
          type="text"
          name="legal_name"
          value={formData.legal_name}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="border-t pt-6 mt-6">
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
            <div>
              <label className="block text-sm font-medium mb-2">Tax ID</label>
              <input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg"
              />
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
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Identification Documents</h2>
        <button
          type="button"
          onClick={addIdentification}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Add ID
        </button>
      </div>

      {formData.identifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No identifications added. Click "Add ID" to add identification documents.
        </div>
      ) : (
        formData.identifications.map((id, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium">Identification #{index + 1}</h3>
              <button
                type="button"
                onClick={() => removeIdentification(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">ID Type</label>
                <select
                  value={id.type}
                  onChange={(e) => handleIdentificationChange(index, 'type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                >
                  {ID_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Document Number</label>
                <input
                  type="text"
                  value={id.number}
                  onChange={(e) => handleIdentificationChange(index, 'number', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Issuing Country</label>
                <input
                  type="text"
                  value={id.issuing_country}
                  onChange={(e) => handleIdentificationChange(index, 'issuing_country', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                />
              </div>
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
            </div>
          </div>
        ))
      )}

      <div className="bg-yellow-50 p-4 rounded-lg text-yellow-800 text-sm">
        <strong>Important:</strong> You will need to complete a live video liveness verification to prove you're a real person.
        This helps prevent bots, AI, and impersonation.
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Verification Application</h1>
      
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

      <form onSubmit={handleSubmit}>
        {renderStep()}

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