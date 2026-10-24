package com.example.ecomerce_backend.model.dto.response;

import java.time.LocalDate;

public record AuthenticatedUserResponse(
        Long id,
        String username,
        String fullName,
        String avatarUrl,
        String role,
        String email,
        LocalDate dateOfBirth,
        String gender
) {
}
