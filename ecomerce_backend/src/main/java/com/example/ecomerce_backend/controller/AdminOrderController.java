package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.model.dto.request.OrderUpdateStatusRequest;
import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.OrderResponse;
import com.example.ecomerce_backend.model.dto.response.OrderItemResponse;
import com.example.ecomerce_backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Quản trị đơn hàng (FR-08) - chỉ ROLE_ADMIN (được chặn ở SecurityConfig qua /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final OrderService orderService;

    /** Toàn bộ đơn hàng của mọi người dùng; lọc theo trạng thái. */
    @GetMapping
    public ResponseEntity<ApiDataResponse<List<OrderResponse>>> listAll(
            @RequestParam(defaultValue = "1") Integer currentPage,
            @RequestParam(defaultValue = "20") Integer pageSize,
            @RequestParam(required = false) OrderStatus orderStatus
    ) {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy danh sách đơn hàng thành công",
                orderService.findAll(currentPage, pageSize, orderStatus).getContent()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDataResponse<List<OrderItemResponse>>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy chi tiết đơn hàng thành công", orderService.getOrderDetail(id)));
    }

    /**
     * Cập nhật trạng thái đơn theo chu trình PENDING -> PROCESSING -> SHIPPING -> COMPLETED (hoặc CANCELLED).
     * Hủy đơn sẽ tự động hoàn số lượng về tồn kho.
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiDataResponse<OrderResponse>> updateStatus(
            @PathVariable Long id, @Valid @RequestBody OrderUpdateStatusRequest request
    ) {
        return ResponseEntity.ok(ApiDataResponse.ok("Cập nhật trạng thái đơn hàng thành công",
                orderService.updateStatus(id, request)));
    }
}