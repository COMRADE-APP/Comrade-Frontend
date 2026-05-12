import React from 'react';
import { Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import MainLayout from '../components/layout/MainLayout';
import { Lazy } from './auth.routes';

const Shop = () => Lazy(() => import('../pages/shop/Shop'));
const ProductDetails = () => Lazy(() => import('../pages/shop/ProductDetails'));
const EstablishmentDetail = () => Lazy(() => import('../pages/shop/EstablishmentDetail'));
const RegisterEstablishment = () => Lazy(() => import('../pages/shop/RegisterEstablishment'));
const CreateService = () => Lazy(() => import('../pages/shop/CreateService'));
const ServiceDetail = () => Lazy(() => import('../pages/shop/ServiceDetail'));
const ShopCart = () => Lazy(() => import('../pages/shop/Cart'));
const ShopOrders = () => Lazy(() => import('../pages/shop/Orders'));
const CreateProduct = () => Lazy(() => import('../pages/products/CreateProduct'));
const BecomePartner = () => Lazy(() => import('../pages/partners/BecomePartner'));

export const shopRoutes = [
    <Route key="shop" path="/shop/:tab?" element={<Shop />} />,
    <Route key="product-detail" path={ROUTES.PRODUCT_DETAILS} element={<ProductDetails />} />,
    <Route key="shop-item" path="/shop/item/:id" element={<ProductDetails />} />,
    <Route key="establishment" path="/shop/establishment/:id" element={<EstablishmentDetail />} />,
    <Route key="register-establishment" path="/shop/register-establishment" element={<RegisterEstablishment />} />,
    <Route key="create-service" path="/shop/create-service" element={<CreateService />} />,
    <Route key="service-detail" path="/shop/service/:id" element={<ServiceDetail />} />,
    <Route key="shop-cart" path="/shop/cart" element={<ShopCart />} />,
    <Route key="shop-orders" path="/shop/orders" element={<ShopOrders />} />,
    <Route key="create-product" path="/products/create" element={<CreateProduct />} />,
    <Route key="become-partner" path="/partners/apply" element={<BecomePartner />} />,
];
