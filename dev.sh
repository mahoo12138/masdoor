#!/usr/bin/env bash
#
# masdoor 本地一键开发/测试环境
#
# 用法:
#   ./dev.sh dev        本地开发：SQLite 后端(go run) + Vite 前端热更新，零外部依赖
#   ./dev.sh test       Docker 测试环境：STANDARD 镜像 + SQLite（默认），构建期内置冒烟验证
#   ./dev.sh test mysql Docker 测试环境：STANDARD 镜像 + MySQL 8（docker-compose.mysql.yml 覆盖层）
#   ./dev.sh smoke      快速冒烟：ALLINONE 镜像(内置 SQLite)单容器验证
#   ./dev.sh down       停止 test/smoke 环境
#   ./dev.sh logs       跟踪 test 环境日志 (Ctrl-C 退出)
#   ./dev.sh clean      清理容器、数据卷、镜像与本地构建产物
#
# 环境变量:
#   BACKEND_PORT   后端/测试环境端口 (默认 8000)
#   SMOKE_PORT     smoke 容器端口   (默认 8010)
#   FRONTEND_PORT  Vite 开发端口    (默认 7001)
#   DB_PORT        MySQL 宿主端口   (默认 3306, 仅 test mysql)
#
set -euo pipefail
cd "$(dirname "$0")"

BACKEND_PORT="${BACKEND_PORT:-8000}"
SMOKE_PORT="${SMOKE_PORT:-8010}"
FRONTEND_PORT="${FRONTEND_PORT:-7001}"
SMOKE_NAME="masdoor-smoke"
SMOKE_IMAGE="masdoor:smoke"
DEV_LOG="logs/dev-backend.log"

# 国内网络下默认走 goproxy.cn；已设置 GOPROXY 时尊重用户环境
export GOPROXY="${GOPROXY:-https://goproxy.cn,direct}"

info()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn()  { printf '\033[1;33m[!]\033[0m %s\n' "$*"; }
fail()  { printf '\033[1;31m[x]\033[0m %s\n' "$*" >&2; exit 1; }

need() {
  command -v "$1" >/dev/null 2>&1 || fail "缺少 $1，请先安装"
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    fail "缺少 docker compose / docker-compose"
  fi
}

# down/logs/clean 恒加载两份 compose 文件，保证 test mysql 的 db 服务/数据卷也能收尾
compose_all() {
  compose -f docker-compose.yml -f docker-compose.mysql.yml "$@"
}

# 轮询等待 HTTP 端点就绪
wait_healthy() {
  local url="$1" name="$2" tries="${3:-60}"
  local i=0
  printf '等待 %s 就绪' "$name"
  while [ "$i" -lt "$tries" ]; do
    if curl -fsS --noproxy '*' -o /dev/null --max-time 2 "$url" 2>/dev/null; then
      printf ' \033[1;32mOK\033[0m\n'
      return 0
    fi
    printf '.'
    sleep 2
    i=$((i + 1))
  done
  printf ' \033[1;31m失败\033[0m\n'
  return 1
}

# 验证健康端点 + 登录页
verify_endpoints() {
  local base="$1"
  local health page
  health="$(curl -fsS --noproxy '*' --max-time 5 "$base/api/health" 2>/dev/null)" || fail "$base/api/health 不可达"
  page="$(curl -fsS --noproxy '*' --max-time 5 -o /dev/null -w '%{http_code}' "$base/" 2>/dev/null)" || fail "$base/ 不可达"
  [ "$page" = "200" ] || fail "$base/ 返回 HTTP $page（期望 200）"
  info "健康检查: $health"
  info "登录页:   HTTP $page"
}

cmd_dev() {
  need go
  need yarn

  if [ ! -d web/node_modules ]; then
    info "web/node_modules 缺失，执行 yarn install ..."
    (cd web && yarn install --network-timeout 600000)
  fi

  mkdir -p logs

  # 零数据库配置：conf/app.conf 默认 SQLite (data/masdoor.db)，无需任何环境变量
  info "启动后端 (SQLite, 端口 $BACKEND_PORT, 日志 $DEV_LOG)"
  socks5Proxy= \
  httpport="$BACKEND_PORT" \
  go run main.go >"$DEV_LOG" 2>&1 &
  local backend_pid=$!

  cleanup() {
    kill "$backend_pid" 2>/dev/null || true
    wait "$backend_pid" 2>/dev/null || true
  }
  trap cleanup EXIT INT TERM

  wait_healthy "http://localhost:${BACKEND_PORT}/api/health" "后端" 30 || {
    warn "后端启动失败，最近日志："
    tail -20 "$DEV_LOG" || true
    exit 1
  }

  info "启动前端 (Vite 热更新, http://localhost:${FRONTEND_PORT})"
  info "开发入口: http://localhost:${FRONTEND_PORT}   (API 代理 -> http://localhost:${BACKEND_PORT})"
  info "Ctrl-C 停止前后端"
  (cd web && CASDOOR_BACKEND="http://localhost:${BACKEND_PORT}" yarn dev --port "$FRONTEND_PORT")
}

cmd_test() {
  local db="${1:-sqlite}"
  case "$db" in
    sqlite|mysql) ;;
    *) fail "用法: ./dev.sh test [sqlite|mysql]" ;;
  esac

  need docker
  compose version >/dev/null 2>&1 || fail "缺少 docker compose"

  local files=(-f docker-compose.yml)
  if [ "$db" = "mysql" ]; then
    files+=(-f docker-compose.mysql.yml)
  fi

  info "构建测试镜像 (STANDARD, 构建期内置 go test)"
  compose "${files[@]}" build

  if [ "$db" = "mysql" ]; then
    info "启动测试环境 (masdoor + MySQL 8)"
  else
    info "启动测试环境 (masdoor + SQLite)"
  fi
  compose "${files[@]}" up -d

  wait_healthy "http://localhost:${BACKEND_PORT}/api/health" "masdoor" 90 || {
    warn "启动失败，最近日志："
    compose "${files[@]}" logs --tail 30 masdoor || true
    exit 1
  }
  verify_endpoints "http://localhost:${BACKEND_PORT}"

  info "测试环境就绪: http://localhost:${BACKEND_PORT}"
  if [ "$db" = "mysql" ]; then
    info "MySQL:        127.0.0.1:${DB_PORT:-3306} (root/123456)"
  else
    info "SQLite 数据:  masdoor-data 卷 (容器内 /data/masdoor.db)"
  fi
  info "停止:         ./dev.sh down    日志: ./dev.sh logs"
}

cmd_smoke() {
  need docker

  info "构建冒烟镜像 (ALLINONE, SQLite, 构建期内置 go test)"
  docker build --target ALLINONE -t "$SMOKE_IMAGE" .

  info "启动冒烟容器 (端口 $SMOKE_PORT)"
  docker rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true
  docker run -d --name "$SMOKE_NAME" -p "${SMOKE_PORT}:8000" "$SMOKE_IMAGE" >/dev/null

  wait_healthy "http://localhost:${SMOKE_PORT}/api/health" "masdoor" 60 || {
    warn "启动失败，最近日志："
    docker logs --tail 30 "$SMOKE_NAME" || true
    exit 1
  }
  verify_endpoints "http://localhost:${SMOKE_PORT}"

  info "冒烟通过: http://localhost:${SMOKE_PORT}"
  info "停止: ./dev.sh down    查看日志: docker logs -f $SMOKE_NAME"
}

cmd_down() {
  need docker
  compose_all down --remove-orphans 2>/dev/null || true
  docker rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true
  info "已停止 test/smoke 环境"
}

cmd_logs() {
  need docker
  compose_all logs -f masdoor
}

cmd_clean() {
  need docker
  compose_all down -v --remove-orphans 2>/dev/null || true
  docker rm -f "$SMOKE_NAME" >/dev/null 2>&1 || true
  docker rmi "$SMOKE_IMAGE" >/dev/null 2>&1 || true
  rm -rf web/build web/build-temp data "$DEV_LOG"
  rm -f masdoor-dev.db masdoor-dev.db-shm masdoor-dev.db-wal   # 旧版 dev 库残留
  info "已清理容器、数据卷、冒烟镜像与本地构建产物"
}

case "${1:-}" in
  dev)   cmd_dev ;;
  test)  cmd_test "${2:-sqlite}" ;;
  smoke) cmd_smoke ;;
  down)  cmd_down ;;
  logs)  cmd_logs ;;
  clean) cmd_clean ;;
  *)
    sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
