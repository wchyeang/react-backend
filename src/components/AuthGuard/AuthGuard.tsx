import { Outlet, Navigate, useLocation } from 'react-router';
import { Spin } from 'antd';
import { useAppSelector } from '@/store/hooks';

function AuthGuard() {
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const initialized = useAppSelector((state) => state.auth._initialized);
  const location = useLocation();

  if (!initialized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!userInfo) {
    const pathname = location.pathname;
    const redirect = pathname !== '/' ? `?redirect=${encodeURIComponent(pathname)}` : '';
    return <Navigate to={`/login${redirect}`} replace />;
  }

  return <Outlet />;
}

export default AuthGuard;
