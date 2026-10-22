package com.example.ecomerce_backend.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OrderUpdateStatusRequest(
        @NotBlank(message = "Trạng thái không được để trống")
        @Pattern(regexp = "^(PENDING|SHIPPING|DELIVERED|CANCELLED)$", message = "Trạng thái không hợp lệ")
        String status
) {
}
