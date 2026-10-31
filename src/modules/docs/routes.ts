import type { FastifyInstance } from 'fastify';

const BASE_URL = 'http://localhost:4501';

const page = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>teds-api — Docs</title>
<style>
:root {
  --bg: #0b0e1a;
  --panel: #131729;
  --panel2: #171c33;
  --border: #252b45;
  --text: #e8eaf3;
  --muted: #8891ab;
  --accent: #6c8bff;
  --accent2: #3ecf8e;
  --accent3: #b17cff;
  --red: #f87171;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body { height: 100%; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.hdr {
  height: 56px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
}
.brand { display: flex; align-items: center; gap: 9px; font-size: 15px; font-weight: 600; }
.brand-mark {
  width: 22px; height: 22px; border-radius: 7px;
  background: rgba(108, 139, 255, 0.16);
  border: 1px solid rgba(108, 139, 255, 0.35);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.hdr-chips { display: flex; align-items: center; gap: 8px; min-width: 0; }
.chip {
  display: inline-flex; align-items: center; gap: 6px;
  max-width: 100%;
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--panel2);
  color: var(--muted);
  font-size: 11px;
  white-space: nowrap;
}
.chip code { font: 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--text); }
.chip-k { font-size: 10px; letter-spacing: 0.06em; text-transform: uppercase; }

/* Shell */
.shell { flex: 1; display: flex; min-height: 0; position: relative; }
.mnav { display: flex; flex-shrink: 0; min-height: 0; }
.side {
  width: 240px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 20px 12px;
  background: var(--panel2);
  border-right: 1px solid var(--border);
}
.side-title { padding: 0 8px 12px; font-size: 15px; font-weight: 600; }
.side-group {
  padding: 12px 8px 4px;
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.tab {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 10px;
  margin-bottom: 2px;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: var(--muted);
  text-align: left;
  font: inherit;
  cursor: pointer;
}
.tab:hover { color: var(--text); background: var(--panel); }
.tab.active { color: var(--text); background: rgba(108, 139, 255, 0.14); border-color: rgba(108, 139, 255, 0.3); }
.tab-icon { flex-shrink: 0; width: 18px; margin-top: 1px; text-align: center; }
.tab-body { min-width: 0; flex: 1; }
.tab-label { display: block; font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tab-sub {
  display: block;
  margin-top: 2px;
  font: 11px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.tab.active .tab-label { color: var(--text); }
.tab.active .tab-sub { color: var(--muted); }

.mbar { display: none; }

/* Content */
.content { flex: 1; min-width: 0; overflow-y: auto; padding: 28px 24px 64px; }
.panel { display: none; }
.panel.active { display: block; }
.card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
}
.title-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.title-row h2 { margin: 0; font-size: 15px; font-weight: 600; }
.method {
  display: inline-block;
  padding: 1px 9px;
  border-radius: 999px;
  border: 1px solid;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.m-get { color: var(--accent2); background: rgba(62, 207, 142, 0.12); border-color: rgba(62, 207, 142, 0.3); }
.m-put { color: var(--accent3); background: rgba(177, 124, 255, 0.12); border-color: rgba(177, 124, 255, 0.3); }
.m-del { color: var(--red); background: rgba(248, 113, 113, 0.12); border-color: rgba(248, 113, 113, 0.3); }
.badge {
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
  color: var(--muted);
  font-size: 10px;
  letter-spacing: 0.04em;
}
.path { font: 12.5px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; color: var(--muted); }
.desc { margin: 10px 0 0; color: var(--muted); font-size: 13px; }
.desc code, .foot code, td code, p code {
  font: 12px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  color: var(--text);
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 5px;
  padding: 0 4px;
}
h3 { margin: 20px 0 8px; font-size: 12.5px; font-weight: 600; color: var(--text); }
h3:first-of-type { margin-top: 18px; }
h3 span.path { font-weight: 400; }

table { border-collapse: collapse; margin-top: 4px; }
th, td {
  border: 1px solid var(--border);
  padding: 5px 11px;
  font-size: 12.5px;
  text-align: left;
  vertical-align: top;
}
th { color: var(--muted); font-weight: 500; background: var(--panel2); }

.code { position: relative; margin-top: 6px; }
pre {
  margin: 0;
  padding: 11px 14px;
  padding-right: 78px;
  overflow-x: auto;
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 10px;
  color: #c9d1e8;
  font: 12px/1.65 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  white-space: pre;
}
.copy {
  position: absolute;
  top: 7px; right: 7px;
  padding: 2px 9px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--panel);
  color: var(--muted);
  font: 11px ui-sans-serif, system-ui, sans-serif;
  cursor: pointer;
}
.copy:hover { color: var(--text); border-color: var(--accent); }

.foot {
  margin-top: 18px;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: 14px;
  background: var(--panel);
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 767px) {
  .hdr { padding: 0 12px; }
  .hdr-chips .chip:first-child { display: none; }
  .shell { flex-direction: column; }
  .mnav { flex-direction: column; position: relative; z-index: 30; border-bottom: 1px solid var(--border); background: var(--panel2); }
  .side {
    display: none;
    position: absolute;
    top: 100%; left: 0; right: 0;
    width: auto;
    max-height: 45vh;
    border-right: 0;
    border-bottom: 1px solid var(--border);
    background: var(--panel);
    box-shadow: 0 16px 24px rgba(0, 0, 0, 0.35);
  }
  .side.open { display: block; }
  .mbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
  }
  .mbtn {
    flex: 1; min-width: 0;
    display: flex; align-items: center; gap: 8px;
    padding: 4px 8px;
    border: 0;
    background: none;
    color: var(--text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .mbtn-title { flex: 1; min-width: 0; font-size: 15px; font-weight: 600; }
  .mbtn-active { flex-shrink: 0; max-width: 50%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--muted); font-size: 12px; }
  .mbtn-caret { flex-shrink: 0; color: var(--muted); font-size: 12px; }
  .content { padding: 18px 14px 56px; }
}
</style>
</head>
<body>

<header class="hdr">
  <div class="brand"><span class="brand-mark">A</span> teds-api</div>
  <div class="hdr-chips">
    <span class="chip"><span class="chip-k">Base</span> <code>${BASE_URL}</code></span>
    <span class="chip"><span class="chip-k">Auth</span> <code>X-API-Key</code></span>
  </div>
</header>

<div class="shell">
  <div class="mnav">
    <div class="mbar">
      <button type="button" class="mbtn" id="mbtn">
        <span class="mbtn-title">API</span>
        <span class="mbtn-active" id="mactive">Health</span>
        <span class="mbtn-caret">▾</span>
      </button>
    </div>
    <aside class="side" id="side">
      <div class="side-title">API</div>
      <div class="side-group">Public</div>
      <button type="button" class="tab active" data-tab="health" data-label="Health">
        <span class="tab-icon">✚</span>
        <span class="tab-body"><span class="tab-label">Health</span><span class="tab-sub">GET /api/health</span></span>
      </button>
      <div class="side-group">Data</div>
      <button type="button" class="tab" data-tab="games" data-label="Free games">
        <span class="tab-icon">◫</span>
        <span class="tab-body"><span class="tab-label">Free games</span><span class="tab-sub">GET /api/fetch-free-games</span></span>
      </button>
      <button type="button" class="tab" data-tab="timeline" data-label="Timeline">
        <span class="tab-icon">◷</span>
        <span class="tab-body"><span class="tab-label">Timeline</span><span class="tab-sub">GET /api/timeline</span></span>
      </button>
      <div class="side-group">KV store</div>
      <button type="button" class="tab" data-tab="kv-list" data-label="KV list">
        <span class="tab-icon">≡</span>
        <span class="tab-body"><span class="tab-label">List keys</span><span class="tab-sub">GET /api/kv</span></span>
      </button>
      <button type="button" class="tab" data-tab="kv-get" data-label="KV get">
        <span class="tab-icon">↧</span>
        <span class="tab-body"><span class="tab-label">Read value</span><span class="tab-sub">GET /api/kv/:key</span></span>
      </button>
      <button type="button" class="tab" data-tab="kv-put" data-label="KV put">
        <span class="tab-icon">↥</span>
        <span class="tab-body"><span class="tab-label">Write value</span><span class="tab-sub">PUT /api/kv/:key</span></span>
      </button>
      <button type="button" class="tab" data-tab="kv-del" data-label="KV delete">
        <span class="tab-icon">⊗</span>
        <span class="tab-body"><span class="tab-label">Delete key</span><span class="tab-sub">DELETE /api/kv/:key</span></span>
      </button>
    </aside>
  </div>

  <main class="content">
    <section class="panel active" data-panel="health">
      <div class="card">
        <div class="title-row">
          <span class="method m-get">GET</span>
          <h2>Health</h2>
          <span class="path">/api/health</span>
          <span class="badge">PUBLIC</span>
        </div>
        <p class="desc">Kiểm tra service và kết nối KV. Route duy nhất không cần <code>X-API-Key</code>.</p>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl ${BASE_URL}/api/health</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>{"status":"ok","kv":"ok","time":"2026-10-22T00:00:00.000Z"}</pre></div>
        <p class="desc"><code>kv</code> là <code>"ok"</code> hoặc <code>"unavailable"</code> khi không đọc được bảng <code>kv_entries</code>.</p>
      </div>
    </section>

    <section class="panel" data-panel="games">
      <div class="card">
        <div class="title-row">
          <span class="method m-get">GET</span>
          <h2>Free games</h2>
          <span class="path">/api/fetch-free-games</span>
        </div>
        <p class="desc">Game đang miễn phí 100% trên Epic và Steam. Lỗi upstream trả <code>502 { error: { code: "upstream_failed" } }</code>.</p>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl -H "X-API-Key: &lt;API_KEY&gt;" ${BASE_URL}/api/fetch-free-games</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>{
  "epic": [{ "title": "...", "image": "...", "url": "...", "originalPrice": "0", "endDate": "...", "store": "epic" }],
  "steam": [{ "title": "...", "image": "...", "url": "...", "originalPrice": "0", "store": "steam" }],
  "errors": []
}</pre></div>
        <p class="desc">Một store lỗi vẫn trả <code>200</code> với mảng rỗng và mục tương ứng trong <code>errors</code>.</p>
      </div>
    </section>

    <section class="panel" data-panel="timeline">
      <div class="card">
        <div class="title-row">
          <span class="method m-get">GET</span>
          <h2>Timeline</h2>
          <span class="path">/api/timeline</span>
        </div>
        <p class="desc">Sự kiện timeline từ bảng <code>timeline_events</code>, sắp xếp tăng dần theo <code>solar_date</code>.</p>
        <h3>Query</h3>
        <table>
          <tr><th>Tham số</th><th>Mô tả</th></tr>
          <tr><td><code>category</code></td><td>Tùy chọn: <code>public-holiday</code>, <code>family</code> hoặc <code>due-dates</code>. Giá trị khác → <code>400 { error: { code: "invalid_query" } }</code>.</td></tr>
        </table>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl -H "X-API-Key: &lt;API_KEY&gt;" "${BASE_URL}/api/timeline?category=family"</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>{"events":[{"id":"...","name":"Tết","solar_date":"2026-02-17","lunar_date":"1/1","type":"lunar","icon":"...","note":"...","category":"public-holiday"}]}</pre></div>
      </div>
    </section>

    <section class="panel" data-panel="kv-list">
      <div class="card">
        <div class="title-row">
          <span class="method m-get">GET</span>
          <h2>List keys</h2>
          <span class="path">/api/kv</span>
        </div>
        <p class="desc">Liệt kê key trong KV store, có phân trang bằng cursor.</p>
        <h3>Query</h3>
        <table>
          <tr><th>Tham số</th><th>Mô tả</th></tr>
          <tr><td><code>prefix</code></td><td>Lọc key bắt đầu bằng prefix.</td></tr>
          <tr><td><code>limit</code></td><td>Mặc định 100, tối đa 1000.</td></tr>
          <tr><td><code>cursor</code></td><td>Phân trang: cursor lấy từ response trước.</td></tr>
        </table>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl -H "X-API-Key: &lt;API_KEY&gt;" "${BASE_URL}/api/kv?prefix=jobs/&amp;limit=50"</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>{"keys":[{"name":"jobs/42","expiration":1760000000}],"cursor":"jobs/42"}</pre></div>
        <p class="desc">Còn trang tiếp theo thì <code>cursor</code> là key cuối cùng; hết trang thì <code>null</code>. <code>expiration</code> là epoch giây hoặc <code>null</code>.</p>
      </div>
    </section>

    <section class="panel" data-panel="kv-get">
      <div class="card">
        <div class="title-row">
          <span class="method m-get">GET</span>
          <h2>Read value</h2>
          <span class="path">/api/kv/:key</span>
        </div>
        <p class="desc"><code>:key</code> có thể chứa dấu <code>/</code>. Không tồn tại → <code>404 { error: { code: "not_found" } }</code>.</p>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl -H "X-API-Key: &lt;API_KEY&gt;" ${BASE_URL}/api/kv/jobs/42</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>{"key":"jobs/42","value":{"status":"done"}}</pre></div>
      </div>
    </section>

    <section class="panel" data-panel="kv-put">
      <div class="card">
        <div class="title-row">
          <span class="method m-put">PUT</span>
          <h2>Write value</h2>
          <span class="path">/api/kv/:key</span>
        </div>
        <p class="desc">Ghi hoặc ghi đè giá trị. Body sai → <code>400 { error: { code: "invalid_body" } }</code>.</p>
        <h3>Body</h3>
        <table>
          <tr><th>Trường</th><th>Mô tả</th></tr>
          <tr><td><code>value</code></td><td>Bắt buộc, bất kỳ JSON value.</td></tr>
          <tr><td><code>expirationTtl</code></td><td>Tùy chọn, số giây ≥ 60.</td></tr>
        </table>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl -X PUT -H "X-API-Key: &lt;API_KEY&gt;" -H "Content-Type: application/json" \\
  -d '{"value":{"status":"done"},"expirationTtl":3600}' \\
  ${BASE_URL}/api/kv/jobs/42</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>{"key":"jobs/42","stored":true,"expirationTtl":3600}</pre></div>
      </div>
    </section>

    <section class="panel" data-panel="kv-del">
      <div class="card">
        <div class="title-row">
          <span class="method m-del">DELETE</span>
          <h2>Delete key</h2>
          <span class="path">/api/kv/:key</span>
        </div>
        <p class="desc">Xoá key khỏi KV store. Trả <code>204</code> không body.</p>
        <h3>Request</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>curl -X DELETE -H "X-API-Key: &lt;API_KEY&gt;" -i ${BASE_URL}/api/kv/jobs/42</pre></div>
        <h3>Response</h3>
        <div class="code"><button type="button" class="copy" data-copy>Copy</button><pre>HTTP/1.1 204 No Content</pre></div>
      </div>
    </section>

    <div class="foot">
      Lỗi chung: envelope <code>{ error: { code, message } }</code>. Route không tồn tại → <code>404 { error: { code: "NOT_FOUND" } }</code>.
      Thiếu hoặc sai <code>X-API-Key</code> → <code>401 { error: { code: "unauthorized" } }</code>.
    </div>
  </main>
</div>

<script>
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-tab]'));
  var panels = Array.prototype.slice.call(document.querySelectorAll('[data-panel]'));
  var side = document.getElementById('side');
  var mactive = document.getElementById('mactive');
  var mbtn = document.getElementById('mbtn');
  var content = document.querySelector('.content');

  function activate(name, label) {
    tabs.forEach(function (t) { t.classList.toggle('active', t.getAttribute('data-tab') === name); });
    panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === name); });
    if (label) mactive.textContent = label;
    side.classList.remove('open');
    content.scrollTop = 0;
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      activate(t.getAttribute('data-tab'), t.getAttribute('data-label'));
    });
  });

  mbtn.addEventListener('click', function () { side.classList.toggle('open'); });

  Array.prototype.slice.call(document.querySelectorAll('[data-copy]')).forEach(function (btn) {
    btn.addEventListener('click', function () {
      var pre = btn.parentNode.querySelector('pre');
      if (!pre || !navigator.clipboard) return;
      navigator.clipboard.writeText(pre.textContent).then(function () {
        var old = btn.textContent;
        btn.textContent = 'Đã copy';
        setTimeout(function () { btn.textContent = old; }, 1500);
      });
    });
  });
})();
</script>
</body>
</html>`;

export async function docsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, reply) => {
    return reply.type('text/html; charset=utf-8').send(page);
  });
}
