import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const StaffPortal = () => Lazy(() => import('../pages/portals/StaffPortal'));
const AuthorPortal = () => Lazy(() => import('../pages/portals/AuthorPortal'));
const ModeratorPortal = () => Lazy(() => import('../pages/portals/ModeratorPortal'));
const LecturerPortal = () => Lazy(() => import('../pages/portals/LecturerPortal'));
const InstitutionPortal = () => Lazy(() => import('../pages/portals/InstitutionPortal'));

export const portalRoutes = [
    <Route key="staff-portal" path={ROUTES.STAFF_PORTAL} element={<StaffPortal />} />,
    <Route key="author-portal" path={ROUTES.AUTHOR_PORTAL} element={<AuthorPortal />} />,
    <Route key="moderator-portal" path={ROUTES.MODERATOR_PORTAL} element={<ModeratorPortal />} />,
    <Route key="lecturer-portal" path={ROUTES.LECTURER_PORTAL} element={<LecturerPortal />} />,
    <Route key="institution-portal" path={ROUTES.INSTITUTION_PORTAL} element={<InstitutionPortal />} />,
];
