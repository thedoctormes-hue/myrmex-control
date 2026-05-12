#!/bin/bash
# ============================================================
# Myrmex Demo — запуск демо-режима на отдельном порту
# Использует myrmex-demo.json через MYRMEX_FILE env
# ============================================================

set -euo pipefail

PROJECT_DIR="/root/LabDoctorM/projects/myrmex-control"
DEMO_PORT=3001

cd "$PROJECT_DIR"

echo "🐜 Myrmex Demo запускается на порту $DEMO_PORT..."

# MYRMEX_FILE переопределяет путь к файлу данных
MYRMEX_FILE="myrmex-demo.json" PORT=$DEMO_PORT node dist/server/index.js
