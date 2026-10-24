package com.example.ecomerce_backend.model.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Mật khẩu cũ không được để trống")
        @Size(min = 6, message = "Mật khẩu phải tối thiểu 6 kí tự")
        String oldPassword,
        @NotBlank(message = "Mật khẩu mới không được để trống")
        @Size(min = 6, message = "Mật khẩu phải tối thiểu 6 kí tự")
        String newPassword
) {
}
