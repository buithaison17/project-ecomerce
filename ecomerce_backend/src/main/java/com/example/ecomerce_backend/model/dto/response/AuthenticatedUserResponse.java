package com.example.ecomerce_backend.model.dto.response;

public record AuthenticatedUserResponse(
        Long id,
        String username,
        String fullName,
        String avatarUrl,
        String role
) {
}
