# React Backend

企业级 React 后台管理系统，基于 Vite + Ant Design 5。

## 技术栈

| 类别 | 技术 |
| ------ | ------ |
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 (Rolldown) |
| 状态管理 | Redux Toolkit |
| 路由 | React Router 7 |
| UI 组件 | Ant Design 5 + @ant-design/icons 6 |
| 国际化 | react-intl 7 |
| HTTP | Axios（拦截器 + 401 单飞刷新） |
| Mock | MSW 3（Service Worker） |
| Hooks | ahooks 3 |
| 测试 | Vitest 3 + jsdom |
| 样式 | SCSS Modules + CSS 设计令牌 |

## 快速开始

```bash
# 安装依赖
pnpm install

# 开发
pnpm dev

# 构建
pnpm build
```

## 常用命令

| 命令 | 说明 |
| ------ | ------ |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | TypeScript 类型检查 + Vite 构建 |
| `pnpm lint` | ESLint 检查 |
| `pnpm lint:fix` | ESLint 自动修复 |
| `pnpm format` | Prettier 格式化 |
| `pnpm test` | 运行 Vitest 测试 |
| `pnpm test:watch` | Vitest 监听模式 |

## 目录结构

```
src/
├── api/            # API 层（axios 实例、拦截器、业务接口）
├── components/     # 公共组件（独立文件夹：hook/tsx/scss/index）
├── hooks/          # 全局自定义 Hooks
├── locales/        # 国际化文案
├── layouts/        # 布局组件
├── mocks/          # MSW handlers
├── pages/          # 页面组件
├── router/         # 路由配置
├── store/          # Redux store + slices
├── styles/         # 全局样式、设计令牌、主题
├── types/          # TypeScript 类型
└── utils/          # 工具函数
```

## 设计令牌与响应式

项目采用 **rem + CSS 自定义属性** 双层体系实现企业级响应式布局。

### 令牌层 (`styles/tokens.css`)

根字号基准 `html { font-size: calc(1rem * 0.625) }`，换算关系 **1rem ≈ 10px**。

```
--space-xs  = 0.4rem  ( 4px)          --text-xs   = 1rem   (10px)
--space-sm  = 0.8rem  ( 8px)          --text-sm   = 1.2rem (12px)
--space-md  = 1.2rem  (12px)          --text-base = 1.4rem (14px)
--space-lg  = 1.6rem  (16px)          --text-md   = 1.6rem (16px)
--space-xl  = 2.4rem  (24px)          --text-lg   = 1.8rem (18px)
--space-2xl = 3.2rem  (32px)          --text-xl   = 2rem   (20px)
--space-3xl = 4.8rem  (48px)          --text-2xl  = 2.4rem (24px)
                                      --text-3xl  = 3.2rem (32px)
```

### 响应式层 (`styles/responsive.css`)

CSS 变量随断点联动切换：

| 断点 | Header 高度 | 内容间距 | 内容最大宽度 |
| ------ | ----------- | --------- | ------------ |
| xs (< 576px) | 48px + 安全区 | 内缩 | 无 |
| md (≥ 768px) | 56px | 正常 | 无 |
| lg (≥ 992px) | 64px | 居中 | 1200px |
| xl (≥ 1200px) | 64px | 居中 | 1400px |

### SCSS 变量 (`styles/_variables.scss`)

SCSS 变量映射到 CSS 设计令牌，保持 `$spacing-*`、`$font-size-*` 等语义不变：

```scss
$font-size-base: var(--text-base);   // → 1.4rem
$spacing-md: var(--space-md);        // → 1.2rem
$header-height: var(--header-height); // → 响应式
```

### 移动端优化

- Header 仅显示图标，标签文字自动隐藏
- 侧边栏 Drawer 占半屏宽度
- 触摸目标 ≥ 44px（WCAG 2.5.5）
- iOS 安全区适配（`env(safe-area-inset-*)`）

### 为什么用 rem 而非 px

DOM 布局（非 Canvas）使用 rem：

1. `calc(1rem * 0.625)` 以用户浏览器默认字号为基准，随无障碍设置缩放
2. 断点切换 CSS 变量值时，所有 rem 引用自动联动
3. `1rem ≈ 10px` 换算直观，`1.4rem` 即 `14px`

Canvas 场景（如粒子动效）仍使用 px 计算，因为位图坐标空间与 DOM 排版机制不同。

## 认证流程

1. 用户登录 → `authApi.login()` → 写入 token + userInfo
2. 请求拦截器注入 `Authorization: Bearer <accessToken>`
3. 响应 401 → 单飞刷新（`isRefreshing` + `waitingQueue` 队列重放）
4. 刷新失败 → 清除 token → 跳转 `/login`
5. `AuthGuard` 检查 `_initialized` + token → 未登录重定向

## localStorage 约定

| 场景 | 方式 |
| ------ | ------ |
| 非 React 上下文（axios、RTK thunk） | `utils/authStorage.ts` 纯函数 |
| React 组件 | ahooks `useLocalStorageState` |
| 全局偏好（settings/trail） | Redux reducer 同步写入 localStorage |

## License

MIT
