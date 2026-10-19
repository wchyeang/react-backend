import { type PropsWithChildren } from 'react';
import { ConfigProvider } from 'antd';
import { useThemeProvider } from './hook';

function ThemeProvider({ children }: PropsWithChildren) {
  const { algorithm } = useThemeProvider();

  return <ConfigProvider theme={{ algorithm: algorithm() }}>{children}</ConfigProvider>;
}

export default ThemeProvider;
