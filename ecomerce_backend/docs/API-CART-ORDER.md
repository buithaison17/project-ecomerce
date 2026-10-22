# API Giỏ hàng, Đặt hàng & Quản trị đơn hàng

Base URL: `http://localhost:8080/api/v1`
Response bọc trong `{ success, message, data, errors, status }`. Mọi endpoint ở đây **yêu cầu** header
`Authorization: Bearer <accessToken>`; các endpoint `/admin/**` chỉ cho tài khoản ROLE_ADMIN
(chưa đăng nhập → 401, không phải admin → 403).

## Giỏ hàng (`/cart`)

| Method | Path | Body | Ghi chú |
|---|---|---|---|
| GET | `/cart` | - | Xem giỏ hàng |
| POST | `/cart/items` | `{ "productId": 1, "quantity": 2 }` | Thêm vào giỏ; đã có thì **cộng dồn** |
| PUT | `/cart/items/{productId}` | `{ "quantity": 3 }` | Đặt số lượng về đúng giá trị (≥ 1) |
| DELETE | `/cart/items/{productId}` | - | Xóa một món |
| DELETE | `/cart` | - | Làm sạch giỏ hàng |
| POST | `/cart/sync` | `{ "items": [{ "productId": 1, "quantity": 2 }] }` | Gộp giỏ ở Client (Zustand/LocalStorage) vào Backend sau khi đăng nhập |

- Số lượng không được vượt tồn kho khả dụng → **409** `Sản phẩm "..." chỉ còn N trong kho`.
- `/cart/sync`: cộng dồn với giỏ đang có và **chặn ở mức tồn kho**; sản phẩm đã ẩn/hết hàng bị bỏ qua (không báo lỗi). Gọi 1 lần ngay sau khi đăng nhập rồi dùng giỏ trả về làm nguồn đúng.
- Mọi endpoint trả `CartResponse`:
  `{ items: [{ productId, productName, thumbnailUrl, unitPrice, quantity, availableQuantity, subtotal }], totalQuantity, totalAmount }`.
- Sản phẩm đã bị admin ẩn/xóa sẽ tự biến mất khỏi giỏ khi gọi các API trên.

## Đặt hàng (`/orders`)

| Method | Path | Mô tả |
|---|---|---|
| POST | `/orders` | Checkout: biến giỏ hàng hiện tại thành đơn (201) |
| GET | `/orders?status=&page=0&size=10` | Đơn hàng của tôi, mới nhất trước; `status` lọc tùy chọn |
| GET | `/orders/{id}` | Chi tiết đơn của tôi (đơn của người khác → 404) |

Body checkout:
```json
{
  "receiverName": "Nguyễn Văn A",
  "phoneNumber": "0912345678",
  "address": "1 Đường ABC, Hà Nội",
  "paymentMethod": "COD",
  "cardNumber": null,
  "note": "Giao giờ hành chính"
}
```
- `phoneNumber`: `0xxxxxxxxx` hoặc `+84xxxxxxxxx` (9 chữ số sau đầu số).
- `paymentMethod`: `COD` hoặc `MOCK_CARD`. Với `MOCK_CARD` phải gửi `cardNumber` là một thẻ test:

| Số thẻ test | Kết quả |
|---|---|
| `4242 4242 4242 4242` | Thành công → `paymentStatus = PAID` |
| `4000 0000 0000 0002` | Thất bại: thẻ bị từ chối (402) |
| `4000 0000 0000 9995` | Thất bại: không đủ số dư (402) |
| `4000 0000 0000 0069` | Thất bại: thẻ hết hạn (402) |
| số khác | 400 `Số thẻ test không hợp lệ` |

- COD → `paymentStatus = PENDING`. Đơn mới luôn có `orderStatus = PENDING`.
- Checkout chạy trong **một transaction**: kiểm tra + trừ kho → thanh toán mô phỏng → tạo đơn → xóa giỏ.
  Hết hàng (409) hoặc thẻ bị từ chối (402) thì **không có đơn nào được tạo, kho không bị trừ, giỏ hàng giữ nguyên**.
- Phí vận chuyển mặc định 0, đổi bằng biến môi trường `SHIPPING_FEE` (VND).

`OrderSummaryResponse` (danh sách): `{ id, orderStatus, paymentMethod, paymentStatus, finalAmount, receiverName, customerId, customerUsername, customerEmail, createdAt }`.

`OrderDetailResponse`: `{ id, orderStatus, paymentMethod, paymentStatus, receiverName, phoneNumber, address, note, items: [{ productId, productName, thumbnailUrl, quantity, unitPrice, totalAmount }], totalAmount, shippingAmount, finalAmount, customerId, customerUsername, customerEmail, createdAt, updatedAt }`.
`unitPrice` là giá tại thời điểm đặt hàng, không đổi khi sản phẩm đổi giá về sau.

## Admin (`/admin/orders`)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/admin/orders?status=&fromDate=&toDate=&page=0&size=20` | Toàn bộ đơn hàng của mọi người dùng |
| GET | `/admin/orders/{id}` | Chi tiết bất kỳ đơn nào |

- `status`: `PENDING` \| `PROCESSING` \| `SHIPPING` \| `COMPLETED` \| `CANCELLED`.
- `fromDate`, `toDate`: định dạng `yyyy-MM-dd`, tính cả hai đầu; `fromDate > toDate` → 400.
- `size` tối đa 100.

## Mã lỗi
`400` dữ liệu không hợp lệ / giỏ trống · `401` chưa đăng nhập · `402` thanh toán thất bại · `403` không đủ quyền · `404` không tìm thấy · `409` không đủ tồn kho.

## Chưa có (ngày 5)
Cập nhật trạng thái đơn (PENDING → PROCESSING → SHIPPING → COMPLETED / CANCELLED) và hoàn kho khi hủy
(dùng `InventoryService.increaseStock` đã có sẵn).
