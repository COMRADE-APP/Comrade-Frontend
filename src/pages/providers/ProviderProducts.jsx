import React from 'react';
import Card, { CardBody } from '../../components/common/Card';

const ProviderProducts = () => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">My Products</h1>
        </div>
        <Card className="border">
            <CardBody className="p-6">
                <p className="text-secondary">Product management coming soon.</p>
            </CardBody>
        </Card>
    </div>
);

export default ProviderProducts;
