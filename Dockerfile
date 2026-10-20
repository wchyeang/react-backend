# =============================================================================
# 企业级 Dockerfile — React 后台管理 SPA
# 多阶段构建: pnpm build → Nginx Alpine
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: 依赖安装层（利用 Docker 缓存，package.json 不变则不重新安装）
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app

# 配置 npm 镜像（国内加速），激活 pnpm
RUN npm config set registry https://registry.npmmirror.com/ \
    && corepack enable && corepack prepare pnpm@latest --activate

# 先复制依赖描述文件 + pnpm 配置，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./

# 仅安装生产依赖 + 开发依赖（因为需要 tsc、vite 等）
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Stage 2: 构建层
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com/ \
    && corepack enable && corepack prepare pnpm@latest --activate

# 从 deps 阶段复制 node_modules（含所有依赖）
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 构建时环境变量（默认值，可在 docker build --build-arg 覆盖）
ARG VITE_API_BASE_URL=/api
ARG VITE_USE_MOCK=false

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_USE_MOCK=${VITE_USE_MOCK}

# TypeScript 类型检查 + Vite 生产构建
RUN pnpm build

# ---------------------------------------------------------------------------
# Stage 3: 运行时层 — 仅保留 dist + Nginx
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

# 安装 curl（供 HEALTHCHECK 使用），删除默认配置
RUN apk add --no-cache curl \
    && rm -f /etc/nginx/conf.d/default.conf

# 注入自定义 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 从构建阶段复制产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建 nginxuser（nginx.conf 中 user 指令引用），容器以 root 启动
# nginx master 绑定 80 后，worker 进程自动降权到 nginxuser
RUN addgroup -g 1001 -S nginxuser \
    && adduser -u 1001 -S nginxuser -G nginxuser \
    && chown -R nginxuser:nginxuser /usr/share/nginx/html \
    && chown -R nginxuser:nginxuser /var/cache/nginx \
    && chown -R nginxuser:nginxuser /var/log/nginx \
    && touch /var/run/nginx.pid \
    && chown -R nginxuser:nginxuser /var/run/nginx.pid

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# 前台运行 Nginx
CMD ["nginx", "-g", "daemon off;"]