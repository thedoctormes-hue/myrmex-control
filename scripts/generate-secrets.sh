#!/bin/bash
# ============================================================
# BL-017: Генерация секретов для Myrmex Control
# Использование:
#   ./scripts/generate-secrets.sh              # генерация в stdout
#   ./scripts/generate-secrets.sh --install    # установка в /etc/myrmex-control/env
# ============================================================

set -euo pipefail

ENV_FILE="/etc/myrmex-control/env"

generate_jwt_secret() {
  # 256-bit random hex
  openssl rand -hex 32
}

generate_setup_token() {
  openssl rand -hex 16
}

case "${1:-}" in
  --install)
    echo "🔐 Генерация секретов для Myrmex Control..."

    JWT_SECRET=$(generate_jwt_secret)
    SETUP_TOKEN=$(generate_setup_token)

    # Читаем CORS_ORIGIN из текущего .env или используем дефолт
    CORS_ORIGIN="https://myrmexcontrol.shtab-ai.ru"
    if [ -f ".env" ]; then
      ORIGIN_FROM_ENV=$(grep "^CORS_ORIGIN=" .env 2>/dev/null | head -1 | cut -d= -f2-)
      if [ -n "$ORIGIN_FROM_ENV" ]; then
        CORS_ORIGIN="$ORIGIN_FROM_ENV"
      fi
    fi

    # Читаем MYRMEX_PASSWORD из .env если есть
    MYRMEX_PASSWORD=""
    if [ -f ".env" ]; then
      PASS_FROM_ENV=$(grep "^MYRMEX_PASSWORD=" .env 2>/dev/null | head -1 | cut -d= -f2-)
      if [ -n "$PASS_FROM_ENV" ]; then
        MYRMEX_PASSWORD="$PASS_FROM_ENV"
      fi
    fi

    sudo mkdir -p /etc/myrmex-control
    sudo tee "$ENV_FILE" > /dev/null <<EOF
# Myrmex Control — Environment Configuration
# ⚠️ Этот файл содержит секреты. Права: 0600, владелец: root:root
# Сгенерировано: $(date -Iseconds)

JWT_SECRET=${JWT_SECRET}
SETUP_TOKEN=${SETUP_TOKEN}
CORS_ORIGIN=${CORS_ORIGIN}
MYRMEX_PASSWORD=${MYRMEX_PASSWORD}
NODE_ENV=production
PORT=3000
EOF

    sudo chmod 600 "$ENV_FILE"
    sudo chown root:root "$ENV_FILE"

    echo "✅ Секреты установлены в $ENV_FILE"
    echo "   Права: $(stat -c '%a %U:%G' "$ENV_FILE")"
    echo ""
    echo "📋 Для обновления systemd unit:"
    echo "   sudo systemctl edit myrmex-control.service"
    echo "   Добавить: EnvironmentFile=$ENV_FILE"
    ;;

  *)
    echo "# Сгенерируйте секреты и установите:"
    echo "#   ./scripts/generate-secrets.sh --install"
    echo ""
    echo "# Или скопируйте вручную в $ENV_FILE:"
    echo "JWT_SECRET=$(generate_jwt_secret)"
    echo "SETUP_TOKEN=$(generate_setup_token)"
    echo "CORS_ORIGIN=https://myrmexcontrol.shtab-ai.ru"
    echo "MYRMEX_PASSWORD="
    echo "NODE_ENV=production"
    echo "PORT=3000"
    ;;
esac
