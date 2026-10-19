import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useIntl } from 'react-intl';
import { type MenuProps, Grid } from 'antd';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutThunk } from '@/store/slices/authSlice';
import { setTrail, type TrailKey } from '@/store/slices/trailSlice';

const { useBreakpoint } = Grid;

interface BasicLayoutReturn {
  collapsed: boolean;
  mobileDrawerOpen: boolean;
  isMobile: boolean;
  menuItems: MenuProps['items'];
  selectedKeys: string[];
  openKeys: string[];
  handleMenuClick: MenuProps['onClick'];
  handleCollapse: (value: boolean) => void;
  handleMobileDrawerToggle: () => void;
  handleMobileMenuClick: MenuProps['onClick'];
  userDropdownItems: MenuProps['items'];
  trailDropdownItems: MenuProps['items'];
  trailLabel: string;
  nickname: string;
}

const trailLabels: Record<string, string> = {
  none: 'header.trailOff',
  cursor: 'header.trailCursor',
  pixel: 'header.trailPixel',
  textRain: 'header.trailTextRain',
};

export function useBasicLayout(): BasicLayoutReturn {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const userInfo = useAppSelector((state) => state.auth.userInfo);
  const trailKey = useAppSelector((state) => state.trail.active);
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const menuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: '/dashboard',
        icon: <span>📊</span>,
        label: intl.formatMessage({ id: 'menu.dashboard' }),
      },
      {
        key: '/system',
        icon: <span>⚙️</span>,
        label: intl.formatMessage({ id: 'menu.system' }),
        children: [
          {
            key: '/system/user',
            label: intl.formatMessage({ id: 'menu.user' }),
          },
        ],
      },
    ],
    [intl],
  );

  const selectedKeys = useMemo(() => {
    const path = location.pathname;
    return [path === '/' ? '/dashboard' : path];
  }, [location.pathname]);

  const openKeys = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/system')) return ['/system'];
    return [];
  }, [location.pathname]);

  const handleMenuClick: MenuProps['onClick'] = useCallback(
    ({ key }) => {
      navigate(key);
    },
    [navigate],
  );

  const handleCollapse = useCallback((value: boolean) => {
    setCollapsed(value);
  }, []);

  const handleLogout = useCallback(() => {
    dispatch(logoutThunk());
    navigate('/login');
  }, [dispatch, navigate]);

  const handleMobileDrawerToggle = useCallback(() => {
    setMobileDrawerOpen((prev) => !prev);
  }, []);

  const handleMobileMenuClick: MenuProps['onClick'] = useCallback(
    ({ key }) => {
      navigate(key);
      setMobileDrawerOpen(false);
    },
    [navigate],
  );

  const handleTrailChange = useCallback(
    (key: TrailKey) => {
      dispatch(setTrail(key));
    },
    [dispatch],
  );

  const userDropdownItems: MenuProps['items'] = [
    {
      key: 'logout',
      label: intl.formatMessage({ id: 'header.logout' }),
      onClick: handleLogout,
    },
  ];

  const trailDropdownItems: MenuProps['items'] = [
    {
      key: 'none',
      label: intl.formatMessage({ id: 'header.trailOff' }),
      onClick: () => handleTrailChange('none'),
    },
    {
      key: 'cursor',
      label: intl.formatMessage({ id: 'header.trailCursor' }),
      onClick: () => handleTrailChange('cursor'),
    },
    {
      key: 'pixel',
      label: intl.formatMessage({ id: 'header.trailPixel' }),
      onClick: () => handleTrailChange('pixel'),
    },
    {
      key: 'textRain',
      label: intl.formatMessage({ id: 'header.trailTextRain' }),
      onClick: () => handleTrailChange('textRain'),
    },
  ];

  const trailLabel = intl.formatMessage({ id: trailLabels[trailKey] || 'header.trailOff' });
  const nickname = userInfo?.nickname || userInfo?.username || '';

  return {
    collapsed,
    mobileDrawerOpen,
    isMobile,
    menuItems,
    selectedKeys,
    openKeys,
    handleMenuClick,
    handleCollapse,
    handleMobileDrawerToggle,
    handleMobileMenuClick,
    userDropdownItems,
    trailDropdownItems,
    trailLabel,
    nickname,
  };
}
