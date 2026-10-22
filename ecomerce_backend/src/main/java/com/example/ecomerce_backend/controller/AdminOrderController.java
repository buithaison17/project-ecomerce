package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.OrderDetailResponse;
import com.example.ecomerce_backend.model.dto.response.OrderSummaryResponse;
import com.example.ecomerce_backend.model.dto.response.PageResponse;
import com.example.ecomerce_backend.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/** Quản trị đơn hàng (FR-08) - chỉ ROLE_ADMIN (được chặn ở SecurityConfig qua /api/v1/admin/**). */
@RestController
@RequestMapping("/api/v1/admin/orders")
@RequiredArgsConstructor
public class AdminOrderController {
    private final OrderService orderService;

    /** Toàn bộ đơn hàng của mọi người dùng; lọc theo trạng thái và/hoặc khoảng ngày tạo (yyyy-MM-dd, gồm cả 2 đầu). */
    @GetMapping
    public ResponseEntity<ApiDataResponse<PageResponse<OrderSummaryResponse>>> listAll(
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy danh sách đơn hàng thành công",
                orderService.listAllOrders(status, fromDate, toDate, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDataResponse<OrderDetailResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy chi tiết đơn hàng thành công", orderService.getOrder(id)));
    }
}
