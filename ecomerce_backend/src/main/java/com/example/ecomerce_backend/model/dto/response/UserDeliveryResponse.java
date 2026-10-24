package com.example.ecomerce_backend.model.dto.response;

public record UserDeliveryResponse(
        Long id,
        String address,
        String phoneNumber
) {
}
