import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Truck, Store, UserCheck, ArrowRight, Briefcase } from 'lucide-react';
import Card, { CardBody } from '../../components/common/Card';

const BusinessRegistration = () => {
    const navigate = useNavigate();

    const options = [
        {
            title: 'Become a Partner',
            description: 'Join as a distributor, affiliate, or content creator.',
            icon: Users,
            path: '/partners/become',
            color: 'bg-blue-500/10 text-blue-600'
        },
        {
            title: 'Become an Agent',
            description: 'Operate as a verified agent in your region.',
            icon: UserCheck,
            path: '/payments/register-agent',
            color: 'bg-green-500/10 text-green-600'
        },
        {
            title: 'Become a Supplier',
            description: 'Supply goods and materials to the platform.',
            icon: Truck,
            path: '/payments/register-supplier',
            color: 'bg-orange-500/10 text-orange-600'
        },
        {
            title: 'Register a Shop',
            description: 'Open your own digital storefront.',
            icon: Store,
            path: '/payments/register-shop',
            color: 'bg-purple-500/10 text-purple-600'
        }
    ];

    return (
        <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-extrabold text-primary sm:text-5xl">
                        Grow with <span className="text-primary">Qomrade</span>
                    </h1>
                    <p className="mt-4 text-xl text-secondary">
                        Choose how you want to do business with us.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    {options.map((option) => (
                        <Card
                            key={option.title}
                            className="hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 transition-transform duration-200"
                            onClick={() => navigate(option.path)}
                        >
                            <CardBody className="p-8 flex flex-col h-full">
                                <div className={`w-14 h-14 rounded-2xl ${option.color} flex items-center justify-center mb-6`}>
                                    <option.icon className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-primary mb-2">{option.title}</h3>
                                <p className="text-secondary flex-grow mb-6">{option.description}</p>
                                <div className="flex items-center text-primary font-semibold group">
                                    Get Started
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-secondary">
                        Already have an account? <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate('/dashboard')}>Go to Dashboard</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

import { Users } from 'lucide-react'; // Late import fix
export default BusinessRegistration;
