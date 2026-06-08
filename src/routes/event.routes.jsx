import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Events = () => Lazy(() => import('../pages/Events'));
const EventDetail = () => Lazy(() => import('../pages/EventDetail'));
const CreateEvent = () => Lazy(() => import('../pages/CreateEvent'));
const EventAnalytics = () => Lazy(() => import('../pages/EventAnalytics'));
const SponsorshipManagement = () => Lazy(() => import('../pages/events/SponsorshipManagement'));
const DiscoverOrganisers = () => Lazy(() => import('../pages/organiser/DiscoverOrganisers'));
const OrganiserDetail = () => Lazy(() => import('../pages/organiser/OrganiserDetail'));
const SponsorDetail = () => Lazy(() => import('../pages/sponsor/SponsorDetail'));

export const eventRoutes = [
    <Route key="events" path={ROUTES.EVENTS} element={<Events />} />,
    <Route key="event-detail" path="/events/:id" element={<EventDetail />} />,
    <Route key="event-edit" path="/events/edit/:id" element={<CreateEvent />} />,
    <Route key="event-create" path="/events/create" element={<CreateEvent />} />,
    <Route key="event-analytics" path="/events/analytics" element={<EventAnalytics />} />,
    <Route key="event-sponsorship" path={ROUTES.EVENT_SPONSORSHIP} element={<SponsorshipManagement />} />,
    <Route key="discover-organisers" path={ROUTES.DISCOVER_ORGANISERS} element={<DiscoverOrganisers />} />,
    <Route key="organiser-detail" path={ROUTES.ORGANISER_DETAIL} element={<OrganiserDetail />} />,
    <Route key="sponsor-detail" path={ROUTES.SPONSOR_DETAIL} element={<SponsorDetail />} />,
];
