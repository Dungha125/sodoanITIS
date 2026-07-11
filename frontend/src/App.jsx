import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import LoadingSpinner from './components/common/LoadingSpinner';
import PermissionRoute from './components/common/PermissionRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StudentsPage from './pages/StudentsPage';
import StatsPage from './pages/StatsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import CohortsPage from './pages/CohortsPage';
import PeriodsPage from './pages/PeriodsPage';
import AdminPage from './pages/AdminPage';
import OrganizationPage from './pages/OrganizationPage';
import NotFoundPage from './pages/NotFoundPage';

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30000 } } });

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
        <Route index element={<PermissionRoute permission="dashboard"><DashboardPage /></PermissionRoute>} />
        <Route path="stats" element={<PermissionRoute permission="stats.overview"><StatsPage /></PermissionRoute>} />
        <Route path="organization" element={<PermissionRoute permission="admin"><OrganizationPage /></PermissionRoute>} />
        <Route path="cohorts" element={<PermissionRoute permission="cohorts.manage"><CohortsPage /></PermissionRoute>} />
        <Route path="departments" element={<PermissionRoute permission="departments.manage"><DepartmentsPage /></PermissionRoute>} />
        <Route path="students" element={<PermissionRoute permission="students.view"><StudentsPage /></PermissionRoute>} />
        <Route path="periods" element={<PermissionRoute permission="periods.manage"><PeriodsPage /></PermissionRoute>} />
        <Route path="admin" element={<PermissionRoute permission="users.manage"><AdminPage /></PermissionRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
