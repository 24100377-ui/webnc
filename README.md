# Finora — Ứng dụng quản lý tài chính cá nhân

Finora giúp theo dõi thu chi, quản lý ví và tài khoản, lập ngân sách theo tháng, đặt mục tiêu tích lũy, theo dõi hóa đơn định kỳ và xem báo cáo tài chính. Giao diện và nội dung ứng dụng bằng tiếng Việt; số tiền được hiển thị bằng VNĐ.

## Công nghệ sử dụng

- **Giao diện:** React 19, Vite, Tailwind CSS 4, React Router, Recharts.
- **Máy chủ:** Node.js, Express 5, MySQL 8.
- **Xác thực:** mật khẩu mã hóa bằng bcrypt; JWT lưu trong cookie `httpOnly`.

## Chạy dự án trên máy cá nhân

### Yêu cầu

- Node.js 20.19 trở lên hoặc 22.12 trở lên, cùng npm.
- MySQL 8 đang chạy. Cổng trong cấu hình mẫu là `3305`; nếu MySQL trên máy dùng cổng khác, sửa `DB_PORT` trong `server/.env`.

### 1. Cài thư viện

Chạy các lệnh sau tại thư mục gốc của dự án:

```bash
npm install
npm install --prefix server
npm install --prefix client
```

### 2. Cấu hình môi trường

Sao chép `server/.env.example` thành `server/.env`, sau đó kiểm tra `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` và `DB_NAME` theo MySQL trên máy. Đặt `JWT_SECRET` thành một chuỗi bí mật riêng.

Trên PowerShell:

```powershell
Copy-Item server/.env.example server/.env
```

### 3. Tạo cơ sở dữ liệu và dữ liệu mẫu

```bash
npm run db:migrate
```

Lệnh này tạo cơ sở dữ liệu nếu chưa có, tạo các bảng và thêm dữ liệu demo khi bảng người dùng còn trống. Muốn xóa toàn bộ dữ liệu hiện có và tạo lại dữ liệu demo, dùng `npm run db:reset`.

### 4. Khởi chạy

```bash
npm run dev
```

| Địa chỉ | Mục đích |
| --- | --- |
| http://localhost:5173 | Giao diện web |
| http://localhost:5000 | Máy chủ API |
| http://localhost:5000/api/health | Kiểm tra kết nối API và MySQL |

Tài khoản demo sau khi tạo dữ liệu mẫu: **`manh@finora.vn` / `123456`**. Có thể tạo tài khoản khác tại trang đăng ký.

## Chức năng chính

| Khu vực | Chức năng |
| --- | --- |
| Tổng quan | Xem tài sản ròng, thu chi trong tháng, biểu đồ dòng tiền và giao dịch gần đây. |
| Giao dịch | Xem, lọc, thêm, sửa và xóa giao dịch. |
| Ngân sách | Đặt ngân sách theo danh mục và theo dõi số đã chi trong từng tháng. |
| Ví và tài khoản | Quản lý tài khoản ngân hàng, thẻ, ví điện tử, tiền mặt và tài khoản đầu tư. |
| Tiết kiệm và mục tiêu | Tạo mục tiêu, ghi nhận đóng góp và xem tiến độ tích lũy. |
| Hóa đơn định kỳ | Theo dõi chu kỳ, hạn thanh toán và ghi nhận thanh toán. |
| Báo cáo | Xem thu chi, biểu đồ, chi tiêu theo danh mục và tải dữ liệu ngày dưới dạng CSV. |
| Cài đặt | Cập nhật hồ sơ, giao diện và mật khẩu. |

## Cấu trúc dự án

```text
webnc/
├── client/                  # Giao diện React
│   └── src/
│       ├── components/      # Thành phần giao diện và bố cục
│       ├── context/         # Trạng thái đăng nhập
│       ├── lib/             # Gọi API, định dạng và giao diện
│       └── pages/           # Các trang chức năng
├── server/                  # Express API
│   └── src/
│       ├── config/          # Cấu hình và kết nối MySQL
│       ├── db/              # Cấu trúc bảng và dữ liệu mẫu
│       ├── middleware/      # Xác thực và kiểm tra dữ liệu
│       └── routes/          # Các nhóm API
└── package.json             # Lệnh chạy chung
```

## API chính

Các API nghiệp vụ yêu cầu đăng nhập. Trình duyệt gửi cookie xác thực qua proxy `/api` của Vite khi chạy ở chế độ phát triển.

| Nhóm | Đường dẫn | Chức năng |
| --- | --- | --- |
| Hệ thống | `GET /api/health` | Kiểm tra trạng thái API và MySQL. |
| Tài khoản | `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | Đăng ký, đăng nhập, đăng xuất, lấy người dùng hiện tại. |
| Giao dịch | `/api/transactions` | Xem, thêm, sửa, xóa giao dịch. |
| Ngân sách | `/api/budgets` | Xem ngân sách theo tháng, thêm, sửa, xóa. |
| Ví và tài khoản | `/api/accounts` | Xem, thêm, sửa tài khoản. |
| Mục tiêu | `/api/goals` | Quản lý mục tiêu và các khoản đóng góp. |
| Hóa đơn | `/api/bills` | Quản lý hóa đơn và ghi nhận thanh toán. |
| Báo cáo | `GET /api/reports` | Lấy dữ liệu tổng hợp theo tháng. |
| Cài đặt | `/api/settings`, `/api/settings/password` | Cập nhật hồ sơ và mật khẩu. |

## Lệnh bổ sung

```bash
npm run build   # tạo bản dựng giao diện trong client/dist
npm run start   # chạy riêng API, sau khi đã cấu hình môi trường và MySQL
```
