import React, { useState, useEffect } from 'react';
import { X, Building2, Plus, Loader2 } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import unitsService from '../../services/units.service';

/**
 * Modal component for creating units for an organization
 */
const CreateOrgUnit = ({ isOpen, onClose, organizationId, organizationName, onUnitCreated }) => {
    const [unitType, setUnitType] = useState('division');
    const [formData, setFormData] = useState({
        name: '',
        code: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const unitTypes = unitsService.getOrganisationUnitTypes();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setFormData({
                name: '',
                code: '',
            });
            setError('');
            setSuccess('');
            setUnitType('division');
        }
    }, [isOpen]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const getCodeFieldName = (type) => {
        const codeFieldMap = {
            division: 'div_code',
            department: 'dep_code',
            section: 'section_code',
            unit: 'unit_code',
            team: 'team_code',
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
            };

            const result = await unitsService.createOrganisationUnit(organizationId, unitType, payload);

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
            setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to create unit. Please try again.');
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
                            <p className="text-sm text-gray-400">{organizationName}</p>
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
                            placeholder="e.g., DIV-001, DEPT-HR"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            A unique identifier for this {selectedUnitType?.label?.toLowerCase()}
                        </p>
                    </div>

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
                </form>
            </div>
        </div>
    );
};

export default CreateOrgUnit;
