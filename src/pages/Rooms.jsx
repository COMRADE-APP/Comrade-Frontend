import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Card, { CardBody } from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { MessageSquare, Users, Lock, Plus, Search, Star, Sparkles, Settings, Trash2, Edit, Filter, X } from 'lucide-react';
import roomsService from '../services/rooms.service';
import { ROUTES } from '../constants/routes';
import SearchFilterBar from '../components/common/SearchFilterBar';

const Rooms = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('my_rooms');
    const [rooms, setRooms] = useState([]);
    const [myRooms, setMyRooms] = useState([]);
    const [recommendedRooms, setRecommendedRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        memberCount: 'any',
        status: 'all',
    });
    const [sortBy, setSortBy] = useState('newest');
    const [newRoom, setNewRoom] = useState({
        name: '',
        description: '',
    });

    // All authenticated users can create rooms
    const canManageRooms = true; // Anyone can create rooms

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [allRooms, myRoomsData, recommendations] = await Promise.all([
                roomsService.getAll().catch(() => []),
                roomsService.getMyRooms().catch(() => []),
                roomsService.getRecommendations().catch(() => []),
            ]);
            setRooms(Array.isArray(allRooms) ? allRooms : []);
            setMyRooms(Array.isArray(myRoomsData) ? myRoomsData : []);
            setRecommendedRooms(Array.isArray(recommendations) ? recommendations : []);
        } catch (error) {
            console.error('Error loading rooms:', error);
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
            loadData();
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room');
        }
    };

    const handleEditRoom = async (e) => {
        e.preventDefault();
        if (!editingRoom) return;
        try {
            await roomsService.update(editingRoom.id, {
                name: editingRoom.name,
                description: editingRoom.description,
            });
            setShowEditModal(false);
            setEditingRoom(null);
            loadData();
        } catch (error) {
            console.error('Failed to update room:', error);
            alert('Failed to update room');
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!confirm('Are you sure you want to delete this room?')) return;
        try {
            await roomsService.delete(roomId);
            loadData();
        } catch (error) {
            console.error('Failed to delete room:', error);
            alert('Failed to delete room');
        }
    };

    const handleJoinRoom = async (roomId) => {
        try {
            await roomsService.joinRoom(roomId);
            loadData();
        } catch (error) {
            console.error('Failed to join room:', error);
            alert(error.response?.data?.message || 'Failed to join room');
        }
    };

    const handleLeaveRoom = async (roomId) => {
        if (!confirm('Are you sure you want to leave this room?')) return;
        try {
            await roomsService.leaveRoom(roomId);
            loadData();
        } catch (error) {
            console.error('Failed to leave room:', error);
            alert('Failed to leave room');
        }
    };

    const getCurrentRooms = () => {
        let roomsList = [];
        switch (activeTab) {
            case 'my_rooms':
                roomsList = myRooms;
                break;
            case 'recommended':
                roomsList = recommendedRooms;
                break;
            case 'all':
            default:
                roomsList = rooms;
        }

        // Apply search filter
        if (searchTerm) {
            roomsList = roomsList.filter(room =>
                room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply member count filter
        if (filters.memberCount !== 'any') {
            roomsList = roomsList.filter(room => {
                const members = room.members?.length || 0;
                switch (filters.memberCount) {
                    case 'small': return members <= 10;
                    case 'medium': return members > 10 && members <= 50;
                    case 'large': return members > 50;
                    default: return true;
                }
            });
        }

        // Apply status filter
        if (filters.status !== 'all') {
            roomsList = roomsList.filter(room => room.operation_state === filters.status);
        }

        // Apply sorting
        roomsList = [...roomsList].sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
                case 'newest':
                    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
                case 'name':
                    return (a.name || '').localeCompare(b.name || '');
                case 'members':
                    return (b.members?.length || 0) - (a.members?.length || 0);
                default:
                    return 0;
            }
        });

        return roomsList;
    };

    const filteredRooms = getCurrentRooms();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Rooms</h1>
                    <p className="text-secondary mt-1">Join rooms and collaborate with your peers</p>
                </div>
                {/* SearchFilterBar handles creating rooms via a button if we moved it there, 
                    but SearchFilterBar doesn't have a custom action slot yet unless we add it. 
                    So we keep the Create Button separate or add it above/below. 
                    The design in Tasks/Announcements kept the button separate. 
                */}
                <Button variant="primary" onClick={() => navigate('/rooms/create')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Room
                </Button>
            </div>

            <SearchFilterBar
                searchQuery={searchTerm}
                onSearch={setSearchTerm}
                placeholder="Search rooms..."
                filters={[
                    {
                        key: 'status',
                        label: 'All Status',
                        options: [
                            { value: 'active', label: 'Active' },
                            { value: 'paused', label: 'Paused' },
                            { value: 'archived', label: 'Archived' }
                        ]
                    },
                    {
                        key: 'memberCount',
                        label: 'Any Size',
                        options: [
                            { value: 'small', label: 'Small (≤10)' },
                            { value: 'medium', label: 'Medium (11-50)' },
                            { value: 'large', label: 'Large (50+)' }
                        ]
                    }
                ]}
                activeFilters={filters}
                onFilterChange={(key, value) => setFilters(prev => ({ ...prev, [key]: value }))}
                sortOptions={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'members', label: 'Most Members' },
                    { value: 'name', label: 'Name (A-Z)' },
                ]}
                sortBy={sortBy}
                onSortChange={setSortBy}
            />

            {/* Tabs */}
            <div className="border-b border-theme">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'my_rooms', label: 'My Rooms', icon: Users, count: myRooms.length },
                        { id: 'recommended', label: 'Recommended', icon: Sparkles, count: recommendedRooms.length },
                        { id: 'all', label: 'All Rooms', icon: MessageSquare, count: rooms.length },
                    ].map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-secondary hover:text-primary hover:border-theme'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                    ? 'bg-primary-100 text-primary-600'
                                    : 'bg-secondary text-secondary'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Rooms Grid */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                </div>
            ) : filteredRooms.length === 0 ? (
                <Card>
                    <CardBody className="text-center py-12">
                        <MessageSquare className="w-12 h-12 text-tertiary mx-auto mb-4" />
                        <p className="text-secondary">
                            {activeTab === 'my_rooms'
                                ? "You haven't joined any rooms yet."
                                : activeTab === 'recommended'
                                    ? "No recommendations available at the moment."
                                    : "No rooms found. Create your first room!"}
                        </p>
                        {activeTab === 'my_rooms' && recommendedRooms.length > 0 && (
                            <Button
                                variant="outline"
                                className="mt-4"
                                onClick={() => setActiveTab('recommended')}
                            >
                                View Recommended Rooms
                            </Button>
                        )}
                    </CardBody>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRooms.map((room) => (
                        <RoomCard
                            key={room.id}
                            room={room}
                            onJoin={handleJoinRoom}
                            onLeave={handleLeaveRoom}
                            onOpen={(roomId) => navigate(`/rooms/${roomId}`)}
                            onEdit={(r) => {
                                setEditingRoom(r);
                                setShowEditModal(true);
                            }}
                            onDelete={handleDeleteRoom}
                            canManage={canManageRooms}
                            isRecommended={activeTab === 'recommended'}
                        />
                    ))}
                </div>
            )}

            {/* Create Room Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <h2 className="text-xl font-bold text-primary mb-4">Create New Room</h2>
                            <form onSubmit={handleCreateRoom} className="space-y-4">
                                <Input
                                    label="Room Name"
                                    value={newRoom.name}
                                    onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                                    required
                                    placeholder="Enter room name"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                    <textarea
                                        value={newRoom.description}
                                        onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-theme bg-secondary text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
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

            {/* Edit Room Modal */}
            {showEditModal && editingRoom && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardBody>
                            <h2 className="text-xl font-bold text-primary mb-4">Edit Room</h2>
                            <form onSubmit={handleEditRoom} className="space-y-4">
                                <Input
                                    label="Room Name"
                                    value={editingRoom.name}
                                    onChange={(e) => setEditingRoom({ ...editingRoom, name: e.target.value })}
                                    required
                                    placeholder="Enter room name"
                                />
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-1">Description</label>
                                    <textarea
                                        value={editingRoom.description || ''}
                                        onChange={(e) => setEditingRoom({ ...editingRoom, description: e.target.value })}
                                        rows="3"
                                        className="w-full px-4 py-2 border border-theme bg-secondary text-primary rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                                        placeholder="Room description"
                                    />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" type="button" onClick={() => {
                                        setShowEditModal(false);
                                        setEditingRoom(null);
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" type="submit">
                                        Save Changes
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

const RoomCard = ({ room, onJoin, onLeave, onEdit, onDelete, canManage, isRecommended, onOpen }) => (
    <Card className="hover:shadow-md transition-shadow">
        <CardBody>
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex items-center gap-2">
                        {room.operation_state === 'active' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                Active
                            </span>
                        ) : (
                            <Lock className="w-4 h-4 text-tertiary" />
                        )}
                        {canManage && (
                            <div className="flex gap-1">
                                <button
                                    onClick={() => onEdit(room)}
                                    className="p-1 text-tertiary hover:text-primary-600 transition-colors"
                                    title="Edit room"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(room.id)}
                                    className="p-1 text-tertiary hover:text-red-600 transition-colors"
                                    title="Delete room"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h3 className="font-semibold text-lg text-primary line-clamp-1">{room.name}</h3>
                    <p className="text-sm text-secondary mt-1 line-clamp-2">
                        {room.description || 'No description available'}
                    </p>
                </div>

                {isRecommended && room.match_reason && (
                    <div className="flex items-center gap-1 text-xs text-primary-600">
                        <Sparkles className="w-3 h-3" />
                        {room.match_reason}
                    </div>
                )}

                <div className="flex items-center gap-2 text-sm text-secondary">
                    <Users className="w-4 h-4" />
                    <span>{room.member_count || 0} members</span>
                </div>

                {room.is_member ? (
                    <div className="flex gap-2">
                        <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => onOpen(room.id)}
                        >
                            Open Room
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onLeave(room.id)}
                        >
                            Leave
                        </Button>
                    </div>
                ) : (
                    <Button
                        variant="primary"
                        className="w-full"
                        onClick={() => onJoin(room.id)}
                    >
                        Join Room
                    </Button>
                )}
            </div>
        </CardBody>
    </Card>
);

export default Rooms;
