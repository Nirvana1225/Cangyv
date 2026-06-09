# Cangyv 前端重建实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 Cangyv 仓库中从零搭建与 The-Nirvana-s-Nest 网关后端完全兼容的前端，替换原有开源代码，适配移动端和电脑端。

**Architecture:** 纯前端 SPA（单文件 HTML/CSS/JS），通过 API 调用网关后端（https://mr-blinds-hose.zeabur.app）。前端部署在 Zeabur（cangyv.zeabur.app），使用 Flask 做轻量级静态文件服务。所有数据存储和 AI 逻辑都在网关后端完成。

**Tech Stack:** Python 3.11 + Flask（静态文件服务）、原生 HTML/CSS/JS（PWA）、SQLite（仅本地缓存）、网关后端 API

---

## 网关 API 端点清单（前端必须对接的）

### 认证
- `POST /api/v1/auth/register` — 注册用户 `{name: str}` → `{id, api_key, name}`
- `GET /api/v1/auth/me` — 获取当前用户（Header: X-API-Key）

### 记忆
- `POST /api/v1/memories` — 创建记忆 `{content, category?, tags?, importance?, mem_type?, session_key?}`
- `GET /api/v1/memories` — 列表 `?category=&status=&limit=&offset=`
- `GET /api/v1/memories/{id}` — 单条详情
- `PUT /api/v1/memories/{id}` — 更新 `{content?, category?, tags?, importance?, favorite?, archived?}`
- `DELETE /api/v1/memories/{id}` — 删除
- `POST /api/v1/memories/search` — 语义搜索 `{query, category?, limit?, min_similarity?}`
- `GET /api/v1/memories/unread` — 未读概览
- `GET /api/v1/memories/wakeup` — 主动唤醒（浮现记忆）
- `GET /api/v1/memories/float` — 随机漂浮（冷门记忆）
- `GET /api/v1/memories/{id}/mark-read` — 标记已读

### 评论
- `GET /api/v1/memories/{id}/comments` — 评论列表
- `POST /api/v1/memories/{id}/comments` — 添加评论 `{author, content, reply_to?}`

### 日记
- `GET /api/v1/diary` — 日记列表 `?limit=&offset=`
- `GET /api/v1/diary/{id}` — 日记详情
- `POST /api/v1/diary` — 手动写日记 `{content, mood?, is_private?}`
- `DELETE /api/v1/diary/{id}` — 删除日记
- `POST /api/v1/diary/{id}/toggle-privacy` — 切换公开/私密
- `POST /api/v1/diary/{id}/comments` — 日记评论
- `POST /api/v1/diary/unlock` — 解锁 `{password}`
- `POST /api/v1/diary/lock` — 上锁 `{password}`

### 心电图
- `POST /api/v1/ecg` — 提交评分 `{user_score, user_mood?, user_comment?}`
- `GET /api/v1/ecg` — 获取数据 `?days=`
- `POST /api/v1/ecg/auto-ai` — 自动生成AI评分

### 会话
- `POST /api/v1/sessions` — 创建/获取会话 `{session_key, title?}`
- `GET /api/v1/sessions` — 会话列表
- `GET /api/v1/sessions/{id}` — 会话详情
- `POST /api/v1/sessions/{id}/messages` — 添加消息 `{role, content}`
- `GET /api/v1/sessions/{id}/messages` — 消息列表
- `DELETE /api/v1/sessions/{id}` — 删除会话

### 上下文
- `POST /api/v1/context` — 构建上下文 `{session_key, query?, max_memories?, max_messages?}`

### 聊天
- `POST /api/v1/chat` — 聊天 `{session_key, message, include_memories?, max_memories?}`
- `POST /api/v1/chat/summarize` — 手动触发总结
- `GET /api/v1/chat/pending-count` — 待总结数量

### 画像
- `GET /api/v1/profile/cards` — 所有卡片
- `GET /api/v1/profile/cards/{key}` — 单张卡片
- `POST /api/v1/profile/cards` — 创建卡片 `{card_key, card_value}`
- `PUT /api/v1/profile/cards/{key}` — 更新卡片
- `DELETE /api/v1/profile/cards/{key}` — 删除卡片

### QQ
- `POST /api/v1/qq/sync` — 同步QQ消息
- `GET /api/v1/qq/history` — QQ聊天历史
- `GET /api/v1/qq/search` — 搜索QQ记录
- `GET /api/v1/qq/groups` — QQ群列表
- `GET /api/v1/qq/stats` — QQ统计

### 设备
- `POST /api/v1/device/report` — 推送设备数据
- `GET /api/v1/device/status` — 获取设备状态

### 桥接
- `ANY /api/v1/bridge/{path}` — NapCat桥接代理

### 苍聿居
- `GET/POST /api/v1/kico/state` — 阅读状态
- `POST /api/v1/kico/booklist` — 书架列表

### Agent
- `GET /api/v1/agent-status` — Agent状态
- `POST /api/v1/breathe` — 手动呼吸
- `POST /api/v1/trigger/diary` — 触发日记
- `POST /api/v1/trigger/cleanup` — 触发清理
- `POST /api/v1/trigger/tide` — 触发潮汐
- `POST /api/v1/trigger/chat-summarize` — 触发聊天总结

### 天气
- `GET /api/v1/weather?city=` — 天气代理

### Dashboard
- `GET /api/v1/dashboard` — 聚合摘要

### 模型路由
- `POST /v1/chat/completions` — OpenAI兼容聊天
- `GET /v1/models` — 模型列表
- `POST /v1/messages` — Anthropic兼容聊天

### MCP
- `POST /mcp` — JSON-RPC端点

### 终端
- `POST /api/v1/terminal/submit` — 提交终端任务
- `GET /api/v1/terminal/pending` — 轮询待执行任务
- `POST /api/v1/terminal/result/{id}` — 回写结果
- `GET /api/v1/terminal/history` — 执行历史

### DeployBot
- `GET /api/v1/deploybot/status` — 部署状态
- `GET /api/v1/deploybot/health` — 健康检查

---

## 文件结构

```
/workspace/Cangyv/
├── app.py                    # Flask 主应用（静态文件服务 + API代理）
├── config.py                 # 配置（网关URL、API Key等）
├── requirements.txt          # Python依赖
├── Dockerfile                # Docker构建
├── zeabur.yaml               # Zeabur部署配置
├── static/
│   ├── index.html            # 主入口（记忆库首页）
│   ├── chat.html             # 聊天界面
│   ├── diary.html            # 日记页面
│   ├── ecg.html              # 心电图页面
│   ├── panel.html            # 控制面板
│   ├── qq.html               # QQ桥接管理
│   ├── device.html           # 设备状态
│   ├── reader.html           # 苍聿居阅读器
│   ├── manifest.json         # PWA配置
│   ├── sw.js                 # Service Worker
│   └── common.js             # 共享工具函数（API调用、主题等）
├── public/                   # 静态资源（图标等）
└── docs/
    └── plans/
        └── 2026-06-09-cangyv-frontend-rebuild.md  # 本计划
```

---

## Task 1: 清理旧代码，创建新项目骨架

**Files:**
- Delete: `aion-chat/` (整个目录移至分支)
- Delete: `AionApp/` (Android应用)
- Delete: `AionPet/` (宠物动画)
- Delete: `Connor-Codex/` (Codex模块)
- Delete: `vendor/` (本地whl包)
- Delete: `main.py`, `cangyv_loader.py` (旧入口)
- Delete: `install.bat`, `一键启动.bat` 等 Windows 脚本
- Create: `app.py` (Flask主应用)
- Create: `config.py` (配置)
- Create: `requirements.txt` (新依赖)
- Modify: `Dockerfile` (新构建)
- Modify: `zeabur.yaml` (新配置)

- [ ] **Step 1: 创建 legacy 分支保存旧代码**

```bash
cd /workspace/Cangyv
git checkout -b legacy/aion-chat
git push origin legacy/aion-chat
git checkout main
```

- [ ] **Step 2: 删除旧代码目录**

```bash
cd /workspace/Cangyv
git rm -r aion-chat/ AionApp/ AionPet/ Connor-Codex/ vendor/
git rm main.py cangyv_loader.py install.bat 一键启动.bat 一键安装环境.bat 启动壁纸.bat 离线安装环境.bat 清理个人数据.bat
git rm -f 硅基流动语音合成.html Gemini\ CLI管线部署教程.md MCP娱乐室实现计划.md 局域网多端同步方案.md 朋友接入智能家居教程.md 给朋友的部署教程.md 无障碍截屏自动恢复说明.txt
```

- [ ] **Step 3: 创建 config.py**

```python
"""Cangyv 前端配置"""
import os

# 网关后端地址
GATEWAY_URL = os.environ.get("GATEWAY_URL", "https://mr-blinds-hose.zeabur.app")

# 默认 API Key
DEFAULT_API_KEY = os.environ.get("API_KEY", "3wT6QvRmPUuVDmzdSatIbscavsh5gfaU")

# Flask 端口
PORT = int(os.environ.get("PORT", 5050))

# 调试模式
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
```

- [ ] **Step 4: 创建 app.py（Flask主应用）**

```python
"""Cangyv — 前端静态服务 + API代理"""
from flask import Flask, send_from_directory, request, jsonify, Response
import requests
import os
from config import GATEWAY_URL, DEFAULT_API_KEY, PORT, DEBUG

app = Flask(__name__, static_folder="static", static_url_path="")

# ── 静态页面路由 ──
@app.route("/")
def index():
    return send_from_directory("static", "index.html")

@app.route("/chat")
def chat_page():
    return send_from_directory("static", "chat.html")

@app.route("/diary")
def diary_page():
    return send_from_directory("static", "diary.html")

@app.route("/ecg")
def ecg_page():
    return send_from_directory("static", "ecg.html")

@app.route("/panel")
def panel_page():
    return send_from_directory("static", "panel.html")

@app.route("/qq")
def qq_page():
    return send_from_directory("static", "qq.html")

@app.route("/device")
def device_page():
    return send_from_directory("static", "device.html")

@app.route("/reader")
def reader_page():
    return send_from_directory("static", "reader.html")

# ── API 代理 → 网关后端 ──
@app.route("/api/<path:path>", methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
def api_proxy(path):
    """将 /api/* 请求代理到网关后端"""
    target = f"{GATEWAY_URL}/api/{path}"
    headers = {k: v for k, v in request.headers if k.lower() != "host"}
    if "X-API-Key" not in headers:
        headers["X-API-Key"] = DEFAULT_API_KEY
    try:
        resp = requests.request(
            method=request.method,
            url=target,
            headers=headers,
            json=request.get_json(silent=True),
            params=request.args,
            timeout=30,
        )
        return Response(resp.content, status=resp.status_code,
                       content_type=resp.headers.get("Content-Type", "application/json"))
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── 模型路由代理 ──
@app.route("/v1/<path:path>", methods=["GET", "POST", "OPTIONS"])
def v1_proxy(path):
    """将 /v1/* 请求代理到网关后端"""
    target = f"{GATEWAY_URL}/v1/{path}"
    headers = {k: v for k, v in request.headers if k.lower() != "host"}
    if "X-API-Key" not in headers:
        headers["X-API-Key"] = DEFAULT_API_KEY
    try:
        resp = requests.request(
            method=request.method,
            url=target,
            headers=headers,
            json=request.get_json(silent=True),
            params=request.args,
            timeout=60,
        )
        return Response(resp.content, status=resp.status_code,
                       content_type=resp.headers.get("Content-Type", "application/json"))
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── MCP 代理 ──
@app.route("/mcp", methods=["POST"])
def mcp_proxy():
    target = f"{GATEWAY_URL}/mcp"
    headers = {k: v for k, v in request.headers if k.lower() != "host"}
    try:
        resp = requests.post(target, json=request.get_json(silent=True), headers=headers, timeout=30)
        return Response(resp.content, status=resp.status_code,
                       content_type=resp.headers.get("Content-Type", "application/json"))
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

# ── 健康检查 ──
@app.route("/health")
def health():
    return jsonify({"status": "ok", "service": "cangyv-frontend"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
```

- [ ] **Step 5: 创建 requirements.txt**

```
flask
requests
gunicorn
```

- [ ] **Step 6: 更新 Dockerfile**

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 5050
CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5050", "--workers", "2"]
```

- [ ] **Step 7: 更新 zeabur.yaml**

```yaml
name: Cangyv
services:
  - name: web
    run: gunicorn app:app --bind 0.0.0.0 --workers 2 --port $PORT
```

- [ ] **Step 8: 创建 static/ 目录和基础文件**

```bash
mkdir -p /workspace/Cangyv/static
```

- [ ] **Step 9: 提交**

```bash
cd /workspace/Cangyv
git add -A
git commit -m "refactor: 清理旧代码，创建新前端项目骨架"
```

---

## Task 2: 创建共享工具库 common.js

**Files:**
- Create: `static/common.js`

- [ ] **Step 1: 创建 common.js**

```javascript
/**
 * Cangyv 前端共享工具库
 * API调用、主题切换、时间格式化等
 */

// ── API 配置 ──
const API_BASE = window.location.origin;

// ── API 调用封装 ──
async function api(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const config = { headers, ...options };
    if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
    }
    const resp = await fetch(url, config);
    const contentType = resp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || data.message || `API错误 ${resp.status}`);
        return data;
    }
    if (!resp.ok) throw new Error(`API错误 ${resp.status}`);
    return resp.text();
}

function apiGet(path) { return api(path, { method: 'GET' }); }
function apiPost(path, body) { return api(path, { method: 'POST', body }); }
function apiPut(path, body) { return api(path, { method: 'PUT', body }); }
function apiDelete(path) { return api(path, { method: 'DELETE' }); }

// ── 主题系统 ──
const THEMES = {
    warm: { bg: '#fdf6f0', card: 'rgba(255,255,255,0.75)', text: '#4a3728', muted: '#8b7355', accent: '#c08b72', border: 'rgba(160,128,96,0.15)' },
    blue: { bg: '#f0f4f8', card: 'rgba(255,255,255,0.8)', text: '#2d3748', muted: '#718096', accent: '#5b8fb9', border: 'rgba(91,143,185,0.15)' },
    rose: { bg: '#fdf0f4', card: 'rgba(255,255,255,0.8)', text: '#5a3040', muted: '#a07080', accent: '#d4849a', border: 'rgba(212,132,154,0.15)' },
    dark: { bg: '#1a1a2e', card: 'rgba(40,40,60,0.8)', text: '#e0e0e0', muted: '#8888aa', accent: '#7c6cf0', border: 'rgba(124,108,240,0.2)' },
};

function applyTheme(name) {
    const t = THEMES[name] || THEMES.warm;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
    localStorage.setItem('cangyv-theme', name);
}

function initTheme() {
    const saved = localStorage.getItem('cangyv-theme') || 'warm';
    applyTheme(saved);
}

// ── 时间格式化 ──
function formatTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff/60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff/3600)}小时前`;
    if (diff < 604800) return `${Math.floor(diff/86400)}天前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// ── 工具函数 ──
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', initTheme);
```

---

## Task 3: 创建 PWA 配置

**Files:**
- Create: `static/manifest.json`
- Create: `static/sw.js`

- [ ] **Step 1: 创建 manifest.json**

```json
{
    "name": "苍聿居",
    "short_name": "苍聿居",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#fdf6f0",
    "theme_color": "#c08b72",
    "icons": [
        { "src": "/public/icon-192.png", "sizes": "192x192", "type": "image/png" },
        { "src": "/public/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
}
```

- [ ] **Step 2: 创建 sw.js**

```javascript
const CACHE_NAME = 'cangyv-v1';
const ASSETS = ['/', '/chat', '/diary', '/ecg', '/panel', '/common.js', '/manifest.json'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('/api/') || e.request.url.includes('/v1/')) return;
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(resp => {
        if (resp.ok && resp.type === 'basic') {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
    })));
});
```

---

## Task 4: 记忆库首页 index.html

**Files:**
- Create: `static/index.html`

这是主页面，展示记忆列表、搜索、分类筛选、新建记忆。

- [ ] **Step 1: 创建 index.html**

完整实现包括：
- 顶部导航栏（首页/聊天/日记/心电图/面板）
- 搜索框（语义搜索）
- 分类标签筛选
- 记忆卡片列表（无限滚动）
- 新建记忆弹窗
- 记忆详情弹窗（含评论）
- 响应式布局（移动端单列，桌面端双列）
- 主题切换按钮
- PWA注册

---

## Task 5: 聊天界面 chat.html

**Files:**
- Create: `static/chat.html`

- [ ] **Step 1: 创建 chat.html**

完整实现包括：
- 会话列表侧边栏（可折叠）
- 聊天气泡（左AI右用户）
- 消息输入框（支持发送、换行）
- 流式输出（SSE）
- 会话管理（新建/删除/重命名）
- 记忆召回指示器
- 响应式布局（移动端侧边栏抽屉式）

---

## Task 6: 日记页面 diary.html

**Files:**
- Create: `static/diary.html`

- [ ] **Step 1: 创建 diary.html**

完整实现包括：
- 日记时间线视图
- 写日记（富文本/纯文本）
- 日记详情（含评论）
- 苍聿锁（密码保护）
- 公开/私密切换
- 响应式布局

---

## Task 7: 心电图页面 ecg.html

**Files:**
- Create: `static/ecg.html`

- [ ] **Step 1: 创建 ecg.html**

完整实现包括：
- 双人情绪评分图表（Canvas绘制）
- 今日评分提交
- AI自动评分按钮
- 历史趋势
- 响应式布局

---

## Task 8: 控制面板 panel.html

**Files:**
- Create: `static/panel.html`

- [ ] **Step 1: 创建 panel.html**

完整实现包括：
- Agent状态监控
- 触发器控制（呼吸/日记/清理/潮汐）
- 设备状态（电量/通知）
- QQ桥接状态
- 天气信息
- Dashboard聚合数据
- DeployBot状态
- 响应式布局

---

## Task 9: QQ桥接页面 qq.html

**Files:**
- Create: `static/qq.html`

---

## Task 10: 设备状态页面 device.html

**Files:**
- Create: `static/device.html`

---

## Task 11: 苍聿居阅读器 reader.html

**Files:**
- Create: `static/reader.html`

---

## Task 12: 最终部署验证

- [ ] **Step 1: 本地测试所有页面**
- [ ] **Step 2: 验证API代理正常工作**
- [ ] **Step 3: 验证移动端适配**
- [ ] **Step 4: 推送代码并部署到Zeabur**
