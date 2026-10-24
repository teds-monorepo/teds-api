import type { FastifyInstance } from 'fastify';

const BASE_URL = 'http://localhost:4501';

const page = `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>teds-api — Docs</title>
<style>
:root { color-scheme: light dark; }
body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; max-width: 880px; margin: 0 auto; padding: 32px 20px 64px; line-height: 1.6; }
h1 { margin-bottom: 0; }
.sub { color: #666; margin-top: 4px; }
nav { margin: 20px 0 32px; }
nav a { margin-right: 16px; }
section { border-top: 1px solid #ddd; padding: 24px 0; }
h2 code { font-size: 0.85em; }
.method { display: inline-block; font-weight: 700; font-size: 0.8em; padding: 2px 10px; border-radius: 999px; color: #fff; vertical-align: middle; }
.get { background: #1a7f37; } .put { background: #8250df; } .del { background: #cf222e; }
.badge { display: inline-block; font-size: 0.75em; padding: 1px 8px; border-radius: 999px; border: 1px solid #999; margin-left: 8px; vertical-align: middle; }
pre { background: #f6f8fa; padding: 12px 16px; border-radius: 8px; overflow-x: auto; font-size: 0.85em; }
@media (prefers-color-scheme: dark) { pre { background: #161b22; } .sub { color: #aaa; } section { border-color: #333; } }
table { border-collapse: collapse; } td, th { border: 1px solid #ccc; padding: 4px 10px; font-size: 0.9em; }
</style>
</head>
<body>
<h1>teds-api</h1>
<p class="sub">Base URL: <code>${BASE_URL}</code> — mọi route JSON, trừ <code>DELETE</code> trả <code>204</code> rỗng.</p>
<nav>
<a href="#auth">Auth</a><a href="#health">Health</a><a href="#games">Free games</a><a href="#timeline">Timeline</a><a href="#kv">KV</a><a href="#errors">Errors</a>
</nav>

<section id="auth">
<h2>Auth</h2>
<p>Mọi <code>/api/*</code> cần header <code>X-API-Key</code>, trừ <code>GET /api/health</code>. Thiếu hoặc sai key → <code>401 { error: { code: "unauthorized" } }</code>.</p>
<pre>curl -H "X-API-Key: &lt;API_KEY&gt;" ${BASE_URL}/api/kv</pre>
</section>

<section id="health">
<h2><span class="method get">GET</span> <code>/api/health</code> <span class="badge">public</span></h2>
<p>Kiểm tra service + KV.</p>
<pre>curl ${BASE_URL}/api/health
# {"status":"ok","kv":"ok","time":"2026-10-22T..."}</pre>
</section>

<section id="games">
<h2><span class="method get">GET</span> <code>/api/fetch-free-games</code></h2>
<p>Game đang miễn phí 100% trên Epic và Steam. Lỗi upstream → <code>502 { error: { code: "upstream_failed" } }</code>.</p>
<pre>curl -H "X-API-Key: &lt;API_KEY&gt;" ${BASE_URL}/api/fetch-free-games</pre>
</section>

<section id="timeline">
<h2><span class="method get">GET</span> <code>/api/timeline</code></h2>
<p>Sự kiện timeline từ bảng <code>timeline_events</code>, sắp xếp tăng dần theo <code>solar_date</code>.</p>
<table><tr><th>Query</th><th>Mô tả</th></tr>
<tr><td><code>category</code></td><td>Tùy chọn: <code>public-holiday</code> hoặc <code>family</code>. Giá trị khác → <code>400 { error: { code: "invalid_query" } }</code>.</td></tr></table>
<pre>curl -H "X-API-Key: &lt;API_KEY&gt;" "${BASE_URL}/api/timeline?category=family"
# {"events":[{"id":"...","name":"Tết","solar_date":"2026-02-17","lunar_date":"1/1","type":"lunar","icon":"...","note":"...","category":"public-holiday"}]}</pre>
</section>

<section id="kv">
<h2>KV store</h2>

<h3><span class="method get">GET</span> <code>/api/kv</code> — liệt kê key</h3>
<table><tr><th>Query</th><th>Mô tả</th></tr>
<tr><td><code>prefix</code></td><td>Lọc key bắt đầu bằng prefix</td></tr>
<tr><td><code>limit</code></td><td>Mặc định 100, tối đa 1000</td></tr>
<tr><td><code>cursor</code></td><td>Phân trang: cursor từ response trước</td></tr></table>
<pre>curl -H "X-API-Key: &lt;API_KEY&gt;" "${BASE_URL}/api/kv?prefix=jobs/&amp;limit=50"</pre>

<h3><span class="method get">GET</span> <code>/api/kv/:key</code> — đọc giá trị</h3>
<p><code>:key</code> có thể chứa dấu <code>/</code>. Không tồn tại → <code>404 { error: { code: "not_found" } }</code>.</p>
<pre>curl -H "X-API-Key: &lt;API_KEY&gt;" ${BASE_URL}/api/kv/jobs/42
# {"key":"jobs/42","value":{"status":"done"}}</pre>

<h3><span class="method put">PUT</span> <code>/api/kv/:key</code> — ghi giá trị</h3>
<p>Body: <code>{"value": &lt;bất kỳ&gt;, "expirationTtl"?: &lt;giây, ≥ 60&gt;}</code>. Sai body → <code>400 { error: { code: "invalid_body" } }</code>.</p>
<pre>curl -X PUT -H "X-API-Key: &lt;API_KEY&gt;" -H "Content-Type: application/json" \\
  -d '{"value":{"status":"done"},"expirationTtl":3600}' \\
  ${BASE_URL}/api/kv/jobs/42
# {"key":"jobs/42","stored":true,"expirationTtl":3600}</pre>

<h3><span class="method del">DELETE</span> <code>/api/kv/:key</code> — xoá key</h3>
<p>Trả <code>204</code> không body.</p>
<pre>curl -X DELETE -H "X-API-Key: &lt;API_KEY&gt;" -i ${BASE_URL}/api/kv/jobs/42
# HTTP/1.1 204 No Content</pre>
</section>

<section id="errors">
<h2>Lỗi chung</h2>
<p>Envelope: <code>{ error: { code, message } }</code>. Route không tồn tại → <code>404 { error: { code: "NOT_FOUND" } }</code>.</p>
</section>
</body>
</html>`;

export async function docsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/', async (_request, reply) => {
    return reply.type('text/html; charset=utf-8').send(page);
  });
}
