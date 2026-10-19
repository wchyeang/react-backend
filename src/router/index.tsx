import { createBrowserRouter } from 'react-router';

const router = createBrowserRouter([
  {
    path: '/login',
    lazy: () => import('@/pages/Login').then((m) => ({ Component: m.default })),
  },
  {
    path: '/',
    lazy: () => import('@/components/AuthGuard').then((m) => ({ Component: m.default })),
    children: [
      {
        lazy: () => import('@/layouts/BasicLayout').then((m) => ({ Component: m.default })),
        children: [
          {
            index: true,
            lazy: () => import('@/pages/Dashboard').then((m) => ({ Component: m.default })),
          },
          {
            path: 'dashboard',
            lazy: () => import('@/pages/Dashboard').then((m) => ({ Component: m.default })),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    lazy: () => import('@/pages/NotFound').then((m) => ({ Component: m.default })),
  },
]);

export default router;
