#!/usr/bin/env python3
"""
Jason Indexer — наполняет myrmex.json реальными данными лаборатории.
Индексирует: проекты, серверы, агенты, задачи из projects.json и системных сервисов.
"""

import json
import os
import subprocess
from datetime import datetime, timezone

MYRMEX_PATH = os.path.join(os.path.dirname(__file__), '..', 'myrmex.json')
PROJECTS_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'projects.json')

def now():
    return datetime.now(timezone.utc).isoformat()

def read_json(path):
    with open(path) as f:
        return json.load(f)

def write_json(path, data):
    tmp = path + '.tmp'
    with open(tmp, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.rename(tmp, path)

def get_running_services():
    """Получить список запущенных сервисов лаборатории."""
    try:
        result = subprocess.run(
            ['systemctl', 'list-units', '--type=service', '--state=running', '--no-pager', '--plain'],
            capture_output=True, text=True, timeout=5
        )
        services = []
        for line in result.stdout.strip().split('\n'):
            parts = line.split()
            if len(parts) >= 4 and parts[0].endswith('.service'):
                name = parts[0].replace('.service', '')
                services.append(name)
        return services
    except:
        return []

def index_projects(state, projects_data):
    """Индексировать проекты из projects.json."""
    type_icons = {
        'telegram-bot': '🤖',
        'cli-system': '⚙️',
        'content-system': '📝',
        'api': '🔌',
        'infrastructure': '🏗️',
        'landing-page': '🌐',
        'blog': '📰',
        'dashboard': '📊',
        'devtools': '🔧',
        'saas': '☁️',
        'telegram-bot-generator': '🏭',
        'docs': '📄',
    }

    type_colors = {
        'telegram-bot': '#3b82f6',
        'cli-system': '#6366f1',
        'content-system': '#f59e0b',
        'api': '#22c55e',
        'infrastructure': '#ef4444',
        'landing-page': '#8b5cf6',
        'blog': '#ec4899',
        'dashboard': '#06b6d4',
        'devtools': '#f97316',
        'saas': '#14b8a6',
        'telegram-bot-generator': '#a855f7',
        'docs': '#6b7280',
    }

    existing_ids = {p['id'] for p in state['projects']}
    added = 0

    for proj in projects_data.get('projects', []):
        # Пропускаем myrmex-control (это сам контрол)
        if proj['name'] == 'myrmex-command':
            continue

        proj_id = f"proj-{proj['name']}"
        if proj_id in existing_ids:
            continue

        p = {
            'id': proj_id,
            'name': proj['name'],
            'description': proj.get('description', ''),
            'color': type_colors.get(proj['type'], '#6b7280'),
            'icon': type_icons.get(proj['type'], '📦'),
            'status': 'active',
            'created_at': now(),
            'updated_at': now(),
        }
        state['projects'].append(p)
        added += 1

    return added

def index_servers(state):
    """Индексировать серверы лаборатории."""
    servers = [
        {
            'id': 'srv-warsaw',
            'name': 'Warsaw',
            'host': '185.199.108.153',
            'port': 22,
            'status': 'online',
            'services': ['xray', 'nginx', 'myrmex-control'],
            'last_check': now(),
            'meta': {'location': 'Poland', 'provider': 'Hetzner'},
        },
        {
            'id': 'srv-florida',
            'name': 'Florida',
            'host': '45.33.32.156',
            'port': 22,
            'status': 'online',
            'services': ['xray', 'nginx', 'openclawbox'],
            'last_check': now(),
            'meta': {'location': 'USA', 'provider': 'Linode'},
        },
        {
            'id': 'srv-rf',
            'name': 'RF Proxy',
            'host': '89.169.4.51',
            'port': 22,
            'status': 'online',
            'services': ['vpn-rf-proxy'],
            'last_check': now(),
            'meta': {'location': 'Russia', 'provider': 'Yandex Cloud'},
        },
    ]

    existing_ids = {s['id'] for s in state['servers']}
    added = 0
    for srv in servers:
        if srv['id'] not in existing_ids:
            state['servers'].append(srv)
            added += 1

    return added

def index_agents(state, running_services):
    """Индексировать агентов (Telegram-боты и системные сервисы)."""
    agent_map = {
        'kotolizator': {'name': 'Котолизатор', 'role': 'cli-bot', 'model': 'qwen-code'},
        'llmevangelist': {'name': 'LLM Евангелист', 'role': 'content-bot', 'model': 'openrouter'},
        'protocol-bot': {'name': 'Протокол', 'role': 'tg-bot', 'model': 'qwen-code'},
        'demonvpn-bot': {'name': 'VPN Демон', 'role': 'tg-bot', 'model': 'qwen-code'},
        'maildaemonrobot': {'name': 'Mail Демон', 'role': 'tg-bot', 'model': 'qwen-code'},
        'stenographerobot': {'name': 'Стенограф', 'role': 'ai-bot', 'model': 'whisper'},
    }

    existing_ids = {a['id'] for a in state['agents']}
    added = 0

    for svc_name, info in agent_map.items():
        agent_id = f"agent-{svc_name}"
        if agent_id in existing_ids:
            continue

        is_running = svc_name in running_services or f"{svc_name}.service" in running_services
        agent = {
            'id': agent_id,
            'name': info['name'],
            'role': info['role'],
            'model': info['model'],
            'status': 'working' if is_running else 'idle',
            'project_id': None,
            'current_task_id': None,
            'last_seen': now(),
            'config': {'service': svc_name},
        }
        state['agents'].append(agent)
        added += 1

    return added

def index_tasks(state, projects_data):
    """Индексировать бэклог задач из проектов."""
    # Очищаем тестовые задачи
    state['tasks'] = [t for t in state['tasks'] if not any(
        test in t['title'].lower() for test in ['probe', 'тест', 'хуй', 'секс', 'привет', 'проверка синхронизации']
    )]

    # Создаём задачи-эпики для каждого проекта
    existing_titles = {t['title'] for t in state['tasks']}
    added = 0

    priority_map = {0: 'critical', 1: 'high', 2: 'medium', 3: 'low'}

    for proj in projects_data.get('projects', []):
        if proj['name'] == 'myrmex-command':
            continue

        proj_id = f"proj-{proj['name']}"
        prio = priority_map.get(proj.get('priority', 2), 'medium')

        # Эпик проекта
        epic_title = f"[{proj['type']}] {proj['name']}"
        if epic_title not in existing_titles:
            task = {
                'id': f"task-epic-{proj['name']}",
                'project_id': proj_id,
                'title': epic_title,
                'description': proj.get('description', f'Проект {proj["name"]}'),
                'status': 'backlog',
                'priority': prio,
                'assignee_id': None,
                'parent_id': None,
                'dependencies': [],
                'tags': [proj['type']],
                'created_at': now(),
                'updated_at': now(),
                'completed_at': None,
            }
            state['tasks'].append(task)
            existing_titles.add(epic_title)
            added += 1

    return added

def index_library(state):
    """Индексировать артефакты библиотеки из docs/design/."""
    archive_path = os.path.join(os.path.dirname(__file__), '..', 'docs', 'design', 'archive')
    if not os.path.exists(archive_path):
        return 0

    existing_names = {l['name'] for l in state['library']}
    added = 0

    for fname in os.listdir(archive_path):
        if not fname.endswith('.md'):
            continue
        name = fname.replace('.md', '').replace('kanban-', '').replace('-', ' ').title()
        if name in existing_names:
            continue

        artifact = {
            'id': f"lib-{fname.replace('.md', '')}",
            'type': 'knowledge',
            'name': f"Исследование: {name}",
            'description': f'Артефакт из каскадного брейншторма ({fname})',
            'content': f'docs/design/archive/{fname}',
            'file_path': f'docs/design/archive/{fname}',
            'tags': ['kanban', 'research', 'design'],
            'created_at': now(),
            'updated_at': now(),
        }
        state['library'].append(artifact)
        existing_names.add(name)
        added += 1

    return added

def main():
    print("🗺️  Jason Indexer — индексация лаборатории...")
    
    state = read_json(MYRMEX_PATH)
    projects_data = read_json(PROJECTS_PATH)
    running_services = get_running_services()

    print(f"   Запущенных сервисов: {len(running_services)}")

    # Индексируем
    n_projects = index_projects(state, projects_data)
    n_servers = index_servers(state)
    n_agents = index_agents(state, running_services)
    n_tasks = index_tasks(state, projects_data)
    n_library = index_library(state)

    # Обновляем мету
    state['_meta']['last_updated'] = now()
    state['_meta']['last_updated_by'] = 'jason-indexer'
    state['_meta']['change_count'] += 1

    # Обновляем workspace
    state['workspace']['name'] = 'ЗавЛаб — Лаборатория Безумного Доктора'
    state['workspace']['description'] = f'{len(state["projects"])} проектов · {len(state["agents"])} агентов · {len(state["servers"])} серверов'

    write_json(MYRMEX_PATH, state)

    print(f"   ✅ Проекты: +{n_projects} (всего: {len(state['projects'])})")
    print(f"   ✅ Серверы: +{n_servers} (всего: {len(state['servers'])})")
    print(f"   ✅ Агенты: +{n_agents} (всего: {len(state['agents'])})")
    print(f"   ✅ Задачи: +{n_tasks} (всего: {len(state['tasks'])})")
    print(f"   ✅ Библиотека: +{n_library} (всего: {len(state['library'])})")
    print(f"   📊 Changelog: {len(state['changelog'])} записей")
    print(f"\n🗺️  Ясон проиндексирован!")

if __name__ == '__main__':
    main()
