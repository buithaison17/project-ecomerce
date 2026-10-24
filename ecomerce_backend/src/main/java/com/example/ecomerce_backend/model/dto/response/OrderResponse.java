package com.example.ecomerce_backend.model.dto.response;

import com.example.ecomerce_backend.constants.PaymentMethod;
import com.example.ecomerce_backend.constants.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        BigDecimal totalAmount,
        BigDecimal shippingAmount,
        BigDecimal finalAmount,
        UserDeliveryResponse delivery,
        String orderStatus,
        PaymentMethod paymentMethod,
        PaymentStatus paymentStatus,
        String note,
        List<OrderItemResponse> items,
        LocalDateTime createdAt
) {
}
