import React, { useState } from 'react';
import { X, Plus, Trash2, Award, Briefcase } from 'lucide-react';
import Input from '../common/Input';
import Button from '../common/Button';

const EditProfileForm = ({ formData, setFormData, onCancel, onSave, saving }) => {
    // Local refs to manage uncontrolled input states for dynamic arrays without relying on DOM ids
    const [certInput, setCertInput] = useState({ name: '', issuer: '', year: '' });
    const [expInput, setExpInput] = useState({ title: '', company: '', period: '' });
    const [hobbyInput, setHobbyInput] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const addHobby = () => {
        if (hobbyInput.trim()) {
            setFormData(prev => ({ ...prev, hobbies: [...(prev.hobbies || []), hobbyInput.trim()] }));
            setHobbyInput('');
        }
    };

    const addCert = () => {
        if (certInput.name.trim()) {
            setFormData(prev => ({ ...prev, certifications: [...(prev.certifications || []), { ...certInput }] }));
            setCertInput({ name: '', issuer: '', year: '' });
        }
    };

    const addExp = () => {
        if (expInput.title.trim()) {
            setFormData(prev => ({ ...prev, work_experience: [...(prev.work_experience || []), { ...expInput }] }));
            setExpInput({ title: '', company: '', period: '' });
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-6 animate-in fade-in duration-300">
            <div className="mb-6 pb-4 border-b border-theme">
                <h2 className="text-2xl font-bold text-primary">Edit Profile</h2>
                <p className="text-secondary text-sm mt-1">Update your personal details below to help people know you better.</p>
            </div>

            <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-secondary rounded-xl p-5 border border-theme">
                    <h3 className="text-sm font-semibold text-primary uppercase mb-4 tracking-wider">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="First Name" name="first_name" value={formData.first_name || ''} onChange={handleChange} />
                        <Input label="Last Name" name="last_name" value={formData.last_name || ''} onChange={handleChange} />
                    </div>
                    <div className="mt-4">
                        <Input label="Occupation" name="occupation" value={formData.occupation || ''} onChange={handleChange} placeholder="e.g. UX Designer" />
                    </div>
                </div>

                {/* About & Contact */}
                <div className="bg-secondary rounded-xl p-5 border border-theme space-y-4">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">About You</h3>
                    <div>
                        <label className="block text-sm font-medium text-primary mb-1">Bio</label>
                        <textarea
                            name="bio"
                            value={formData.bio || ''}
                            onChange={handleChange}
                            rows="3"
                            maxLength={500}
                            placeholder="Tell everyone a little bit about yourself..."
                            className="w-full px-4 py-3 border border-theme bg-primary text-primary placeholder-tertiary rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-all"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Location" name="location" value={formData.location || ''} onChange={handleChange} placeholder="City, Country" />
                        <Input label="Website" name="website" value={formData.website || ''} onChange={handleChange} placeholder="https://..." />
                        <Input label="Religion" name="religion" value={formData.religion || ''} onChange={handleChange} placeholder="Optional" />
                    </div>
                </div>

                {/* Dynamic Arrays (Hobbies, Certs, Work) */}
                <div className="bg-secondary rounded-xl p-5 border border-theme space-y-6">
                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">Additional Details</h3>
                    
                    {/* Hobbies */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Hobbies</label>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {(formData.hobbies || []).map((hobby, i) => (
                                <span key={i} className="flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-700 rounded-full text-sm font-medium transition-colors hover:bg-green-500/20">
                                    {hobby}
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, hobbies: prev.hobbies.filter((_, idx) => idx !== i) }))} className="hover:text-red-500 transition-colors"><X size={14} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Add a hobby (press Enter to add)"
                                value={hobbyInput}
                                onChange={(e) => setHobbyInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addHobby(); } }}
                                className="flex-1 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                            />
                            <button type="button" onClick={addHobby} className="p-2 bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300 rounded-lg hover:opacity-80"><Plus size={18} /></button>
                        </div>
                    </div>

                    {/* Certifications */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Certifications</label>
                        <div className="space-y-2 mb-3">
                            {(formData.certifications || []).map((cert, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-primary border border-theme rounded-xl text-sm">
                                    <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-primary">{typeof cert === 'string' ? cert : cert.name}</p>
                                        {(cert.issuer || cert.year) && <p className="text-secondary text-xs mt-0.5">{cert.issuer}{cert.year ? ` · ${cert.year}` : ''}</p>}
                                    </div>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, certifications: prev.certifications.filter((_, idx) => idx !== i) }))} className="text-tertiary hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="Certificate Title" value={certInput.name} onChange={(e) => setCertInput({...certInput, name: e.target.value})} className="flex-1 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                            <input type="text" placeholder="Issuer" value={certInput.issuer} onChange={(e) => setCertInput({...certInput, issuer: e.target.value})} className="flex-1 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                            <input type="text" placeholder="Year" value={certInput.year} onChange={(e) => setCertInput({...certInput, year: e.target.value})} className="w-full sm:w-24 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                            <button type="button" onClick={addCert} className="p-2 bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300 rounded-lg hover:opacity-80 flex justify-center"><Plus size={18} /></button>
                        </div>
                    </div>

                    {/* Work Experience */}
                    <div>
                        <label className="block text-sm font-medium text-primary mb-2">Work Experience</label>
                        <div className="space-y-2 mb-3">
                            {(formData.work_experience || []).map((exp, i) => (
                                <div key={i} className="flex items-start gap-3 p-3 bg-primary border border-theme rounded-xl text-sm">
                                    <Briefcase className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-primary">{typeof exp === 'string' ? exp : exp.title}</p>
                                        {(exp.company || exp.period) && <p className="text-secondary text-xs mt-0.5">{exp.company}{exp.period ? ` · ${exp.period}` : ''}</p>}
                                    </div>
                                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, work_experience: prev.work_experience.filter((_, idx) => idx !== i) }))} className="text-tertiary hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input type="text" placeholder="Job Title" value={expInput.title} onChange={(e) => setExpInput({...expInput, title: e.target.value})} className="flex-1 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                            <input type="text" placeholder="Company" value={expInput.company} onChange={(e) => setExpInput({...expInput, company: e.target.value})} className="flex-1 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                            <input type="text" placeholder="Period (e.g. 2021-Present)" value={expInput.period} onChange={(e) => setExpInput({...expInput, period: e.target.value})} className="w-full sm:w-40 px-3 py-2 border border-theme bg-primary text-primary rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                            <button type="button" onClick={addExp} className="p-2 bg-primary-100 text-primary-700 dark:bg-primary-800 dark:text-primary-300 rounded-lg hover:opacity-80 flex justify-center"><Plus size={18} /></button>
                        </div>
                    </div>
                </div>

                <div className="bg-secondary rounded-xl p-5 border border-theme space-y-4">
                     <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Privacy & Contact</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-primary mb-2">Show Email To</label>
                            <select name="show_email" value={formData.show_email || 'followers'} onChange={handleChange} className="w-full px-4 py-2 border border-theme bg-primary text-primary rounded-xl outline-none focus:border-primary-500">
                                <option value="everyone">Everyone</option>
                                <option value="followers">Followers Only</option>
                                <option value="private">Private</option>
                            </select>
                        </div>
                        <div>
                           <label className="flex items-center gap-2 text-sm font-medium text-primary mt-2">
                                <input type="checkbox" name="show_activity_status" checked={formData.show_activity_status ?? true} onChange={handleChange} className="form-checkbox rounded text-primary-600 border-theme h-4 w-4" />
                                Show Activity Status
                            </label>
                        </div>
                     </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-6 pb-12 mt-6 border-t border-theme sticky bottom-0 bg-primary bg-opacity-70 backdrop-blur-md px-4 rounded-xl">
                    <Button variant="outline" onClick={onCancel} disabled={saving} className="px-6">Cancel</Button>
                    <Button variant="primary" onClick={onSave} disabled={saving} className="px-6">
                        {saving ? 'Saving...' : 'Save Profile'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileForm;
