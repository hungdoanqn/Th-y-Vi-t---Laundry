# DotnAI Laundry ERP — v1.0

Hệ thống quản lý xưởng giặt là B2B (khách sạn, spa, nhà hàng): **Nhận đơn → các công đoạn sản xuất → Giao hàng ký điện tử**, quản lý nhìn tiến độ theo thời gian thực. Giao diện theo DotnAI UI Kit 15.78.

Kiến trúc giống MeiLi: 1 trang `index.html` + 1 API `/api/rpc` (Vercel Serverless) + Supabase (service role key).

## Deploy lên Vercel

1. **Supabase**: tạo project → SQL Editor → chạy `supabase/schema.sql`.
2. **Vercel**: import repo (Framework Preset = *Other*, không cần build command). Thêm biến môi trường:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY` (service role)
   - `SESSION_SECRET` — chuỗi ngẫu nhiên dài (ký token đăng nhập)
3. Deploy. Lần đăng nhập đầu, hệ thống tự ghi **dữ liệu mẫu** (công đoạn, quy trình, khách, mặt hàng, nhân viên + ~50 đơn mẫu) nếu bảng `nhan_vien` trống.
   Muốn bắt đầu sạch: sau khi demo xong, xoá dữ liệu bảng `don_hang` (cascade sang `cong_doan_log`, `phieu_giao`).

> Chưa cấu hình Supabase? Trang vẫn chạy **chế độ demo**: toàn bộ nghiệp vụ chạy trên trình duyệt (localStorage), cùng code với server — dùng để show khách ngay.

Tài khoản mẫu (mã · PIN): `QL01·1234` quản lý · `ND01·1111` nhận đơn · `SX01·2222` phân loại · `SX02·3333` giặt/sấy · `SX03·4444` ủi/QC/đóng gói · `GH01·5555` giao hàng. **Đổi PIN trước khi chạy thật.**

## Cấu trúc

| File | Vai trò |
|---|---|
| `lib/core.js` | Toàn bộ nghiệp vụ (dùng chung server + demo): đơn, công đoạn, giao hàng, ký, dashboard, thiết lập, dữ liệu mẫu |
| `lib/store-supabase.js` / `lib/store-local.js` | Lớp lưu trữ: Supabase (phân trang 1.000 dòng, tách lô IN) / localStorage |
| `api/rpc.js` | API duy nhất `POST /api/rpc {fn,args,token}` — token HMAC, hàm public cho link ký (server tự gắn IP + User-Agent) |
| `app.js` | Khung app: router, phiên, shell (sidebar/topbar/bottom nav), chữ ký, phiếu in, biểu đồ |
| `screens/*.js` | Màn hình: `dash` tổng quan · `don` nhận đơn/đơn hàng/chi tiết · `tram` trạm sản xuất · `giao` giao hàng/phiếu/ký công khai · `setup` thiết lập |
| `ui/tokens.css`, `ui/icons.js` | Token + icon từ DotnAI UI Kit |
| `supabase/schema.sql` | 8 bảng, RLS bật, không policy (chỉ service key truy cập) |

Tên/địa chỉ công ty in trên phiếu: sửa `CONFIG.company` đầu file `app.js`.

## Luồng nghiệp vụ

- **Nhận đơn**: chọn khách → bộ phận (HK/FB/Spa) → quy trình (tự lấy theo khách) → đếm từng loại theo cái + cân tổng kg → hẹn giao tự tính theo SLA khách (giao nhanh = 8 giờ).
- **Trạm sản xuất**: mỗi công đoạn 1 tab, hàng chờ sắp theo *giao nhanh → hạn giao*. Nhân viên bấm *Bắt đầu* (ghi giờ + người) → *Nhập kết quả* (trường riêng của công đoạn: máy, chương trình, nhiệt độ…; công đoạn có kiểm đếm thì nhập SL ra từng loại, lệch phải chọn lý do) → đơn tự chuyển bước kế.
- **Giao hàng**: lập phiếu (SL giao, thiếu tự tính), khách **ký trên máy tài xế** hoặc **gửi link** cho khách tự ký trên điện thoại. Lưu chữ ký PNG, giờ ký, IP, thiết bị. Phiếu in theo mẫu phiếu giấy hiện tại.
- **Quản lý**: Tổng quan — điểm cần chú ý, KPI, dây chuyền (số đơn/cái/kg ở mỗi công đoạn, ai đang làm, chờ lâu nhất), bảng đơn đang chạy, kg 14 ngày, khách hàng, hiệu suất & tỷ lệ lỗi từng công đoạn. Chi tiết đơn: tiến độ, đối chiếu SL qua từng bước, nhật ký.
- **Thiết lập**: thêm công đoạn (màu, kiểm đếm, lý do lỗi, **trường nhập tuỳ biến**), **nối công đoạn thành quy trình** (kéo thả / mũi tên), khách hàng, mặt hàng, nhân viên + phân công đoạn.

Đơn lưu *ảnh chụp* quy trình lúc nhận → sửa quy trình không ảnh hưởng đơn đang chạy.

## Việc nên làm tiếp (v1.1+)

- Băm PIN (hiện lưu thô như hệ MeiLi), giới hạn số lần thử đăng nhập.
- Tách mẻ (1 đơn chia nhiều mẻ/máy), giặt lại quay về bước trước.
- Chụp ảnh đồ hư/ố lúc nhận và lúc QC (Supabase Storage).
- Bảng giá & công nợ khách theo kg/cái, xuất hoá đơn tháng.
- Dashboard đang đọc tối đa 2.000 đơn gần nhất — khi dữ liệu lớn chuyển sang view/RPC tổng hợp trong Postgres.
- QR trên phiếu/bao hàng để quét mở đơn ở trạm.
