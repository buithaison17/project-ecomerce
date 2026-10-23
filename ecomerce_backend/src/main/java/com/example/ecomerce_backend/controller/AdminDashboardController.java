package com.example.ecomerce_backend.controller;

import com.example.ecomerce_backend.model.dto.response.ApiDataResponse;
import com.example.ecomerce_backend.model.dto.response.DashboardSummaryResponse;
import com.example.ecomerce_backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final DashboardService dashboardService;

    @GetMapping("/summary")
    public ResponseEntity<ApiDataResponse<DashboardSummaryResponse>> summary() {
        return ResponseEntity.ok(ApiDataResponse.ok("Lấy số liệu tổng quan thành công", dashboardService.getSummary()));
    }
}