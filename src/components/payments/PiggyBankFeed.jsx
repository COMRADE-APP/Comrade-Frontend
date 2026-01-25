import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PiggyBank, Target, ChevronRight, Plus, TrendingUp } from 'lucide-react';
import Card, { CardBody, CardHeader } from '../common/Card';
import Button from '../common/Button';
import paymentsService from '../../services/payments.service';

/**
 * PiggyBankFeed - Dashboard widget showing user's savings goals and piggy banks
 */
const PiggyBankFeed = ({ limit = 5 }) => {
    const navigate = useNavigate();
    const [piggyBanks, setPiggyBanks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await paymentsService.getPiggyBanks().catch(() => []);
            setPiggyBanks(Array.isArray(data) ? data.slice(0, limit) : []);
        } catch (error) {
            console.error('Error loading piggy banks:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = (current, target) => {
        if (!target || target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    };

    if (loading) {
        return (
            <Card>
                <CardBody className="p-4">
                    <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </CardBody>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <PiggyBank className="w-5 h-5 text-pink-600" />
                    <h3 className="font-semibold text-gray-900">Savings Goals</h3>
                </div>
                <button
                    onClick={() => navigate('/piggy-banks')}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    + New Goal
                </button>
            </CardHeader>
            <CardBody className="p-0">
                {piggyBanks.length === 0 ? (
                    <div className="p-8 text-center">
                        <PiggyBank className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No savings goals yet</p>
                        <Button
                            variant="outline"
                            className="mt-3"
                            onClick={() => navigate('/piggy-banks')}
                        >
                            Start Saving
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {piggyBanks.map((piggy) => {
                            const progress = calculateProgress(piggy.current_amount, piggy.target_amount);
                            return (
                                <div
                                    key={piggy.id}
                                    className="p-4 hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/piggy-banks/${piggy.id}`)}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${piggy.achieved ? 'bg-green-100' : 'bg-pink-100'
                                                }`}>
                                                {piggy.achieved ? (
                                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                                ) : (
                                                    <Target className="w-5 h-5 text-pink-600" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{piggy.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    ${piggy.current_amount || 0} / ${piggy.target_amount || 0}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${piggy.achieved ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                {progress.toFixed(0)}%
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all ${piggy.achieved ? 'bg-green-500' : 'bg-pink-500'
                                                }`}
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {piggyBanks.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                        <button
                            onClick={() => navigate('/piggy-banks')}
                            className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View All Savings Goals →
                        </button>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default PiggyBankFeed;
