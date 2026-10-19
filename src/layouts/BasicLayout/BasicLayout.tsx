import { Outlet } from 'react-router';
import { Layout, Menu, Dropdown, Space, Drawer, Button, theme as antdTheme } from 'antd';
import { CaretDownOutlined, MenuOutlined } from '@ant-design/icons';
import { useIntl } from 'react-intl';
import { useBasicLayout } from './hook';
import ThemeToggle from '@/components/ThemeToggle';
import { LocaleToggle } from '@/components/LocaleToggle';
import styles from './BasicLayout.module.scss';

const { Header, Sider, Content } = Layout;

function BasicLayout() {
  const {
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
  } = useBasicLayout();
  const intl = useIntl();
  const { token } = antdTheme.useToken();

  const cursorIcon = (
    <svg
      className="chip-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
    </svg>
  );

  const logoContent = (
    <div
      className={styles.basicLayoutLogo}
      style={{ borderBottomColor: token.colorBorderSecondary }}
    >
      {collapsed && !isMobile ? 'L' : intl.formatMessage({ id: 'app.logo' })}
    </div>
  );

  return (
    <Layout className={styles.basicLayout}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={handleCollapse}
          className={styles.basicLayoutSider}
          breakpoint="lg"
          style={{ background: token.colorBgContainer }}
        >
          {logoContent}
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            defaultOpenKeys={openKeys}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ background: 'transparent', borderInlineEnd: 'none' }}
          />
        </Sider>
      )}

      <Layout className={styles.basicLayoutInner}>
        <Header className={styles.basicLayoutHeader} style={{ background: token.colorBgContainer }}>
          <div className={styles.basicLayoutHeaderLeft}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuOutlined />}
                onClick={handleMobileDrawerToggle}
                className={styles.basicLayoutHamburger}
              />
            )}
            {isMobile && (
              <span className={styles.basicLayoutMobileLogo}>
                {intl.formatMessage({ id: 'app.logo' })}
              </span>
            )}
          </div>
          <div className={styles.basicLayoutHeaderRight}>
            <>
              <Dropdown menu={{ items: trailDropdownItems }} placement="bottomRight">
                <div className="toolbar-chip">
                  {cursorIcon}
                  <span className="chip-label">{trailLabel}</span>
                  <CaretDownOutlined className="chip-caret" />
                </div>
              </Dropdown>
              <LocaleToggle />
              <ThemeToggle />
              <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight">
                <Space className={styles.basicLayoutUser}>
                  <span>{nickname}</span>
                </Space>
              </Dropdown>
            </>
          </div>
        </Header>
        <Content className={styles.basicLayoutContent}>
          <Outlet />
        </Content>
      </Layout>

      <Drawer
        title={intl.formatMessage({ id: 'app.logo' })}
        placement="left"
        onClose={handleMobileDrawerToggle}
        open={mobileDrawerOpen}
        className={styles.basicLayoutMobileDrawer}
        styles={{ wrapper: { width: '50vw' }, body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          defaultOpenKeys={openKeys}
          items={menuItems}
          onClick={handleMobileMenuClick}
        />
      </Drawer>
    </Layout>
  );
}

export default BasicLayout;
