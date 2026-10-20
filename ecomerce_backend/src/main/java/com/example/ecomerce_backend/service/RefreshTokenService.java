package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.model.entity.RefreshToken;
import com.example.ecomerce_backend.model.entity.User;
import com.example.ecomerce_backend.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    @Value("${jwt.refresh-expiration}")
    private long expirationTime;

    public RefreshToken refreshToken(User user) {
        Instant expiresAt = Instant.now().plusMillis(expirationTime);
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(expiresAt)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }
}
