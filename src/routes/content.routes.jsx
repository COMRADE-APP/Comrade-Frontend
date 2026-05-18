import React from 'react';
import { Route } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Announcements = () => Lazy(() => import('../pages/Announcements'));
const AnnouncementDetail = () => Lazy(() => import('../pages/AnnouncementDetail'));
const CreateAnnouncement = () => Lazy(() => import('../pages/CreateAnnouncement'));
const ServiceConverter = () => Lazy(() => import('../components/announcements/ServiceConverter'));

const Tasks = () => Lazy(() => import('../pages/Tasks'));
const TaskDetail = () => Lazy(() => import('../pages/TaskDetail'));
const TaskCreation = () => Lazy(() => import('../pages/TaskCreation'));
const ResponseDetail = () => Lazy(() => import('../pages/ResponseDetail'));

const Resources = () => Lazy(() => import('../pages/Resources'));
const ResourceDetail = () => Lazy(() => import('../pages/ResourceDetail'));
const CreateResource = () => Lazy(() => import('../pages/CreateResource'));

const Articles = () => Lazy(() => import('../pages/Articles'));
const ArticleDetail = () => Lazy(() => import('../pages/ArticleDetail'));
const CreateArticle = () => Lazy(() => import('../pages/CreateArticle'));

const Research = () => Lazy(() => import('../pages/Research'));
const ResearchDetail = () => Lazy(() => import('../pages/ResearchDetail'));
const CreateResearch = () => Lazy(() => import('../pages/CreateResearch'));
const ResearchApplication = () => Lazy(() => import('../pages/ResearchApplication'));
const ResearchAnalytics = () => Lazy(() => import('../pages/ResearchAnalytics'));
const ApplyResearcher = () => Lazy(() => import('../pages/ApplyResearcher'));

const Report = () => Lazy(() => import('../pages/Report'));

export const contentRoutes = [
    <Route key="announcements" path="/announcements" element={<Announcements />} />,
    <Route key="announcement-detail" path="/announcements/:id" element={<AnnouncementDetail />} />,
    <Route key="create-announcement" path="/announcements/create" element={<CreateAnnouncement />} />,
    <Route key="convert-announcement" path="/announcements/convert" element={<ServiceConverter />} />,

    <Route key="tasks" path="/tasks" element={<Tasks />} />,
    <Route key="tasks-my" path="/tasks/my_tasks" element={<Tasks />} />,
    <Route key="tasks-all" path="/tasks/all_tasks" element={<Tasks />} />,
    <Route key="tasks-submissions" path="/tasks/submissions" element={<Tasks />} />,
    <Route key="tasks-responses" path="/tasks/responses" element={<Tasks />} />,
    <Route key="task-create" path="/tasks/create" element={<TaskCreation />} />,
    <Route key="task-detail" path="/tasks/:id" element={<TaskDetail />} />,
    <Route key="task-response" path="/tasks/responses/:id" element={<ResponseDetail />} />,

    <Route key="resources" path="/resources" element={<Resources />} />,
    <Route key="resource-detail" path="/resources/:id" element={<ResourceDetail />} />,
    <Route key="resource-create" path="/resources/create" element={<CreateResource />} />,

    <Route key="articles" path="/articles" element={<Articles />} />,
    <Route key="article-detail" path="/articles/:id" element={<ArticleDetail />} />,
    <Route key="article-create" path="/articles/create" element={<CreateArticle />} />,

    <Route key="research" path="/research" element={<Research />} />,
    <Route key="research-detail" path="/research/:id" element={<ResearchDetail />} />,
    <Route key="research-create" path="/research/create" element={<CreateResearch />} />,
    <Route key="research-edit" path="/research/edit/:id" element={<CreateResearch />} />,
    <Route key="research-apply" path="/research/apply" element={<ApplyResearcher />} />,
    <Route key="research-analytics" path="/research/:id/analytics" element={<ResearchAnalytics />} />,
    <Route key="research-app" path="/research-application" element={<ResearchApplication />} />,

    <Route key="report" path="/report" element={<Report />} />,
];
