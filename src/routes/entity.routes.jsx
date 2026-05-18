import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Institutions = () => Lazy(() => import('../pages/Institutions'));
const CreateInstitution = () => Lazy(() => import('../pages/institutions/CreateInstitution'));
const InstitutionDetail = () => Lazy(() => import('../pages/institutions/InstitutionDetail'));
const InstitutionVerification = () => Lazy(() => import('../pages/institutions/InstitutionVerification'));

const Organizations = () => Lazy(() => import('../pages/Organizations'));
const CreateOrganization = () => Lazy(() => import('../pages/organizations/CreateOrganization'));
const OrganizationDetail = () => Lazy(() => import('../pages/organizations/OrganizationDetail'));
const OrganizationVerification = () => Lazy(() => import('../pages/organizations/OrganizationVerification'));

const EntityCreationPortal = () => Lazy(() => import('../components/entities/EntityCreationPortal'));
const VerificationDashboard = () => Lazy(() => import('../components/entities/VerificationDashboard'));

export const entityRoutes = [
    <Route key="institutions" path={ROUTES.INSTITUTIONS} element={<Institutions />} />,
    <Route key="institution-detail" path="/institutions/:id/:tab?" element={<InstitutionDetail />} />,
    <Route key="institution-verification" path="/institutions/:id/verification" element={<InstitutionVerification />} />,
    <Route key="institution-portal-verify" path="/institutions/portal/:id/verify" element={<VerificationDashboard />} />,

    <Route key="organizations" path={ROUTES.ORGANIZATIONS} element={<Organizations />} />,
    <Route key="org-detail" path="/organizations/:id/:tab?" element={<OrganizationDetail />} />,
    <Route key="org-verification" path="/organizations/:id/verification" element={<OrganizationVerification />} />,
    <Route key="org-portal-verify" path="/organizations/portal/:id/verify" element={<VerificationDashboard />} />,
];
