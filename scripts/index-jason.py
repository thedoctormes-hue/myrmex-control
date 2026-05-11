#!/usr/bin/env python3
"""
Jason Indexer v2 — полная индексация артефактов и бэклога лаборатории.
Индексирует: проекты, серверы, агенты, задачи, инциденты, скиллы, хуки, знания.
"""

import json
import os
import re
import subprocess
from datetime import datetime, timezone

MYRMEX_PATH = os.path.join(os.path.dirname(__file__), '..', 'myrmex.json')
PROJECTS_PATH = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'projects.json')
LAB_ROOT = os.path.join(os.path.dirname(__file__), '..', '..', '..')
QWEN_ROOT = os.path.expanduser('~/.qwen')
QWEN_LOCAL = os.path.join(LAB_ROOT, '.qwen')

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
    try:
        result = subprocess.run(
            ['systemctl', 'list-units', '--type=service', '--state=running', '--no-pager', '--plain'],
            capture_output=True, text=True, timeout=5
        )
        return [line.split()[0].replace('.service', '') for line in result.stdout.strip().split('\n')
                if len(line.split()) >= 4 and line.split()[0].endswith('.service')]
    except:
        return []

# ─── PROJECTS ───

def index_projects(state, projects_data):
    type_icons = {
        'telegram-bot': '🤖', 'cli-system': '⚙️', 'content-system': '📝',
        'api': '🔌', 'infrastructure': '🏗️', 'landing-page': '🌐',
        'blog': '📰', 'dashboard': '📊', 'devtools': '🔧',
        'saas': '☁️', 'telegram-bot-generator': '🏭', 'docs': '📄',
    }
    type_colors = {
        'telegram-bot': '#3b82f6', 'cli-system': '#6366f1', 'content-system': '#f59e0b',
        'api': '#22c55e', 'infrastructure': '#ef4444', 'landing-page': '#8b5cf6',
        'blog': '#ec4899', 'dashboard': '#06b6d4', 'devtools': '#f97316',
        'saas': '#14b8a6', 'telegram-bot-generator': '#a855f7', 'docs': '#6b7280',
    }
    existing_ids = {p['id'] for p in state['projects']}
    added = 0
    for proj in projects_data.get('projects', []):
        if proj['name'] in ('myrmex-command',):
            continue
        proj_id = f"proj-{proj['name']}"
        if proj_id in existing_ids:
            continue
        state['projects'].append({
            'id': proj_id, 'name': proj['name'],
            'description': proj.get('description', ''),
            'color': type_colors.get(proj['type'], '#6b7280'),
            'icon': type_icons.get(proj['type'], '📦'),
            'status': 'active', 'created_at': now(), 'updated_at': now(),
        })
        added += 1
    return added

# ─── SERVERS ───

def index_servers(state):
    servers = [
        {'id': 'srv-warsaw', 'name': 'Warsaw', 'host': '185.199.108.153', 'port': 22,
         'status': 'online', 'services': ['xray', 'nginx', 'myrmex-control'],
         'last_check': now(), 'meta': {'location': 'Poland', 'provider': 'Hetzner'}},
        {'id': 'srv-florida', 'name': 'Florida', 'host': '45.33.32.156', 'port': 22,
         'status': 'online', 'services': ['xray', 'nginx', 'openclawbox'],
         'last_check': now(), 'meta': {'location': 'USA', 'provider': 'Linode'}},
        {'id': 'srv-rf', 'name': 'RF Proxy', 'host': '89.169.4.51', 'port': 22,
         'status': 'online', 'services': ['vpn-rf-proxy'],
         'last_check': now(), 'meta': {'location': 'Russia', 'provider': 'Yandex Cloud'}},
    ]
    existing_ids = {s['id'] for s in state['servers']}
    added = 0
    for srv in servers:
        if srv['id'] not in existing_ids:
            state['servers'].append(srv)
            added += 1
    return added

# ─── AGENTS ───

def index_agents(state, running_services):
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
        is_running = svc_name in running_services
        state['agents'].append({
            'id': agent_id, 'name': info['name'], 'role': info['role'],
            'model': info['model'], 'status': 'working' if is_running else 'idle',
            'project_id': None, 'current_task_id': None, 'last_seen': now(),
            'config': {'service': svc_name},
        })
        added += 1
    return added

# ─── TASKS FROM BACKLOG ───

def index_tasks(state, projects_data):
    """Индексировать задачи: эпики проектов + инциденты + бэклог."""
    # Очищаем мусор
    state['tasks'] = [t for t in state['tasks'] if not any(
        test in t['title'].lower() for test in ['probe', 'тест', 'хуй', 'секс', 'привет', 'проверка синхронизации']
    )]

    existing_titles = {t['title'] for t in state['tasks']}
    added = 0
    priority_map = {0: 'critical', 1: 'high', 2: 'medium', 3: 'low'}

    # Эпики проектов
    for proj in projects_data.get('projects', []):
        if proj['name'] in ('myrmex-command',):
            continue
        proj_id = f"proj-{proj['name']}"
        prio = priority_map.get(proj.get('priority', 2), 'medium')
        title = f"[{proj['type']}] {proj['name']}"
        if title not in existing_titles:
            state['tasks'].append({
                'id': f"task-epic-{proj['name']}", 'project_id': proj_id,
                'title': title, 'description': proj.get('description', f'Проект {proj["name"]}'),
                'status': 'backlog', 'priority': prio, 'assignee_id': None,
                'parent_id': None, 'dependencies': [], 'tags': [proj['type']],
                'created_at': now(), 'updated_at': now(), 'completed_at': None,
            })
            existing_titles.add(title)
            added += 1

    # Задачи из инцидентов (открытые)
    incidents_path = os.path.join(LAB_ROOT, 'INCIDENTS.md')
    if os.path.exists(incidents_path):
        with open(incidents_path) as f:
            content = f.read()
        # Парсим инциденты со статусом "В работе"
        incident_blocks = re.split(r'\n---\n', content)
        for block in incident_blocks:
            if '**Статус:** В работе' in block or '**СтATУС:** В работе' in block:
                title_match = re.search(r'\*\*Описание:\*\*\s*\n(.+)', block)
                severity_match = re.search(r'\*\*SEVERITY:\*\*\s*(\w+)', block)
                if title_match:
                    title = f"[INCIDENT] {title_match.group(1).strip()[:80]}"
                    if title not in existing_titles:
                        severity = severity_match.group(1).lower() if severity_match else 'medium'
                        prio = {'critical': 'critical', 'high': 'high'}.get(severity, 'medium')
                        state['tasks'].append({
                            'id': f"task-inc-{hash(title) % 100000}",
                            'project_id': None, 'title': title,
                            'description': block[:200], 'status': 'todo',
                            'priority': prio, 'assignee_id': None,
                            'parent_id': None, 'dependencies': [], 'tags': ['incident'],
                            'created_at': now(), 'updated_at': now(), 'completed_at': None,
                        })
                        existing_titles.add(title)
                        added += 1

    return added

# ─── LIBRARY: SKILLS ───

def index_skills(state):
    skills_dir = os.path.join(QWEN_ROOT, 'skills')
    if not os.path.exists(skills_dir):
        return 0
    existing_names = {l['name'] for l in state['library']}
    added = 0
    for skill_name in os.listdir(skills_dir):
        skill_path = os.path.join(skills_dir, skill_name, 'SKILL.md')
        if not os.path.exists(skill_path):
            continue
        name = f"Скилл: {skill_name}"
        if name in existing_names:
            continue
        with open(skill_path) as f:
            content = f.read()
        # Извлекаем description из frontmatter
        desc_match = re.search(r'description:\s*["\']?(.+?)["\']?\s*\n', content)
        description = desc_match.group(1)[:100] if desc_match else ''
        state['library'].append({
            'id': f"lib-skill-{skill_name}", 'type': 'skill',
            'name': name, 'description': description,
            'content': content[:500], 'file_path': f'.qwen/skills/{skill_name}/SKILL.md',
            'tags': ['skill', skill_name],
            'created_at': now(), 'updated_at': now(),
        })
        existing_names.add(name)
        added += 1
    return added

# ─── LIBRARY: HOOKS ───

def index_hooks(state):
    hooks_dir = os.path.join(QWEN_ROOT, 'hooks')
    if not os.path.exists(hooks_dir):
        return 0
    existing_names = {l['name'] for l in state['library']}
    added = 0
    for hook_name in os.listdir(hooks_dir):
        if not hook_name.endswith('.sh'):
            continue
        hook_path = os.path.join(hooks_dir, hook_name)
        name = f"Хук: {hook_name}"
        if name in existing_names:
            continue
        with open(hook_path) as f:
            content = f.read()
        state['library'].append({
            'id': f"lib-hook-{hook_name.replace('.sh', '')}", 'type': 'hook',
            'name': name, 'description': content[:100],
            'content': content[:500], 'file_path': f'.qwen/hooks/{hook_name}',
            'tags': ['hook', hook_name.replace('.sh', '')],
            'created_at': now(), 'updated_at': now(),
        })
        existing_names.add(name)
        added += 1
    return added

# ─── LIBRARY: EMPLOYEE CARDS ───

def index_employees(state):
    agents_dir = os.path.join(QWEN_ROOT, 'agents')
    if not os.path.exists(agents_dir):
        return 0
    existing_names = {l['name'] for l in state['library']}
    added = 0
    for agent_name in os.listdir(agents_dir):
        if not agent_name.endswith('.md'):
            continue
        agent_path = os.path.join(agents_dir, agent_name)
        name = f"Сотрудник: {agent_name.replace('.md', '')}"
        if name in existing_names:
            continue
        with open(agent_path) as f:
            content = f.read()
        state['library'].append({
            'id': f"lib-emp-{agent_name.replace('.md', '')}", 'type': 'card',
            'name': name, 'description': content[:100],
            'content': content[:500], 'file_path': f'.qwen/agents/{agent_name}',
            'tags': ['employee', 'card'],
            'created_at': now(), 'updated_at': now(),
        })
        existing_names.add(name)
        added += 1
    return added

# ─── LIBRARY: KNOWLEDGE (memory, research) ───

def index_knowledge(state):
    """Индексировать знания: memory/, docs/design/archive/, QWEN.md, ARTIFACTS.md."""
    existing_names = {l['name'] for l in state['library']}
    added = 0

    # Memory files
    memory_dir = os.path.join(QWEN_ROOT, 'projects', '-root-LabDoctorM', 'memory')
    if os.path.exists(memory_dir):
        for fname in os.listdir(memory_dir):
            if not fname.endswith('.md') or fname == 'MEMORY.md':
                continue
            name = f"Память: {fname.replace('.md', '')}"
            if name in existing_names:
                continue
            fpath = os.path.join(memory_dir, fname)
            with open(fpath) as f:
                content = f.read()
            state['library'].append({
                'id': f"lib-mem-{fname.replace('.md', '')}", 'type': 'knowledge',
                'name': name, 'description': content[:100],
                'content': content[:500], 'file_path': f'.qwen/projects/-root-LabDoctorM/memory/{fname}',
                'tags': ['memory', 'knowledge'],
                'created_at': now(), 'updated_at': now(),
            })
            existing_names.add(name)
            added += 1

    # Kanban research (archive)
    archive_dir = os.path.join(os.path.dirname(__file__), '..', 'docs', 'design', 'archive')
    if os.path.exists(archive_dir):
        for fname in os.listdir(archive_dir):
            if not fname.endswith('.md'):
                continue
            name = f"Исследование: {fname.replace('.md', '').replace('kanban-', '')}"
            if name in existing_names:
                continue
            fpath = os.path.join(archive_dir, fname)
            with open(fpath) as f:
                content = f.read()
            state['library'].append({
                'id': f"lib-kanban-{fname.replace('.md', '')}", 'type': 'knowledge',
                'name': name, 'description': content[:100],
                'content': content[:500], 'file_path': f'docs/design/archive/{fname}',
                'tags': ['kanban', 'research', 'design'],
                'created_at': now(), 'updated_at': now(),
            })
            existing_names.add(name)
            added += 1

    # Key lab documents
    key_docs = [
        ('QWEN.md', 'Конфигурация QWEN', 'config'),
        ('ARTIFACTS.md', 'Артефакты лаборатории', 'knowledge'),
        ('INCIDENTS.md', 'Журнал инцидентов', 'knowledge'),
        ('projects.json', 'Проекты лаборатории', 'config'),
    ]
    for fname, desc, tag in key_docs:
        fpath = os.path.join(LAB_ROOT, fname)
        if not os.path.exists(fpath):
            continue
        name = f"Документ: {fname}"
        if name in existing_names:
            continue
        with open(fpath) as f:
            content = f.read()
        state['library'].append({
            'id': f"lib-doc-{fname.replace('.', '-')}", 'type': 'knowledge',
            'name': name, 'description': desc,
            'content': content[:500], 'file_path': fname,
            'tags': ['lab', tag],
            'created_at': now(), 'updated_at': now(),
        })
        existing_names.add(name)
        added += 1

    return added

# ─── MAIN ───

def main():
    print("🗺️  Jason Indexer v2 — полная индексация лаборатории...")

    state = read_json(MYRMEX_PATH)
    projects_data = read_json(PROJECTS_PATH)
    running_services = get_running_services()
    print(f"   Запущенных сервисов: {len(running_services)}")

    n_proj = index_projects(state, projects_data)
    n_srv = index_servers(state)
    n_agents = index_agents(state, running_services)
    n_tasks = index_tasks(state, projects_data)
    n_skills = index_skills(state)
    n_hooks = index_hooks(state)
    n_emp = index_employees(state)
    n_know = index_knowledge(state)

    # Обновляем мету
    state['_meta']['last_updated'] = now()
    state['_meta']['last_updated_by'] = 'jason-indexer-v2'
    state['_meta']['change_count'] += 1
    state['workspace']['name'] = 'ЗавЛаб — Лаборатория Безумного Доктора'
    state['workspace']['description'] = (
        f'{len(state["projects"])} проектов · {len(state["agents"])} агентов · '
        f'{len(state["servers"])} серверов · {len(state["tasks"])} задач · '
        f'{len(state["library"])} артефактов'
    )

    write_json(MYRMEX_PATH, state)

    print(f"   ✅ Проекты:  +{n_proj}  (всего: {len(state['projects'])})")
    print(f"   ✅ Серверы:  +{n_srv}  (всего: {len(state['servers'])})")
    print(f"   ✅ Агенты:   +{n_agents}  (всего: {len(state['agents'])})")
    print(f"   ✅ Задачи:   +{n_tasks}  (всего: {len(state['tasks'])})")
    print(f"   ✅ Скиллы:   +{n_skills}  (всего: {sum(1 for l in state['library'] if l['type']=='skill')})")
    print(f"   ✅ Хуки:     +{n_hooks}  (всего: {sum(1 for l in state['library'] if l['type']=='hook')})")
    print(f"   ✅ Сотрудники: +{n_emp}  (всего: {sum(1 for l in state['library'] if l['type']=='card')})")
    print(f"   ✅ Знания:   +{n_know}  (всего: {sum(1 for l in state['library'] if l['type']=='knowledge')})")
    print(f"   📊 Библиотека всего: {len(state['library'])}")
    print(f"   📊 Changelog: {len(state['changelog'])} записей")
    print(f"\n🗺️  Ясон полностью проиндексирован!")

if __name__ == '__main__':
    main()
