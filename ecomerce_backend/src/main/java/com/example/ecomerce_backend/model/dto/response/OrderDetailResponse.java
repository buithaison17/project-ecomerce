package com.example.ecomerce_backend.model.dto.response;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderDetailResponse(
        Long id,
        OrderStatus orderStatus,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        String receiverName,
        String phoneNumber,
        String address,
        String note,
        List<OrderItemResponse> items,
        BigDecimal totalAmount,
        BigDecimal shippingAmount,
        BigDecimal finalAmount,
        Long customerId,
        String customerUsername,
        String customerEmail,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
