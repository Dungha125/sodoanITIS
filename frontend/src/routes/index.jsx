import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PermissionRoute from '../components/common/PermissionRoute';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const StatsPage = lazy(() => import('../pages/StatsPage'));
const OrganizationPage = lazy(() => import('../pages/OrganizationPage'));
const CohortsPage = lazy(() => import('../pages/CohortsPage'));
const DepartmentsPage = lazy(() => import('../pages/DepartmentsPage'));
const StudentsPage = lazy(() => import('../pages/StudentsPage'));
const PeriodsPage = lazy(() => import('../pages/PeriodsPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PageSuspense({ children }) {
  return <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={(
          <PageSuspense>
            <LoginPage />
          </PageSuspense>
        )}
      />
      <Route
        path="/"
        element={(
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        )}
      >
        <Route
          index
          element={(
            <PageSuspense>
              <PermissionRoute permission="dashboard"><DashboardPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="stats"
          element={(
            <PageSuspense>
              <PermissionRoute permission="stats.overview"><StatsPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="organization"
          element={(
            <PageSuspense>
              <PermissionRoute permission="admin"><OrganizationPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="cohorts"
          element={(
            <PageSuspense>
              <PermissionRoute permission="cohorts.manage"><CohortsPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="departments"
          element={(
            <PageSuspense>
              <PermissionRoute permission="departments.manage"><DepartmentsPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="students"
          element={(
            <PageSuspense>
              <PermissionRoute permission="students.view"><StudentsPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="periods"
          element={(
            <PageSuspense>
              <PermissionRoute permission="periods.manage"><PeriodsPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="admin"
          element={(
            <PageSuspense>
              <PermissionRoute permission="users.manage"><AdminPage /></PermissionRoute>
            </PageSuspense>
          )}
        />
        <Route
          path="*"
          element={(
            <PageSuspense>
              <NotFoundPage />
            </PageSuspense>
          )}
        />
      </Route>
      <Route
        path="*"
        element={(
          <PageSuspense>
            <NotFoundPage />
          </PageSuspense>
        )}
      />
    </Routes>
  );
}
