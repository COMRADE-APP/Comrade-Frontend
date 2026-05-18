import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Dashboard = () => Lazy(() => import('../pages/Dashboard'));
const QomAI = () => Lazy(() => import('../pages/QomAI'));
const Profile = () => Lazy(() => import('../pages/Profile'));
const Settings = () => Lazy(() => import('../pages/Settings'));
const Notifications = () => Lazy(() => import('../pages/Notifications'));
const ActivityLog = () => Lazy(() => import('../pages/ActivityLog'));
const Devices = () => import('../pages/Devices');
const PermissionsSettings = () => Lazy(() => import('../pages/PermissionsSettings'));
const TransactionHistory = () => Lazy(() => import('../pages/TransactionHistory'));

export const coreRoutes = [
    <Route key="dashboard" path="/dashboard/:tab?" element={<Dashboard />} />,
    <Route key="qomai" path={ROUTES.QOMAI} element={<QomAI />} />,
    <Route key="profile" path={ROUTES.PROFILE} element={<Profile />} />,
    <Route key="profile-detail" path={ROUTES.PROFILE_DETAIL} element={<Profile />} />,
    <Route key="settings" path={ROUTES.SETTINGS} element={<Settings />} />,
    <Route key="notifications" path={ROUTES.NOTIFICATIONS} element={<Notifications />} />,
    <Route key="activity" path={ROUTES.ACTIVITY} element={<ActivityLog />} />,
    <Route key="devices" path={ROUTES.DEVICES} element={<Devices />} />,
    <Route key="permissions" path={ROUTES.PERMISSIONS} element={<PermissionsSettings />} />,
    <Route key="transactions" path="/transactions" element={<TransactionHistory />} />,
    <Route key="activity-history" path="/activity" element={<TransactionHistory />} />,
];
