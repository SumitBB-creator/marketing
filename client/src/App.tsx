// import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLayout from './layouts/AdminLayout';
import PlatformListPage from './pages/admin/PlatformListPage';
import PlatformConfigurationPage from './pages/admin/PlatformConfigurationPage';
import MarketerListPage from './pages/admin/MarketerListPage';
import MarketerDashboard from './pages/marketer/DashboardPage';
import PlatformLeadsPage from './pages/marketer/PlatformLeadsPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import BrandingSettingsPage from './pages/admin/BrandingSettingsPage';
import UsersPage from './pages/admin/UsersPage';
import PerformancePage from './pages/admin/PerformancePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from "./components/theme-provider"
import { BrandingProvider } from './components/branding-provider';

import MarketerLayout from './layouts/MarketerLayout';
import AllLeadsPage from './pages/marketer/AllLeadsPage';
import AdminLeadsPage from './pages/admin/AdminLeadsPage';
import PublicLeadPage from './pages/public/PublicLeadPage';
import ProfilePage from './pages/marketer/ProfilePage';

import MarketerPerformancePage from './pages/marketer/MarketerPerformancePage';
import LeadPoolPage from './pages/marketer/LeadPoolPage';

const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

const Dashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'marketer') {
    return <MarketerLayout><MarketerDashboard /></MarketerLayout>;
  }
  // Redirect admin to admin dashboard or show generic
  return <Navigate to="/admin" replace />;
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <BrandingProvider>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />

              <Route element={<MarketerLayout />}>
                <Route path="/marketer/platform/:platformId" element={<PlatformLeadsPage />} />
                <Route path="/marketer/all-leads" element={<AllLeadsPage />} />
                <Route path="/marketer/pool" element={<LeadPoolPage />} />
                <Route path="/marketer/profile" element={<ProfilePage />} />
                <Route path="/marketer/performance" element={<MarketerPerformancePage />} />
              </Route>



              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AnalyticsPage />} />
                <Route path="leads" element={<AdminLeadsPage />} />
                <Route path="platforms" element={<PlatformListPage />} />
                <Route path="platforms/:id/edit" element={<PlatformConfigurationPage />} />
                <Route path="team" element={<MarketerListPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="branding" element={<BrandingSettingsPage />} />
                <Route path="performance" element={<PerformancePage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Shared Link - Protected but doesn't need specific layout? 
                  Or should it start with dashboard layout?
                  User didn't specify. Keeping it standalone but protected. 
              */}
              <Route path="/shared/:token" element={<PublicLeadPage />} />
            </Route>
          </Routes>
        </BrandingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
