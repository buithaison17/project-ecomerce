package com.example.ecomerce_backend.model.dto.request;

import com.example.ecomerce_backend.constants.PaymentMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CheckoutRequest(
        @NotBlank(message = "Họ tên người nhận không được để trống")
        @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
        String receiverName,
        @NotBlank(message = "Số điện thoại không được để trống")
        @Pattern(regexp = "^(0|\\+84)\\d{9}$", message = "Số điện thoại không hợp lệ")
        String phoneNumber,
        @NotBlank(message = "Địa chỉ giao hàng không được để trống")
        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address,
        @NotNull(message = "Vui lòng chọn phương thức thanh toán")
        PaymentMethod paymentMethod,
        /** Chỉ cần khi paymentMethod = MOCK_CARD. Dùng số thẻ test, xem docs/API-CART-ORDER.md. */
        @Size(max = 25, message = "Số thẻ không hợp lệ")
        String cardNumber,
        @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
        String note
) {
}
