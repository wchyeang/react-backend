import { Dropdown } from 'antd';
import { CaretDownOutlined, GlobalOutlined } from '@ant-design/icons';
import { useLocaleToggle } from './hook';
import type { Locale } from '@/store/slices/settingsSlice';

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '中文',
  'en-US': 'EN',
};

function LocaleToggle() {
  const { locale, handleChange } = useLocaleToggle();

  const items = (Object.keys(LOCALE_LABELS) as Locale[]).map((key) => ({
    key,
    label: LOCALE_LABELS[key],
  }));

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        items,
        selectedKeys: [locale],
        onClick: ({ key }) => handleChange(key as Locale),
      }}
    >
      <div className="toolbar-chip">
        <GlobalOutlined className="chip-icon" />
        <span className="chip-label">{LOCALE_LABELS[locale]}</span>
        <CaretDownOutlined className="chip-caret" />
      </div>
    </Dropdown>
  );
}

export default LocaleToggle;
