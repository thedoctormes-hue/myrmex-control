#!/bin/bash
# ============================================================
# BL-021: Автоматизация деплоя Myrmex Control
# Использование:
#   ./scripts/deploy.sh              # полный деплой
#   ./scripts/deploy.sh --check-only # только проверки (smoke test)
#   ./scripts/deploy.sh --rollback   # откат к предыдущей версии
# ============================================================

set -euo pipefail

PROJECT="/root/LabDoctorM/projects/myrmex-control"
DEPLOY_DIR="/var/www/myrmexcontrol"
SERVER_DIST="$PROJECT/dist/server"
CLIENT_DIST="$PROJECT/dist/client"
NGINX_CONF="/etc/nginx/sites-enabled/myrmexcontrol"
BACKUP_DIR="/root/LabDoctorM/backups"
DATE=$(date +%Y%m%d_%H%M%S)
ROLLBACK_FILE="$BACKUP_DIR/rollback-$DATE.json"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# --- 0. Pre-deploy backup ---
pre_deploy_backup() {
  log "Pre-deploy бэкап..."
  if [ -f "$PROJECT/myrmex.json" ]; then
    mkdir -p "$BACKUP_DIR"
    cp "$PROJECT/myrmex.json" "$ROLLBACK_FILE"
    log "Rollback snapshot: $ROLLBACK_FILE"
  fi
  # Также используем backup.sh если доступен
  if [ -x "$PROJECT/scripts/backup.sh" ]; then
    "$PROJECT/scripts/backup.sh" --pre-deploy || true
  fi
}

# --- 1. Build ---
build() {
  log "Building..."
  cd "$PROJECT"
  npm run build 2>&1 || err "Build failed"
  log "Build OK"
}

# --- 2. Smoke test ---
smoke_test() {
  log "Smoke test..."

  # Проверяем что билд существует
  [ -d "$CLIENT_DIST" ] || err "Client dist not found"
  [ -f "$SERVER_DIST/index.js" ] || err "Server dist not found"

  # Проверяем синтаксис server bundle
  node --check "$SERVER_DIST/index.js" 2>&1 || err "Server bundle syntax error"

  # Быстрый запуск сервера на тестовом порту
  PORT=3099 NODE_ENV=test timeout 5 node "$SERVER_DIST/index.js" &
  SERVER_PID=$!
  sleep 2

  # Health check
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3099/api/health/score 2>/dev/null || echo "000")

  kill $SERVER_PID 2>/dev/null || true
  wait $SERVER_PID 2>/dev/null || true

  if [ "$HTTP_CODE" = "200" ]; then
    log "Smoke test OK (HTTP $HTTP_CODE)"
  else
    warn "Smoke test warning (HTTP $HTTP_CODE) — продолжить?"
  fi
}

# --- 3. Deploy client ---
deploy_client() {
  log "Deploying client to $DEPLOY_DIR..."
  mkdir -p "$DEPLOY_DIR"
  cp -r "$CLIENT_DIST/"* "$DEPLOY_DIR/"
  log "Client deployed"
}

# --- 4. Deploy server ---
deploy_server() {
  log "Deploying server..."
  cd "$PROJECT"
  if systemctl is-active --quiet myrmex-control; then
    systemctl restart myrmex-control
    sleep 2
    if systemctl is-active --quiet myrmex-control; then
      log "Service restarted OK"
    else
      err "Service failed to start — проверь journalctl -u myrmex-control"
    fi
  else
    warn "myrmex-control service not running — запускаю..."
    systemctl start myrmex-control || err "Failed to start service"
  fi
}

# --- 5. Nginx check ---
nginx_check() {
  log "Checking nginx..."
  if [ -f "$NGINX_CONF" ]; then
    nginx -t 2>&1 || err "Nginx config test failed"
    systemctl reload nginx
    log "Nginx reloaded"
  else
    warn "Nginx config not found: $NGINX_CONF — skip"
  fi
}

# --- 6. Post-deploy health ---
post_deploy_health() {
  log "Post-deploy health check..."
  sleep 3
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health/score 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Post-deploy health OK (HTTP $HTTP_CODE)"
  else
    err "❌ Post-deploy health FAILED (HTTP $HTTP_CODE) — rollback?"
  fi
}

# --- Rollback ---
rollback() {
  log "Rolling back..."
  LATEST_ROLLBACK=$(ls -t "$BACKUP_DIR"/rollback-*.json 2>/dev/null | head -1)
  if [ -z "$LATEST_ROLLBACK" ]; then
    err "Нет файла отката"
  fi
  cp "$LATEST_ROLLBACK" "$PROJECT/myrmex.json"
  log "Восстановлено: $LATEST_ROLLBACK"
  build
  deploy_server
  log "✅ Rollback завершён"
}

# --- Main ---
case "${1:-}" in
  --check-only)
    build
    smoke_test
    log "✅ Check-only завершён"
    ;;

  --rollback)
    rollback
    ;;

  *)
    pre_deploy_backup
    build
    smoke_test
    deploy_client
    deploy_server
    nginx_check
    post_deploy_health
    log "🚀 Деплой завершён успешно!"
    ;;
esac
