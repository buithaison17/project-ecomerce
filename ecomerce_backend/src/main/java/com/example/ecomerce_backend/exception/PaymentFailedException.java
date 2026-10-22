package com.example.ecomerce_backend.exception;

/** Thanh toán thất bại (cổng mô phỏng từ chối). Ném ra sẽ rollback toàn bộ giao dịch đặt hàng. */
public class PaymentFailedException extends RuntimeException {
    public PaymentFailedException(String message) {
        super(message);
    }
}
