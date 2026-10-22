package com.example.ecomerce_backend.model.dto.response;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long productId,
        String productName,
        String thumbnailUrl,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalAmount
) {
}
