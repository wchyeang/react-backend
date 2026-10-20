#!/usr/bin/env bash
# =============================================================================
# deploy.sh — React Admin 一键构建 & 部署脚本
# =============================================================================
set -euo pipefail

# ---------------------------------------------------------------------------
# 配置
# ---------------------------------------------------------------------------
IMAGE_NAME="react-backend"
REGISTRY="${DOCKER_REGISTRY:-}"                              # e.g. harbor.company.com/project

# ---------------------------------------------------------------------------
# 加载 .env 文件（与 deploy.ps1 同步）
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

load_env_file() {
    local file="$1" label="$2"
    [ -f "$file" ] || return 0
    echo "==> Loading $label ..."
    while IFS= read -r line || [ -n "$line" ]; do
        line="${line%$'\r'}"
        [[ "$line" =~ ^[[:space:]]*([^#=]+)[[:space:]]*=[[:space:]]*(.*)$ ]] || continue
        local key="${BASH_REMATCH[1]}" value="${BASH_REMATCH[2]}"
        if [ -n "${!key+x}" ]; then
            echo "    $key = $value  (skipped, already set via CLI)"
        else
            export "$key=$value"
            echo "    $key = $value"
        fi
    done < "$file"
}

load_env_file "$SCRIPT_DIR/.env" ".env (base)"
load_env_file "$SCRIPT_DIR/.env.production" ".env.production (override)"

# IMAGE_TAG 默认读取 package.json 的 version 字段，可通过环境变量覆盖
DEFAULT_TAG="latest"
if [ -f "$SCRIPT_DIR/package.json" ]; then
    DEFAULT_TAG=$(node -e "console.log(require('$SCRIPT_DIR/package.json').version)" 2>/dev/null || echo "latest")
fi
TAG="${IMAGE_TAG:-$DEFAULT_TAG}"
FULL_IMAGE="${REGISTRY:+${REGISTRY}/}${IMAGE_NAME}:${TAG}"

# ---------------------------------------------------------------------------
# 使用说明
# ---------------------------------------------------------------------------
usage() {
    cat <<EOF
Usage: $0 [command]

Commands:
  build          构建 Docker 镜像
  push           构建并推送镜像到仓库
  run            本地运行（docker compose up）
  stop           停止运行
  lint           仅检查 Dockerfile 语法（需要 hadolint）
  clean          清理本地镜像和构建缓存

Environment:
  DOCKER_REGISTRY   镜像仓库地址 (e.g. harbor.company.com/project)
  IMAGE_TAG         镜像标签 (default: package.json version)
  HOST_PORT         宿主机端口 (default: 80)
EOF
}

# ---------------------------------------------------------------------------
# 构建镜像
# ---------------------------------------------------------------------------
do_build() {
    echo "==> Cleaning previous build cache..."
    docker builder prune -f
    echo "==> Building ${FULL_IMAGE} ..."
    docker build \
        --build-arg VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}" \
        --build-arg VITE_USE_MOCK="${VITE_USE_MOCK:-false}" \
        -t "${FULL_IMAGE}" \
        -t "${IMAGE_NAME}:latest" \
        -f Dockerfile \
        .
    echo "==> Build complete: ${FULL_IMAGE}"
}

# ---------------------------------------------------------------------------
# 推送镜像
# ---------------------------------------------------------------------------
do_push() {
    if [ -z "${REGISTRY}" ]; then
        echo "ERROR: DOCKER_REGISTRY is not set"
        exit 1
    fi
    do_build
    echo "==> Pushing ${FULL_IMAGE} ..."
    docker push "${FULL_IMAGE}"
    echo "==> Push complete"
}

# ---------------------------------------------------------------------------
# 本地运行
# ---------------------------------------------------------------------------
do_run() {
    do_build
    export IMAGE_TAG="${TAG}"
    export HOST_PORT="${HOST_PORT:-80}"
    echo "==> Starting container..."
    docker compose up -d
    echo "==> App running at http://localhost:${HOST_PORT}"
}

# ---------------------------------------------------------------------------
# 停止
# ---------------------------------------------------------------------------
do_stop() {
    docker compose down
    echo "==> Stopped"
}

# ---------------------------------------------------------------------------
# Lint
# ---------------------------------------------------------------------------
do_lint() {
    if command -v hadolint &>/dev/null; then
        hadolint Dockerfile
        echo "==> Dockerfile lint OK"
    else
        echo "==> hadolint not installed, skipping. Install: brew install hadolint / apt install hadolint"
    fi
}

# ---------------------------------------------------------------------------
# 清理
# ---------------------------------------------------------------------------
do_clean() {
    echo "==> Stopping & removing container..."
    docker rm -f react-backend 2>/dev/null || true
    echo "==> Removing compose resources..."
    docker compose down -v 2>/dev/null || true
    echo "==> Removing image ${FULL_IMAGE} ..."
    docker rmi -f "${IMAGE_NAME}:latest" 2>/dev/null || true
    if [ "${TAG}" != "latest" ]; then
        docker rmi -f "${FULL_IMAGE}" 2>/dev/null || true
    fi
    echo "==> Cleaning build cache..."
    docker builder prune -f
    echo "==> Cleaned"
}

# ---------------------------------------------------------------------------
# 主入口
# ---------------------------------------------------------------------------
case "${1:-}" in
    build)  do_build ;;
    push)   do_push ;;
    run)    do_run ;;
    stop)   do_stop ;;
    lint)   do_lint ;;
    clean)  do_clean ;;
    *)      usage ;;
esac