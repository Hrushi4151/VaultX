import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import PublicLayout    from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';

// Guards
import ProtectedRoute from '../components/common/ProtectedRoute';
import PublicRoute    from '../components/common/PublicRoute';
import AdminRoute     from '../components/common/AdminRoute';

// Layouts


import AdminLayout     from '../layouts/AdminLayout';
import LandingPage from '../pages/public/LandingPage';

// Pages — Auth
import LoginPage    from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import EmailVerificationPage from '../pages/auth/EmailVerificationPage';
import AdminLogin from '../pages/admin/AdminLogin';

// Pages — Dashboard
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/dashboard/ProfilePage';
import SettingsPage from '../pages/dashboard/SettingsPage';
import SessionsPage from '../pages/dashboard/SessionsPage';
import CreatePinPage from '../pages/dashboard/CreatePinPage';

// Pages — Dashboard (Documents & Bundles)
import DocumentsPage from '../pages/dashboard/DocumentsPage';
import DocumentDetailsPage from '../pages/dashboard/documents/DocumentDetailsPage';
import TrashPage from '../pages/dashboard/TrashPage';
import BundlesPage from '../pages/dashboard/bundles/BundlesPage';
import CreateBundleWizard from '../pages/dashboard/bundles/CreateBundleWizard';
import BundleDetailsPage from '../pages/dashboard/bundles/BundleDetailsPage';

// Pages — Dashboard (PDF Toolkit)
import PdfToolkitDashboard from '../pages/dashboard/pdf/PdfToolkitDashboard';
import PdfExportWizard from '../pages/dashboard/pdf/PdfExportWizard';
import PdfSplitWizard from '../pages/dashboard/pdf/PdfSplitWizard';
import PdfWatermarkWizard from '../pages/dashboard/pdf/PdfWatermarkWizard';
import PdfProtectWizard from '../pages/dashboard/pdf/PdfProtectWizard';
import TempStoragePage from '../pages/dashboard/temp/TempStoragePage';
import NotificationsPage from '../pages/dashboard/notifications/NotificationsPage';

// Pages — Dashboard (Shares)
import SharesDashboard from '../pages/dashboard/shares/SharesDashboard';
import CreateShareWizard from '../pages/dashboard/shares/CreateShareWizard';
import ShareDetailsPage from '../pages/dashboard/shares/ShareDetailsPage';

// Pages — Dashboard (Search)
import SearchPage from '../pages/dashboard/search/SearchPage';

// Pages — Dashboard (Collections)
import CollectionsPage from '../pages/dashboard/collections/CollectionsPage';
import CollectionDetailPage from '../pages/dashboard/collections/CollectionDetailPage';

// Pages — Public
import PublicSharePage from '../pages/public/PublicSharePage';

// Pages — Admin
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminUsersPage from '../pages/admin/AdminUsersPage';
import AdminDocumentsPage from '../pages/admin/AdminDocumentsPage';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage';
import AdminStoragePage from '../pages/admin/AdminStoragePage';
import AdminAnalyticsPage from '../pages/admin/AdminAnalyticsPage';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage';

// Pages — Errors
import NotFoundPage from '../pages/errors/NotFoundPage';

// Constants
import { ROUTES } from '../utils/constants';

/**
 * Application router — defines all routes and their layout/guard assignments.
 */
export default function AppRouter() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '14px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px 0 rgb(0 0 0 / 0.10)',
          },
          success: { iconTheme: { primary: '#16A34A', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* ── Public routes ─────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<LandingPage />} />

          {/* Auth routes — redirect authenticated users to dashboard */}
          <Route path={ROUTES.LOGIN}    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path={ROUTES.REGISTER} element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPasswordPage /></PublicRoute>} />
          <Route path="/verify-email" element={<PublicRoute><EmailVerificationPage /></PublicRoute>} />
          <Route path="/admin/login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
        </Route>

        {/* Public Share Route - Standalone (no standard headers/footers needed if it has its own layout) */}
        <Route path="/share/:token" element={<PublicSharePage />} />

        {/* ── Protected dashboard routes ──────────────────── */}
        {/* We use individual ProtectedRoute per route or directly within a wrapper. The original code wrapped DashboardLayout inside ProtectedRoute but didn't wrap individual pages, meaning all children are protected. Note: DashboardLayout handles Sidebar. */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}
        >
          <Route index element={<DashboardPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="sessions" element={<SessionsPage />} />
          <Route path="create-pin" element={<CreatePinPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailsPage />} />
          <Route path="bundles" element={<BundlesPage />} />
          <Route path="bundles/create" element={<CreateBundleWizard />} />
          <Route path="bundles/:id" element={<BundleDetailsPage />} />
          <Route path="trash" element={<TrashPage />} />
          <Route path="pdf-toolkit" element={<PdfToolkitDashboard />} />
          <Route path="pdf-toolkit/export" element={<PdfExportWizard />} />
          <Route path="pdf-toolkit/split" element={<PdfSplitWizard />} />
          <Route path="pdf-toolkit/watermark" element={<PdfWatermarkWizard />} />
          <Route path="pdf-toolkit/protect" element={<PdfProtectWizard />} />
          <Route path="temp-storage" element={<TempStoragePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          
          <Route path="shares" element={<SharesDashboard />} />
          <Route path="shares/create" element={<CreateShareWizard />} />
          <Route path="shares/:id" element={<ShareDetailsPage />} />
          
          <Route path="search" element={<SearchPage />} />
          
          {/* Collections */}
          <Route path="collections" element={<CollectionsPage />} />
          <Route path="collections/:id" element={<CollectionDetailPage />} />
          
          {/* Future routes — will be added as modules are built */}
        </Route>

        <Route
          path="/profile"
          element={<Navigate to="/dashboard/profile" replace />}
        />
        <Route
          path="/settings"
          element={<Navigate to="/dashboard/settings" replace />}
        />

        {/* ── Admin routes ─────────────────────────────────── */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="documents" element={<AdminDocumentsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          {/* Mocks for others */}
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="storage" element={<AdminStoragePage />} />
          <Route path="audit" element={<AdminAuditLogsPage />} />
        </Route>

        {/* ── Error pages ────────────────────────────────── */}
        <Route path="/404"  element={<NotFoundPage />} />
        <Route path="*"     element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
