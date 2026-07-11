# Hướng dẫn triển khai lên VPS

Domain production: **https://sodoan.lcdkhoacntt1.com**

## Yêu cầu VPS

| Thành phần | Phiên bản |
|------------|-----------|
| Ubuntu | 22.04 / 24.04 LTS |
| Docker | 24+ |
| Docker Compose | v2+ |
| RAM | Tối thiểu 2 GB |
| Disk | Tối thiểu 20 GB |

## 1. Chuẩn bị VPS

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Đăng xuất/đăng nhập lại để nhóm docker có hiệu lực

# Cài Docker Compose plugin (nếu chưa có)
sudo apt install docker-compose-plugin -y
```

## 2. Trỏ DNS

Tại nhà cung cấp domain, tạo bản ghi **A**:

| Host | Type | Value |
|------|------|-------|
| `sodoan` | A | `<IP_VPS>` |

Kết quả: `sodoan.lcdkhoacntt1.com` → IP VPS. Đợi DNS propagate (5–30 phút).

## 3. Upload mã nguồn lên VPS

```bash
# Trên máy local
git clone <repo-url> so-doan-dien-tu
cd so-doan-dien-tu

# Hoặc dùng scp/rsync
scp -r so-doan-dien-tu user@<IP_VPS>:/opt/
```

Trên VPS:

```bash
cd /opt/so-doan-dien-tu
```

## 4. Cấu hình môi trường production

```bash
cp .env.production.example .env
nano .env
```

Cập nhật:

```env
DB_PASSWORD=<mật-khẩu-postgres-mạnh>
SECRET_KEY=<chuỗi-ngẫu-nhiên-64-ký-tự>
```

Tạo `SECRET_KEY`:

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

## 5. Build & chạy Docker Production

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Kiểm tra:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

Truy cập: http://sodoan.lcdkhoacntt1.com

Đăng nhập: `admin` / `admin123` → **đổi mật khẩu ngay** qua menu Tài khoản.

## 6. Cấu trúc production

```
Internet
    │
    ▼
┌─────────────────────────────────────┐
│  frontend (nginx:80)                │
│  - Serve React build (static)       │
│  - Proxy /api/* → backend:8000      │
└──────────────┬──────────────────────┘
               │
    ┌──────────▼──────────┐
    │  backend (FastAPI)    │
    │  port 8000 (internal)│
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │  db (PostgreSQL 16) │
    │  port 5432 (internal)│
    └─────────────────────┘
```

- Frontend build với `VITE_API_URL=https://sodoan.lcdkhoacntt1.com/api/v1`
- Nginx trong container frontend proxy `/api/` sang backend
- Database **không** expose ra ngoài

## 7. Cài SSL (HTTPS) với Certbot

Sau khi HTTP chạy ổn:

```bash
# Dừng frontend tạm để certbot bind port 80
docker compose -f docker-compose.prod.yml stop frontend

sudo apt install certbot -y
sudo certbot certonly --standalone -d sodoan.lcdkhoacntt1.com
```

Tạo file `frontend/nginx.ssl.conf` (hoặc sửa `nginx.conf`):

```nginx
server {
    listen 80;
    server_name sodoan.lcdkhoacntt1.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sodoan.lcdkhoacntt1.com;
    root /usr/share/nginx/html;

    ssl_certificate /etc/letsencrypt/live/sodoan.lcdkhoacntt1.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sodoan.lcdkhoacntt1.com/privkey.pem;

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 20M;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Cập nhật `docker-compose.prod.yml` — mount cert vào frontend:

```yaml
  frontend:
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

Rebuild frontend với nginx SSL config, rồi:

```bash
docker compose -f docker-compose.prod.yml up -d --build frontend
```

Gia hạn SSL tự động:

```bash
sudo crontab -e
# Thêm dòng:
0 3 * * * certbot renew --quiet && docker compose -f /opt/so-doan-dien-tu/docker-compose.prod.yml restart frontend
```

## 8. Khởi tạo hệ thống lần đầu

Seed chỉ tạo **roles + admin**. Không có dữ liệu mẫu.

Sau đăng nhập admin, thực hiện theo thứ tự:

1. **Tổ chức** → Tạo Liên Chi đoàn
2. **Tổ chức** → Tạo Chi đoàn (chọn Liên chi)
3. **Tài khoản** → Tạo user (Bí thư, Liên chi, CTV...)
4. **Quản lý lớp** → Tạo lớp, import danh sách Excel
5. **Đoàn viên / Sổ đoàn** → Quản lý nghiệp vụ

### Xóa data cũ (nếu đã có DB từ trước)

```bash
docker compose -f docker-compose.prod.yml exec backend python scripts/reset_data.py
```

Hoặc reset hoàn toàn:

```bash
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d --build
```

## 9. Cập nhật phiên bản mới

```bash
cd /opt/so-doan-dien-tu
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## 10. Backup database

```bash
# Backup
docker compose -f docker-compose.prod.yml exec db \
  pg_dump -U postgres so_doan > backup_$(date +%Y%m%d).sql

# Restore
cat backup_20250710.sql | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U postgres so_doan
```

Cron backup hàng ngày:

```bash
0 2 * * * docker compose -f /opt/so-doan-dien-tu/docker-compose.prod.yml exec -T db pg_dump -U postgres so_doan > /opt/backups/so_doan_$(date +\%Y\%m\%d).sql
```

## 11. Monitoring & logs

```bash
# Health check
curl https://sodoan.lcdkhoacntt1.com/health

# Logs
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 12. Troubleshooting

| Lỗi | Giải pháp |
|-----|-----------|
| CORS error | Kiểm tra `CORS_ORIGINS` trong `docker-compose.prod.yml` khớp domain |
| 502 Bad Gateway | Backend chưa sẵn sàng — `docker compose logs backend` |
| Trang trắng | Kiểm tra `VITE_API_URL` khi build frontend |
| Camera QR không hoạt động | Cần HTTPS (bước 7) |
| DB connection refused | Đợi PostgreSQL healthy: `docker compose ps` |
| 401 liên tục | Xóa localStorage, đăng nhập lại |

## 13. Chạy local (development)

```bash
docker compose up --build
# Frontend: http://localhost:5173
# Backend:  http://localhost:8000
```

## 14. Biến môi trường

| Biến | Mô tả | Production |
|------|-------|------------|
| `DB_PASSWORD` | Mật khẩu PostgreSQL | Bắt buộc |
| `SECRET_KEY` | JWT secret | Bắt buộc, 64 ký tự |
| `VITE_API_URL` | API URL cho frontend build | `https://sodoan.lcdkhoacntt1.com/api/v1` |
| `CORS_ORIGINS` | Domain được phép gọi API | Domain production |
| `DEBUG` | Debug mode | `false` |
| `RATE_LIMIT_MAX_REQUESTS` | Số request tối đa/1 IP trong window trước khi blacklist | `10` |
| `RATE_LIMIT_WINDOW_SECONDS` | Cửa sổ đếm request (giây) | `1` |

## 15. Bảo mật & chống tấn công

Hệ thống có **4 lớp bảo vệ**:

### Lớp 1 — Nginx (server)
- Rate limit: **10 req/s** burst (khớp rule backend)
- Login: **5 req/phút** / IP
- Giới hạn kết nối đồng thời: 20/IP
- Security headers: `X-Frame-Options`, `X-Content-Type-Options`, ...
- Ẩn `server_tokens`, chặn truy cập file ẩn (`/.env`, ...)

### Lớp 2 — Backend (FastAPI)
- **Tự động blacklist** khi cùng 1 IP gửi **> 10 request trong 1 giây**
- Login: **> 5 lần/phút** → blacklist
- IP blacklist lưu **database** (bảng `ip_blacklist`), chặn vĩnh viễn cho đến khi admin gỡ
- Ghi log sự kiện bảo mật (`security_events`)
- Security headers trên mọi response
- Production: tắt `/docs`, `TrustedHostMiddleware`

### Lớp 3 — Frontend
- Axios timeout 30s, xử lý **403 (IP chặn)** và **429 (rate limit)**
- JWT refresh tự động, xóa token khi bị chặn

### Lớp 4 — Database
- **Không expose port** ra internet (chỉ Docker internal network)
- Script `postgres/init-security.sql` thu hẹp quyền schema

### Quản lý blacklist (Admin)

```bash
# Xem danh sách IP bị chặn
curl -H "Authorization: Bearer <token>" https://sodoan.lcdkhoacntt1.com/api/v1/security/blacklist

# Gỡ chặn IP
curl -X DELETE -H "Authorization: Bearer <token>" https://sodoan.lcdkhoacntt1.com/api/v1/security/blacklist/1.2.3.4

# Xem log sự kiện bảo mật
curl -H "Authorization: Bearer <token>" https://sodoan.lcdkhoacntt1.com/api/v1/security/events
```

Hoặc vào menu **Tài khoản** → tab **Bảo mật** (admin).

### Khuyến nghị VPS thêm
```bash
# Firewall — chỉ mở 80, 443, 22
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2ban (tùy chọn) — chặn brute-force SSH
sudo apt install fail2ban -y
```
