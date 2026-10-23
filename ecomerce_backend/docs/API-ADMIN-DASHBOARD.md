# API Admin Dashboard

Base URL: `http://localhost:8080/api/v1/admin` — mọi endpoint cần `Authorization: Bearer <accessToken>` của ROLE_ADMIN
(chưa đăng nhập → 401, không phải admin → 403). Response bọc trong `{ success, message, data, errors, status }`.

## Tổng quan (trang Dashboard)

`GET /admin/dashboard/summary`

```json
{
  "totalOrders": 6,
  "ordersToday": 4,
  "ordersByStatus": { "PENDING": 3, "PROCESSING": 0, "SHIPPING": 0, "COMPLETED": 2, "CANCELLED": 1 },
  "totalRevenue": 500000,
  "totalProducts": 10,
  "lowStockProducts": 2,
  "outOfStockProducts": 1,
  "lowStockThreshold": 5
}
```
- `ordersByStatus` luôn đủ 5 trạng thái (chưa có đơn thì là 0).
- `totalRevenue` = tổng `finalAmount` của các đơn đã **COMPLETED**.
- `ordersToday` tính từ 00:00 hôm nay theo giờ Việt Nam.
- `lowStockProducts` = số sản phẩm tồn kho khả dụng < `lowStockThreshold` (đã gồm cả sản phẩm hết hàng).

## Quản trị đơn hàng (FR-08)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/orders?status=&fromDate=&toDate=&page=0&size=20` | Danh sách toàn bộ đơn; lọc theo trạng thái và/hoặc ngày tạo (`yyyy-MM-dd`) |
| GET | `/admin/orders/{id}` | Chi tiết đơn |
| PATCH | `/admin/orders/{id}/status` | Cập nhật trạng thái: body `{ "status": "PROCESSING" }` |

Chu trình hợp lệ (chỉ đi từng bước một, không quay lui):

```
PENDING → PROCESSING → SHIPPING → COMPLETED
   └──────────┴────────────┴──→ CANCELLED   (hủy được ở mọi bước trước khi hoàn tất)
```
- Sai chu trình (nhảy bước, quay lui, đổi sang chính trạng thái hiện tại, sửa đơn đã COMPLETED/CANCELLED) → **400** kèm thông báo.
- **Hủy đơn** → tự động cộng hoàn số lượng từng dòng hàng về tồn kho, cùng transaction với việc đổi trạng thái. Hủy lần 2 bị chặn nên không thể hoàn kho hai lần.
- **COMPLETED** với đơn COD → `paymentStatus` tự chuyển `PENDING → PAID` (đã thu tiền khi giao).
- Đơn đã thanh toán bằng thẻ mô phỏng (`PAID`) khi hủy: hệ thống hoàn kho nhưng **chưa mô phỏng hoàn tiền** (`paymentStatus` giữ nguyên).

## Quản lý tồn kho (FR-07)
Xem `docs/API-PRODUCT-INVENTORY.md`: `GET /admin/inventories?lowStockOnly=true` cho danh sách cảnh báo hàng sắp hết,
`PATCH .../restock` để nhập thêm, `PUT .../products/{productId}` để kiểm kê.
