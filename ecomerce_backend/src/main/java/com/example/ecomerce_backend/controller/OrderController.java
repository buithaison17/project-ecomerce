package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.model.dto.request.CheckoutRequest;
import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.OrderDetailResponse;
import com.example.ecomerce_backend.model.dto.response.OrderSummaryResponse;
import com.example.ecomerce_backend.model.dto.response.PageResponse;
import com.example.ecomerce_backend.security.principal.UserPrincipal;
import com.example.ecomerce_backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** Đặt hàng và xem đơn của chính người dùng đang đăng nhập. */
@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    /** Checkout: biến giỏ hàng hiện tại thành đơn hàng. */
    @PostMapping
    public ResponseEntity<ApiDataResponse<OrderDetailResponse>> checkout(
            @AuthenticationPrincipal UserPrincipal principal, @Valid @RequestBody CheckoutRequest request
    ) {
        return ResponseEntity.status(201).body(ApiDataResponse.created("Đặt hàng thành công",
                orderService.checkout(principal.getUser().getId(), request)));
    }

    /** Lịch sử đơn hàng của tôi, mới nhất trước; lọc theo status nếu truyền vào. */
    @GetMapping
    public ResponseEntity<ApiDataResponse<PageResponse<OrderSummaryResponse>>> listMyOrders(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy danh sách đơn hàng thành công",
                orderService.listMyOrders(principal.getUser().getId(), status, page, size)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiDataResponse<OrderDetailResponse>> getMyOrder(
            @AuthenticationPrincipal UserPrincipal principal, @PathVariable Long id
    ) {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy chi tiết đơn hàng thành công",
                orderService.getMyOrder(principal.getUser().getId(), id)));
    }
}
