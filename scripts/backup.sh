#!/bin/bash
# ============================================================
# BL-016: Автоматический бэкап myrmex.json
# Использование:
#   ./scripts/backup.sh                    # обычный бэкап
#   ./scripts/backup.sh --pre-deploy       # бэкап перед деплоем
#   ./scripts/backup.sh --restore <file>  # восстановление
# ============================================================

set -euo pipefail

PROJECT="/root/LabDoctorM/projects/myrmex-control"
BACKUP_DIR="/root/LabDoctorM/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION=10

mkdir -p "$BACKUP_DIR"

case "${1:-}" in
  --restore)
    # Восстановление из бэкапа
    RESTORE_FILE="${2:-}"
    if [ -z "$RESTORE_FILE" ]; then
      echo "Доступные бэкапы:"
      ls -la "$BACKUP_DIR"/myrmex-*.json 2>/dev/null || echo "  (нет бэкапов)"
      echo ""
      echo "Использование: $0 --restore <file>"
      exit 1
    fi
    if [ ! -f "$RESTORE_FILE" ]; then
      echo "ERROR: файл не найден: $RESTORE_FILE"
      exit 1
    fi
    # Бэкап текущего перед восстановлением
    if [ -f "$PROJECT/myrmex.json" ]; then
      cp "$PROJECT/myrmex.json" "$BACKUP_DIR/myrmex-before-restore-$DATE.json"
    fi
    cp "$RESTORE_FILE" "$PROJECT/myrmex.json"
    echo "✅ Восстановлено из: $RESTORE_FILE"
    exit 0
    ;;

  --pre-deploy)
    # Бэкап перед деплоем
    BACKUP_FILE="$BACKUP_DIR/myrmex-pre-deploy-$DATE.json"
    if [ -f "$PROJECT/myrmex.json" ]; then
      cp "$PROJECT/myrmex.json" "$BACKUP_FILE"
      echo "✅ Pre-deploy бэкап: $BACKUP_FILE"
    else
      echo "⚠️ myrmex.json не найден, пропуск бэкапа"
    fi
    ;;

  *)
    # Обычный бэкап
    BACKUP_FILE="$BACKUP_DIR/myrmex-$DATE.json"
    if [ -f "$PROJECT/myrmex.json" ]; then
      cp "$PROJECT/myrmex.json" "$BACKUP_FILE"
      echo "✅ Бэкап: $BACKUP_FILE"
    else
      echo "⚠️ myrmex.json не найден"
      exit 1
    fi
    ;;
esac

# Ротация: хранить последние N бэкапов
ls -t "$BACKUP_DIR"/myrmex-*.json 2>/dev/null | tail -n +$((RETENTION + 1)) | xargs -r rm -f

# Показать статистику
BACKUP_COUNT=$(ls "$BACKUP_DIR"/myrmex-*.json 2>/dev/null | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo "📦 Бэкапов: $BACKUP_COUNT | Размер: $TOTAL_SIZE"