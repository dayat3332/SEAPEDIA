import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HomePage from '../pages/public/HomePage';
import ProductListPage from '../pages/public/ProductListPage';
import ProductDetailPage from '../pages/public/ProductDetailPage';
import LoginPage from '../pages/public/LoginPage';
import RegisterPage from '../pages/public/RegisterPage';
import VerifyOtpPage from '../pages/public/VerifyOtpPage';
import RoleSelectPage from '../pages/RoleSelectPage';
import SellerDashboard from '../pages/seller/SellerDashboard';
import BuyerDashboard from '../pages/buyer/BuyerDashboard';
import DriverDashboard from '../pages/driver/DriverDashboard';
import AdminDashboard from '../pages/admin/AdminDashboard';
import CartPage from '../pages/buyer/CartPage';
import CheckoutPage from '../pages/buyer/CheckoutPage';
import { ProtectedRoute, GuestRoute, RoleSelectRoute } from './guards';

import ScrollToTop from '../components/layout/ScrollToTop';

// Layout wrapper for public pages (with Navbar and Footer)
function PublicLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-surface-50">
      <ScrollToTop />
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Layout for auth pages (no Navbar, no Footer — fullscreen branded)
function AuthLayout() {
  return (
    <div className="min-h-screen auth-bg relative flex items-center justify-center">
      <ScrollToTop />
      <main className="relative z-10 w-full">
        <Outlet />
      </main>
    </div>
  );
}

import DashboardHeader from '../components/layout/DashboardHeader';

// Layout for dashboard pages (no Navbar/Footer — dedicated dashboard shell)
function DashboardLayout() {
  return (
    <div className="dashboard-shell bg-grid-pattern min-h-screen flex flex-col">
      <ScrollToTop />
      <DashboardHeader />
      <main className="flex-grow">
        <Outlet />
      </main>
    </div>
  );
}

export const router = createBrowserRouter([
  // Public pages with Navbar + Footer
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'products',
        element: <ProductListPage />,
      },
      {
        path: 'products/:id',
        element: <ProductDetailPage />,
      },
    ],
  },
  // Auth pages — fullscreen branded background, no Navbar
  {
    path: '/',
    element: <AuthLayout />,
    children: [
      {
        path: 'login',
        element: (
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        ),
      },
      {
        path: 'register',
        element: (
          <GuestRoute>
            <RegisterPage />
          </GuestRoute>
        ),
      },
      {
        path: 'verify-otp',
        element: (
          <GuestRoute>
            <VerifyOtpPage />
          </GuestRoute>
        ),
      },
      {
        path: 'select-role',
        element: (
          <RoleSelectRoute>
            <RoleSelectPage />
          </RoleSelectRoute>
        ),
      },
    ],
  },
  // Dashboard pages — no Navbar/Footer, dashboard shell
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      {
        path: 'cart',
        element: (
          <ProtectedRoute allowedRoles={['buyer']}>
            <CartPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'checkout',
        element: (
          <ProtectedRoute allowedRoles={['buyer']}>
            <CheckoutPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/seller',
        element: (
          <ProtectedRoute allowedRoles={['seller']}>
            <SellerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/buyer',
        element: (
          <ProtectedRoute allowedRoles={['buyer']}>
            <BuyerDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/driver',
        element: (
          <ProtectedRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard/admin',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
