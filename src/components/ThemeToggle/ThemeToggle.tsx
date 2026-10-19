import { Switch } from 'antd';
import { useThemeToggle } from './hook';

function ThemeToggle() {
  const { isDark, handleToggle } = useThemeToggle();

  return (
    <Switch checked={isDark} checkedChildren="🌙" unCheckedChildren="☀️" onChange={handleToggle} />
  );
}

export default ThemeToggle;
