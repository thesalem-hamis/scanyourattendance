import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { FullPageSpinner } from '@/components/common/LoadingSpinner';
import { ROUTES } from '@/config/routes';
import { HomeRedirect } from './guards/HomeRedirect';
import { RedirectIfAuthed } from './guards/RedirectIfAuthed';
import { RequireAuth } from './guards/RequireAuth';
import { RequireRole } from './guards/RequireRole';
import { AdminLayout } from './layouts/AdminLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { UsherLayout } from './layouts/UsherLayout';
import { ErrorPage } from './pages/ErrorPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

/**
 * Lazy-loads a page so its code (and heavy libraries like the QR scanner or
 * charts) is only downloaded when that route is opened.
 * This is the one place allowed to import a feature's page file directly,
 * because going through a feature's index.ts would defeat code splitting.
 */
const lazyPage = (load: () => Promise<{ default: ComponentType }>) => async () => ({
  Component: (await load()).default,
});

export const router = createBrowserRouter([
  {
    path: ROUTES.home,
    errorElement: <ErrorPage />,
    hydrateFallbackElement: <FullPageSpinner />,
    children: [
      { index: true, element: <HomeRedirect /> },

      // Logged-out only
      {
        element: <RedirectIfAuthed />,
        children: [{ path: ROUTES.login, lazy: lazyPage(() => import('@/features/auth/pages/LoginPage')) }],
      },

      // Public: teens, no account
      {
        element: <PublicLayout />,
        children: [
          {
            path: ROUTES.register,
            lazy: lazyPage(() => import('@/features/registration/pages/RegisterPage')),
          },
          { path: ROUTES.passPattern, lazy: lazyPage(() => import('@/features/pass/pages/PassPage')) },
        ],
      },

      // Staff only
      {
        element: <RequireAuth />,
        children: [
          // Ushers AND admin can scan
          {
            element: <RequireRole allow={['admin', 'usher']} />,
            children: [
              {
                element: <UsherLayout />,
                children: [
                  { path: ROUTES.usher, lazy: lazyPage(() => import('@/features/checkin/pages/UsherPage')) },
                ],
              },
            ],
          },

          // Admin only
          {
            element: <RequireRole allow={['admin']} />,
            children: [
              {
                path: ROUTES.admin.root,
                element: <AdminLayout />,
                children: [
                  { index: true, element: <Navigate to={ROUTES.admin.dashboard} replace /> },
                  {
                    path: ROUTES.admin.dashboard,
                    lazy: lazyPage(() => import('@/features/dashboard/pages/DashboardPage')),
                  },
                  {
                    path: ROUTES.admin.members,
                    lazy: lazyPage(() => import('@/features/members/pages/MembersPage')),
                  },
                  {
                    path: ROUTES.admin.membersImport,
                    lazy: lazyPage(() => import('@/features/import/pages/ImportPage')),
                  },
                  {
                    path: ROUTES.admin.attendance,
                    lazy: lazyPage(() => import('@/features/attendance/pages/AttendancePage')),
                  },
                  {
                    path: ROUTES.admin.followUp,
                    // lazy: lazyPage(() => import('@/features/followup/pages/FollowUpPage')),
                    lazy: lazyPage(() => import('@/features/followup/pages/FollowupPage')),
                  },
                  {
                    path: ROUTES.admin.settings,
                    lazy: lazyPage(() => import('@/features/settings/pages/SettingsPage')),
                  },
                ],
              },
            ],
          },
        ],
      },

      { path: ROUTES.unauthorized, element: <UnauthorizedPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
