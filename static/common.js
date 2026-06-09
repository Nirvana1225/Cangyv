/**
 * Cangyv 前端共享工具库
 * API调用、主题切换、导航、时间格式化等
 */

// ── API 配置 ──
const API_BASE = window.location.origin;

// ── API 调用封装 ──
async function api(path, options = {}) {
    const url = `${API_BASE}${path}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const config = { ...options, headers };
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
    warm:  { bg:'#fdf6f0', card:'rgba(255,255,255,0.75)', cardSolid:'#fff', text:'#4a3728', muted:'#8b7355', accent:'#c08b72', accentLight:'rgba(192,139,114,0.12)', border:'rgba(160,128,96,0.15)', shadow:'rgba(160,128,96,0.08)', inputBg:'rgba(255,255,255,0.6)' },
    blue:  { bg:'#f0f4f8', card:'rgba(255,255,255,0.8)', cardSolid:'#fff', text:'#2d3748', muted:'#718096', accent:'#5b8fb9', accentLight:'rgba(91,143,185,0.12)', border:'rgba(91,143,185,0.15)', shadow:'rgba(91,143,185,0.08)', inputBg:'rgba(255,255,255,0.6)' },
    rose:  { bg:'#fdf0f4', card:'rgba(255,255,255,0.8)', cardSolid:'#fff', text:'#5a3040', muted:'#a07080', accent:'#d4849a', accentLight:'rgba(212,132,154,0.12)', border:'rgba(212,132,154,0.15)', shadow:'rgba(212,132,154,0.08)', inputBg:'rgba(255,255,255,0.6)' },
    dark:  { bg:'#1a1a2e', card:'rgba(40,40,60,0.85)', cardSolid:'#282844', text:'#e0e0e8', muted:'#8888aa', accent:'#7c6cf0', accentLight:'rgba(124,108,240,0.15)', border:'rgba(124,108,240,0.2)', shadow:'rgba(0,0,0,0.3)', inputBg:'rgba(40,40,60,0.6)' },
};

function applyTheme(name) {
    const t = THEMES[name] || THEMES.warm;
    const root = document.documentElement;
    Object.entries(t).forEach(([k, v]) => root.style.setProperty(`--${k}`, v));
    localStorage.setItem('cangyv-theme', name);
    document.body.className = `theme-${name}`;
}

function initTheme() {
    const saved = localStorage.getItem('cangyv-theme') || 'warm';
    applyTheme(saved);
}

function cycleTheme() {
    const names = Object.keys(THEMES);
    const current = localStorage.getItem('cangyv-theme') || 'warm';
    const idx = names.indexOf(current);
    applyTheme(names[(idx + 1) % names.length]);
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
    return d.toLocaleDateString('zh-CN', { month:'short', day:'numeric' });
}

function formatDateTime(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('zh-CN', { year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
}

function formatDate(isoStr) {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    return d.toLocaleDateString('zh-CN', { month:'long', day:'numeric', weekday:'short' });
}

// ── DOM 工具 ──
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(msg, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ── 导航栏 ──
function renderNav(activePage) {
    const pages = [
        { path: '/', label: '记忆', icon: '🧠', id: 'index' },
        { path: '/chat', label: '聊天', icon: '💬', id: 'chat' },
        { path: '/diary', label: '日记', icon: '📖', id: 'diary' },
        { path: '/ecg', label: '心电图', icon: '💓', id: 'ecg' },
        { path: '/reader', label: '共读', icon: '📚', id: 'reader' },
        { path: '/cinema', label: '陪看', icon: '🎬', id: 'cinema' },
        { path: '/pet', label: '桌宠', icon: '🐱', id: 'pet' },
        { path: '/panel', label: '面板', icon: '⚙️', id: 'panel' },
    ];
    return `<nav class="main-nav">
        <div class="nav-brand" onclick="location.href='/'">苍聿居</div>
        <div class="nav-links">
            ${pages.map(p => `<a href="${p.path}" class="nav-link ${activePage === p.id ? 'active' : ''}">${p.icon}<span class="nav-label">${p.label}</span></a>`).join('')}
        </div>
        <button class="nav-theme" onclick="cycleTheme()" title="切换主题">🎨</button>
    </nav>`;
}

// ── 全局 CSS ──
const GLOBAL_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
:root{--bg:#fdf6f0;--card:rgba(255,255,255,0.75);--cardSolid:#fff;--text:#4a3728;--muted:#8b7355;--accent:#c08b72;--accentLight:rgba(192,139,114,0.12);--border:rgba(160,128,96,0.15);--shadow:rgba(160,128,96,0.08);--inputBg:rgba(255,255,255,0.6);--radius:12px;--radius-lg:16px;--nav-h:56px}
html{font-size:16px;-webkit-text-size-adjust:100%}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;padding-top:var(--nav-h);transition:background .3s,color .3s}
a{color:var(--accent);text-decoration:none}
button{cursor:pointer;font-family:inherit;border:none;background:none;color:inherit}
input,textarea,select{font-family:inherit;font-size:inherit;color:var(--text);background:var(--inputBg);border:1px solid var(--border);border-radius:var(--radius);padding:10px 14px;outline:none;transition:border .2s}
input:focus,textarea:focus{border-color:var(--accent)}
textarea{resize:vertical;min-height:80px}

/* 导航栏 */
.main-nav{position:fixed;top:0;left:0;right:0;height:var(--nav-h);background:var(--card);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 16px;z-index:1000;gap:8px}
.nav-brand{font-size:1.15rem;font-weight:700;color:var(--accent);cursor:pointer;white-space:nowrap}
.nav-links{display:flex;gap:2px;flex:1;justify-content:center;overflow-x:auto;scrollbar-width:none}
.nav-links::-webkit-scrollbar{display:none}
.nav-link{display:flex;align-items:center;gap:4px;padding:6px 12px;border-radius:var(--radius);font-size:.875rem;color:var(--muted);transition:all .2s;white-space:nowrap}
.nav-link:hover{background:var(--accentLight);color:var(--accent)}
.nav-link.active{background:var(--accentLight);color:var(--accent);font-weight:600}
.nav-theme{font-size:1.1rem;padding:6px 8px;border-radius:var(--radius);transition:background .2s}
.nav-theme:hover{background:var(--accentLight)}

/* 卡片 */
.card{background:var(--card);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px;transition:box-shadow .2s,transform .15s}
.card:hover{box-shadow:0 4px 20px var(--shadow)}

/* 按钮 */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 18px;border-radius:var(--radius);font-size:.875rem;font-weight:500;transition:all .2s;cursor:pointer}
.btn-primary{background:var(--accent);color:#fff}
.btn-primary:hover{opacity:.9;transform:translateY(-1px)}
.btn-ghost{background:var(--accentLight);color:var(--accent)}
.btn-ghost:hover{background:var(--accent);color:#fff}
.btn-sm{padding:5px 12px;font-size:.8rem}
.btn-danger{background:#e74c3c;color:#fff}
.btn-danger:hover{opacity:.9}

/* 布局 */
.container{max-width:900px;margin:0 auto;padding:16px}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.flex-between{display:flex;justify-content:space-between;align-items:center}
.flex-center{display:flex;align-items:center;justify-content:center}
.flex-col{display:flex;flex-direction:column}
.gap-8{gap:8px}.gap-12{gap:12px}.gap-16{gap:16px}

/* 标签 */
.tag{display:inline-block;padding:3px 10px;border-radius:20px;font-size:.75rem;background:var(--accentLight);color:var(--accent);font-weight:500}

/* Toast */
.toast{position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(20px);padding:10px 24px;border-radius:var(--radius);font-size:.875rem;z-index:9999;opacity:0;transition:all .3s;pointer-events:none}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.toast-info{background:var(--accent);color:#fff}
.toast-error{background:#e74c3c;color:#fff}
.toast-success{background:#27ae60;color:#fff}

/* 模态框 */
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.4);backdrop-filter:blur(4px);z-index:2000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s;pointer-events:none}
.modal-overlay.active{opacity:1;pointer-events:auto}
.modal{background:var(--cardSolid);border-radius:var(--radius-lg);padding:24px;width:90%;max-width:520px;max-height:85vh;overflow-y:auto;transform:scale(.95);transition:transform .2s}
.modal-overlay.active .modal{transform:scale(1)}
.modal h2{margin-bottom:16px;font-size:1.2rem}
.modal-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:20px}

/* 加载 */
.spinner{width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.skeleton{background:linear-gradient(90deg,var(--border) 25%,var(--accentLight) 50%,var(--border) 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:var(--radius)}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* 空状态 */
.empty-state{text-align:center;padding:60px 20px;color:var(--muted)}
.empty-state .icon{font-size:3rem;margin-bottom:12px}

/* 响应式 */
@media(max-width:768px){
    .nav-label{display:none}
    .nav-link{padding:6px 8px;font-size:1rem}
    .grid-2{grid-template-columns:1fr}
    .container{padding:12px}
    .modal{width:95%;padding:18px}
}
@media(min-width:769px){
    .mobile-only{display:none!important}
}
@media(max-width:768px){
    .desktop-only{display:none!important}
}
`;

// ── 初始化 ──
document.addEventListener('DOMContentLoaded', initTheme);
