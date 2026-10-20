<#
.SYNOPSIS
    React Admin — Windows Docker 部署脚本

.DESCRIPTION
    用法:
      .\deploy.ps1 build       # 构建镜像
      .\deploy.ps1 run         # 构建 + 启动
      .\deploy.ps1 stop        # 停止服务
      .\deploy.ps1 clean       # 清理本地镜像 + 构建缓存
#>

param (
    [ValidateSet("build", "run", "stop", "clean")]
    [string]$Command = "run"
)

$ErrorActionPreference = "Stop"

# 读取 .env 文件：先加载 .env（基础），再加载 .env.production（覆盖）
# Docker Compose 也感知 --env-file，见 Invoke-Run
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Import-DotEnv {
    param ([string]$Path, [string]$Label)
    if (-not (Test-Path $Path)) { return }
    Write-Host "==> Loading $Label ..." -ForegroundColor DarkGray
    Get-Content $Path | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)\s*=\s*(.+)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            # 命令行已设的环境变量始终优先
            if (Test-Path "env:$key") {
                Write-Host "    $key = $value  (skipped, already set via CLI)" -ForegroundColor DarkGray
            }
            else {
                Set-Item -Path "env:$key" -Value $value
                Write-Host "    $key = $value" -ForegroundColor DarkGray
            }
        }
    }
}

Import-DotEnv -Path (Join-Path $ScriptDir ".env") -Label ".env (base)"
Import-DotEnv -Path (Join-Path $ScriptDir ".env.production") -Label ".env.production (override)"

$ImageName = "react-backend"
$PackageVersion = "latest"

# 从 package.json 读取 name 和 version
$PackageJsonPath = Join-Path $ScriptDir "package.json"
if (Test-Path $PackageJsonPath) {
    $pkg = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
    $ImageName = $pkg.name
    $PackageVersion = $pkg.version
}
$ImageTag = if ($env:IMAGE_TAG) { $env:IMAGE_TAG } else { $PackageVersion }

$HostPort = if ($env:HOST_PORT) { $env:HOST_PORT } else { "80" }
$FullImage = "${ImageName}:${ImageTag}"

function Exit-IfFailed {
    if ($LASTEXITCODE -ne 0) {
        Write-Host "==> FAILED (exit code: $LASTEXITCODE)" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Invoke-Build {
    Write-Host "==> Building ${FullImage} ..." -ForegroundColor Cyan
    docker build `
        --build-arg VITE_API_BASE_URL="$($env:VITE_API_BASE_URL)" `
        --build-arg VITE_USE_MOCK="$($env:VITE_USE_MOCK)" `
        -t $FullImage `
        -f Dockerfile `
        .
    Exit-IfFailed
    Write-Host "==> Build complete: $FullImage" -ForegroundColor Green
}

function Invoke-Run {
    Invoke-Build
    Write-Host "==> Starting container..." -ForegroundColor Cyan
    $env:IMAGE_NAME = $ImageName
    $env:IMAGE_TAG = $ImageTag
    $env:HOST_PORT = $HostPort
    docker compose up -d
    Exit-IfFailed
    Write-Host "==> App running at http://localhost:$HostPort" -ForegroundColor Green
}

function Invoke-Stop {
    docker compose down
    Write-Host "==> Stopped" -ForegroundColor Green
}

function Invoke-Clean {
    Write-Host "==> Stopping & removing container..." -ForegroundColor DarkGray
    docker rm -f $ImageName 2>$null
    Write-Host "==> Removing compose resources..." -ForegroundColor DarkGray
    docker compose down -v 2>$null
    Write-Host "==> Removing images ${ImageName}:* ..." -ForegroundColor DarkGray
    $images = docker images -q "${ImageName}:*" 2>$null
    if ($images) { docker rmi -f $images 2>$null }
    Write-Host "==> Cleaning build cache..." -ForegroundColor DarkGray
    docker builder prune -f
    Write-Host "==> Cleaned" -ForegroundColor Green
}

switch ($Command) {
    "build" { Invoke-Build }
    "run" { Invoke-Run }
    "stop" { Invoke-Stop }
    "clean" { Invoke-Clean }
}