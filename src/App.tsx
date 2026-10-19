import { useEffect, Suspense, lazy } from 'react';
import { RouterProvider } from 'react-router';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { initAuthThunk } from '@/store/slices/authSlice';
import router from '@/router';
import LocaleProvider from '@/components/LocaleProvider';
import ThemeProvider from '@/components/ThemeProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import '@/styles/tokens.css';
import '@/styles/responsive.css';
import '@/styles/global.scss';
import '@/styles/theme.scss';
import '@/styles/antd-override.scss';

const CursorTrail = lazy(() => import('@/components/CursorTrail'));
const PixelTrail = lazy(() => import('@/components/PixelTrail'));
const TextRainTrail = lazy(() => import('@/components/TextRainTrail'));

const trailComponents = {
  cursor: <CursorTrail />,
  pixel: <PixelTrail />,
  textRain: <TextRainTrail />,
  none: null,
} as const;

function AppContent() {
  const themeMode = useAppSelector((state) => state.settings.theme);
  const trailKey = useAppSelector((state) => state.trail.active);
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, [themeMode]);

  useEffect(() => {
    dispatch(initAuthThunk());
  }, [dispatch]);

  return (
    <>
      <Suspense fallback={null}>{trailComponents[trailKey]}</Suspense>
      <RouterProvider router={router} />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <LocaleProvider>
        <ThemeProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
        </ThemeProvider>
      </LocaleProvider>
    </Provider>
  );
}

export default App;
