# Finora — Quản lý tài chính cá nhân

Web app quản lý tài chính cá nhân: ghi chép giao dịch, ngân sách, ví, mục tiêu tiết kiệm, hóa đơn định kỳ và báo cáo.

**Stack:** React (Vite) + Tailwind CSS v4 · Node.js/Express · MySQL 8

---

## 1. Chạy dự án

### Yêu cầu
- Node.js 20+
- MySQL 8+ đang chạy ở `localhost:3305` (cấu hình trong `server/.env`)

### Cài đặt

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### Cấu hình

```bash
copy server\.env.example server\.env
```

Mở `server/.env` và điền `DB_PASSWORD` (mật khẩu MySQL của bạn). Các biến còn lại giữ mặc định được.

### Tạo database + dữ liệu demo

```bash
npm run db:migrate        # tạo DB finora, tạo bảng, seed dữ liệu mẫu
npm run db:reset          # xoá sạch và seed lại từ đầu
```

### Chạy

```bash
npm run dev
```

- Web: http://localhost:5173
- API: http://localhost:5000
- Health: http://localhost:5000/api/health

**Tài khoản demo:** `manh@finora.vn` / `123456`

---

## 2. Cấu trúc

```
webnc/
├── client/               # React + Vite + Tailwind
│   └── src/
│       ├── components/   # layout (sidebar, topbar), auth shell, placeholder
│       ├── context/      # AuthContext: giữ user trong RAM
│       ├── lib/          # axios client, format tiền/ngày, theme
│       └── pages/        # 9 màn hình
├── server/               # Express API
│   └── src/
│       ├── config/       # env, mysql pool
│       ├── db/           # schema.sql, seed.js, migrate.js
│       ├── middleware/   # requireAuth, validate (Zod), errorHandler
│       ├── routes/       # auth
│       └── utils/        # token (JWT + cookie), lỗi
```

---

## 3. Luồng hoạt động (Ngày 1)

### Đăng ký / đăng nhập
1. Form React gửi `POST /api/auth/login` (hoặc `/register`).
2. Express validate bằng Zod → tra `users` bằng email → so `bcrypt`.
3. Server ký JWT 7 ngày, gắn vào cookie `finora_token` (`httpOnly`, `sameSite=lax`).
4. Response trả user (không có `password_hash`); React lưu user vào `AuthContext`.

### Giữ phiên khi F5
1. `AuthProvider` mount → gọi `GET /api/auth/me`.
2. Trình duyệt tự gửi cookie → middleware `requireAuth` verify JWT → trả user.
3. `ProtectedRoute` chờ `loading=false`: có user thì render layout, không thì về `/login`.

### Vì sao dùng proxy `/api`
Vite proxy `http://localhost:5173/api` → `http://localhost:5000/api`, nên trình duyệt thấy same-origin:
cookie `httpOnly` hoạt động, không cần xử lý CORS phức tạp khi dev.

### Bảo mật cơ bản
- Mật khẩu hash `bcrypt` (10 rounds), không bao giờ trả về client.
- JWT chỉ chứa `sub` (user id), hạn 7 ngày.
- Rate limit 30 request/15 phút cho login & register.
- Mọi query nghiệp vụ về sau đều phải lọc `user_id`.

---

## 4. API hiện có

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/health` | Trạng thái API + MySQL |
| POST | `/api/auth/register` | Đăng ký, tạo ví Tiền mặt + 9 danh mục mặc định |
| POST | `/api/auth/login` | Đăng nhập, set cookie |
| POST | `/api/auth/logout` | Xoá cookie |
| GET | `/api/auth/me` | User hiện tại (cần đăng nhập) |

---

## 5. Lộ trình

Xem [docs/ROADMAP.md](docs/ROADMAP.md) — 7 ngày, mỗi ngày một mốc chạy được.
