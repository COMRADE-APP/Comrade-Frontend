import React from 'react';
import Card, { CardBody } from '../components/common/Card';
import { Users } from 'lucide-react';

const Community = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Community</h1>
                <p className="text-gray-600 mt-1">Connect with peers and engage in discussions</p>
            </div>

            <Card>
                <CardBody className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Features Coming Soon</h3>
                    <p className="text-gray-500">
                        We're working on bringing you exciting community features including forums, study groups, and more!
                    </p>
                </CardBody>
            </Card>
        </div>
    );
};

export default Community;
