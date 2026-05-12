#!/bin/bash
# ============================================================
# BL-024: Мониторинг и алертинг Myrmex Control
# Проверяет здоровье сервиса, диск, память, uptime
# Использование:
#   ./scripts/monitor.sh          # полная проверка + отчёт
#   ./scripts/monitor.sh --json   # вывод в JSON (для автоматизации)
#   ./scripts/monitor.sh --alert  # только алерты (exit 1 если проблемы)
# ============================================================

set -euo pipefail

PROJECT="/root/LabDoctorM/projects/myrmex-control"
MYRMEX="$PROJECT/myrmex.json"
SERVICE="myrmex-control"
PORT=3000
OUTPUT="${1:-}"

# Пороги алертов
DISK_THRESHOLD=90    # % заполнения диска
MEM_THRESHOLD=90     # % использования памяти
HEALTH_MIN=50        # минимальный health score
MAX_RESPONSE_MS=3000 # макс. время ответа API

# Цвета
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }
crit() { echo -e "${RED}❌${NC} $1"; }

declare -a ALERTS=()

# --- 1. Service health ---
check_service() {
  if systemctl is-active --quiet "$SERVICE"; then
    local uptime=$(systemctl show "$SERVICE" --property=ActiveEnterTimestamp --value 2>/dev/null | xargs -I{} date -d "{}" +%s 2>/dev/null || echo "0")
    local now=$(date +%s)
    local up_sec=$((now - uptime))
    local up_h=$((up_sec / 3600))
    ok "Service $SERVICE running (${up_h}h)"
    echo "$up_sec"
    return 0
  else
    crit "Service $SERVICE is DOWN"
    ALERTS+=("service_down")
    echo "0"
    return 1
  fi
}

# --- 2. API health check ---
check_api() {
  local start_ms=$(date +%s%N)
  local http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "http://localhost:$PORT/api/health" 2>/dev/null || echo "000")
  local end_ms=$(date +%s%N)
  local elapsed_ms=$(( (end_ms - start_ms) / 1000000 ))

  if [ "$http_code" = "200" ]; then
    if [ "$elapsed_ms" -lt "$MAX_RESPONSE_MS" ]; then
      ok "API /health: HTTP $http_code (${elapsed_ms}ms)"
    else
      warn "API /health: HTTP $http_code SLOW (${elapsed_ms}ms > ${MAX_RESPONSE_MS}ms)"
      ALERTS+=("api_slow")
    fi
  else
    crit "API /health: HTTP $http_code"
    ALERTS+=("api_error")
  fi

  echo "$elapsed_ms"
}

# --- 3. Health score ---
check_health_score() {
  local score_json=$(curl -s --max-time 5 "http://localhost:$PORT/api/health/score" 2>/dev/null || echo "{}")
  local score=$(echo "$score_json" | node -e "process.stdin.resume(); let d=''; process.stdin.on('data',c=>d+=c); process.stdin.on('end',()=>{try{console.log(JSON.parse(d).overall||'N/A')}catch(e){console.log('N/A')}})" 2>/dev/null || echo "N/A")

  if [ "$score" = "N/A" ] || [ -z "$score" ]; then
    warn "Health score: N/A (API error)"
    ALERTS+=("health_score_na")
  elif [ "$score" -lt "$HEALTH_MIN" ]; then
    crit "Health score: $score (min: $HEALTH_MIN)"
    ALERTS+=("health_score_low")
  else
    ok "Health score: $score/100"
  fi

  echo "$score"
}

# --- 4. Disk usage ---
check_disk() {
  local usage=$(df -h / | tail -1 | awk '{print $5}' | tr -d '%')
  if [ "$usage" -ge "$DISK_THRESHOLD" ]; then
    crit "Disk usage: ${usage}% (threshold: ${DISK_THRESHOLD}%)"
    ALERTS+=("disk_full")
  elif [ "$usage" -ge $((DISK_THRESHOLD - 10)) ]; then
    warn "Disk usage: ${usage}% (close to ${DISK_THRESHOLD}%)"
  else
    ok "Disk usage: ${usage}%"
  fi
}

# --- 5. Memory usage ---
check_memory() {
  local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2*100}')
  if [ "$usage" -ge "$MEM_THRESHOLD" ]; then
    crit "Memory usage: ${usage}% (threshold: ${MEM_THRESHOLD}%)"
    ALERTS+=("memory_high")
  elif [ "$usage" -ge $((MEM_THRESHOLD - 10)) ]; then
    warn "Memory usage: ${usage}% (close to ${MEM_THRESHOLD}%)"
  else
    ok "Memory usage: ${usage}%"
  fi
}

# --- 6. myrmex.json integrity ---
check_myrmex_integrity() {
  if [ ! -f "$MYRMEX" ]; then
    warn "myrmex.json not found"
    ALERTS+=("myrmex_missing")
    return 1
  fi

  if node -e "JSON.parse(require('fs').readFileSync('$MYRMEX','utf-8'))" 2>/dev/null; then
    local size_kb=$(du -k "$MYRMEX" | cut -f1)
    if [ "$size_kb" -gt 10240 ]; then
      warn "myrmex.json: ${size_kb}KB (large, consider cleanup)"
      ALERTS+=("myrmex_large")
    else
      ok "myrmex.json: valid JSON (${size_kb}KB)"
    fi
  else
    crit "myrmex.json: INVALID JSON"
    ALERTS+=("myrmex_invalid")
    return 1
  fi
}

# --- 7. Backup check ---
check_backup() {
  local backup_dir="/root/LabDoctorM/backups"
  if [ -d "$backup_dir" ]; then
    local latest=$(ls -t "$backup_dir"/myrmex-*.json 2>/dev/null | head -1)
    if [ -n "$latest" ]; then
      local age_hours=$(( ($(date +%s) - $(stat -c %Y "$latest")) / 3600 ))
      if [ "$age_hours" -gt 48 ]; then
        warn "Last backup: ${age_hours}h ago (>48h)"
        ALERTS+=("backup_stale")
      else
        ok "Last backup: ${age_hours}h ago"
      fi
    else
      warn "No backups found"
      ALERTS+=("no_backups")
    fi
  else
    warn "Backup directory not found"
  fi
}

# --- JSON output ---
json_output() {
  local service_up="${1}"
  local api_ms="${2}"
  local health="${3}"

  node -e "
const d = {
  timestamp: new Date().toISOString(),
  service: { name: '$SERVICE', running: $([ "$service_up" -gt 0 ] && echo true || echo false), uptime_sec: $service_up },
  api: { response_ms: $api_ms },
  health_score: '$health',
  alerts: ['${ALERTS[*]}'].filter(Boolean),
  status: '${#ALERTS[@]}' === 0 ? 'ok' : 'alert'
};
console.log(JSON.stringify(d, null, 2));
"
}

# --- Main ---
case "$OUTPUT" in
  --json)
    UP=$(check_service 2>/dev/null || echo "0")
    MS=$(check_api 2>/dev/null || echo "0")
    HS=$(check_health_score 2>/dev/null || echo "N/A")
    check_disk 2>/dev/null || true
    check_memory 2>/dev/null || true
    check_myrmex_integrity 2>/dev/null || true
    check_backup 2>/dev/null || true
    json_output "$UP" "$MS" "$HS"
    ;;

  --alert)
    check_service > /dev/null 2>&1 || true
    check_api > /dev/null 2>&1 || true
    check_health_score > /dev/null 2>&1 || true
    check_disk 2>/dev/null || true
    check_memory 2>/dev/null || true
    check_myrmex_integrity > /dev/null 2>&1 || true
    check_backup 2>/dev/null || true
    if [ ${#ALERTS[@]} -gt 0 ]; then
      echo "ALERTS: ${ALERTS[*]}"
      exit 1
    fi
    exit 0
    ;;

  *)
    echo "🔍 Myrmex Control Monitor — $(date '+%Y-%m-%d %H:%M:%S')"
    echo "================================================"
    echo ""
    echo "--- Service ---"
    check_service
    echo ""
    echo "--- API ---"
    check_api
    check_health_score
    echo ""
    echo "--- System ---"
    check_disk
    check_memory
    echo ""
    echo "--- Data ---"
    check_myrmex_integrity
    check_backup
    echo ""
    if [ ${#ALERTS[@]} -gt 0 ]; then
      echo "🚨 ALERTS: ${ALERTS[*]}"
      exit 1
    else
      echo "✅ All checks passed"
      exit 0
    fi
    ;;
esac
