import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { Camera, MapPin, Calendar, Mail, Phone, LogOut } from 'lucide-react';

const Profile = () => {
    const { user, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        firstName: user?.first_name || '',
        lastName: user?.last_name || '',
        email: user?.email || '',
        phone: user?.phone_number || '',
        bio: '',
        location: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            // TODO: Implement profile update
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Cover Photo & Profile Picture */}
            <Card>
                <div className="relative">
                    {/* Cover Photo */}
                    <div className="h-48 bg-gradient-to-r from-primary-600 to-primary-700 relative">
                        <button className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors">
                            <Camera className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>

                    {/* Profile Picture */}
                    <div className="absolute -bottom-16 left-8">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
                                <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-3xl">
                                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                                </div>
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-primary-600 rounded-full hover:bg-primary-700 transition-colors">
                                <Camera className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                <CardBody className="pt-20 pb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {user?.first_name} {user?.last_name}
                            </h1>
                            <p className="text-gray-600 capitalize">{user?.user_type || 'Student'}</p>
                        </div>
                        <div className="flex gap-2">
                            {isEditing ? (
                                <>
                                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleSave}>
                                        Save Changes
                                    </Button>
                                </>
                            ) : (
                                <Button variant="primary" onClick={() => setIsEditing(true)}>
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user?.email}</span>
                        </div>
                        {user?.phone_number && (
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{user.phone_number}</span>
                            </div>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Profile Details */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>

                    {isEditing ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Input
                                    label="First Name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                />
                                <Input
                                    label="Last Name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                />
                            </div>

                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                            />

                            <Input
                                label="Phone"
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                    placeholder="Tell us about yourself..."
                                />
                            </div>

                            <Input
                                label="Location"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                placeholder="City, Country"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4 text-gray-600">
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Bio</h3>
                                <p className="mt-1">{formData.bio || 'No bio added yet'}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Location</h3>
                                <p className="mt-1">{formData.location || 'Not specified'}</p>
                            </div>
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Account Actions */}
            <Card>
                <CardBody>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Settings</h2>
                    <div className="space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                            Change Password
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            Privacy Settings
                        </Button>
                        <Button
                            variant="danger"
                            className="w-full justify-start"
                            onClick={logout}
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
};

export default Profile;
