import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { MessageRepository } from './db.js';
import { OpsManager } from './ops.js';

export class DashboardServer {
  private server: http.Server | null = null;

  constructor(
    private db: MessageRepository,
    private ops: OpsManager,
    private port: number = 8788,
    private mediaDir: string = path.join(process.cwd(), 'data', 'media')
  ) {}

  public start(): void {
    if (this.server) return;

    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
      const pathname = url.pathname;

      // Enable CORS for localhost
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      try {
        // API Endpoints
        if (pathname === '/api/stats') {
          const telemetry = this.ops.getTelemetry();
          const dbStats = await this.db.getStats();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ telemetry, dbStats }));
          return;
        }

        if (pathname === '/api/messages') {
          const limit = parseInt(url.searchParams.get('limit') || '50', 10);
          const [rows] = await this.db.pool.query(
            `SELECT id, message_id, chat_jid AS jid, chat_jid, sender_jid, message_type, 
                    COALESCE(text_body, caption, '') AS content, media_path, 
                    (media_path IS NOT NULL) AS has_media, 
                    (revoked_at IS NOT NULL) AS is_deleted, created_at 
             FROM bot_messages ORDER BY id DESC LIMIT ?`,
            [limit]
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rows));
          return;
        }

        if (pathname === '/api/edits') {
          const limit = parseInt(url.searchParams.get('limit') || '50', 10);
          const [rows] = await this.db.pool.query(
            `SELECT id, message_id, chat_jid AS jid, sender_jid, 
                    original_text AS original_content, edited_text AS edited_content, 
                    created_at AS edited_at 
             FROM bot_edits 
             ORDER BY id DESC LIMIT ?`,
            [limit]
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rows));
          return;
        }

        if (pathname === '/api/audit') {
          const limit = parseInt(url.searchParams.get('limit') || '50', 10);
          const [rows] = await this.db.pool.query(
            `SELECT id, event_name, event_name AS action, 
                    COALESCE(actor_jid, jid, 'system') AS actor_jid, 
                    COALESCE(status, 'success') AS status, details, created_at 
             FROM bot_audit_log ORDER BY id DESC LIMIT ?`,
            [limit]
          );
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rows));
          return;
        }

        if (pathname === '/api/settings') {
          if (req.method === 'POST') {
            let body = '';
            for await (const chunk of req) body += chunk;
            const data = JSON.parse(body || '{}');
            if (data.key && data.value) {
              await this.db.setSetting(data.key, data.value);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
            return;
          }

          const [rows] = await this.db.pool.query(`SELECT setting_key, setting_value FROM bot_settings`);
          const settings: Record<string, string> = {};
          for (const r of rows as any[]) {
            settings[r.setting_key] = r.setting_value;
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(settings));
          return;
        }

        // Serve static media files securely
        if (pathname.startsWith('/media/')) {
          const fileName = path.basename(pathname.replace('/media/', ''));
          const filePath = path.join(this.mediaDir, fileName);

          if (fs.existsSync(filePath)) {
            const stream = fs.createReadStream(filePath);
            res.writeHead(200);
            stream.pipe(res);
            return;
          }
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Media not found');
          return;
        }

        // Single Page App UI (Material Design 3 Dark)
        if (pathname === '/' || pathname === '/index.html') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(this.renderHtml());
          return;
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } catch (err: any) {
        console.error('[DashboardServer] Error handling request:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });

    this.server.listen(this.port, '127.0.0.1', () => {
      console.log(`[Dashboard] Material Design 3 Web UI live at http://127.0.0.1:${this.port}`);
    });
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private renderHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BOT_404_V3 • Operations Command Center</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --md-sys-color-primary: #a8c7fa;
      --md-sys-color-on-primary: #04316a;
      --md-sys-color-surface: #121316;
      --md-sys-color-surface-container: #1b1c20;
      --md-sys-color-surface-container-high: #24252a;
      --md-sys-color-outline: #3a3b42;
      --md-sys-color-text: #e3e2e6;
      --md-sys-color-text-dim: #c4c6d0;
      --md-sys-color-accent: #7c4dff;
      --md-sys-color-danger: #ffb4ab;
      --md-sys-color-success: #6dd58c;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--md-sys-color-surface);
      color: var(--md-sys-color-text);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      line-height: 1.5;
    }
    header {
      background: var(--md-sys-color-surface-container);
      border-bottom: 1px solid var(--md-sys-color-outline);
      padding: 16px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-logo { font-size: 22px; }
    .brand-title { font-size: 18px; font-weight: 700; letter-spacing: 0.5px; }
    .badge {
      background: rgba(168, 199, 250, 0.15);
      color: var(--md-sys-color-primary);
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .grid-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }
    .card {
      background: var(--md-sys-color-surface-container);
      border: 1px solid var(--md-sys-color-outline);
      border-radius: 12px;
      padding: 20px;
    }
    .card-title {
      color: var(--md-sys-color-text-dim);
      font-size: 12px;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 26px;
      font-weight: 700;
      font-family: 'Roboto Mono', monospace;
      color: var(--md-sys-color-primary);
    }
    .card-sub { font-size: 12px; color: var(--md-sys-color-text-dim); margin-top: 4px; }
    .tabs {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--md-sys-color-outline);
      padding-bottom: 8px;
    }
    .tab-btn {
      background: transparent;
      border: none;
      color: var(--md-sys-color-text-dim);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .tab-btn.active {
      background: var(--md-sys-color-surface-container-high);
      color: var(--md-sys-color-primary);
    }
    .panel { display: none; }
    .panel.active { display: block; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    th {
      font-size: 12px;
      color: var(--md-sys-color-text-dim);
      font-weight: 600;
      background: var(--md-sys-color-surface-container-high);
    }
    tr:hover { background: rgba(255, 255, 255, 0.02); }
    .mono { font-family: 'Roboto Mono', monospace; font-size: 12px; }
    .diff-old { background: rgba(255, 80, 80, 0.15); color: #ff8080; padding: 2px 6px; border-radius: 4px; }
    .diff-new { background: rgba(80, 255, 120, 0.15); color: #80ff80; padding: 2px 6px; border-radius: 4px; }
    .toggle-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--md-sys-color-outline);
    }
    .btn {
      background: var(--md-sys-color-primary);
      color: var(--md-sys-color-on-primary);
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span class="brand-logo">🤖</span>
      <span class="brand-title">BOT_404_V3 Command Center</span>
      <span class="badge">OWNER: Rutaab</span>
    </div>
    <div id="live-indicator" class="badge" style="background: rgba(109, 213, 140, 0.15); color: var(--md-sys-color-success);">
      LIVE • REFRESHING
    </div>
  </header>

  <div class="container">
    <!-- Telemetry Cards -->
    <div class="grid-stats">
      <div class="card">
        <div class="card-title">Memory (RSS)</div>
        <div class="card-value" id="stat-ram">0 MB</div>
        <div class="card-sub" id="stat-heap">Heap: 0 MB / 512 MB</div>
      </div>
      <div class="card">
        <div class="card-title">System Uptime</div>
        <div class="card-value" id="stat-uptime">0h 0m</div>
        <div class="card-sub" id="stat-platform">-</div>
      </div>
      <div class="card">
        <div class="card-title">Total Messages Logged</div>
        <div class="card-value" id="stat-messages">0</div>
        <div class="card-sub" id="stat-media">0 Media files stored</div>
      </div>
      <div class="card">
        <div class="card-title">Edits Intercepted</div>
        <div class="card-value" id="stat-edits">0</div>
        <div class="card-sub" id="stat-db-size">DB Size: 0 MB</div>
      </div>
    </div>

    <!-- Navigation Tabs -->
    <div class="tabs">
      <button class="tab-btn active" onclick="switchTab('messages')">Messages Stream</button>
      <button class="tab-btn" onclick="switchTab('edits')">Anti-Edit Forensic Vault</button>
      <button class="tab-btn" onclick="switchTab('settings')">Security & Bot Toggles</button>
      <button class="tab-btn" onclick="switchTab('audit')">Audit Logs</button>
    </div>

    <!-- Panel 1: Message Stream -->
    <div id="panel-messages" class="panel active card">
      <h3>Live Message Feed (Latest 50)</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Chat (JID)</th>
            <th>Sender</th>
            <th>Type</th>
            <th>Content</th>
          </tr>
        </thead>
        <tbody id="messages-body">
          <tr><td colspan="5">Loading real-time records...</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Panel 2: Anti-Edit Diff Viewer -->
    <div id="panel-edits" class="panel card">
      <h3>Message Edit Interception Logs</h3>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Sender</th>
            <th>Original Content</th>
            <th>Edited Content</th>
          </tr>
        </thead>
        <tbody id="edits-body">
          <tr><td colspan="4">No edits intercepted yet.</td></tr>
        </tbody>
      </table>
    </div>

    <!-- Panel 3: Settings Toggles -->
    <div id="panel-settings" class="panel card">
      <h3>Forensic & Bot Automation Controls</h3>
      <div id="settings-container" style="margin-top: 16px;">
        <div class="toggle-row">
          <div>
            <strong>Anti-Delete Interception</strong>
            <div style="font-size: 12px; color: var(--md-sys-color-text-dim);">Recover revoked text and media directly to Rutaab's DM</div>
          </div>
          <button class="btn" id="btn-antidelete" onclick="toggleSetting('antidelete')">TOGGLE</button>
        </div>
        <div class="toggle-row">
          <div>
            <strong>Anti-Edit Forensics</strong>
            <div style="font-size: 12px; color: var(--md-sys-color-text-dim);">Detect modified messages and alert Rutaab with original diff</div>
          </div>
          <button class="btn" id="btn-antiedit" onclick="toggleSetting('antiedit')">TOGGLE</button>
        </div>
      </div>
    </div>

    <!-- Panel 4: Audit Logs -->
    <div id="panel-audit" class="panel card">
      <h3>Security & Execution Audit Trail</h3>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Status</th>
            <th>Metadata</th>
          </tr>
        </thead>
        <tbody id="audit-body">
          <tr><td colspan="5">Loading audit logs...</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    function switchTab(name) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('panel-' + name).classList.add('active');
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const data = await res.json();
        document.getElementById('stat-ram').textContent = data.telemetry.memoryRssMb + ' MB';
        document.getElementById('stat-heap').textContent = 'Heap: ' + data.telemetry.memoryHeapUsedMb + ' MB';
        document.getElementById('stat-uptime').textContent = data.telemetry.uptimeFormatted;
        document.getElementById('stat-platform').textContent = data.telemetry.platform;
        document.getElementById('stat-messages').textContent = data.dbStats.totalMessages.toLocaleString();
        document.getElementById('stat-media').textContent = data.dbStats.totalMedia.toLocaleString() + ' media stored';
        document.getElementById('stat-edits').textContent = data.dbStats.totalEdits.toLocaleString();
        document.getElementById('stat-db-size').textContent = 'DB Size: ' + data.dbStats.databaseSizeMb + ' MB';
      } catch (e) {}
    }

    async function fetchMessages() {
      try {
        const res = await fetch('/api/messages?limit=30');
        const list = await res.json();
        const tbody = document.getElementById('messages-body');
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5">No messages recorded yet.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(m => \`
          <tr>
            <td class="mono">\${new Date(m.created_at).toLocaleTimeString()}</td>
            <td class="mono">\${m.jid.replace('@s.whatsapp.net', '').replace('@g.us', ' [GRP]')}</td>
            <td class="mono">\${(m.sender_jid || '').replace('@s.whatsapp.net', '')}</td>
            <td><span class="badge">\${m.message_type}</span></td>
            <td>\${m.content ? escapeHtml(m.content).slice(0, 80) : (m.has_media ? '<em>[Media: ' + m.media_path + ']</em>' : '')}</td>
          </tr>
        \`).join('');
      } catch (e) {}
    }

    async function fetchEdits() {
      try {
        const res = await fetch('/api/edits?limit=30');
        const list = await res.json();
        const tbody = document.getElementById('edits-body');
        if (list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4">No edits captured yet.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(e => \`
          <tr>
            <td class="mono">\${new Date(e.edited_at).toLocaleTimeString()}</td>
            <td class="mono">\${(e.sender_jid || '').replace('@s.whatsapp.net', '')}</td>
            <td><span class="diff-old">\${escapeHtml(e.original_content || '')}</span></td>
            <td><span class="diff-new">\${escapeHtml(e.edited_content || '')}</span></td>
          </tr>
        \`).join('');
      } catch (e) {}
    }

    async function fetchAudit() {
      try {
        const res = await fetch('/api/audit?limit=30');
        const list = await res.json();
        const tbody = document.getElementById('audit-body');
        if (!Array.isArray(list) || list.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5">No audit entries yet.</td></tr>';
          return;
        }
        tbody.innerHTML = list.map(a => \`
          <tr>
            <td class="mono">\${new Date(a.created_at).toLocaleTimeString()}</td>
            <td><strong>\${escapeHtml(a.action || a.event_name || 'audit')}</strong></td>
            <td class="mono">\${escapeHtml(a.actor_jid || a.jid || 'system')}</td>
            <td><span class="badge" style="\${(a.status === 'success' || !a.status) ? 'color: var(--md-sys-color-success)' : 'color: var(--md-sys-color-danger)'}">\${escapeHtml(a.status || 'success')}</span></td>
            <td class="mono" style="font-size: 11px;">\${escapeHtml(JSON.stringify(a.details || {}).slice(0, 100))}</td>
          </tr>
        \`).join('');
      } catch (e) {}
    }

    let currentSettings = {};
    async function fetchSettings() {
      try {
        const res = await fetch('/api/settings');
        currentSettings = await res.json();
        updateButton('btn-antidelete', currentSettings.antidelete === 'on');
        updateButton('btn-antiedit', currentSettings.antiedit === 'on');
      } catch (e) {}
    }

    function updateButton(id, isOn) {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.textContent = isOn ? 'ENABLED (ON)' : 'DISABLED (OFF)';
      btn.style.background = isOn ? 'var(--md-sys-color-primary)' : 'var(--md-sys-color-surface-container-high)';
      btn.style.color = isOn ? 'var(--md-sys-color-on-primary)' : 'var(--md-sys-color-text-dim)';
    }

    async function toggleSetting(key) {
      try {
        const current = currentSettings[key] || 'off';
        const next = current === 'on' ? 'off' : 'on';
        const res = await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, value: next })
        });
        if (res.ok) {
          currentSettings[key] = next;
          updateButton('btn-' + key, next === 'on');
        }
      } catch (e) {
        alert('Failed to update setting: ' + e.message);
      }
    }

    function escapeHtml(text) {
      return (text || '').replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    fetchStats();
    fetchMessages();
    fetchEdits();
    fetchAudit();
    fetchSettings();
    setInterval(fetchStats, 5000);
    setInterval(fetchMessages, 10000);
    setInterval(fetchEdits, 10000);
    setInterval(fetchSettings, 10000);
  </script>
</body>
</html>`;
  }
}
