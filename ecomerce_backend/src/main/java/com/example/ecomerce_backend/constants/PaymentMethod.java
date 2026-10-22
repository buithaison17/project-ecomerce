package com.example.ecomerce_backend.constants;

public enum PaymentMethod {
    /** Thanh toán khi nhận hàng. */
    COD,
    /** Cổng mô phỏng thanh toán thẻ (Mock Payment Gateway) - thành công/thất bại theo kịch bản thẻ test. */
    MOCK_CARD
}
