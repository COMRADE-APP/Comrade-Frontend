import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Specializations = () => Lazy(() => import('../pages/Specializations'));
const SpecializationDetail = () => Lazy(() => import('../pages/SpecializationDetail'));
const SpecializationAnalytics = () => Lazy(() => import('../pages/SpecializationAnalytics'));
const CreateSpecialization = () => Lazy(() => import('../pages/CreateSpecialization'));
const CreateStack = () => Lazy(() => import('../pages/CreateStack'));

export const learningRoutes = [
    <Route key="specializations" path={ROUTES.SPECIALIZATIONS} element={<Specializations />} />,
    <Route key="create-specialization" path={ROUTES.CREATE_SPECIALIZATION} element={<CreateSpecialization />} />,
    <Route key="specialization-detail" path="/specializations/:id" element={<SpecializationDetail />} />,
    <Route key="specialization-analytics" path="/specializations/:id/analytics" element={<SpecializationAnalytics />} />,
    <Route key="create-stack" path={ROUTES.CREATE_STACK} element={<CreateStack />} />,
];
