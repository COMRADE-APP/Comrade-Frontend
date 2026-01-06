import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { MessageSquare, Users, Lock, Plus, Search } from 'lucide-react';
import roomsService from '../services/rooms.service';
import { ROUTES } from '../constants/routes';

const Rooms = () => {
    const navigate = useNavigate();
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newRoom, setNewRoom] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        setLoading(true);
        try {
            const data = await roomsService.getAll();
            setRooms(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading rooms:', error);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRoom = async (e) => {
        e.preventDefault();
        try {
            await roomsService.create(newRoom);
            setShowCreateModal(false);
            setNewRoom({ name: '', description: '' });
            loadRooms();
        } catch (error) {
            alert('Failed to create room');
        }
    };

    const handleJoinRoom = async (roomId) => {
        try {
            await roomsService.joinRoom(roomId);
            navigate(`${ROUTES.ROOMS}/${roomId}`);
        } catch (error) {
            alert('Failed to join room');
        }
    };

    const filteredRooms = rooms.filter(room =>
        room.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rooms</h1>
                    <p className="text-gray-600 mt-1">Join rooms and collaborate with your peers</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Search rooms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                />
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredRooms.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">No rooms found. Create your first room!</p>
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                        <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
                    ))}
                </div>
            )}

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Create New Room</h2>
                            <form onSubmit={handleCreateRoom} className="space-y-4">
                                <Input
                                    label="Room Name"
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    required
                                    placeholder="Enter room name"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={newRoom.description}
                                        onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Room description (optional)"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Create Room
                                    </Button>
                                </div>
                            </form>
                        </CardBody>
                    </Card>
                </div>
            )}
        </div>
    );
};

const RoomCard = ({ room, onJoin }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardBody>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-primary-600" />
                    </div>
                    {room.operation_state === 'active' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            Active
                        </span>
                    ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                    )}
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{room.name}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {room.description || 'No description available'}
                    </p>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>{room.members?.length || 0} members</span>
                </div>

                <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => onJoin(room.id)}
                >
                    Join Room
                </Button>
            </div>
        </CardBody>
    </Card>
);

export default Rooms;
