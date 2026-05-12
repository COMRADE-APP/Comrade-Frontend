import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const FundingHub = () => Lazy(() => import('../pages/funding/FundingHub'));
const CreateBusiness = () => Lazy(() => import('../pages/funding/CreateBusiness'));
const CreateFundingOrg = () => Lazy(() => import('../pages/funding/CreateFundingOrg'));
const CreateEnterprise = () => Lazy(() => import('../pages/funding/CreateEnterprise'));
const CreateOpportunity = () => Lazy(() => import('../pages/funding/CreateOpportunity'));
const BusinessDetail = () => Lazy(() => import('../pages/funding/BusinessDetail'));
const BusinessPortal = () => Lazy(() => import('../pages/funding/BusinessPortal'));
const BusinessAnalytics = () => Lazy(() => import('../pages/funding/BusinessAnalytics'));
const OpportunitiesExplorer = () => Lazy(() => import('../pages/funding/OpportunitiesExplorer'));
const OpportunityDetail = () => Lazy(() => import('../pages/funding/OpportunityDetail'));
const InvestmentProcess = () => Lazy(() => import('../pages/funding/InvestmentProcess'));
const RequestFunding = () => Lazy(() => import('../pages/funding/RequestFunding'));
const RequestDetail = () => Lazy(() => import('../pages/funding/RequestDetail'));
const FundingOrgDashboard = () => Lazy(() => import('../pages/funding/FundingOrgDashboard'));
const FundingRequestAnalytics = () => Lazy(() => import('../pages/funding/FundingRequestAnalytics'));
const InvestorProfilePage = () => Lazy(() => import('../pages/funding/InvestorProfilePage'));

export const fundingRoutes = [
    <Route key="funding" path="/funding" element={<Navigate to="/funding/market" replace />} />,
    <Route key="funding-tab" path="/funding/:tab" element={<FundingHub />} />,
    <Route key="funding-investor" path="/funding/investor-profile" element={<InvestorProfilePage />} />,
    <Route key="funding-request" path="/funding/requests/:id" element={<RequestDetail />} />,
    <Route key="funding-analytics" path="/funding/analytics/:id" element={<FundingRequestAnalytics />} />,
    <Route key="funding-create" path="/funding/create" element={<CreateBusiness />} />,
    <Route key="funding-business-analytics" path="/funding/businesses/:id/analytics" element={<BusinessAnalytics />} />,
    <Route key="funding-donations" path="/funding/donations" element={<FundingHub />} />,
    <Route key="funding-ventures-create" path="/funding/ventures/create" element={<CreateFundingOrg />} />,
    <Route key="funding-ventures-detail" path="/funding/ventures/:id" element={<FundingOrgDashboard />} />,
    <Route key="funding-opportunity" path="/funding/opportunity/:id" element={<OpportunityDetail />} />,
    <Route key="funding-opportunity-create" path="/funding/opportunity/create/:businessId?" element={<CreateOpportunity />} />,
    <Route key="funding-enterprise" path="/funding/enterprise/create" element={<CreateEnterprise />} />,
    <Route key="funding-invest" path="/funding/invest/:ventureId" element={<InvestmentProcess />} />,
    <Route key="funding-request-funding" path="/funding/request/:businessId" element={<RequestFunding />} />,
    <Route key="funding-business" path="/funding/business/:id" element={<BusinessDetail />} />,
    <Route key="my-businesses" path="/my-businesses" element={<BusinessPortal />} />,
    <Route key="opportunities" path="/opportunities/:category?" element={<OpportunitiesExplorer />} />,
];
