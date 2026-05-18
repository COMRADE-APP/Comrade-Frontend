import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const GigsPage = () => Lazy(() => import('../pages/careers/GigsPage'));
const CareersPage = () => Lazy(() => import('../pages/careers/CareersPage'));
const CreateGig = () => Lazy(() => import('../pages/careers/CreateGig'));
const CreateCareer = () => Lazy(() => import('../pages/careers/CreateCareer'));
const TrackingPage = () => Lazy(() => import('../pages/careers/TrackingPage'));
const CareerDetail = () => Lazy(() => import('../pages/careers/CareerDetail'));
const ApplyCareer = () => Lazy(() => import('../pages/careers/ApplyCareer'));
const GigDetail = () => Lazy(() => import('../pages/careers/GigDetail'));
const ApplyGig = () => Lazy(() => import('../pages/careers/ApplyGig'));

export const careerRoutes = [
    <Route key="gigs" path={ROUTES.GIGS} element={<GigsPage />} />,
    <Route key="create-gig" path={ROUTES.CREATE_GIG} element={<CreateGig />} />,
    <Route key="gig-detail" path="/gigs/:id" element={<GigDetail />} />,
    <Route key="gig-apply" path="/gigs/:id/apply" element={<ApplyGig />} />,
    <Route key="careers" path={ROUTES.CAREERS} element={<CareersPage />} />,
    <Route key="create-career" path="/careers/create" element={<CreateCareer />} />,
    <Route key="career-detail" path="/careers/:id" element={<CareerDetail />} />,
    <Route key="career-apply" path="/careers/:id/apply" element={<ApplyCareer />} />,
    <Route key="career-tracking" path="/careers/tracking" element={<TrackingPage />} />,
];
