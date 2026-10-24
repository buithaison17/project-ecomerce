package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.model.dto.request.LoginRequest;
import com.example.ecomerce_backend.model.dto.request.RegisterRequest;
import com.example.ecomerce_backend.model.dto.request.ResetPasswordRequest;
import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.LoginResponse;
import com.example.ecomerce_backend.model.dto.response.UserRegisterResponse;
import com.example.ecomerce_backend.service.AuthService;
import com.example.ecomerce_backend.service.RefreshTokenService;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletResponse response
    ) {
        return ResponseEntity.ok(authService.login(loginRequest, response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiDataResponse<UserRegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        return new ResponseEntity<>(new ApiDataResponse<>(
                true,
                "Đăng kí thành công",
                authService.register(request),
                null,
                HttpStatus.CREATED
        ), HttpStatus.CREATED);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiDataResponse<Void>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return new ResponseEntity<>(new ApiDataResponse<>(
                true,
                "Đặt lại mật khẩu thành công",
                null,
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(
            @CookieValue("refreshToken") String refreshToken,
            HttpServletResponse response
    ) {
        LoginResponse loginResponse = refreshTokenService.refreshToken(refreshToken);
        authService.writeAccessTokenCookie(response, loginResponse.getAccessToken());
        loginResponse.setAccessToken(null);
        return new ResponseEntity<>(loginResponse, HttpStatus.OK);
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiDataResponse<Void>> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken,
            HttpServletResponse response
    ) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenService.revokeToken(refreshToken);
        }
        authService.clearAuthenticationCookies(response);
        return new ResponseEntity<>(new ApiDataResponse<>(
                true,
                "Đăng xuất thành công",
                null,
                null,
                HttpStatus.OK
        ), HttpStatus.OK);
    }
}
