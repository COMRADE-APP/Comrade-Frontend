import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Events = () => Lazy(() => import('../pages/Events'));
const EventDetail = () => Lazy(() => import('../pages/EventDetail'));
const CreateEvent = () => Lazy(() => import('../pages/CreateEvent'));
const EventAnalytics = () => Lazy(() => import('../pages/EventAnalytics'));

export const eventRoutes = [
    <Route key="events" path={ROUTES.EVENTS} element={<Events />} />,
    <Route key="event-detail" path="/events/:id" element={<EventDetail />} />,
    <Route key="event-edit" path="/events/edit/:id" element={<CreateEvent />} />,
    <Route key="event-create" path="/events/create" element={<CreateEvent />} />,
    <Route key="event-analytics" path="/events/analytics" element={<EventAnalytics />} />,
];
