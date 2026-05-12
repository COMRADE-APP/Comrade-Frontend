import React, { Suspense } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import StripeProvider from '../contexts/StripeProvider';

const Lazy = (importFn) => {
    const Component = React.lazy(importFn);
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>}>
            <Component />
        </Suspense>
    );
};

const Landing = () => Lazy(() => import('../pages/Landing'));
const LegalPrivacy = () => Lazy(() => import('../pages/public/LegalPrivacy'));
const LegalTerms = () => Lazy(() => import('../pages/public/LegalTerms'));
const HelpCenter = () => Lazy(() => import('../pages/public/HelpCenter'));
const Login = () => Lazy(() => import('../pages/auth/Login'));
const Register = () => Lazy(() => import('../pages/auth/Register'));
const ForgotPassword = () => Lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = () => Lazy(() => import('../pages/auth/ResetPassword'));
const GoogleCallback = () => Lazy(() => import('../pages/auth/GoogleCallback'));
const VerifyEmail = () => Lazy(() => import('../pages/auth/VerifyEmail'));
const VerifyRegistration = () => Lazy(() => import('../pages/auth/VerifyRegistration'));
const RegistrationSuccess = () => Lazy(() => import('../pages/auth/RegistrationSuccess'));
const LoginSuccess = () => Lazy(() => import('../pages/auth/LoginSuccess'));
const ProfileSetup = () => Lazy(() => import('../pages/auth/ProfileSetup'));
const Onboarding = () => Lazy(() => import('../pages/auth/Onboarding'));
const SocialPasswordVerify = () => Lazy(() => import('../pages/auth/SocialPasswordVerify'));
const Setup2FA = () => Lazy(() => import('../pages/auth/Setup2FA'));
const Verify2FA = () => Lazy(() => import('../pages/auth/Verify2FA'));
const VerifySMS = () => Lazy(() => import('../pages/auth/VerifySMS'));
const TOTPSetup = () => Lazy(() => import('../pages/auth/TOTPSetup'));

const { AppleCallback, FacebookCallback, XCallback, GitHubCallback, MicrosoftCallback } = await import('../pages/auth/OAuthCallback');

export const publicRoutes = [
    <Route key="landing" path="/" element={<Landing />} />,
    <Route key="privacy" path="/privacy" element={<LegalPrivacy />} />,
    <Route key="terms" path="/terms" element={<LegalTerms />} />,
    <Route key="help" path="/help" element={<HelpCenter />} />,
    <Route key="login" path={ROUTES.LOGIN} element={<Login />} />,
    <Route key="register" path={ROUTES.REGISTER} element={<Register />} />,
    <Route key="forgot-password" path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />,
    <Route key="reset-password" path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />,
    <Route key="verify-email" path={ROUTES.VERIFY_EMAIL_OTP} element={<VerifyEmail />} />,
    <Route key="verify-registration" path={ROUTES.VERIFY_REGISTRATION} element={<VerifyRegistration />} />,
    <Route key="registration-success" path={ROUTES.REGISTRATION_SUCCESS} element={<RegistrationSuccess />} />,
    <Route key="login-success" path={ROUTES.LOGIN_SUCCESS} element={<LoginSuccess />} />,
    <Route key="profile-setup" path={ROUTES.PROFILE_SETUP} element={<ProfileSetup />} />,
    <Route key="onboarding" path={ROUTES.ONBOARDING} element={<Onboarding />} />,
    <Route key="social-verify" path={ROUTES.SOCIAL_PASSWORD_VERIFY} element={<SocialPasswordVerify />} />,
    <Route key="verify-2fa" path={ROUTES.VERIFY_2FA} element={<Verify2FA />} />,
    <Route key="verify-sms" path={ROUTES.VERIFY_SMS} element={<VerifySMS />} />,
    <Route key="setup-2fa" path={ROUTES.SETUP_2FA} element={<Setup2FA />} />,
    <Route key="google-callback" path={ROUTES.GOOGLE_CALLBACK} element={<GoogleCallback />} />,
    <Route key="apple-callback" path={ROUTES.APPLE_CALLBACK} element={<AppleCallback />} />,
    <Route key="facebook-callback" path={ROUTES.FACEBOOK_CALLBACK} element={<FacebookCallback />} />,
    <Route key="x-callback" path={ROUTES.X_CALLBACK} element={<XCallback />} />,
    <Route key="github-callback" path={ROUTES.GITHUB_CALLBACK} element={<GitHubCallback />} />,
    <Route key="microsoft-callback" path={ROUTES.MICROSOFT_CALLBACK} element={<MicrosoftCallback />} />,
];

export { Lazy };
