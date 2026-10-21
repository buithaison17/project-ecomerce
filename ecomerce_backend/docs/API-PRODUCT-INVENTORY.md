# API Sản phẩm, Danh mục & Tồn kho

Base URL: `http://localhost:8080/api/v1`
Response bọc trong `{ success, message, data, errors, status }` (giống module Auth).
API admin cần header `Authorization: Bearer <accessToken>` của tài khoản ROLE_ADMIN
(tài khoản mẫu: `admin` / `123456`). Không đăng nhập → 401, đăng nhập nhưng không phải admin → 403.

## Public (không cần đăng nhập)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/categories` | Danh sách danh mục |
| GET | `/products` | Danh sách sản phẩm (phân trang, tìm kiếm, lọc, sắp xếp) |
| GET | `/products/{id}` | Chi tiết sản phẩm (mô tả, ảnh, tồn kho) |

Query của `GET /products`:

| Param | Mặc định | Ghi chú |
|---|---|---|
| `keyword` | - | Tìm theo tên (không phân biệt hoa thường) |
| `categoryId` | - | Lọc theo danh mục |
| `minPrice`, `maxPrice` | - | Khoảng giá; `minPrice > maxPrice` → 400 |
| `sortBy` | `createdAt` | `price` \| `name` \| `createdAt` |
| `sortDir` | `desc` | `asc` \| `desc` |
| `page`, `size` | `0`, `12` | `size` tối đa 100 |

`data` của danh sách: `{ content: [{ id, name, price, categoryId, categoryName, thumbnailUrl, stockQuantity, inStock }], page, size, totalElements, totalPages }`.
`thumbnailUrl` có dạng `/uploads/xxx.jpg` → ghép với `http://localhost:8080` để hiển thị. `thumbnailUrl` là `null` nếu sản phẩm chưa có ảnh.

## Admin

### Danh mục
| Method | Path | Body |
|---|---|---|
| POST | `/admin/categories` | `{ "name": "Laptop", "description": "..." }` |
| PUT | `/admin/categories/{id}` | như trên |
| DELETE | `/admin/categories/{id}` | Xóa mềm; 400 nếu còn sản phẩm |

### Sản phẩm
| Method | Path | Body |
|---|---|---|
| POST | `/admin/products` | `{ name, description, price, categoryId, initialQuantity?, imageUrls? }` → tự tạo bản ghi tồn kho |
| PUT | `/admin/products/{id}` | `{ name, description, price, categoryId }` (không đổi tồn kho/ảnh) |
| DELETE | `/admin/products/{id}` | Ẩn (xóa mềm) khỏi catalog |
| POST | `/admin/products/{id}/images` | `multipart/form-data`, field `file` (JPG/PNG/WEBP/GIF, ≤ 5MB, tối đa 10 ảnh/sản phẩm) |
| DELETE | `/admin/products/{id}/images/{imageId}` | Xóa ảnh |

### Tồn kho
| Method | Path | Body / ghi chú |
|---|---|---|
| GET | `/admin/inventories?lowStockOnly=false&page=0&size=20` | `lowStockOnly=true` → chỉ hàng sắp hết (< 5) |
| GET | `/admin/inventories/products/{productId}` | Tồn kho 1 sản phẩm |
| PATCH | `/admin/inventories/products/{productId}/restock` | `{ "quantity": 20 }` → cộng dồn |
| PUT | `/admin/inventories/products/{productId}` | `{ "quantity": 12 }` → đặt lại đúng số lượng (kiểm kê) |

`InventoryResponse`: `{ productId, productName, quantity, reservedQuantity, availableQuantity, lowStock, updatedAt }`.

## Mã lỗi
`400` dữ liệu không hợp lệ · `401` chưa đăng nhập · `403` không đủ quyền · `404` không tìm thấy · `409` không đủ tồn kho.

## Dành cho phần Order (Checkout / Hủy đơn)
`InventoryService.decreaseStock(productId, amount)` và `increaseStock(productId, amount)` đã khóa dòng
(`SELECT ... FOR UPDATE`) và kiểm tra tồn khả dụng; gọi chúng **bên trong** `@Transactional` của checkout / hủy đơn
để trừ/hoàn kho cùng giao dịch với việc tạo/hủy đơn.
