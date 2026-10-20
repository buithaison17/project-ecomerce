package com.example.ecomerce_backend.service;

import com.example.ecomerce_backend.model.dto.request.LoginRequest;
import com.example.ecomerce_backend.model.dto.response.LoginResponse;
import com.example.ecomerce_backend.model.entity.RefreshToken;
import com.example.ecomerce_backend.security.jwt.JwtService;
import com.example.ecomerce_backend.security.principal.UserPrincipal;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public LoginResponse login(LoginRequest request, HttpServletResponse httpServletResponse) {
        // Xác thực thông tin đăng nhập
        UsernamePasswordAuthenticationToken authenticationToken = new UsernamePasswordAuthenticationToken(
                request.username(),
                request.password()
        );
        Authentication authentication = authenticationManager.authenticate(authenticationToken);
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        // Tạo token
        String accessToken = jwtService.generateToken(request.username());
        RefreshToken refreshToken = refreshTokenService.refreshToken(userPrincipal.getUser());
        // Lưu refresh token vào cookie
        Cookie cookie = new Cookie("refreshToken", refreshToken.getToken());
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        long maxAge = Duration.between(
                Instant.now(),
                refreshToken.getExpiresAt()
        ).getSeconds();
        cookie.setMaxAge((int) maxAge);
        httpServletResponse.addCookie(cookie);
        return LoginResponse.builder()
                .accessToken(accessToken)
                .build();
    }
}
