package com.example.ecomerce_backend.model.dto.response;

import com.example.ecomerce_backend.constants.OrderStatus;
import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Một dòng trong danh sách đơn hàng (của khách hoặc của admin). */
public record OrderSummaryResponse(
        Long id,
        OrderStatus orderStatus,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        BigDecimal finalAmount,
        String receiverName,
        Long customerId,
        String customerUsername,
        String customerEmail,
        LocalDateTime createdAt
) {
}
