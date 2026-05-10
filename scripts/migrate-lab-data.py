#!/usr/bin/env python3
"""
Myrmex Lab Data Migrator
========================
Мигрирует данные из старых источников в новый myrmex.json

Источники:
  - /root/LabDoctorM/projects.json     → projects
  - /root/LabDoctorM/INCIDENTS.md      → incidents
  - /root/LabDoctorM/myrmex.json       → changelog (сохраняем историю)

Итог:
  - /root/LabDoctorM/projects/myrmex-control/myrmex-migrated-draft.json

Запуск:
  python3 scripts/migrate-lab-data.py [--dry-run] [--verbose]
"""

import json
import re
import uuid
import sys
import os
from datetime import datetime, timezone
from pathlib import Path

# ============================================================
# Конфигурация путей
# ============================================================
LAB_ROOT = Path("/root/LabDoctorM")
PROJECTS_JSON = LAB_ROOT / "projects.json"
INCIDENTS_MD = LAB_ROOT / "INCIDENTS.md"
OLD_MYRMEX = LAB_ROOT / "projects/myrmex-control/myrmex.json"
OUTPUT = LAB_ROOT / "projects/myrmex-control/myrmex-migrated-draft.json"

# ============================================================
# Маппинг типов проектов → категории
# ============================================================
TYPE_TO_CATEGORY = {
    "cli-system": "cli",
    "content-system": "content",
    "telegram-bot": "telegram-bot",
    "api": "api",
    "devtools": "devtools",
    "infrastructure": "infrastructure",
    "landing-page": "landing",
    "blog": "blog",
    "dashboard": "dashboard",
    "saas": "saas",
    "telegram-bot-generator": "generator",
}

# ============================================================
# Справочник категорий
# ============================================================
CATEGORIES = [
    {"id": "cli", "name": "CLI System", "description": "Командная строка, системные утилиты", "icon": "⌨️", "color": "#6366f1"},
    {"id": "content", "name": "Content System", "description": "Контент-машины, блог, публикации", "icon": "📝", "color": "#8b5cf6"},
    {"id": "telegram-bot", "name": "Telegram Bot", "description": "Telegram боты и каналы", "icon": "🤖", "color": "#3b82f6"},
    {"id": "api", "name": "API", "description": "API сервисы и бэкенд", "icon": "🔌", "color": "#10b981"},
    {"id": "devtools", "name": "DevTools", "description": "Инструменты разработки", "icon": "🔧", "color": "#f59e0b"},
    {"id": "infrastructure", "name": "Infrastructure", "description": "Инфраструктура, мониторинг", "icon": "🏗️", "color": "#ef4444"},
    {"id": "landing", "name": "Landing Page", "description": "Лендинги и сайты", "icon": "🌐", "color": "#06b6d4"},
    {"id": "blog", "name": "Blog", "description": "Блоги и статьи", "icon": "📰", "color": "#ec4899"},
    {"id": "dashboard", "name": "Dashboard", "description": "Дашборды и панели управления", "icon": "📊", "color": "#14b8a6"},
    {"id": "saas", "name": "SaaS", "description": "SaaS платформы", "icon": "☁️", "color": "#f97316"},
    {"id": "generator", "name": "Generator", "description": "Генераторы и фабрики", "icon": "⚙️", "color": "#64748b"},
    {"id": "other", "name": "Other", "description": "Прочее", "icon": "📦", "color": "#9ca3af"},
]

# ============================================================
# Утилиты
# ============================================================
def gen_id(prefix: str = "item") -> str:
    """Генерирует короткий ID."""
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def now_iso() -> str:
    """Текущее время в ISO 8601."""
    return datetime.now(timezone.utc).isoformat()

def priority_to_int(priority: int) -> int:
    """Маппинг priority (0-3) из projects.json."""
    return max(0, min(3, priority))

# ============================================================
# Парсер INCIDENTS.md
# ============================================================
def parse_incidents_md(content: str) -> list[dict]:
    """
    Парсит инциденты из markdown формата INCIDENTS.md.
    Поддерживает два формата:
    1. Старый: ## 2026-05-06: Название
    2. Новый: ## INC-20260509161724 — название
    """
    incidents = []

    # Разбиваем на секции по ## (но не ###)
    sections = re.split(r'\n(?=## [^#])', content)

    for section in sections:
        if not section.strip():
            continue

        # Заголовок: ## 2026-05-06: Название или ## INC-xxx — Название
        title_match = re.match(r'## (.*?)(?:\n|$)', section)
        if not title_match:
            continue

        raw_title = title_match.group(1).strip()

        # Пропускаем заголовок документа
        if raw_title.startswith('# ') or 'Инциденты' in raw_title:
            continue

        incident = {
            "id": gen_id("inc"),
            "title": raw_title,
            "description": "",
            "severity": "medium",
            "status": "open",
            "reportedAt": now_iso(),
            "reportedBy": "system",
            "affectedProjects": [],
            "affectedServices": [],
            "rootCause": "",
            "resolution": "",
            "lessonsLearned": [],
        }

        # SEVERITY
        sev_match = re.search(r'\*\*SEVERITY:\*\*\s*(\w+)', section)
        if sev_match:
            sev = sev_match.group(1).lower()
            if "critical" in sev:
                incident["severity"] = "critical"
            elif "high" in sev:
                incident["severity"] = "high"
            elif "medium" in sev:
                incident["severity"] = "medium"
            elif "low" in sev:
                incident["severity"] = "low"

        # Статус
        status_match = re.search(r'\*\*Статус:\*\*\s*(.+)', section)
        if status_match:
            status_text = status_match.group(1).strip().lower()
            if "исправлено" in status_text or "resolved" in status_text:
                incident["status"] = "resolved"
            elif "в работе" in status_text or "investigating" in status_text:
                incident["status"] = "investigating"
            elif "закрыт" in status_text or "closed" in status_text:
                incident["status"] = "closed"
            elif "mitigated" in status_text:
                incident["status"] = "mitigated"

        # Ответственный
        resp_match = re.search(r'\*\*Ответственный:\*\*\s*(.+)', section)
        if resp_match:
            incident["reportedBy"] = resp_match.group(1).strip()

        # Описание (блок **Описание:**)
        desc_match = re.search(r'\*\*Описание:\*\*\s*\n([^\n#]+)', section)
        if desc_match:
            incident["description"] = desc_match.group(1).strip()

        # Root Cause
        rc_match = re.search(r'\*\*Причина:\*\*\s*\n?([^\n#]+)', section)
        if rc_match:
            incident["rootCause"] = rc_match.group(1).strip()

        # Resolution
        res_match = re.search(r'\*\*Действия:\*\*\s*\n([^\n#]+)', section)
        if res_match:
            incident["resolution"] = res_match.group(1).strip()

        # Lessons Learned
        ll_section = re.search(r'\*\*Вывод:\*\*\s*\n(.*?)(?=\n---|\n##|\Z)', section, re.DOTALL)
        if ll_section:
            lessons = [l.strip().lstrip('- ').strip()
                      for l in ll_section.group(1).split('\n')
                      if l.strip() and l.strip() != '-']
            incident["lessonsLearned"] = lessons

        # Дата из заголовка
        date_match = re.search(r'(\d{4}-\d{2}-\d{2})', raw_title)
        if date_match:
            try:
                dt = datetime.strptime(date_match.group(1), "%Y-%m-%d")
                dt = dt.replace(tzinfo=timezone.utc)
                incident["reportedAt"] = dt.isoformat()
            except ValueError:
                pass

        # Пропускаем тестовые инциденты
        if "test-service" in raw_title.lower() or "probe" in raw_title.lower():
            incident["_skip"] = True  # Маркер для пропуска

        incidents.append(incident)

    return incidents

# ============================================================
# Миграция projects.json → projects
# ============================================================
def migrate_projects(old_projects: list[dict]) -> list[dict]:
    """Мигрирует проекты из старого формата в новый."""
    projects = []

    for old in old_projects:
        category = TYPE_TO_CATEGORY.get(old.get("type", ""), "other")

        project = {
            "id": gen_id("proj"),
            "title": old.get("name", "Untitled"),
            "description": old.get("description", ""),
            "status": "active",  # Все старые проекты → active
            "category": category,
            "tags": [old.get("type", "unknown")] if old.get("type") else [],
            "priority": priority_to_int(old.get("priority", 1)),
            "path": old.get("path", ""),
            "url": old.get("url", ""),
            "port": old.get("port"),
            "service": old.get("service", ""),
            "channel": old.get("channel", ""),
            "integratesWith": old.get("integrates_with", []),
            "goals": [],
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }

        # Добавляем описание в tags если есть статус
        if old.get("status"):
            project["tags"].append(old["status"])

        projects.append(project)

    return projects

# ============================================================
# Миграция changelog из старого myrmex.json
# ============================================================
def migrate_changelog(old_data: dict) -> list[dict]:
    """Сохраняет changelog из старого myrmex.json, переименовывая ключи."""
    old_log = old_data.get("changelog", [])
    new_log = []

    for entry in old_log:
        new_entry = {
            "id": entry.get("id", gen_id("log")),
            "timestamp": entry.get("timestamp", now_iso()),
            "source": entry.get("source", "migration"),
            "action": entry.get("action", "create"),
            "entityType": entry.get("entity_type", "unknown"),
            "entityId": entry.get("entity_id", ""),
            "diff": entry.get("diff", {}),
        }
        new_log.append(new_entry)

    return new_log

# ============================================================
# Главная функция
# ============================================================
def migrate(dry_run: bool = False, verbose: bool = False) -> dict:
    """Выполняет миграцию данных."""

    print("=" * 60)
    print("🐜 Myrmex Lab Data Migrator")
    print("=" * 60)

    # Читаем источники
    print("\n📖 Чтение источников...")

    # projects.json
    with open(PROJECTS_JSON, "r", encoding="utf-8") as f:
        projects_data = json.load(f)
    old_projects = projects_data.get("projects", [])
    print(f"   projects.json: {len(old_projects)} проектов")

    # INCIDENTS.md
    with open(INCIDENTS_MD, "r", encoding="utf-8") as f:
        incidents_content = f.read()
    print(f"   INCIDENTS.md: {len(incidents_content)} символов")

    # Старый myrmex.json (для changelog)
    old_changelog = []
    if OLD_MYRMEX.exists():
        with open(OLD_MYRMEX, "r", encoding="utf-8") as f:
            old_myrmex = json.load(f)
        old_changelog = old_myrmex.get("changelog", [])
        print(f"   старый myrmex.json: {len(old_changelog)} записей changelog")

    # Мигрируем
    print("\n🔄 Миграция данных...")

    projects = migrate_projects(old_projects)
    print(f"   projects: {len(projects)} мигрировано")

    incidents = parse_incidents_md(incidents_content)
    # Фильтруем тестовые
    real_incidents = [i for i in incidents if not i.pop("_skip", False)]
    skipped = len(incidents) - len(real_incidents)
    print(f"   incidents: {len(real_incidents)} мигрировано ({skipped} тестовых пропущено)")

    changelog = migrate_changelog({"changelog": old_changelog})
    print(f"   changelog: {len(changelog)} записей сохранено")

    # Добавляем audit entry о миграции
    migration_audit = {
        "id": gen_id("audit"),
        "timestamp": now_iso(),
        "entityType": "system",
        "entityId": "migration",
        "action": "data_migration",
        "by": "migration-script",
        "details": f"Migrated {len(projects)} projects, {len(real_incidents)} incidents from legacy sources",
    }

    # Собираем итоговый myrmex.json
    result = {
        "_meta": {
            "version": datetime.now().strftime("%Y.%m.%d"),
            "schemaVersion": "1.0.0",
            "lastUpdated": now_iso(),
            "lastUpdatedBy": "migration-script",
            "changeCount": len(changelog),
        },
        "workspace": {
            "name": "ЗавЛаб — Лаборатория Безумного Доктора",
            "description": "Единый источник правды лаборатории",
            "owner": "eugene",
            "createdAt": now_iso(),
        },
        "categories": CATEGORIES,
        "projects": projects,
        "tasks": [],  # Задачи — пусто, будем создавать через UI
        "agents": [],  # Агенты — нужно заполнить вручную!
        "incidents": real_incidents,
        "skills": [],  # Скиллы — нужно заполнить вручную!
        "hooks": [],   # Хуки — нужно заполнить вручную!
        "servers": [],
        "changelog": changelog,
        "auditLog": [migration_audit],
        "settings": {
            "theme": "dark",
            "language": "ru",
            "refreshIntervalSec": 30,
            "notificationsEnabled": True,
            "custom": {},
        },
    }

    # Отчёт
    print("\n" + "=" * 60)
    print("📊 ОТЧЁТ О МИГРАЦИИ")
    print("=" * 60)
    print(f"  Проектов:    {len(projects)}")
    print(f"  Инцидентов:  {len(real_incidents)}")
    print(f"  Агентов:     0 ⚠️  НУЖНО ЗАПОЛНИТЬ ВРУЧНУЮ")
    print(f"  Скиллов:     0 ⚠️  НУЖНО ЗАПОЛНИТЬ ВРУЧНУЮ")
    print(f"  Хуков:       0 ⚠️  НУЖНО ЗАПОЛНИТЬ ВРУЧНУЮ")
    print(f"  Changelog:   {len(changelog)} записей")
    print(f"  Audit:       1 запись (миграция)")

    # Статистика по категориям
    cats = {}
    for p in projects:
        cat = p["category"]
        cats[cat] = cats.get(cat, 0) + 1
    print(f"\n  По категориям:")
    for cat, count in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"    {cat}: {count}")

    # Статистика по severity инцидентов
    sevs = {}
    for i in real_incidents:
        sev = i["severity"]
        sevs[sev] = sevs.get(sev, 0) + 1
    print(f"\n  По severity инцидентов:")
    for sev, count in sorted(sevs.items(), key=lambda x: -x[1]):
        print(f"    {sev}: {count}")

    # Предупреждения
    print(f"\n⚠️  ВНИМАНИЕ:")
    print(f"  1. Агенты (employees) НЕ мигрированы — нет источника на диске")
    print(f"  2. Скиллы и хуки НЕ мигрированы — нет источника на диске")
    print(f"  3. Демо-данные из старого myrmex.json УДАЛЕНЫ")
    print(f"  4. Проверь файл перед использованием: {OUTPUT}")

    if dry_run:
        print(f"\n🔍 DRY RUN — файл НЕ записан")
        return result

    # Записываем результат
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    size_kb = OUTPUT.stat().st_size / 1024
    print(f"\n✅ Результат записан: {OUTPUT} ({size_kb:.1f} KB)")
    print(f"\nСледующий шаг: отредактируй файл вручную (агенты, скиллы, хуки)")
    print(f"Затем: cp {OUTPUT} myrmex.json && npm run build && deploy")

    return result

# ============================================================
# Entry point
# ============================================================
if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    verbose = "--verbose" in sys.argv

    try:
        migrate(dry_run=dry_run, verbose=verbose)
    except Exception as e:
        print(f"\n❌ ОШИБКА: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
