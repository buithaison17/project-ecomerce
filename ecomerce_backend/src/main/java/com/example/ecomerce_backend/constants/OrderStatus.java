package com.example.ecomerce_backend.constants;

/** Chu trình đơn hàng theo SRS: PENDING -> PROCESSING -> SHIPPING -> COMPLETED (hoặc CANCELLED). */
public enum OrderStatus {
    PENDING,
    PROCESSING,
    SHIPPING,
    COMPLETED,
    CANCELLED
}
