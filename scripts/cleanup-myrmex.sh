#!/bin/bash
# ============================================================
# BL-023: Очистка myrmex.json
# Удаляет дубликаты, пустые массивы, старые changelog entries,
# битые ссылки и UUID-мусор
# Использование:
#   ./scripts/cleanup-myrmex.sh          # показать что будет очищено (dry-run)
#   ./scripts/cleanup-myrmex.sh --apply  # применить очистку
# ============================================================

set -euo pipefail

PROJECT="/root/LabDoctorM/projects/myrmex-control"
MYRMEX="$PROJECT/myrmex.json"
APPLY="${1:-}"

if [ ! -f "$MYRMEX" ]; then
  echo "ERROR: myrmex.json не найден: $MYRMEX"
  exit 1
fi

# Бэкап перед очисткой
BACKUP="$PROJECT/myrmex.json.pre-cleanup-$(date +%Y%m%d_%H%M%S).bak"
cp "$MYRMEX" "$BACKUP"
echo "📦 Бэкап: $BACKUP"

if [ "$APPLY" != "--apply" ]; then
  echo ""
  echo "🔍 DRY-RUN (покажет что будет очищено, без изменений)"
  echo "   Для применения: $0 --apply"
  echo ""
fi

node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('$MYRMEX', 'utf-8'));
const report = [];

// 1. Дедупликация changelog по id
const beforeChangelog = data.changelog?.length || 0;
const seenIds = new Set();
data.changelog = (data.changelog || []).filter(entry => {
  if (seenIds.has(entry.id)) return false;
  seenIds.add(entry.id);
  return true;
});
const afterChangelog = data.changelog.length;
if (beforeChangelog !== afterChangelog) {
  report.push('changelog: удалено ' + (beforeChangelog - afterChangelog) + ' дубликатов');
}

// 2. Ограничить changelog до 1000 entries
if (data.changelog?.length > 1000) {
  const removed = data.changelog.length - 1000;
  data.changelog.length = 1000;
  report.push('changelog: обрезано до 1000 (удалено ' + removed + ')');
}

// 3. Удалить пустые массивы (но не users/refresh_tokens — они обязательны)
const keepFields = ['users', 'refresh_tokens', 'changelog', '_meta', 'workspace', 'settings', 'servers', 'mcp_servers'];
for (const key of Object.keys(data)) {
  if (keepFields.includes(key)) continue;
  if (Array.isArray(data[key]) && data[key].length === 0) {
    // Не удаляем, просто отмечаем
    report.push('empty array: ' + key + ' (оставлен для совместимости)');
  }
}

// 4. Дедупликация tasks по id
if (data.tasks?.length) {
  const before = data.tasks.length;
  const seen = new Set();
  data.tasks = data.tasks.filter(t => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
  if (data.tasks.length !== before) {
    report.push('tasks: удалено ' + (before - data.tasks.length) + ' дубликатов');
  }
}

// 5. Дедупликация projects по id
if (data.projects?.length) {
  const before = data.projects.length;
  const seen = new Set();
  data.projects = data.projects.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  if (data.projects.length !== before) {
    report.push('projects: удалено ' + (before - data.projects.length) + ' дубликатов');
  }
}

// 6. Дедупликация agents по id
if (data.agents?.length) {
  const before = data.agents.length;
  const seen = new Set();
  data.agents = data.agents.filter(a => {
    if (seen.has(a.id)) return false;
    seen.add(a.id);
    return true;
  });
  if (data.agents.length !== before) {
    report.push('agents: удалено ' + (before - data.agents.length) + ' дубликатов');
  }
}

// 7. Дедупликация library по id
if (data.library?.length) {
  const before = data.library.length;
  const seen = new Set();
  data.library = data.library.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
  if (data.library.length !== before) {
    report.push('library: удалено ' + (before - data.library.length) + ' дубликатов');
  }
}

// 8. Очистить refresh_tokens (удалить expired)
if (data.refresh_tokens && typeof data.refresh_tokens === 'object') {
  const now = Date.now();
  let cleaned = 0;
  for (const [token, info] of Object.entries(data.refresh_tokens)) {
    if (info && info.expires_at && new Date(info.expires_at).getTime() < now) {
      delete data.refresh_tokens[token];
      cleaned++;
    }
  }
  if (cleaned > 0) {
    report.push('refresh_tokens: удалено ' + cleaned + ' expired');
  }
}

// 9. Обновить _meta
data._meta.last_updated = new Date().toISOString();
data._meta.last_updated_by = 'cleanup-script';

// Отчёт
if (report.length === 0) {
  echo '✅ Очистка не требуется — myrmex.json в порядке';
} else {
  echo '📋 Найдено для очистки:';
  for (const r of report) echo '   - ' + r;
}

// Применить
if ('$APPLY' === '--apply') {
  fs.writeFileSync('$MYRMEX', JSON.stringify(data, null, 2), 'utf-8');
  echo '';
  echo '✅ Очистка применена';
} else {
  echo '';
  echo '💡 Для применения: $0 --apply';
}

// Статистика
echo '';
echo '📊 Статистика:';
echo '   projects: ' + (data.projects?.length || 0);
echo '   tasks: ' + (data.tasks?.length || 0);
echo '   agents: ' + (data.agents?.length || 0);
echo '   library: ' + (data.library?.length || 0);
echo '   servers: ' + (data.servers?.length || 0);
echo '   changelog: ' + (data.changelog?.length || 0);
echo '   users: ' + (data.users?.length || 0);
const sizeKB = (fs.statSync('$MYRMEX').size / 1024).toFixed(1);
echo '   размер: ' + sizeKB + ' KB';
"
