# Deploy Backend lên VPS (Frontend trên Vercel)

Kiến trúc:

```
sodoan.lcdkhoacntt1.com        → Vercel (React frontend)
api.sodoan.lcdkhoacntt1.com    → VPS 180.93.32.135 (FastAPI + PostgreSQL)
```

## Bước 1 — DNS trên Hostinger

Vào **DNS Zone** của domain `lcdkhoacntt1.com`, thêm bản ghi:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `api.sodoan` | `180.93.32.135` | 300 |

> Giữ nguyên bản ghi `sodoan` trỏ Vercel (frontend). Chỉ thêm subdomain `api`.

Kiểm tra sau 5–30 phút:

```bash
ping api.sodoan.lcdkhoacntt1.com
# Phải trả về 180.93.32.135
```

## Bước 2 — SSH vào VPS

```bash
ssh root@180.93.32.135
```

## Bước 3 — Cài Docker

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin nginx certbot python3-certbot-nginx -y
```

## Bước 4 — Upload mã nguồn (chỉ backend, không cần frontend)

**Trên máy Windows (PowerShell):**

```powershell
cd E:\DEV\so-doan-dien-tu

# Tạo gói deploy (backend + config, bỏ frontend/node_modules)
scp -r backend postgres deploy docker-compose.vps.yml .env.production.example root@180.93.32.135:/opt/so-doan-dien-tu/
```

Hoặc dùng **git** trên VPS:

```bash
mkdir -p /opt/so-doan-dien-tu && cd /opt/so-doan-dien-tu
git clone <repo-url> .
```

## Bước 5 — Tạo file .env

```bash
cd /opt/so-doan-dien-tu
cp .env.production.example .env
nano .env
```

```env
DB_PASSWORD=<mật-khẩu-mạnh-16-ký-tự>
SECRET_KEY=<chuỗi-ngẫu-nhiên-64-ký-tự>
```

Tạo SECRET_KEY:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## Bước 6 — Chạy Backend + Database

```bash
cd /opt/so-doan-dien-tu
docker compose -f docker-compose.vps.yml --env-file .env up -d --build
docker compose -f docker-compose.vps.yml ps
docker compose -f docker-compose.vps.yml logs -f backend
```

Kiểm tra nội bộ:

```bash
curl http://127.0.0.1:8001/health
# {"status":"ok",...}
```

### Khởi tạo DB lần đầu (chỉ khi DB mới)

```bash
docker compose -f docker-compose.vps.yml exec backend python scripts/init_db.py
```

Không chạy lại khi đã có dữ liệu — script bỏ qua tạo admin nếu DB đã có user.

## Bước 7 — Cấu hình Nginx (reverse proxy API)

```bash
cp /opt/so-doan-dien-tu/deploy/nginx-api.conf /etc/nginx/sites-available/sodoan-api
ln -s /etc/nginx/sites-available/sodoan-api /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

Test HTTP:

```bash
curl http://api.sodoan.lcdkhoacntt1.com/health
```

## Bước 8 — Cài SSL (HTTPS)

```bash
certbot --nginx -d api.sodoan.lcdkhoacntt1.com
```

Chọn redirect HTTP → HTTPS. Sau đó:

```bash
curl https://api.sodoan.lcdkhoacntt1.com/health
curl https://api.sodoan.lcdkhoacntt1.com/api/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'
```

## Bước 9 — Cấu hình Vercel (Frontend)

Vào **Vercel Dashboard** → Project → **Settings** → **Environment Variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://api.sodoan.lcdkhoacntt1.com/api/v1` |

**Redeploy** frontend (Deployments → Redeploy).

Domain `sodoan.lcdkhoacntt1.com` giữ trỏ Vercel như hiện tại.

## Bước 10 — Firewall VPS

```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

## Bước 11 — Đăng nhập & khởi tạo

1. Mở https://sodoan.lcdkhoacntt1.com
2. Đăng nhập: `admin` / `admin123` (nếu đã chạy `init_db.py`)
3. Đổi mật khẩu ngay
4. Thiết lập: **Liên chi** → **Tài khoản** → **Khóa** → **Chi đoàn** → **Kỳ cập nhật** → Import đoàn viên

## Cập nhật phiên bản backend

```bash
cd /opt/so-doan-dien-tu
git pull   # hoặc scp lại thư mục backend
docker compose -f docker-compose.vps.yml --env-file .env up -d --build
```

> Deploy **không** tự seed — dữ liệu production được giữ nguyên.

## Backup database

```bash
docker compose -f docker-compose.vps.yml exec db \
  pg_dump -U postgres so_doan > /opt/backups/so_doan_$(date +%Y%m%d).sql
```

## Troubleshooting

| Lỗi | Nguyên nhân | Cách sửa |
|-----|-------------|----------|
| CORS error trên browser | Backend chưa cho phép domain Vercel | Kiểm tra `CORS_ORIGINS` trong `docker-compose.vps.yml` |
| Network Error / API không gọi được | `VITE_API_URL` sai trên Vercel | Đặt `https://api.sodoan.lcdkhoacntt1.com/api/v1`, redeploy |
| 502 Bad Gateway | Backend chưa chạy | `docker compose -f docker-compose.vps.yml logs backend` |
| Invalid host header | TrustedHost chưa có api subdomain | Kiểm tra `ALLOWED_HOSTS` trong docker-compose.vps.yml |
| DNS không resolve | Chưa thêm A record | Thêm `api.sodoan` → `180.93.32.135` trên Hostinger |

## File cần upload lên VPS

```
/opt/so-doan-dien-tu/
├── backend/              ← FastAPI
├── postgres/             ← init-security.sql
├── deploy/nginx-api.conf   ← cấu hình nginx
├── docker-compose.vps.yml
├── .env
└── storage/              ← tự tạo khi chạy
```

**Không cần** upload `frontend/` lên VPS.
