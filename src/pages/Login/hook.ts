import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { useIntl } from 'react-intl';
import { useAppDispatch } from '@/store/hooks';
import { loginThunk } from '@/store/slices/authSlice';
import type { FormProps } from 'antd';

interface LoginFormValues {
  username: string;
  password: string;
}

export function useLogin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const intl = useIntl();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  const handleFinish: FormProps<LoginFormValues>['onFinish'] = useCallback(
    async (values) => {
      setLoading(true);
      try {
        await dispatch(loginThunk(values));
        const redirect = searchParams.get('redirect') || '/dashboard';
        navigate(redirect, { replace: true });
      } catch {
        // 错误已由全局拦截器统一提示，此处仅阻止异常冒泡
      } finally {
        setLoading(false);
      }
    },
    [dispatch, navigate, searchParams],
  );

  return {
    title: intl.formatMessage({ id: 'login.welcome' }),
    loginTitle: intl.formatMessage({ id: 'login.title' }),
    subtitle: intl.formatMessage({ id: 'login.subtitle' }),
    brandDesc: intl.formatMessage({ id: 'login.brandDesc' }),
    brandTagline: intl.formatMessage({ id: 'login.brandTagline' }),
    forgotLabel: intl.formatMessage({ id: 'login.forgot' }),
    usernameLabel: intl.formatMessage({ id: 'login.username' }),
    passwordLabel: intl.formatMessage({ id: 'login.password' }),
    submitLabel: intl.formatMessage({ id: 'login.submit' }),
    rememberLabel: intl.formatMessage({ id: 'login.remember' }),
    loading,
    handleFinish,
  };
}
