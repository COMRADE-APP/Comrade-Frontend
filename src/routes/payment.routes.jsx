import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Payments = () => Lazy(() => import('../pages/Payments'));
const PaymentMethods = () => Lazy(() => import('../pages/PaymentMethods'));
const TransactionPage = () => Lazy(() => import('../pages/payments/TransactionPage'));
const TransactionConfirmation = () => Lazy(() => import('../pages/payments/TransactionConfirmation'));
const CheckoutPage = () => Lazy(() => import('../pages/payments/CheckoutPage'));
const VerifyAccount = () => Lazy(() => import('../pages/payments/VerifyAccount'));

const PiggyBanks = () => Lazy(() => import('../pages/payments/PiggyBanks'));
const CreatePiggyBank = () => Lazy(() => import('../pages/payments/CreatePiggyBank'));
const PiggyBankDetail = () => Lazy(() => import('../pages/payments/PiggyBankDetail'));
const MergePiggyBanks = () => Lazy(() => import('../pages/payments/MergePiggyBanks'));
const MergeRequests = () => Lazy(() => import('../pages/payments/MergeRequests'));
const Donations = () => Lazy(() => import('../pages/payments/Donations'));
const DonationDetail = () => Lazy(() => import('../pages/payments/DonationDetail'));
const GroupInvestments = () => Lazy(() => import('../pages/payments/GroupInvestments'));
const GroupInvestmentDetail = () => Lazy(() => import('../pages/payments/GroupInvestmentDetail'));
const KittyManagement = () => Lazy(() => import('../pages/payments/KittyManagement'));
const KittyDetail = () => Lazy(() => import('../pages/payments/KittyDetail'));
const GroupTargets = () => Lazy(() => import('../pages/payments/GroupTargets'));
const PaymentGroups = () => Lazy(() => import('../pages/payments/PaymentGroups'));
const PaymentGroupDetail = () => Lazy(() => import('../pages/payments/PaymentGroupDetail'));
const CreatePaymentGroup = () => Lazy(() => import('../pages/payments/CreatePaymentGroup'));
const GroupAnalytics = () => Lazy(() => import('../pages/payments/GroupAnalytics'));
const PortfolioAnalytics = () => Lazy(() => import('../pages/payments/PortfolioAnalytics'));
const GroupKittyDetail = () => Lazy(() => import('../pages/payments/GroupKittyDetail'));
const ReverseTransaction = () => Lazy(() => import('../pages/payments/ReverseTransaction'));
const CreateAutomationPage = () => Lazy(() => import('../pages/payments/CreateAutomationPage'));

const BillPayments = () => Lazy(() => import('../pages/payments/BillPayments'));
const Loans = () => Lazy(() => import('../pages/payments/Loans'));
const Escrow = () => Lazy(() => import('../pages/payments/Escrow'));
const EscrowDetail = () => Lazy(() => import('../pages/payments/EscrowDetail'));
const Insurance = () => Lazy(() => import('../pages/payments/Insurance'));

const BusinessRegistration = () => Lazy(() => import('../pages/payments/BusinessRegistration'));
const RegisterAgent = () => Lazy(() => import('../pages/payments/RegisterAgent'));
const RegisterSupplier = () => Lazy(() => import('../pages/payments/RegisterSupplier'));
const RegisterShop = () => Lazy(() => import('../pages/payments/RegisterShop'));

// Query Management
const MyQueries = () => Lazy(() => import('../pages/payments/MyQueries'));
const SubmitQuery = () => Lazy(() => import('../pages/payments/SubmitQuery'));
const QueryDetail = () => Lazy(() => import('../pages/payments/QueryDetail'));

// Investment Portfolio
const MyInvestments = () => Lazy(() => import('../pages/payments/MyInvestments'));

// Businesses
const MyBusinesses = () => Lazy(() => import('../pages/funding/MyBusinesses'));

const ProductCatalog = () => Lazy(() => import('../pages/products/ProductCatalog'));
const SubscriptionPlans = () => Lazy(() => import('../pages/subscription/SubscriptionPlans'));
const TierPlans = () => Lazy(() => import('../pages/subscription/TierPlans'));

const PaymentForm = () => Lazy(() => import('../components/payments/PaymentForm'));

// Provider Portal Routes
const ProviderLanding = () => Lazy(() => import('../pages/providers/ProviderLanding'));
const ProviderRegistration = () => Lazy(() => import('../pages/providers/ProviderRegistration'));
const ProviderDashboard = () => Lazy(() => import('../pages/providers/ProviderDashboard'));
const ProviderDetail = () => Lazy(() => import('../pages/providers/ProviderDetail'));

export const paymentRoutes = [
    <Route key="payments" path={ROUTES.PAYMENTS} element={<Payments />} />,
    <Route key="payment-methods" path={ROUTES.PAYMENT_METHODS} element={<PaymentMethods />} />,
    <Route key="payment-methods-alt" path="/payment-methods" element={<PaymentMethods />} />,
    <Route key="deposit" path="/payments/deposit" element={<TransactionPage />} />,
    <Route key="withdraw" path="/payments/withdraw" element={<TransactionPage />} />,
    <Route key="send" path="/payments/send" element={<TransactionPage />} />,
    <Route key="checkout" path="/payments/checkout" element={<CheckoutPage />} />,
    <Route key="confirm" path="/payments/confirm" element={<TransactionConfirmation />} />,
    <Route key="verify-account" path="/payments/verify-account" element={<VerifyAccount />} />,

    <Route key="piggy-banks" path={ROUTES.PIGGY_BANKS} element={<PiggyBanks />} />,
    <Route key="piggy-create" path="/payments/piggy-banks/create" element={<CreatePiggyBank />} />,
    <Route key="piggy-detail" path="/payments/piggy-banks/:id" element={<PiggyBankDetail />} />,
    <Route key="piggy-merge" path="/payments/piggy-banks/merge" element={<MergePiggyBanks />} />,
    <Route key="piggy-merge-requests" path="/payments/piggy-banks/merge-requests" element={<MergeRequests />} />,
    <Route key="donations" path={ROUTES.DONATIONS} element={<Donations />} />,
    <Route key="donation-detail" path="/payments/donations/:id" element={<DonationDetail />} />,
    <Route key="donations-funding" path="/funding/donations" element={<Donations />} />,
    <Route key="group-investments" path={ROUTES.GROUP_INVESTMENTS} element={<GroupInvestments />} />,
    <Route key="group-investments-funding" path="/funding/group-investments" element={<GroupInvestments />} />,
    <Route key="group-investment-detail" path="/payments/group-investments/:id" element={<GroupInvestmentDetail />} />,
    <Route key="kitties" path={ROUTES.KITTIES} element={<KittyManagement />} />,
    <Route key="kitty-detail" path="/payments/kitties/:kittyId" element={<KittyDetail />} />,
    <Route key="savings-goals" path="/savings-goals" element={<GroupTargets />} />,
    <Route key="payment-groups" path="/payments/groups" element={<PaymentGroups />} />,
    <Route key="payment-group-detail" path="/payments/groups/:groupId" element={<PaymentGroupDetail />} />,
    <Route key="payment-group-analytics" path="/payments/groups/:groupId/analytics" element={<GroupAnalytics />} />,
    <Route key="payment-group-portfolio" path="/payments/groups/:groupId/portfolio" element={<PortfolioAnalytics />} />,
    <Route key="payment-group-kitty-detail" path="/payments/groups/:groupId/kitty/:kittyId" element={<GroupKittyDetail />} />,
    <Route key="reverse-transaction" path="/payments/reverse-transaction" element={<ReverseTransaction />} />,
    <Route key="payment-group-create" path="/payments/create-group" element={<CreatePaymentGroup />} />,
    <Route key="payment-group-create-automation" path="/payments/groups/:groupId/create-automation" element={<CreateAutomationPage />} />,
    <Route key="payment-personal-create-automation" path="/payments/create-automation" element={<CreateAutomationPage />} />,

    <Route key="bill-payments" path={ROUTES.BILL_PAYMENTS} element={<BillPayments />} />,
    <Route key="loans" path={ROUTES.LOANS} element={<Loans />} />,
    <Route key="escrow" path={ROUTES.ESCROW} element={<Escrow />} />,
    <Route key="escrow-detail" path="/payments/escrow/:id" element={<EscrowDetail />} />,
    <Route key="insurance" path={ROUTES.INSURANCE} element={<Insurance />} />,

    <Route key="business-register" path="/business/register" element={<BusinessRegistration />} />,
    <Route key="register-agent" path="/payments/register-agent" element={<RegisterAgent />} />,
    <Route key="register-supplier" path="/payments/register-supplier" element={<RegisterSupplier />} />,
    <Route key="register-shop" path="/payments/register-shop" element={<RegisterShop />} />,

    // Query Management
    <Route key="my-queries" path="/payments/queries" element={<MyQueries />} />,
    <Route key="submit-query" path="/payments/queries/submit" element={<SubmitQuery />} />,
    <Route key="query-detail" path="/payments/queries/:queryId" element={<QueryDetail />} />,

    // Investment Portfolio
    <Route key="my-investments" path="/payments/investments" element={<MyInvestments />} />,

    <Route key="products" path="/products" element={<ProductCatalog />} />,
    <Route key="subscriptions" path="/subscriptions" element={<SubscriptionPlans />} />,
    <Route key="tier-plans" path={ROUTES.TIER_PLANS} element={<TierPlans />} />,

    // Provider Self-Service Portal
    <Route key="provider-landing" path="/providers" element={<ProviderLanding />} />,
    <Route key="provider-register" path="/providers/register" element={<ProviderRegistration />} />,
    <Route key="provider-dashboard" path="/providers/dashboard" element={<ProviderDashboard />} />,
    <Route key="provider-detail" path="/providers/:providerId" element={<ProviderDetail />} />,
];
