# teds-api (Fastify port)

API chạy trên **Fastify + Node.js**, deploy VPS (systemd + Caddy). Port từ bản
Cloudflare Pages Functions gốc: giữ nguyên routes, auth X-API-Key, CORS
fail-closed và envelope lỗi `{ error: { code, message } }`.

KV binding của Cloudflare được thay bằng bảng Supabase `public.kv_entries`
(`supabase/migrations/20251021000001_create_kv_entries.sql`), truy cập qua
`SupabaseKvStore` (`src/lib/kv.ts`) dùng service-role key phía server.
API dùng service-role nên RLS deny mặc định với anon — không expose key ra client.

## Yêu cầu

- Node.js >= 20.19
- pnpm >= 10

## Cấu trúc

```
src/
  server.ts              # boot + graceful shutdown
  app.ts                 # build Fastify instance, CORS, routes
                         # + default export cho Vercel (entrypoint serverless)
  config/env.ts          # validate env bằng Zod, fail fast
  plugins/
    error-handler.ts     # envelope lỗi + 404, giấu stack ở production
    auth.ts              # X-API-Key cho mọi /api/* trừ /api/health
  modules/
    health/routes.ts     # GET /api/health (public)
    games/
      routes.ts          # GET /api/fetch-free-games
      free-games.ts      # fetch Epic + parse Steam, Zod validate Epic JSON
    kv/
      routes.ts          # CRUD /api/kv/*
      schemas.ts         # Zod schemas + giới hạn limit/TTL
  lib/
    auth.ts              # so khớp API key (constant-time)
    kv.ts                # SupabaseKvStore: CRUD qua bảng kv_entries
test/                    # vitest: env, auth, kv round-trip
```

## API

Mọi endpoint đều cần header `X-API-Key`, trừ `/api/health`.

| Method   | Path                    | Mô tả                                                                      |
| -------- | ----------------------- | -------------------------------------------------------------------------- |
| `GET`    | `/api/health`           | Kiểm tra service + KV. Public.                                             |
| `GET`    | `/api/fetch-free-games` | Game đang miễn phí 100% trên Epic và Steam.                                |
| `GET`    | `/api/timeline`           | Danh sách sự kiện timeline từ bảng `timeline_events`, sắp xếp theo `solar_date`. Query: `category` (`public-holiday` \| `family`). |
| `GET`    | `/api/kv`               | Liệt kê key. Query: `prefix`, `limit` (tối đa 1000), `cursor`.             |
| `GET`    | `/api/kv/:key`          | Đọc giá trị. `:key` có thể chứa dấu `/`.                                   |
| `PUT`    | `/api/kv/:key`          | Ghi giá trị. Body: `{"value": <bất kỳ>, "expirationTtl"?: <giây, >= 60>}`. |
| `DELETE` | `/api/kv/:key`          | Xoá key. Trả `204`.                                                        |

## Chạy local

```bash
supabase start
supabase db reset
pnpm install
cp .env.example .env
pnpm dev
```

`supabase start` chạy Postgres + API local (:54322 / :54321). `supabase db reset`
áp migrations + seed (migrations nằm trong repo monorepo gốc). Sau khi copy
`.env.example`, điền `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` (lấy từ
`supabase status`).

Mở `http://localhost:4501/api/health`. Đặt `API_KEY` trong `.env` để gọi các
route còn lại:

```bash
curl -H "X-API-Key: dev-secret-key" http://localhost:4501/api/health
curl -H "X-API-Key: dev-secret-key" "http://localhost:4501/api/timeline?category=family"
curl -X PUT -H "X-API-Key: dev-secret-key" -H "Content-Type: application/json" \
  -d '{"value":{"status":"done"}}' http://localhost:4501/api/kv/jobs/42
curl -H "X-API-Key: dev-secret-key" http://localhost:4501/api/kv/jobs/42
```

## Deploy

VPS + systemd + Caddy: build bằng `pnpm build`, chạy `node dist/server.js`.
Env bắt buộc trong production: `API_KEY`, `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `CORS_ORIGINS`.

Vercel: repo tự nhận framework Fastify và lấy `src/app.ts` làm entrypoint, nên
file này phải có `export default` (handler `(req, res)` dựng Fastify instance một
lần rồi emit request). Thiếu default export → Vercel báo
`The default export must be a function or server.` `src/server.ts` chỉ dùng cho
VPS (`node dist/server.js`).
