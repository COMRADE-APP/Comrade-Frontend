import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Opinions = () => Lazy(() => import('../pages/Opinions'));
const OpinionDetail = () => Lazy(() => import('../pages/OpinionDetail'));
const CommentDetail = () => Lazy(() => import('../pages/CommentDetail'));
const Following = () => Lazy(() => import('../pages/Following'));

const Rooms = () => Lazy(() => import('../pages/Rooms'));
const RoomDetail = () => Lazy(() => import('../pages/RoomDetail'));
const CreateRoom = () => Lazy(() => import('../pages/CreateRoom'));

const Messages = () => Lazy(() => import('../pages/Messages'));

const Community = () => Lazy(() => import('../pages/Community'));
const GroupsHub = () => Lazy(() => import('../pages/groups/GroupsHub'));
const GroupPublicProfile = () => Lazy(() => import('../pages/groups/GroupPublicProfile'));

export const socialRoutes = [
    <Route key="opinions" path="/opinions" element={<Opinions />} />,
    <Route key="opinion-detail" path="/opinions/:id" element={<OpinionDetail />} />,
    <Route key="comment-detail" path="/opinions/:id/comments/:commentId" element={<CommentDetail />} />,
    <Route key="following" path="/following" element={<Following />} />,

    <Route key="rooms" path="/rooms" element={<Rooms />} />,
    <Route key="room-detail" path="/rooms/:id" element={<RoomDetail />} />,
    <Route key="room-create" path="/rooms/create" element={<CreateRoom />} />,

    <Route key="messages" path="/messages" element={<Messages />} />,

    <Route key="community" path="/community" element={<Community />} />,
    <Route key="groups-hub" path="/groups-rooms" element={<GroupsHub />} />,
    <Route key="group-profile" path="/groups/profile/:groupId" element={<GroupPublicProfile />} />,
];
