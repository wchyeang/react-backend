import { Form, Input, Button, Checkbox, Typography, Dropdown } from 'antd';
import { UserOutlined, LockOutlined, GlobalOutlined, CaretDownOutlined } from '@ant-design/icons';
import { useLogin } from './hook';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setLocale, type Locale } from '@/store/slices/settingsSlice';
import ThemeToggle from '@/components/ThemeToggle';
import styles from './Login.module.scss';

const { Title } = Typography;

const LOCALE_LABELS: Record<Locale, string> = {
  'zh-CN': '中文',
  'en-US': 'EN',
};

function Login() {
  const {
    title,
    loginTitle,
    subtitle,
    brandDesc,
    brandTagline,
    forgotLabel,
    usernameLabel,
    passwordLabel,
    submitLabel,
    rememberLabel,
    handleFinish,
  } = useLogin();
  const dispatch = useAppDispatch();
  const locale = useAppSelector((state) => state.settings.locale);

  const localeItems = (Object.keys(LOCALE_LABELS) as Locale[]).map((key) => ({
    key,
    label: LOCALE_LABELS[key],
  }));

  return (
    <div className={styles.login}>
      {/* 右上角毛玻璃工具栏（语言 + 主题） */}
      <div className={styles.loginToolbar}>
        <div className={styles.toolbarGlass}>
          <Dropdown
            trigger={['hover']}
            menu={{
              items: localeItems,
              selectedKeys: [locale],
              onClick: ({ key }) => dispatch(setLocale(key as Locale)),
            }}
          >
            <span className={styles.langChip}>
              <GlobalOutlined className={styles.chipIcon} />
              <span className={styles.chipLabel}>{LOCALE_LABELS[locale]}</span>
              <CaretDownOutlined className={styles.chipCaret} />
            </span>
          </Dropdown>
          <ThemeToggle />
        </div>
      </div>

      {/* 动态背景光球 */}
      <div className={styles.bgOrbs}>
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
        <div className={styles.bgOrb4} />
        <div className={styles.bgOrb5} />
      </div>

      {/* 粒子光点 */}
      <div className={styles.particles}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className={`${styles.particle} ${styles[`particle${i + 1}`]}`} />
        ))}
      </div>

      {/* 左侧品牌区 */}
      <div className={styles.loginLeft}>
        <div className={styles.brandContent}>
          <div className={styles.brandLogo}>
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="48" height="48" rx="14" fill="url(#logoGrad)" />
              <path
                d="M14 28L21 21L27 27L34 18"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="34" cy="18" r="3" fill="#fff" fillOpacity="0.3" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop stopColor="#4f8cff" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className={styles.brandName}>{loginTitle}</h1>
          <p className={styles.brandDesc}>{brandDesc}</p>
          <p className={styles.brandTagline}>{brandTagline}</p>
        </div>
      </div>

      {/* 右侧毛玻璃登录卡片 */}
      <div className={styles.loginRight}>
        <div className={styles.glassCard}>
          <div className={styles.cardHeader}>
            <Title level={3} className={styles.loginTitle}>
              {title}
            </Title>
            <p className={styles.loginSubtitle}>{subtitle}</p>
          </div>

          <Form
            onFinish={handleFinish}
            size="large"
            autoComplete="off"
            className={styles.loginForm}
          >
            <Form.Item name="username" rules={[{ required: true, message: usernameLabel }]}>
              <Input
                prefix={<UserOutlined />}
                placeholder={usernameLabel}
                className={styles.glassInput}
              />
            </Form.Item>

            <Form.Item name="password" rules={[{ required: true, message: passwordLabel }]}>
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={passwordLabel}
                className={styles.glassInput}
              />
            </Form.Item>

            <div className={styles.formRow}>
              <Form.Item name="remember" valuePropName="checked" noStyle>
                <Checkbox>{rememberLabel}</Checkbox>
              </Form.Item>
              <a className={styles.forgotLink}>{forgotLabel}</a>
            </div>

            <Form.Item>
              <Button type="primary" htmlType="submit" block className={styles.submitBtn}>
                {submitLabel}
              </Button>
            </Form.Item>

            {import.meta.env.VITE_USE_MOCK === 'true' && (
              <div className={styles.demoHint}>演示账号：admin / admin</div>
            )}
          </Form>
        </div>
      </div>
    </div>
  );
}

export default Login;
