package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.model.dto.request.CreateOrderRequest;
import com.example.ecomerce_backend.model.dto.request.OrderUpdateStatusRequest;
import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.OrderResponse;
import com.example.ecomerce_backend.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    @Secured("ROLE_CUSTOMER")
    @PostMapping
    public ResponseEntity<ApiDataResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return new ResponseEntity<>(new ApiDataResponse<>(
                true,
                "Đặt hàng thành công",
                orderService.createOrder(request),
                null,
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    @Secured("ROLE_ADMIN")
    @PatchMapping("/{id}")
    public ResponseEntity<ApiDataResponse<OrderResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody OrderUpdateStatusRequest request
    ) {
        return new ResponseEntity<>(new ApiDataResponse<>(
                true,
                "Cập nhật trạng thái đơn hàng thành công",
                orderService.updateStatus(id, request),
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    @Secured("ROLE_CUSTOMER")
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiDataResponse<OrderResponse>> cancelOrder(
            @PathVariable Long id
    ) {
        return new ResponseEntity<>(new ApiDataResponse<>(
                true,
                "Cập nhật trạng thái đơn hàng thành công",
                orderService.cancelOrder(id),
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }
}
