import React, { useState, useEffect } from 'react';
import { X, Building2, Plus, Loader2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import unitsService from '../../services/units.service';

/**
 * Modal component for creating units for an institution
 */
const CreateUnit = ({ isOpen, onClose, institutionId, institutionName, onUnitCreated }) => {
    const [unitType, setUnitType] = useState('branch');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        // Address fields for branches
        address: '',
        city: '',
        country: '',
        postal_code: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const unitTypes = unitsService.getInstitutionUnitTypes();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                code: '',
                description: '',
                address: '',
                city: '',
                country: '',
                postal_code: '',
            });
            setError('');
            setSuccess('');
            setUnitType('branch');
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getCodeFieldName = (type) => {
        const codeFieldMap = {
            branch: 'branch_code',
            faculty: 'faculty_code',
            department: 'dep_code',
            programme: 'programme_code',
            admin_dep: 'admin_code',
            vc_office: 'office_code',
            student_affairs: 'stud_affairs_code',
            support_services: 'support_services_code',
        };
        return codeFieldMap[type] || 'code';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const codeField = getCodeFieldName(unitType);
            const payload = {
                name: formData.name,
                [codeField]: formData.code,
                description: formData.description,
            };

            // Add address fields for branches
            if (unitType === 'branch') {
                payload.address = formData.address;
                payload.city = formData.city;
                payload.country = formData.country;
                payload.postal_code = formData.postal_code;
            }

            const result = await unitsService.createInstitutionUnit(institutionId, unitType, payload);

            if (result.approval_status === 'pending') {
                setSuccess('Unit submitted for approval! An admin will review it shortly.');
            } else {
                setSuccess('Unit created successfully!');
            }

            if (onUnitCreated) {
                onUnitCreated(result);
            }

            // Close after a brief delay to show success message
            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (err) {
            console.error('Error creating unit:', err);
            const resData = err.response?.data;
            let errorMessage = 'Failed to create unit. Please try again.';

            if (resData) {
                if (resData.detail) {
                    errorMessage = resData.detail;
                } else if (resData.message) {
                    errorMessage = resData.message;
                } else {
                    // Extract first field error or format nicely
                    const fieldErrors = Object.entries(resData)
                        .map(([key, msg]) => {
                            const formattedKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                            return `${formattedKey}: ${Array.isArray(msg) ? msg[0] : msg}`;
                        });

                    if (fieldErrors.length > 0) {
                        errorMessage = fieldErrors[0]; // Show just the first error for simplicity
                    }
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedUnitType = unitTypes.find(t => t.key === unitType);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-gray-700/50 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/20 rounded-xl">
                            <Building2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Add Unit</h2>
                            <p className="text-sm text-gray-400">{institutionName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Unit Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Unit Type
                        </label>
                        <select
                            value={unitType}
                            onChange={(e) => setUnitType(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 
                                     text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent
                                     transition-all duration-200"
                        >
                            {unitTypes.map(type => (
                                <option key={type.key} value={type.key}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            {selectedUnitType?.label} Name *
                        </label>
                        <Input
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder={`Enter ${selectedUnitType?.label?.toLowerCase()} name`}
                            required
                        />
                    </div>

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Unique Code *
                        </label>
                        <Input
                            name="code"
                            value={formData.code}
                            onChange={handleInputChange}
                            placeholder="e.g., FAC-001, DEPT-CS"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            A unique identifier for this {selectedUnitType?.label?.toLowerCase()}
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            placeholder="Brief description of this unit..."
                            className="w-full px-4 py-3 rounded-xl bg-gray-800/50 border border-gray-700 
                                     text-white placeholder-gray-500 focus:ring-2 focus:ring-violet-500 
                                     focus:border-transparent transition-all duration-200 resize-none"
                        />
                    </div>

                    {/* Address Fields - Only for branches */}
                    {unitType === 'branch' && (
                        <div className="space-y-4 pt-2 border-t border-gray-700/50">
                            <h4 className="text-sm font-medium text-gray-300">Location Details</h4>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Address *
                                </label>
                                <Input
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder="Street address"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        City *
                                    </label>
                                    <Input
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        placeholder="City"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                        Postal Code
                                    </label>
                                    <Input
                                        name="postal_code"
                                        value={formData.postal_code}
                                        onChange={handleInputChange}
                                        placeholder="Postal code"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">
                                    Country *
                                </label>
                                <Input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleInputChange}
                                    placeholder="Country"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    {/* Error/Success Messages */}
                    {error && (
                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
                            {success}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1"
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 
                                     hover:from-violet-500 hover:to-purple-500"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create Unit
                                </span>
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Note: Units created by non-admins require approval before they appear publicly.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default CreateUnit;
